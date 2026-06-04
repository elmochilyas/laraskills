# Metadata

Domain: Performance & Runtime Engineering
Subdomain: Laravel Octane Performance
Knowledge Unit: Octane Installation and Configuration — composer require, Driver Setup, config/octane.php
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Installing Octane: `composer require laravel/octane`, then `php artisan octane:install` to select a driver and publish configuration. The `config/octane.php` file controls worker count (`worker_num`), max requests (`max_requests`), task workers (`task_worker_num`), and server-specific settings. Starting the server: `php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=8000 --workers=4 --max-requests=1000`.

---

# Core Concepts

- **Installation steps**: `composer require laravel/octane` → `php artisan octane:install` (selects driver: RoadRunner, Swoole, or FrankenPHP) → download driver binary (RoadRunner: `rr` binary downloaded, FrankenPHP: built-in).
- **config/octane.php**: `max_requests` (worker recycling), `worker_num` (concurrent workers), `task_worker_num` (Swoole-only for background tasks), `server` (driver binary path), `watch` (file watcher for development).
- **Server start options**: `--workers=N` sets worker count, `--max-requests=N` sets recycling threshold, `--task-workers=N` (Swoole), `--host` and `--port` for binding.
- **Development mode**: `--watch` enables hot reload — file changes trigger automatic worker restart.

---

# Performance Considerations

- RoadRunner workers: Default `worker_num` from `swoole_cpu_num()` or config. 4-8 workers typical for most servers.
- max_requests: 1000-5000 depending on memory stability. Monitor worker RSS growth to determine optimal value.
- Task workers (Swoole): Isolate blocking operations. Don't set higher than available CPU cores.

---

# Common Mistakes

**Forgetting to optimize service providers**: After installation, profile service provider `register()` and `boot()` methods. Any heavy work here runs on every worker start but not per-request.

---

# Related Knowledge Units

Service Provider Optimization | Worker Configuration by Driver | Octane Service Container Lifecycle

---

## Mental Models

**Power plant model**: PHP-FPM is starting up and shutting down a generator for every kilowatt produced. Octane is a power plant that keeps the turbine spinning â€” fuel (bootstrap) is burned once, and the spinning turbine handles variable load. Sandbox containers are separate circuit breakers that contain faults without taking down the whole grid.

---

## Internal Mechanics

Octane's bootstrap occurs once per worker during rtisan octane:start. The worker's boot sequence: Illuminate\Foundation\Application constructed â†’ service providers registered â†’ providers booted â†’ routes/facades registered â†’ event loop begins. Per-request handling creates a sandbox by cloning the application instance. Request-specific services (database connections, session, auth) are fresh per-request while config, events, and logging singletons are shared. Octane intercepts framework shutdown by replacing $app->terminate() calls with sandbox reset logic. State leaks are detected by tracking static property modifications via a callback registered in zend_execute_data.

---

## Patterns

**Safe migration pattern**: 1) Audit all service providers for state leaks, 2) Add Octane::booted() callbacks for per-worker initialization, 3) Replace static property usage with pp()->instance() bindings, 4) Test with php artisan octane:status to verify worker health, 5) Deploy to 10% of servers first, compare error rates for 24 hours.

---

## Architectural Decisions

- **RoadRunner vs Swoole vs FrankenPHP as Octane driver**: RoadRunner offers the simplest worker model (process-per-worker) and best isolation. Swoole provides coroutine-based concurrency for I/O-bound workloads. FrankenPHP is easiest to deploy (single binary). The driver choice affects maximum concurrency, memory footprint, and debugging complexity.
- **Service provider strategy**: Deferring non-essential providers to per-request execution reduces worker memory. Boot essential providers once, defer expensive ones. Audit all providers for request-scoped singletons.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| Octane vs FPM | 2-20x throughput improvement | State management, package compatibility |
| RoadRunner driver | Process isolation, simple | Higher per-worker memory |
| Swoole driver | Coroutine concurrency, low memory | Non-blocking requirement, complex debugging |
| FrankenPHP driver | Single binary, zero config | Newer, smaller ecosystem |

---

## Production Considerations

- **Health checks**: Configure Octane health endpoint (/octane/health). Monitor via load balancer. Alert if health check fails on any worker.
- **Graceful reload**: php artisan octane:reload â€” reloads workers without dropping requests. Run after every deploy.
- **State leak detection**: Monitor worker RSS growth. Increase >10% per hour indicates state leak. Set octane:watch during development to detect leaks.
- **Connection pooling**: Configure database and Redis connection limits to match worker count. Each worker maintains persistent connections.

---

## Failure Modes

- **Memory leak in long-running worker**: Service provider registers listeners on each request without cleanup. Symptom: Worker RSS grows by 1-5MB per request until OOM. Mitigation: Audit providers, use Octane::booted() for one-time registration, monitor RSS.
- **Stale singleton state**: Singleton holds request-scoped data that leaks to next request. Symptom: User A sees User B's data. Mitigation: Use sandbox pattern, clone stateful services, never store request data in singletons.
- **Deadlock in connection pool**: All database connections checked out, request waits forever. Symptom: Workers stuck, no requests complete. Mitigation: Set connection pool timeout, monitor pool utilization, ensure connections returned after request.

---

## Ecosystem Usage

- **Laravel Octane**: The primary Octane user base. Over 1M installs on Packagist. Supported by Laravel Forge, Laravel Cloud, and Vapor. Used in production by major Laravel agencies.
- **RoadRunner**: Spiral Framework's application server. Over 500 GitHub stars for Octane integration. Mature, well-documented, PHP 8.4 compatible.
- **FrankenPHP**: Newest runtime. Growing rapidly with Docker official image, K8s Helm chart, and Laravel-specific documentation. 6K+ GitHub stars.
- **Swoole**: Most mature coroutine-based PHP runtime. Used in China extensively (WeChat, Meituan). PHP 8.x support lags slightly behind RoadRunner and FrankenPHP.

---

## Research Notes

- Laravel Octane's sandbox model: Research on per-request Application cloning overhead shows 0.5-2ms per request â€” negligible compared to the 10-40ms bootstrap it replaces.
- State leak prevention: Static analysis tools (Larastan, PHPStan) now include rules for detecting Octane-unsafe static property usage. Community packages like stan-blade/laravel-octane-analyzer provide automated audits.
- Performance cliff research: Octane throughput drops 40-60% when memory pressure triggers swap. Proper max_children calculation is critical for maintaining gains.
- FrankenPHP + Octane: Initial benchmarks show 5-10% overhead over RoadRunner due to CGO boundary crossing in PHP request handling. Expected to narrow in future releases.
