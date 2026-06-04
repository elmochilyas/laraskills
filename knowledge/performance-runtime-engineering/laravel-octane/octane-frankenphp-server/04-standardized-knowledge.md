# Octane FrankenPHP Server — Caddy Module, Embedded PHP, Worker Mode

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Octane FrankenPHP Server — Caddy Module, Embedded PHP, Worker Mode |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

FrankenPHP is a Go-based application server built as a Caddy module that embeds PHP directly via CGO. It implements a custom SAPI (Server API) that eliminates the FastCGI layer entirely — PHP runs in the same process as the HTTP server. Worker mode uses persistent PHP threads that handle requests without re-booting, achieving 3–5× throughput over PHP-FPM. FrankenPHP's single-binary deployment (including Caddy, PHP, and the application) makes it the simplest Octane driver to deploy. It ships with built-in HTTP/3, automatic HTTPS via ACME, and 103 Early Hints support.

## Core Concepts

- **Single binary**: FrankenPHP compiles PHP, Caddy, and the Go runtime into one executable. No separate PHP-FPM, Nginx, or PHP installation needed.
- **Custom SAPI**: `frankenphp_sapi_module` implements the full PHP request lifecycle — `php_module_startup()`, `php_request_startup()`, `php_request_shutdown()` — all within the Go process.
- **CGO bridge**: Go calls C PHP functions directly via CGO. PHP memory is pinned via Go's `runtime.Pinner` to prevent GC from moving C-accessible pointers.
- **Worker mode**: PHP code runs in persistent threads. The thread pool maintains idle workers in a "ready" state, picking requests from a shared queue.
- **Thread state machine**: `Reserved → Booting → Inactive → Ready → Done`. Threads transition through states during startup, request handling, and recycling.
- **Caddyfile configuration**: Uses `php_server` directive and `worker` block for FrankenPHP-specific settings within Caddy's configuration format.

## When To Use

- You want the simplest deployment — a single binary replaces Nginx/ Caddy + PHP-FPM + certbot.
- You are deploying in containers (Docker, Kubernetes) and want minimal image complexity.
- Your team values operational simplicity over absolute maximum performance.
- You need automatic HTTPS (ACME) and HTTP/3 support without additional infrastructure.
- You want built-in 103 Early Hints for faster page load perception.

## When NOT To Use

- You need the absolute maximum throughput. RoadRunner (process isolation) or Swoole (coroutines) may outperform FrankenPHP in specific workloads.
- You require a mature, battle-tested ecosystem for complex enterprise deployments.
- You rely on PHP extensions that are not compatible with ZTS (Zend Thread Safety) — FrankenPHP requires ZTS builds.
- You have existing Nginx infrastructure and don't want to migrate to Caddy.
- You must use a specific PHP version or custom PHP build that isn't available in FrankenPHP's distribution.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use worker mode (`frankenphp_worker` directive) | Worker mode enables persistent PHP threads. Without it, requests use standard mode with per-request PHP boot. |
| Set `num_threads` to CPU core count | Each thread handles one request. More threads than cores cause context switching overhead without throughput gain for CPU-bound workloads. |
| Set `max_threads` to 1.5–2× `num_threads` | Allows auto-scaling during traffic spikes. The thread pool grows up to `max_threads` under load. |
| Set `max_requests` per thread to 500–2000 | Prevents memory leak accumulation. Threads are recycled after N requests. |
| Configure `max_wait_time` for graceful shutdown | Determines how long a thread waits for a new request before being recycled during pool downsizing. |
| Set `GOMEMLIMIT` in container environments | Go's garbage collector respects `GOMEMLIMIT` for memory management. Prevents OOM in memory-constrained containers. |
| Use musl-based builds for smaller container images | Alpine/musl builds produce ~50MB smaller images than glibc builds. |

## Architecture Guidelines

- **Caddy module**: FrankenPHP registers as a Caddy module (`php_server` directive). Caddy handles HTTP/2, HTTP/3, TLS termination, and static file serving. FrankenPHP handles PHP execution.
- **Thread pool**: The pool maintains `num_threads` idle threads. When a request arrives, it's dispatched to an idle thread. If all threads are busy, the request waits in a queue.
- **Request lifecycle**: Caddy receives HTTP request → passes to FrankenPHP module → picks idle thread → thread calls `php_request_startup()` → executes PHP → calls `php_request_shutdown()` → thread returns to pool.
- **Zend String caching**: FrankenPHP caches `$_SERVER` keys as persistent `zend_string` allocations, reducing per-request string duplication overhead.
- **Graceful reload**: Sending `USR2` signal to FrankenPHP forces threads to recycle after completing their current request. New threads boot with updated code.
- **Container orchestration**: In Kubernetes, configure liveness/readiness probes against FrankenPHP's health endpoint. The single-binary model simplifies container image building.

## Performance Considerations

- Worker mode achieves 3–5× throughput over PHP-FPM. API endpoints with <50ms response times see the largest gains.
- Thread-per-request model: each thread handles one request at a time. No coroutine overhead.
- CGO boundary crossing adds ~5–10% overhead over RoadRunner in some benchmarks. The gap is expected to narrow in future releases.
- Thread memory: each PHP thread uses 20–60MB RSS. Total memory = threads × per-thread RSS + Go runtime (~20MB).
- Thread state transitions (Reserved → Ready) take ~2–5s for Laravel bootstrap. Pool warming should be part of startup sequence.
- 103 Early Hints: sends `Link` headers before the full response, allowing the browser to preload assets. Improves LCP by 100–300ms.

## Security Considerations

- Thread-local state: PHP threads run in the same process. A PHP crash in one thread can potentially affect the entire process. Process-level isolation is weaker than RoadRunner.
- Automatic HTTPS via ACME: Caddy handles certificate provisioning and renewal automatically. Ensure ACME ports (80/443) are accessible from the internet.
- File permissions: The single binary should be owned by a non-root user in production. Caddy can bind to privileged ports via `setcap`.
- Thread safety: All PHP extensions must be ZTS-compatible. Non-ZTS extensions can cause segfaults or memory corruption in threaded environments.
- Container security: Run FrankenPHP with `--read-only` root filesystem and `--cap-drop=ALL` for defense in depth.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Running in standard mode instead of worker mode | PHP boots on every request, negating Octane's performance advantage. | Default configuration does not enable worker mode. | Throughput similar to FPM — no Octane benefit. | Add `frankenphp_worker` directive to Caddyfile. |
| Setting `num_threads` too high | Over-provisioning threads wastes memory and causes context switching. | Assuming "more threads = more throughput." | Memory exhaustion, degraded performance due to thread contention. | Start at CPU core count, monitor, increase for I/O-bound only. |
| Not setting `GOMEMLIMIT` in containers | Go's GC has no memory limit and can cause OOM kills. | Unaware of Go memory management in container environments. | Container OOM kills under memory pressure. | Set `GOMEMLIMIT=xxxMiB` environment variable. |
| Using glibc build in Alpine containers | glibc binaries don't work with musl libc. | Downloading wrong binary for the container base image. | Binary fails to start with loader errors. | Use musl-based FrankenPHP builds for Alpine. |
| Not warming threads after deployment | First requests to new threads trigger slow PHP bootstrap. | Assuming threads start instantly. | 2–5s latency for the first request on each new thread. | Run warm-up requests hitting critical endpoints after deploy. |

## Anti-Patterns

- **Using FrankenPHP without Octane for Laravel**: FrankenPHP can run Laravel without Octane (via standard `php_server`), but you lose worker mode and sandbox management. Always use Octane with worker mode for Laravel.
- **Running FrankenPHP as root**: The single binary does not need root. Use a non-root user with `setcap` for privileged port binding.
- **Assuming thread safety means all PHP code is safe**: PHP userland code is thread-safe by design, but extensions and some pattens (global state, static properties) can cause race conditions.
- **Mixing FrankenPHP with external PHP-FPM**: Either use FrankenPHP's embedded PHP or external FPM, not both. Using both defeats the purpose of the single-binary model.

## Examples

```caddyfile
# Caddyfile — Laravel Octane with FrankenPHP
frankenphp

localhost:8080 {
    root * /app/public
    php_server {
        worker {
            num_threads 4
            max_threads 8
            max_requests 1000
        }
    }
    file_server
}
```

```bash
# Run FrankenPHP
./frankenphp run --config Caddyfile

# With GOMEMLIMIT for containers
GOMEMLIMIT=256MiB ./frankenphp run --config Caddyfile
```

```dockerfile
# Dockerfile — minimal container
FROM dunglas/frankenphp:1.7-alpine
COPY . /app
WORKDIR /app
CMD ["frankenphp", "run", "--config", "Caddyfile"]
```

## Related Topics

- Octane Architecture and Execution Model
- Driver Selection Comparison — RoadRunner vs Swoole vs FrankenPHP
- Worker Configuration by Driver
- Container Memory Management for Octane
- FPM-to-Octane Migration

## AI Agent Notes

- FrankenPHP's key differentiator is operational simplicity — one binary replaces an entire web server stack. This is compelling for containerized and serverless deployments.
- The thread model is different from RoadRunner's process model and Swoole's coroutine model. Threads share the same address space, so isolation is weaker but inter-thread communication is faster.
- Common confusion: `num_threads` in FrankenPHP is NOT the same as `worker_num` in Swoole. FrankenPHP threads are actual OS threads, not coroutines. Each thread handles one request synchronously.
- The CGO bridge is the source of most FrankenPHP performance overhead and stability concerns. The PHP community is actively working on reducing this penalty.

## Verification

- [ ] Run `./frankenphp run --config Caddyfile` and verify the server starts without errors.
- [ ] Verify worker mode is active: check logs for "worker mode enabled" message.
- [ ] Test HTTPS certificate: `curl -I https://localhost:443` — verify valid TLS certificate.
- [ ] Load test: `wrk -t4 -c100 -d30s http://localhost:8080/` and verify throughput.
- [ ] Monitor thread memory: observe RSS stability over 1000+ requests.
- [ ] Verify graceful reload: send `USR2` signal and observe thread recycling.
- [ ] Test 103 Early Hints: `curl -I https://localhost/` — verify `Link` headers are sent.
- [ ] Verify container OOM protection: `GOMEMLIMIT=128MiB ./frankenphp run` under load.
- [ ] Test thread recycling: verify `max_requests` limit causes threads to recycle.
- [ ] Document the Caddyfile configuration and deployment procedure.
