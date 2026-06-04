# Octane RoadRunner Server — Go-Based Application Server, Goridge Binary Protocol

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Octane RoadRunner Server — Go-Based Application Server, Goridge Binary Protocol |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

RoadRunner is a Go-based application server that manages a pool of PHP workers via the Goridge binary protocol. It acts as Laravel Octane's driver with the best all-around performance profile — 41–111% throughput improvement over PHP-FPM in benchmarks. No PHP extension is required; RoadRunner communicates with standard PHP workers over pipes using the Goridge protocol. Its Go-based architecture leverages goroutine scheduling for efficient connection handling, making it the most popular Octane driver for enterprise Laravel deployments.

## Core Concepts

- **Go process supervisor**: The `rr` binary manages the entire lifecycle — worker spawning, health checks, graceful shutdown, and process recycling.
- **Goridge protocol**: Binary protocol over TCP or stdio pipes. Encodes/decodes PHP values (arrays, strings, integers) between Go and PHP with minimal overhead. Uses byte-level framing for message boundaries.
- **`.rr.yaml` configuration**: Single YAML file defines server command, HTTP address, worker pool settings, RPC listeners, and plugin configuration.
- **Worker pool semantics**: `num_workers` defines the baseline worker count. The supervisor maintains this pool, restarting workers that fail or exceed `max_jobs`.
- **Process isolation**: Each worker is a separate OS process. A crash in one worker does not affect others. Memory leaks are contained within the individual worker process.
- **Plugin ecosystem**: RoadRunner ships with plugins for gRPC, queues (RabbitMQ, SQS, Beanstalk), WebSocket (Centrifugo), Temporal, metrics (Prometheus), and more.

## When To Use

- You want the best all-around Octane driver with proven enterprise production track record.
- Your team prefers process-level isolation (each worker is a separate OS process).
- You need gRPC, WebSocket, or queue worker functionality alongside HTTP serving.
- You want to avoid PHP extensions — RoadRunner requires none.
- You need mature tooling (Supervisor integration, health checks, graceful reload).

## When NOT To Use

- You want the simplest possible deployment (single binary). FrankenPHP is simpler.
- Your application requires coroutine-based concurrency for high-latency I/O. Swoole has better coroutine support.
- You are deploying in a memory-constrained environment. RoadRunner's Go binary adds ~20–40MB baseline memory.
- You want to minimize infrastructure and configuration complexity.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Set `num_workers` to CPU core count for CPU-bound, 1.5–2× for I/O-bound | Workers are persistent — each handles one request at a time. More workers than cores benefit I/O-bound workloads where workers spend time waiting. |
| Set `max_jobs` (equivalent to `max_requests`) to 500–2000 | Prevents memory drift accumulation while avoiding excessive worker restart overhead. Higher values for stable apps, lower for apps with known leaks. |
| Configure `supervisor.max_workers` to set an upper cap | Prevents the supervisor from spawning too many workers under load, which could exhaust memory or database connections. |
| Set `allocate_timeout` to 60s | Determines how long the supervisor waits for a worker to boot. Octane workers can take 2–10s to bootstrap a Laravel app. |
| Use `exec_ttl` for workers with known slow memory growth | Time-based worker recycling complements `max_jobs`. Workers are recycled after the TTL even if `max_jobs` hasn't been reached. |
| Monitor `rr` process memory | The Go binary itself has a stable memory footprint, but worker RSS must be tracked separately. |

## Architecture Guidelines

- **Worker pool**: RoadRunner maintains `num_workers` idle workers. When a request arrives, it picks an idle worker, sends the request via Goridge, waits for the response, and returns the worker to the pool.
- **Goridge protocol flow**: Go sends `{\"context\": {...}, \"body\": \"...\"}` → PHP worker reads from stdin → processes → writes response to stdout → Go reads and sends HTTP response.
- **Graceful shutdown**: Sending `SIGTERM` to `rr` tells workers to finish their current request then exit. New requests are routed to remaining workers. Once all workers drain, the process exits.
- **RPC server**: RoadRunner exposes an RPC server (default `tcp://127.0.0.1:6001`) for administrative commands: `rr reset`, `rr workers`, `rr status`, `rr http:reset`.
- **Supervisor integration**: Use Supervisor to manage the `rr` binary itself. RoadRunner manages its own worker pool internally — Supervisor's role is to restart the Go process if it crashes.
- **Environment propagation**: Environment variables set in `.rr.yaml` or the system environment are passed to PHP workers. Use this for configuration that varies across environments.

## Performance Considerations

- RoadRunner achieves 41–111% throughput improvement over PHP-FPM in benchmarks. The gain is most significant for API endpoints with <50ms response times.
- Each PHP worker uses 30–80MB RSS. Total memory = `num_workers` × per-worker RSS + Go binary baseline (~30MB).
- Workers maintain persistent database and Redis connections. Total connections = `num_workers` × connections-per-worker. Budget carefully against database `max_connections`.
- Goridge protocol adds ~0.1–0.5ms per request compared to embedded SAPI (FrankenPHP) but offers better process isolation.
- Go goroutine scheduler handles thousands of concurrent connections efficiently, even with minimal I/O wait.
- The Go binary itself is stable and does not leak memory. All memory concerns apply to PHP workers.

## Security Considerations

- RoadRunner workers run as separate OS processes. A crash or compromise in one worker does not affect others.
- The RPC server should not be exposed publicly. Bind to `127.0.0.1` only.
- Worker processes inherit environment variables from the `rr` process. Do not store secrets in `.rr.yaml` — use environment variables or secret management.
- File permissions: The `rr` binary and `.rr.yaml` should be readable only by the deploying user.
- Process isolation: PHP workers cannot access each other's memory. State leaks are contained within a single worker process.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Setting `num_workers` equal to CPU cores for I/O-bound apps | Each worker handles one request at a time. If requests spend 80% of time waiting for DB, more workers don't help. | Misunderstanding persistent worker semantics. | Workers idle while waiting for I/O, throughput is capped at `num_workers`. | Increase workers by 50–100% for I/O-bound workloads. |
| Not setting `max_jobs` (or setting to 0) | Workers run indefinitely without recycling. | FPM habit — in FPM, workers are recycled per request. | Memory drift — worker RSS grows over time until OOM. | Set `max_jobs` to 500–2000 based on app stability. |
| Forgetting to configure `supervisor.max_workers` | Workers multiply under load without an upper bound. | Not understanding that RoadRunner can spawn additional workers on demand. | Memory exhaustion, crashed database from too many connections. | Set an explicit cap based on available memory. |
| Exposing RPC port to the network | `rpc.listen: tcp://0.0.0.0:6001` allows external RPC commands. | Copying config from examples without reviewing security. | Unauthorized `rr reset` or worker inspection. | Bind to `127.0.0.1` only. |

## Anti-Patterns

- **Using RoadRunner without Octane**: While possible, RoadRunner is designed for Spiral Framework. Octane provides the Laravel integration layer that handles service container bootstrapping, sandbox management, and state leak prevention.
- **Setting `num_workers` too high**: Workers are persistent and each holds database connections. 100 workers × 2 DB connections = 200 DB connections, potentially exceeding database limits.
- **Not configuring process supervision**: If the `rr` binary crashes, all workers go down. Always run `rr` under Supervisor or a container orchestrator.
- **Mixing RoadRunner and FPM environments**: The same codebase may behave differently. Test Octane configuration in a dedicated environment.

## Examples

```yaml
# .rr.yaml — Laravel Octane with RoadRunner
server:
  command: "php artisan octane:start --server=roadrunner --host=127.0.0.1 --port=8080"
  env:
    - APP_ENV: production
    - APP_DEBUG: false

rpc:
  listen: tcp://127.0.0.1:6001

http:
  address: "0.0.0.0:8080"
  pool:
    num_workers: 8
    max_jobs: 1000
    allocate_timeout: 60s
    supervisor:
      max_workers: 16
      exec_ttl: 3600s
```

```bash
# RoadRunner CLI commands
rr serve -c .rr.yaml          # Start RoadRunner
rr http:reset                   # Gracefully reset HTTP workers
rr workers -i                   # List all workers with status
rr status                       # Show server status and metrics
```

## Related Topics

- Octane Architecture and Execution Model
- Driver Selection Comparison — RoadRunner vs Swoole vs FrankenPHP
- Worker Configuration by Driver
- Connection Pooling Strategies
- FPM-to-Octane Migration

## AI Agent Notes

- RoadRunner is the most "boring" and stable Octane driver — it does one thing (manage PHP workers) and does it well. No PHP extensions, no CGO, no coroutines. Just processes.
- The Goridge protocol is what makes RoadRunner portable — any language that can read/write to stdio can be a RoadRunner worker.
- Common confusion: `num_workers` in RoadRunner = `worker_num` in Swoole = `num_threads` in FrankenPHP. But the semantics differ (process vs thread vs goroutine pool).
- For migration from FPM, RoadRunner is the safest first Octane driver because process isolation matches FPM's model most closely.

## Verification

- [ ] Run `php artisan octane:start --server=roadrunner` and verify the server starts without errors.
- [ ] Check worker status: `rr workers -i` — all workers should show "ready" state.
- [ ] Verify graceful reload: `php artisan octane:reload` — observe workers recycling one at a time.
- [ ] Load test: `wrk -t4 -c100 -d30s http://localhost:8080/` and verify throughput and error rate.
- [ ] Monitor worker RSS over time — no more than 10% growth per 1000 requests.
- [ ] Verify health check: `curl http://localhost:8080/octane/health` returns 200.
- [ ] Test RPC security: `nc -zv 127.0.0.1 6001` works; `nc -zv <public_ip> 6001` should be blocked.
- [ ] Verify database connection budget: workers * connections-per-request < database max_connections.
- [ ] Test `SIGTERM` graceful shutdown: kill the `rr` process and verify in-flight requests complete.
- [ ] Document the `.rr.yaml` configuration and deployment procedure.
