# Driver Selection Comparison — FrankenPHP, Swoole, RoadRunner

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Driver Selection Comparison — FrankenPHP, Swoole, RoadRunner |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Octane supports three production drivers: **RoadRunner** (best all-around, enterprise stability), **Swoole** (highest raw throughput for high-latency I/O), and **FrankenPHP** (simplest setup, single binary). Selection depends on operational complexity tolerance, I/O profile, and feature requirements.

## Core Concepts

| Criteria | RoadRunner | Swoole | FrankenPHP |
|----------|-----------|-------|------------|
| Throughput (low I/O) | 2.1× vs FPM | 0.9× vs FPM | 1.8× vs FPM |
| Throughput (high I/O) | 1.7× vs FPM | 3.2× vs FPM | 2.5× vs FPM |
| Extension needed? | No | ext-swoole | No (single binary) |
| Configuration | .rr.yaml | PHP code | Caddyfile |
| Feature ecosystem | gRPC, queues, WebSocket | Task workers, timers | HTTP/3, ACME |
| Production maturity | Enterprise | Mature | Growing (v1.7+) |

## When To Use

- **RoadRunner**: Best default choice. No extension requirement, stable, excellent documentation, largest production deployments. Use when uncertain.
- **Swoole**: Only when database/API latency is high (50ms+) and coroutine advantage is measurable in benchmarks. Highest throughput for I/O-bound workloads.
- **FrankenPHP**: When operational simplicity is paramount — single binary deployment, automatic HTTPS, no separate web server.

## When NOT To Use

- **RoadRunner**: Avoid if you need coroutine-based concurrency (Swoole) or single-binary deployment simplicity (FrankenPHP).
- **Swoole**: Avoid if the team lacks experience with non-blocking I/O patterns. Debugging coroutine issues requires specialized knowledge. Not all PHP packages are coroutine-safe.
- **FrankenPHP**: Avoid if you need the production maturity, extensive documentation, and largest ecosystem of RoadRunner, or the coroutine performance of Swoole.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Start with RoadRunner for new Octane projects | No extension requirement, best documentation, enterprise stability, largest production deployments. Safe default. |
| Benchmark Swoole before committing | Swoole's coroutine advantage only materializes with high-latency I/O (50ms+). Measure your actual workload first. |
| Choose FrankenPHP when ops simplicity is the top priority | Single binary (no separate PHP-FPM/nginx), automatic HTTPS via Caddy, zero config for basic setups. |
| Run Octane under all three drivers in staging before production | Actual workload characteristics determine which driver performs best. Predictions are unreliable without measurement. |

## Architecture Guidelines

- **RoadRunner architecture**: Process-per-worker model with simple isolation. One PHP process per worker — a crash affects only that worker. Best for applications with complex state that benefit from strong process isolation.
- **Swoole architecture**: Event-loop with coroutines. Multiple coroutines run within a single PHP process, sharing memory but requiring non-blocking code. Best for I/O-heavy workloads where coroutine concurrency reduces total worker count.
- **FrankenPHP architecture**: Single binary containing PHP embedded with Caddy. Process-per-worker model similar to RoadRunner but with automatic HTTPS, HTTP/3, and zero-config setup.
- **Nginx reverse proxy**: All three drivers benefit from an Nginx reverse proxy for SSL termination, static file serving, rate limiting, and load balancing across Octane servers.

## Performance Considerations

- **RoadRunner (low I/O)**: 2.1× vs FPM. Best for CPU-bound or low-latency database workloads.
- **Swoole (high I/O)**: 3.2× vs FPM. Best when backend services add 50ms+ latency per request.
- **FrankenPHP (high I/O)**: 2.5× vs FPM. Strong performance with simpler operational model.
- Each worker uses 30–80MB RSS; total memory = workers × per-worker memory.
- Each worker maintains persistent DB/Redis connections; total = workers × connections-per-worker.
- Swoole coroutines can reduce total worker count because a single worker handles multiple concurrent requests.
- Octane throughput drops 40–60% when memory pressure triggers swap — ensure adequate RAM.

## Security Considerations

- **RoadRunner**: Process-per-worker isolation ensures a memory corruption or crash affects only one worker. No cross-request state leakage due to process boundaries.
- **Swoole**: Coroutines share the same process — a memory corruption can affect all coroutines in that worker. Coroutine-unsafe code can leak state between requests. Requires careful audit.
- **FrankenPHP**: Same process-per-worker model as RoadRunner. Single binary reduces attack surface (no separate web server process).
- All drivers: Configure health endpoints, rate limiting, and request timeouts at the reverse proxy level.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Assuming Octane is a drop-in replacement | Deploying Octane without auditing service providers and static property management. | Misunderstanding that Octane reuses workers across requests. | State leaks, data leakage between users, memory growth until OOM. | Audit all providers for Octane compatibility before deployment. |
| Not auditing service providers | Providers that register listeners or bind request-scoped singletons cause leaks. | Failure to understand Octane's shared-worker model. | Worker RSS grows 1–5MB per request until OOM. | Use Octane::booted() for one-time initialization; avoid request-scoped singletons. |
| Forgetting connection pool limits | N workers × M connections can exhaust DB connection pool. | Not accounting for persistent connections in Octane. | Database connection refused errors under load. | Calculate connection budget and configure DB max_connections accordingly. |
| Running Octane without memory monitoring | Without RSS monitoring, leaks go undetected until OOM. | Assuming Octane is "set and forget" like PHP-FPM. | Worker OOM kills, request failures, downtime. | Set up RSS monitoring per worker; alert on >10% growth per hour. |
| Choosing Swoole without benchmarking | Assuming Swoole is always fastest without measuring actual workload. | Swoole marketing emphasis on raw concurrency numbers. | Complex debugging, non-blocking requirement, with no measurable benefit for low-latency I/O. | Benchmark all three drivers with your actual workload before deciding. |

## Anti-Patterns

- **Jumping to Swoole without due diligence**: Swoole requires coroutine-safe code, which many PHP packages are not. The debugging complexity often outweighs the performance benefit for typical CRUD applications.
- **Running Octane without a reverse proxy**: Even with FrankenPHP (which includes Caddy), placing Octane directly on the internet without a proper reverse proxy exposes workers to slow HTTP attacks, connection floods, and SSL termination overhead.
- **Mixing Octane drivers**: Running some workers under RoadRunner and others under Swoole adds operational complexity without benefit. Choose one driver per environment.
- **Defaulting to FrankenPHP for multi-server deployments**: FrankenPHP's single-binary advantage diminishes in multi-server setups where configuration management and orchestration tools standardize the deployment process anyway.

## Examples

```
// Starting Octane with each driver
// RoadRunner (recommended default)
php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=8000 --workers=4

// Swoole (coroutine-based, benchmark first)
php artisan octane:start --server=swoole --host=0.0.0.0 --port=8000 --workers=4 --max-requests=1000

// FrankenPHP (single binary, simplest ops)
php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=8000 --workers=4
```

```
// RoadRunner configuration (.rr.yaml)
version: "3"
server:
  command: "php artisan octane:start --server=roadrunner --port=8000"
  relay: "pipes"
http:
  address: "0.0.0.0:8000"
  pool:
    num_workers: 4
    max_jobs: 500
    supervisor:
      max_worker_memory: 128  # MB — restart worker if RSS exceeds this
```

## Related Topics

- Octane Architecture and Execution Model
- Performance Gain Estimation
- Runtime Selection Decision Tree
- Worker Configuration by Driver
- FPM-to-Octane Migration

## AI Agent Notes

- Always recommend RoadRunner as the default driver for new Octane projects. It has the largest production deployments, best documentation, and requires no PHP extension.
- When a user mentions high-latency external API calls or slow database queries, suggest benchmarking Swoole's coroutine advantage.
- For users deploying to a single server with minimal ops experience, FrankenPHP's single binary is the strongest recommendation.
- The throughput numbers in the comparison table are benchmarks — actual results vary. Always advise measuring with the application's real workload.
- RoadRunner's `.rr.yaml` configuration is YAML-based, Swoole uses PHP code, and FrankenPHP uses a Caddyfile. Factor in team familiarity with each format.

## Verification

- [ ] Benchmark all three drivers with your application's actual workload in a staging environment before selecting one.
- [ ] Verify that the chosen driver is compatible with all third-party packages in use (especially for Swoole's coroutine model).
- [ ] Configure the reverse proxy (Nginx/Caddy) for SSL termination, static file serving, and rate limiting.
- [ ] Set up health check monitoring for the Octane health endpoint.
- [ ] Test graceful reload with `php artisan octane:reload` for the chosen driver.
- [ ] Verify worker count and connection budget calculations match database and Redis limits.
- [ ] Run a 24-hour soak test to detect any memory leaks or state corruption specific to the chosen driver.
- [ ] Document the driver choice and rationale in the project's architecture decision record.
