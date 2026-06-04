# Skill: Tune Octane for Sub-50ms Response Times

## Purpose
Achieve sub-50ms response times for Laravel Octane API endpoints through systematic optimization following the sequence: bootstrap elimination, service provider optimization, database query tuning, caching, and worker tuning — all driven by profiling measurements rather than guesses.

## When To Use
- You need sub-50ms response times for high-traffic API endpoints
- You have already deployed Octane and eliminated the bootstrap bottleneck
- Your profiling shows that post-Octane, database queries are the new dominant bottleneck
- You need to maximize throughput on limited hardware (reduce cost per request)
- Your application is I/O-bound and you want to minimize all sources of latency

## When NOT To Use
- Your application has response times >200ms without Octane — optimize database and external API calls first
- You haven't yet deployed Octane or completed basic Octane compatibility work (service provider audit, static property elimination)
- You are running PHP-FPM — these tuning techniques are specific to Octane's persistent worker architecture
- Your application is CPU-bound — JIT and OpCache tuning will yield more benefit than Octane-specific tuning
- You haven't profiled the application to identify actual bottlenecks

## Prerequisites
- Laravel application deployed under Octane with stable worker operation
- Profiling tool (Blackfire, Tideways, Laravel Debugbar) to measure per-request timings
- PHP-FPM baseline and Octane baseline benchmarks
- `php artisan optimize`, `route:cache`, `config:cache`, `event:cache` already in deployment pipeline
- OpCache configured with `memory_consumption=512MB` and preloading enabled
- Database query log or slow query log enabled

## Inputs
- Profiling data: per-request timing breakdown (bootstrap, middleware, controller, queries, serialization)
- Current p50/p95/p99 latency for target endpoints
- List of all database queries per endpoint with execution times
- Service provider list with boot() method analysis
- Current config/octane.php settings (worker count, max_requests, pre_resolved list)
- OpCache status (hit rate, memory usage, accelerated files count)

## Workflow

### 1. Profile Current Request Breakdown
- Use Blackfire, Tideways, or Laravel Debugbar to profile target endpoints
- Break down total request time into:
  - Octane sandbox cloning (0.5-2ms)
  - Route dispatch + middleware stack (1-3ms)
  - Controller logic (0.5-2ms)
  - Database queries (varies — critical path)
  - View/JSON serialization (0.5-2ms)
- Identify the top 3 time consumers as optimization targets
- Document the current total time and the target (50ms)

### 2. Optimize Service Providers
- Audit all service providers — verify correct use of singleton vs scoped
- Apply `DeferrableProvider` to providers used in <50% of requests
- Pre-resolve only services used in >50% of requests
- Move expensive boot() operations to lazy initialization
- Verify no duplicate event listener registrations
- Measure impact: each deferred provider saves 1-5ms per request

### 3. Cache Routes, Config, and Events
- Run `php artisan route:cache` — saves 1-2ms per request
- Run `php artisan config:cache` — saves 2-5ms per request
- Run `php artisan event:cache` — saves 0.5-1ms per request
- Add these commands to the deployment pipeline
- Verify cached files exist in bootstrap/cache/
- Invalidate cache on every deployment (cache files change with code)

### 4. Optimize Middleware Stack
- Review all middleware applied to API routes
- Remove session middleware from stateless API routes (it loads session data unnecessarily)
- Remove CSRF middleware from API routes
- Move global middleware to route-specific middleware where possible
- Combine multiple middleware into one where they share data (e.g., auth + load user)
- Measure impact: each middleware adds 0.1-1ms per request

### 5. Optimize Database Queries
- Profile every query in the target endpoints
- Fix N+1 queries: use eager loading (`with()`) or `load()` with specific relationships
- Add missing database indexes: check `EXPLAIN` output for full table scans
- Use query batching: combine multiple queries where possible
- Use read replicas for reporting/heavy read queries
- Consider Redis caching for query results that change infrequently
- Measure impact: query optimization typically saves 10-80ms per request

### 6. Add Response Caching
- Cache entire API responses for read-heavy endpoints:
  ```php
  return cache()->remember('api:users:index', 60, fn () => User::all());
  ```
- Use Redis as cache driver for sub-millisecond reads
- Invalidate cache on write operations (model events, observer)
- Cache granularity: cache at the response level for maximum gain, query level for flexibility
- Set appropriate TTLs based on data freshness requirements
- Measure impact: cache hit saves 20-100% of request time

### 7. Optimize Serialization
- Use API resources with `JsonResource` for lean JSON responses
- Use `spatie/laravel-data` or similar for typed DTOs with efficient serialization
- Avoid loading and serializing unnecessary fields
- For large collections: use pagination (limit results per page)
- For very large responses (>100KB): consider streaming or cursor-based pagination
- Measure impact: serialization optimization saves 1-5ms per request

### 8. Tune Worker Count and Connection Pools
- Set worker count based on workload profile (CPU-bound: cores; I/O-bound: cores × 1.5-2)
- Set max_requests to 1000+ (never below 500)
- Ensure connection pool size supports peak concurrent queries
- Use read/write splitting for database connections
- Configure connection timeouts (5s) to prevent worker hangs
- Measure impact: correct worker tuning adds 10-30% throughput at same latency

### 9. Enable and Tune JIT
- Configure `opcache.jit=1255` (tracing mode) in php.ini
- Set `jit_buffer_size=256M`
- JIT helps CPU-bound operations within Octane workers: serialization, encryption, validation
- Verify JIT is active: `opcache_get_status()['jit']['enabled']`
- JIT impact: 5-20% improvement on CPU-bound operations, negligible on I/O-bound

### 10. Verify Sub-50ms Target
- Re-profile the optimized endpoints
- Confirm total request time <50ms (server-side only, not including network)
- Typical breakdown for sub-50ms:
  - Sandbox overhead: 0.5-2ms
  - Route + middleware: 1-3ms
  - Controller logic: 0.5-2ms
  - Database query (1 query): 2-10ms
  - JSON serialization: 0.5-2ms
  - Total: 5-19ms
- If still >50ms, identify the remaining bottleneck and iterate
- Document the optimization changes and their impact on latency

## Validation Checklist
- [ ] Request time profiled and top 3 bottlenecks identified
- [ ] Service providers optimized (deferred, pre-resolved, lazy initialization)
- [ ] Route, config, and event caching applied and verified
- [ ] Middleware stack reviewed and unnecessary middleware removed from API routes
- [ ] Database queries profiled: N+1 fixed, indexes added, query optimization applied
- [ ] Response caching implemented for appropriate endpoints
- [ ] Serialization optimized (API resources, pagination, field selection)
- [ ] Worker count and connection pools tuned for workload profile
- [ ] JIT enabled and verified active
- [ ] Sub-50ms target verified for high-priority endpoints
- [ ] Optimization changes documented with before/after measurements
- [ ] Continuous performance monitoring configured to detect regressions

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Still >50ms after all optimizations | 80ms to 120ms response | Single slow database query (50ms+) dominates budget | Profile and optimize the specific query; add caching |
| Sub-50ms sometimes, >200ms other times | Intermittent latency spikes | Query cache miss, cache stampede, or GC pause | Verify cache hit rate, check GC telemetry |
| Optimization improves median but not p99 | p99 >500ms | Tail latency from connection pool contention, garbage collection | Profile tail requests separately, increase pool size, check GC |
| Caching improves speed but data stale | Users see outdated data | Cache TTL too long or cache not invalidated on writes | Reduce TTL, implement write-through cache invalidation |
| JIT enabled but no improvement | Same throughput with and without JIT | I/O-bound workload where JIT doesn't help | Accept JIT impact is workload-dependent; focus on I/O optimization |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Cache response vs cache query | Response caching for static/deterministic data. Query caching for dynamic data with frequent writes. Cache both if budget allows |
| Index vs cache | Index when the query runs frequently with different parameters. Cache when the query runs rarely or returns static data |
| JIT mode | `1255` (tracing) for general use. `1265` (tracing with register allocation) for CPU-heavy. `0` to disable for memory-constrained |
| More workers vs faster queries | More workers if queries are I/O-bound and connection pool has headroom. Faster queries if database CPU is the bottleneck |

## Performance Considerations
- Sub-50ms target breakdown: sandbox 0.5-2ms, route + middleware 1-3ms, controller 0.5-2ms, query 2-10ms, serialization 0.5-2ms
- The critical path is database I/O — one slow query (>50ms) consumes the entire budget
- Route/config/event caching together save 3.5-8ms per request across all workers
- Middleware reduction saves 0.1-1ms per middleware removed from the stack
- Serialization optimization saves 1-5ms for typical JSON responses
- JIT adds 5-20% improvement on CPU-bound operations within workers

## Security Considerations
- Response caching must include user identity in cache keys for authenticated endpoints; otherwise User B may receive User A's cached data
- Removing middleware for speed must never remove security middleware (auth, authorization, throttle)
- Pre-resolved bindings persist across requests — ensure they don't store request-scoped data
- Sub-50ms responses may expose timing side channels — ensure auth checks take consistent time
- Cached responses may contain sensitive data — ensure cache storage is secured and encrypted

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Follow optimization sequence: bootstrap → providers → queries → caching → worker tuning | `05-rules.md:1` | Entire workflow follows this sequence |
| Defer non-essential providers and pre-resolve only essential ones | `05-rules.md:29` | Step 2: provider optimization |
| Use route, config, and event caching in every production deployment | `05-rules.md:60` | Step 3: caching |
| Profile database queries after Octane deployment | `05-rules.md:89` | Step 5: query optimization |
| Never set max_requests below 500 in production | `05-rules.md:114` | Step 8: worker tuning |

## Related Skills

| Skill | Relation |
|-------|----------|
| Benchmark and Monitor Octane Performance | Prerequisite — must measure before and after tuning |
| Optimize Service Providers for Octane | Step 2 is a detailed implementation of this |
| Configure Octane Workers by Driver | Step 8 depends on driver-specific worker configuration |
| Implement Concurrent Request Execution | Concurrent I/O further reduces response time for fan-out patterns |
| Calculate and Manage Connection Budgets | Connection pool sizing is critical for sub-50ms targets |

## Success Criteria
- High-priority API endpoints achieve <50ms server-side response time
- Top 3 time consumers identified and optimized
- Route, config, and event caching active in production
- Middleware stack optimized for API routes (no unnecessary middleware)
- Database queries optimized (N+1 eliminated, indexes added, query time reduced)
- Response caching implemented for appropriate endpoints
- Worker count and connection pools tuned for workload
- JIT enabled and verified
- Optimization changes documented with before/after latency measurements
- Continuous performance monitoring configured to prevent regressions
