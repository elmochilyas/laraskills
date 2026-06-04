# Octane Performance Tuning — Sub-50ms Response, Bootstrap Elimination, Optimization Sequence

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Octane Performance Tuning — Sub-50ms Response, Bootstrap Elimination, Optimization Sequence |
| Difficulty | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Achieving sub-50ms response times with Laravel Octane requires systematic optimization across the entire request lifecycle — from framework bootstrap elimination and service provider tuning to connection pooling and database query optimization. The bootstrap elimination provided by Octane (saving 10–40ms per request) is only the first step. True sub-50ms performance requires ruthless optimization of every remaining millisecond: service container calls, route dispatching, middleware overhead, view rendering, and I/O operations.

## Core Concepts

- **Bootstrap elimination**: Octane boots the framework once per worker. The 10–40ms bootstrap cost (service container construction, config loading, provider registration, route registration) is paid once per worker, not once per request.
- **Sub-50ms target**: Achievable for API endpoints returning JSON. Requires total request time <50ms server-side, including all I/O (database, Redis, external APIs).
- **Optimization sequence**: Bootstrap elimination → service provider optimization → query optimization → caching → connection pooling → worker tuning → JIT/OpCache tuning. Each step builds on the previous.
- **Sandbox overhead**: Octane's per-request Application cloning adds 0.5–2ms. Measure and minimize this overhead.
- **Deferred providers**: Services not needed on every request can be deferred to per-request resolution, reducing worker memory and startup time.
- **Pre-resolved bindings**: Services used on every request should be pre-resolved at worker boot. Saves the resolution overhead on each request.

## When To Use

- You need sub-50ms response times for API endpoints (e.g., microservices, high-traffic APIs).
- You have already deployed Octane and want to push performance further.
- Your application is I/O-bound and you want to minimize all sources of latency.
- You are running in a competitive environment where response time directly impacts business metrics (conversion rate, user engagement).
- You need to maximize throughput on limited hardware (reduce cost per request).

## When NOT To Use

- Your application has response times >200ms without Octane. Focus on database and external API optimization first.
- Your team has not yet audited service providers for Octane compatibility. Tuning is premature without a stable foundation.
- You are running PHP-FPM, not Octane. These tuning techniques are specific to persistent worker architecture.
- Your application is CPU-bound. JIT and OpCache tuning will yield more benefit than Octane-specific tuning.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Defer non-essential service providers | Providers that are only needed for specific admin/cli commands should not run in every worker. Saves 1–5ms per request and worker memory. |
| Pre-resolve essential bindings in `Octane::booted()` | Container resolution happens once at boot, not per-request. Saves 0.5–3ms per request depending on service complexity. |
| Use route caching (`php artisan route:cache`) | Eliminates route registration overhead. Saves 1–2ms per request. Always use in production with Octane. |
| Use config caching (`php artisan config:cache`) | Eliminates config file merging and environment variable reading at boot. Saves 2–5ms per request. |
| Use event caching (`php artisan event:cache`) | Eliminates event discovery overhead. Saves 0.5–1ms per request. |
| Minimize middleware stack | Each middleware adds 0.1–1ms. Remove unnecessary middleware from API routes. |
| Optimize database queries with Octane | With bootstrap eliminated, database queries are now the dominant cost. Profile and optimize slow queries. |
| Use read replicas for reporting queries | Offload read-heavy queries to read replicas. Reduces primary database connection contention. |
| Set `max_requests` based on observed memory growth | Measure worker RSS after N requests. Set `max_requests` to recycle before memory exceeds 80% of available limit. |

## Architecture Guidelines

- **Tuning sequence**: Measure → identify bottleneck → optimize → measure again. Never optimize without data. Use Blackfire or Tideways to identify the slowest component.
- **Worker count tuning**: Start at CPU core count. Monitor queue depth (requests waiting for a worker). Increase workers if queue depth grows under load. Monitor RSS to avoid memory exhaustion.
- **Connection pool sizing**: Each worker maintains persistent connections. Workers × connections-per-request must not exceed database `max_connections`. Monitor connection pool utilization.
- **Database query batching**: Use `load()` with specific relationships (not all) to avoid N+1 queries. One query with JOIN is faster than N+1 queries.
- **Response caching**: Cache entire API responses for read-heavy endpoints. Use Redis with TTL. Invalidate on write operations.
- **OpCache tuning**: `memory_consumption=512MB`, `max_accelerated_files=200000`, `validate_timestamps=0`, `opcache.preload=` with preloading for framework classes. Monitor hit rate.
- **JIT configuration**: `opcache.jit=1255` (tracing mode), `jit_buffer_size=256M`. JIT helps CPU-bound processing within Octane workers (serialization, encryption, data transformation).
- **Graceful reload procedure**: Deploy code → `php artisan octane:reload` → warm cache with health check requests → verify hit rate >99% → enable traffic.

## Performance Considerations

- Sub-50ms target breakdown for a typical Laravel Octane API request:
  - Octane sandbox overhead: 0.5–2ms
  - Route dispatch + middleware: 1–3ms
  - Controller logic: 0.5–2ms
  - Database query (1 query): 2–10ms (network + execution)
  - Response serialization (JSON): 0.5–2ms
  - Total: 5–19ms (within sub-50ms target)
- The critical path is database I/O. One slow query (50ms+) consumes the entire budget. Optimize every query.
- Connection pool overhead: establishing a new database connection takes 5–20ms. With persistent connections in Octane, this cost is paid once per worker.
- Serialization overhead: large JSON responses (>100KB) take 2–10ms to serialize. Use pagination, sparse fields, or streaming for large responses.
- View rendering adds 5–20ms. API endpoints should return JSON, not Blade views, for sub-50ms targets.
- OpCache preloading saves 1–3ms per request by eliminating class autoloading.

## Security Considerations

- Response caching can serve stale or unauthorized data if cache keys don't include user identity. Always include user ID or roles in cache keys for authenticated endpoints.
- Sub-50ms responses may expose timing side channels. Ensure authentication and authorization checks take consistent time regardless of success/failure.
- Pre-resolved bindings: services resolved at boot persist across requests. Ensure they don't store request-scoped data that could leak between users.
- Deferred providers: ensure deferred providers do not include security-critical middleware or guards.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Tuning without measurement | Optimizing random parts of the application without data. | Assuming all parts contribute equally to latency. | Effort wasted on already-fast components; real bottlenecks untouched. | Always profile first with Blackfire or Tideways. |
| Ignoring database as bottleneck | After bootstrap elimination, database queries become the dominant cost. | Focusing exclusively on application-level tuning. | p99 latency still >100ms because of slow queries. | Profile database query performance. Optimize slow queries. |
| Over-optimizing middleware | Removing security-critical middleware for speed. | Assuming all middleware is overhead. | Security vulnerabilities from missing authentication or authorization checks. | Remove unnecessary middleware (e.g., session for API), never security middleware. |
| Setting `max_requests` too low | Workers recycle too frequently, negating Octane's bootstrap benefit. | Setting `max_requests=100` to be "safe." | Frequent worker restarts (every 100 requests) add bootstrap cost to 1% of requests. | Set `max_requests=500` minimum. Increase based on memory growth observation. |
| Not caching at the application level | Each request hits the database for the same data. | Assuming database queries are fast enough. | Database becomes bottleneck under load. | Cache API responses and query results with appropriate TTL. |

## Anti-Patterns

- **Premature optimization**: Tuning Octane before basic performance work (OpCache, index optimization, query tuning) is done. Optimize in the right sequence.
- **Sub-50ms obsession**: Not every endpoint needs sub-50ms response. Focus on high-traffic API endpoints. Report-generation and admin endpoints can tolerate higher latency.
- **Ignoring the 95th percentile**: Optimizing only median latency while tail latency (p95/p99) remains high. Users experience the tail.
- **All-in-one optimization**: Changing multiple variables simultaneously. Change one setting at a time and measure the impact.

## Examples

```php
// Service provider optimization workflow
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Octane\Facades\Octane;

class OptimizationProvider extends ServiceProvider
{
    public function register(): void
    {
        // Defer providers not needed on every request
        if ($this->app->runningInConsole()) {
            $this->app->register(ReportingServiceProvider::class);
        }
    }

    public function boot(): void
    {
        // Pre-resolve services used on every request
        Octane::booted(function () {
            app('router')->getRoutes()->refreshNameLookups();
            app('cache')->store('octane')->forever('worker:started', now());
        });
    }
}
```

```bash
# Optimization sequence commands
php artisan optimize                        # Cache config, routes, events
php artisan route:cache                     # Cache route registration
php artisan config:cache                    # Cache config merging
php artisan event:cache                     # Cache event discovery
php artisan octane:start --server=roadrunner --host=127.0.0.1 --port=8080
```

## Related Topics

- Service Provider Optimization for Persistence
- State Management and Leak Prevention
- Connection Pooling Strategies
- Octane Metrics and Benchmarks
- OpCache Tuning for Octane

## AI Agent Notes

- The most impactful tuning step is almost always database query optimization. After Octane eliminates bootstrap, queries are the new bottleneck.
- Sub-50ms is achievable but requires discipline — every middleware, every query, every service resolution matters at this scale.
- The 80/20 rule applies: 80% of the performance gain comes from 20% of the tuning effort (bootstrap elimination + OpCache tuning + query optimization). The remaining 20% gain requires significant effort.
- For API endpoints, remember that sub-50ms server-side doesn't account for network latency. End-to-end response time for global users will be 50–200ms even with sub-50ms server time.

## Verification

- [ ] Run `php artisan optimize` and verify all cache files are generated.
- [ ] Benchmark request time: measure p50/p95/p99 latency with `wrk`.
- [ ] Profile with Blackfire/Tideways: identify the top 3 time-consuming components.
- [ ] Verify database queries: ensure all queries are indexed, no N+1 queries.
- [ ] Monitor connection pool utilization under peak load.
- [ ] Test with production-scale data in staging.
- [ ] Document the performance baseline and optimization changes.
- [ ] Set up continuous performance monitoring with alerts on regressions.
- [ ] Run 24-hour soak test: verify worker RSS stability.
- [ ] Verify sub-50ms target is met for high-priority endpoints.
