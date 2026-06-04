# Metadata

Domain: Performance & Runtime Engineering
Subdomain: Laravel Octane Performance
Knowledge Unit: Service Provider Optimization for Persistence — Singleton Scoping, Deferred Providers
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

In Octane's memory-resident model, service provider `register()` and `boot()` methods run **once per worker start**, not per request. This means: 1) Singletons persist across requests (can be used for connection pooling), 2) Any provider registering stateful bindings must use the `$app->scoped()` or `$app->singleton()` pattern correctly, 3) Providers with side effects in `boot()` (event listeners, middleware registration) must not accumulate registrations over time.

---

# Core Concepts

- **Singleton persistence**: `$this->app->singleton(Service::class)` creates one instance shared across all requests within a worker. Ideal for services with no request-scoped state (logging, configuration, caching).
- **Scoped bindings**: `$this->app->scoped(Service::class)` creates one instance per request. Resets at each request boundary. Use for services that depend on request context (auth, session).
- **Deferred providers**: Providers that only register service container bindings can be deferred (not loaded until the bound service is requested). `$this->app->registerDeferredProvider(HeavyProvider::class)`.
- **Provider boot() optimization**: Move heavy operations from `boot()` to lazy initialization. Use memoization: `$this->app->singleton(Service::class, fn() => $this->initializeExpensiveService())`.

---

# Patterns

**State audit**: Review every service provider. If `register()` or `boot()` does a database query, API call, or file read, ensure it's cached or deferred. These run on every worker start, not per request.

---

# Common Mistakes

**Registering event listeners per-request in a provider**: In Octane, provider boot runs once. Listeners registered there persist across all requests. If a listener captures request state, it must use scoped bindings internally.

---

# Performance Considerations

- Octane delivers 2.5-20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains
- Each worker uses 30-80MB RSS; total memory = workers x per-worker memory
- Each worker maintains persistent DB/Redis connections; total = workers x connections-per-worker
- Under Octane, database queries become primary bottleneck (bootstrap is eliminated)
- OpCache preloading further reduces cold-start latency by 2-5ms per worker

---

# Related Knowledge Units

State Management and Leak Prevention | Deferred Providers and Pre-Resolved Bindings | Octane Service Container Lifecycle

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
