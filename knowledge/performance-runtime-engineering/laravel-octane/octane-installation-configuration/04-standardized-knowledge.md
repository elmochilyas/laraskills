# Standardized Knowledge: Octane Installation and Configuration

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Octane Installation and Configuration — composer require, Driver Setup, config/octane.php |
| Difficulty | Intermediate |
| Lifecycle | Setup, Configure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Installing Octane: `composer require laravel/octane`, then `php artisan octane:install` to select a driver and publish configuration. The `config/octane.php` file controls worker count (`worker_num`), max requests (`max_requests`), task workers (`task_worker_num`), and server-specific settings. Starting the server: `php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=8000 --workers=4 --max-requests=1000`.

## Core Concepts

- **Installation steps**: `composer require laravel/octane` → `php artisan octane:install` (selects driver: RoadRunner, Swoole, or FrankenPHP) → download driver binary (RoadRunner: `rr` binary downloaded, FrankenPHP: built-in).
- **config/octane.php**: `max_requests` (worker recycling), `worker_num` (concurrent workers), `task_worker_num` (Swoole-only for background tasks), `server` (driver binary path), `watch` (file watcher for development).
- **Server start options**: `--workers=N` sets worker count, `--max-requests=N` sets recycling threshold, `--task-workers=N` (Swoole), `--host` and `--port` for binding.
- **Development mode**: `--watch` enables hot reload — file changes trigger automatic worker restart.

## When To Use

- Setting up Laravel Octane for the first time
- Migrating from PHP-FPM to Octane for high-throughput applications
- Configuring Octane for production deployment
- Switching between Octane drivers (RoadRunner, Swoole, FrankenPHP)

## When NOT To Use

- For simple CRUD applications where PHP-FPM performance is sufficient
- When the application has incompatible packages that cannot be refactored
- Without first benchmarking to confirm Octane's benefit for the specific workload
- For applications with significant memory leaks in vendor packages

## Best Practices

- **Optimize service providers after install**: Profile `register()` and `boot()` methods. Heavy work here runs once per worker start, not per request.
- **Start with 4 workers**: Default of `swoole_cpu_num()` may be too high. Begin with 4 workers, monitor RSS, scale up.
- **Set max_requests**: 1000-5000 depending on memory stability. Monitor worker RSS growth to determine optimal value.
- **Use --watch in development**: Enables hot reload for faster iteration. Remove in production.
- **Test with octane:test**: Run `php artisan octane:test` to verify Octane compatibility before deploying.

## Architecture Guidelines

- **RoadRunner config** (.rr.yaml): `rpc`, `server.command`, `http.pool.num_workers`, `http.pool.max_jobs`, `http.pool.supervisor.max_workers`.
- **Swoole config**: Worker count via `swoole_cpu_num()`, task worker count at half CPU cores, max_request for recycling.
- **FrankenPHP config** (Caddyfile): `php_server { worker { num_threads max_threads } }`. Threads are not directly analogous to workers.
- **max_request across drivers**: 1000-5000 for stable apps, 300-500 for apps with known leak patterns.

## Performance Considerations

- RoadRunner workers: Default `worker_num` from `swoole_cpu_num()` or config. 4-8 workers typical for most servers.
- max_requests: 1000-5000 depending on memory stability. Monitor worker RSS growth to determine optimal value.
- Task workers (Swoole): Isolate blocking operations. Don't set higher than available CPU cores.
- Each worker maintains persistent database/Redis connections — account for connection pool limits.

## Security Considerations

- Octane exposes an HTTP server — ensure it's behind a reverse proxy (Nginx, Caddy) in production
- Never expose Octane's port directly to the internet
- Configure health check endpoint (/octane/health) behind firewall

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not optimizing service providers after install | Forgetting provider boot cost | Slow worker start, high memory | Profile and optimize providers |
| Setting workers = CPU cores for all workloads | Blind default | Memory waste for I/O-bound apps | Adjust based on workload profile |
| Running Octane without health checks | No monitoring | Silent worker failures | Configure /octane/health |
| Not testing with octane:test before deploy | Rushing migration | Cross-request contamination | Run octane:test in CI pipeline |

## Anti-Patterns

- **Running Octane without reverse proxy**: Octane's built-in server is not hardened for direct internet exposure.
- **Disabling max_requests**: Setting max_requests = 0 in production allows unbounded memory drift.
- **Starting with max workers immediately**: Begin with fewer workers and scale up after monitoring RSS.
- **Ignoring opcache.preload**: Preloading reduces cold-start latency by 2-5ms per worker. Configure before production.

## Examples

```bash
# Install and configure
composer require laravel/octane
php artisan octane:install  # Select RoadRunner

# Development
php artisan octane:start --server=roadrunner --watch --workers=2

# Production
php artisan octane:start \
    --server=roadrunner \
    --host=127.0.0.1 \
    --port=8000 \
    --workers=4 \
    --max-requests=1000

# Graceful reload after deploy
php artisan octane:reload
```

## Related Topics

- Service Provider Optimization
- Worker Configuration by Driver
- Octane Service Container Lifecycle
- FPM to Octane Migration

## AI Agent Notes

- Install: `composer require laravel/octane` → `php artisan octane:install` → configure driver.
- Three drivers: RoadRunner (process isolation), Swoole (coroutines), FrankenPHP (simplicity).
- config/octane.php: worker_num, max_requests, task_worker_num.
- Start with 4 workers and 1000 max_requests. Monitor RSS to tune.
- Always run behind a reverse proxy.
- Use --watch in development, never in production.

## Verification

- [ ] Octane installed and configured for chosen driver
- [ ] Service providers audited and optimized after install
- [ ] Worker count and max_requests configured based on monitoring
- [ ] Health check endpoint configured (/octane/health)
- [ ] Reverse proxy configured in front of Octane
- [ ] octane:test run in CI pipeline
- [ ] opcache.preload configured for cold-start reduction
