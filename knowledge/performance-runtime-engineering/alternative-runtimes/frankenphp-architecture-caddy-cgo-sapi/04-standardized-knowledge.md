# Standardized Knowledge: FrankenPHP Architecture

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | FrankenPHP Architecture — Caddy Module, CGO-Embedded PHP, Custom SAPI |
| Difficulty | Foundation |
| Lifecycle | Design, Evaluate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

FrankenPHP is built on three layers: Caddy (Go web server with HTTP/3, automatic HTTPS via ACME), a CGO bridge (Go ↔ C binding embedding the PHP interpreter), and a custom SAPI (`frankenphp_sapi_module` — a complete Server API implementation). This architecture eliminates the Nginx/PHP-FPM intermediary entirely, reducing latency and operational complexity.

## Core Concepts

- **Caddy Module**: FrankenPHP is a Caddy module written in Go. It handles TLS termination, HTTP/2/3 multiplexing, request routing, and static file serving within a single process.
- **CGO Bridge**: `#include <php_embed.h>` via CGO. Go calls `php_embed_init()`, `php_execute_script()`, etc. PHP memory is pinned for Go GC safety using `runtime.Pinner`.
- **Custom SAPI**: Implements `php_module_startup()`, `php_request_startup()`, `php_execute_script()`, `php_request_shutdown()`. Allocates per-request `SG(server_context)` and manages the PHP lifecycle at C level.
- **Thread-Safe PHP**: FrankenPHP relies on ZTS (Zend Thread Safety) compilation — each thread gets its own TSRM context.

## When To Use

- Teams wanting a single binary replacing Nginx + PHP-FPM + certbot
- Containerized deployments where minimizing infrastructure complexity is critical
- Applications needing HTTP/3, 103 Early Hints, or automatic HTTPS without additional configuration
- Memory-constrained environments (shared OpCache across threads reduces per-worker RSS)

## When NOT To Use

- Environments where PHP cannot be compiled with ZTS (Zend Thread Safety) enabled
- Applications with PHP extensions that do not support ZTS
- Teams relying on Nginx-specific features (complex rewrite rules, custom modules) not available in Caddy
- High-isolation multi-tenant environments (threads share memory, less isolation than processes)

## Best Practices

- **Always use worker mode for production**: Worker mode provides 3-5x throughput vs PHP-FPM. Standard mode is only for development.
- **ZTS-compile PHP**: FrankenPHP requires PHP compiled with `--enable-zts`. Verify ZTS is enabled before building.
- **Test extensions with ZTS**: Not all PHP extensions are thread-safe. Test all extensions in a FrankenPHP staging environment before production.
- **Set GOMEMLIMIT in containers**: Set `GOMEMLIMIT=800MiB` (80% of container limit) to prevent Go runtime from causing OOM kills.
- **Use debian-slim images**: glibc-based images outperform musl (Alpine) by 10-20% for PHP workloads in FrankenPHP.

## Architecture Guidelines

- **Eliminated Network Hop**: Without FastCGI, there is no HTTP↔FastCGI translation layer. Request parsing, TLS termination, and PHP execution happen in-process.
- **CGO Boundary Cost**: ~100ns per CGO call. For a typical web request with dozens of CGO crossings, total overhead is <10μs — negligible for web workloads.
- **Thread vs Process**: Threads share OpCache memory, reducing total RAM vs FPM's per-process OpCache. But thread safety requires ZTS and testing.
- **Single Binary Deployment**: The FrankenPHP binary contains Caddy, PHP, and all extensions. Container images are 150-300MB vs Nginx + FPM + certbot at 400-600MB combined.

## Performance Considerations

- Eliminates FastCGI protocol overhead (~0.1-0.5ms per request saved vs Nginx + FPM)
- CGO boundary crossing: ~100ns per call — negligible for web requests measured in milliseconds
- Thread pool model: memory savings from shared OpCache across threads (vs separate processes in FPM)
- Worker mode: 3-5x throughput vs PHP-FPM in benchmarks with proper thread pool sizing

## Security Considerations

- FrankenPHP's attack surface is the Caddy server + PHP combined. Keep both updated for security patches.
- Thread isolation in PHP is less complete than process isolation. A memory corruption in one thread could theoretically affect others.
- Go runtime's memory management handles Caddy's allocations; PHP memory is managed separately. This dual-allocation model has unique security implications.
- Caddy's automatic HTTPS (ACME) handles certificate renewal automatically, reducing certificate management errors.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using standard mode for production | Not configuring `--workers` flag | No performance gain over FPM | Always use worker mode with `frankenphp php-server --workers` |
| Deploying with Alpine/musl images | Smaller image preference | 10-20% performance penalty from slower memory allocator | Use debian-slim (glibc) images for production |
| Missing GOMEMLIMIT in container | Not understanding Go memory management | OOM kills when Go heap grows | Set GOMEMLIMIT to 80% of container memory limit |
| Using ZTS-incompatible extensions | Not testing extensions in thread context | Segfaults in production under concurrent load | Test all extensions in staging with ZTS enabled |

## Anti-Patterns

- **Running FrankenPHP alongside Nginx**: FrankenPHP replaces Nginx. Running both together duplicates TLS termination, complicates routing, and adds latency.
- **Disabling thread safety checks**: Skipping ZTS compatibility verification for extensions leads to intermittent segfaults in production.
- **Ignoring Go memory management**: FrankenPHP's Go runtime and PHP memory are separate systems. Both must be monitored and tuned independently.
- **Treating FrankenPHP containers as stateless**: Thread state accumulates across requests. Memory recycling via max_requests is essential.

## Examples

```caddy
# Caddyfile for FrankenPHP worker mode
localhost:8080 {
    root * /app/public
    php_server {
        worker {
            num_threads 4
            max_threads 8
            max_requests 1000
        }
    }
}
```

## Related Topics

- FrankenPHP Installation and Caddyfile
- FrankenPHP Worker Thread Management
- FrankenPHP Container Memory Management
- Runtime Comparison Overview

## AI Agent Notes

- FrankenPHP requires ZTS-compiled PHP. This is a prerequisite that affects extension compatibility.
- The CGO bridge between Go and PHP is the primary source of FrankenPHP's unique behavior (memory pinning, thread safety).
- FrankenPHP's thread state machine (Reserved → Booting → Inactive → Ready → Done) is fundamental to understanding its concurrency model.
- Container deployments need both GOMEMLIMIT (Go) and PHP memory_limit configured independently.

## Verification

- [ ] PHP compiled with ZTS (`php -i | grep "Thread Safety"`)
- [ ] FrankenPHP binary built and working (`./frankenphp version`)
- [ ] Worker mode configured (`--workers` flag in Caddyfile or CLI)
- [ ] All PHP extensions tested for ZTS compatibility
- [ ] GOMEMLIMIT set in container environments
- [ ] debian-slim (glibc) base image used for production
- [ ] Thread pool num_threads and max_threads configured
