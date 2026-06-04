# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** # Octane Performance Tuning â€” Sub-50ms Response, Bootstrap Elimination, Optimization Sequence
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Run `php artisan optimize` and verify all cache files are generated.
- [ ] Benchmark request time: measure p50/p95/p99 latency with `wrk`.
- [ ] Profile with Blackfire/Tideways: identify the top 3 time-consuming components.
- [ ] Verify database queries: ensure all queries are indexed, no N+1 queries.
- [ ] Monitor connection pool utilization under peak load.
- [ ] High-priority API endpoints achieve <50ms server-side response time
- [ ] Top 3 time consumers identified and optimized
- [ ] Route, config, and event caching active in production
- [ ] Middleware stack optimized for API routes (no unnecessary middleware)
- [ ] Database queries optimized (N+1 eliminated, indexes added, query time reduced)
- [ ] Response caching implemented for appropriate endpoints
- [ ] Worker count and connection pools tuned for workload
- [ ] JIT enabled and verified
- [ ] Optimization changes documented with before/after latency measurements
- [ ] Continuous performance monitoring configured to prevent regressions
- [ ] Request time profiled and top 3 bottlenecks identified
- [ ] Service providers optimized (deferred, pre-resolved, lazy initialization)
- [ ] Route, config, and event caching applied and verified
- [ ] Middleware stack reviewed and unnecessary middleware removed from API routes
- [ ] Database queries profiled: N+1 fixed, indexes added, query optimization applied

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Tuning sequence**: Measure â†’ identify bottleneck â†’ optimize â†’ measure again. Never optimize without data. Use Blackfire or Tideways to identify the slowest component.
- [ ] **Worker count tuning**: Start at CPU core count. Monitor queue depth (requests waiting for a worker). Increase workers if queue depth grows under load. Monitor RSS to avoid memory exhaustion.
- [ ] **Connection pool sizing**: Each worker maintains persistent connections. Workers Ã— connections-per-request must not exceed database `max_connections`. Monitor connection pool utilization.
- [ ] **Database query batching**: Use `load()` with specific relationships (not all) to avoid N+1 queries. One query with JOIN is faster than N+1 queries.
- [ ] **Response caching**: Cache entire API responses for read-heavy endpoints. Use Redis with TTL. Invalidate on write operations.
- [ ] **OpCache tuning**: `memory_consumption=512MB`, `max_accelerated_files=200000`, `validate_timestamps=0`, `opcache.preload=` with preloading for framework classes. Monitor hit rate.
- [ ] **JIT configuration**: `opcache.jit=1255` (tracing mode), `jit_buffer_size=256M`. JIT helps CPU-bound processing within Octane workers (serialization, encryption, data transformation).
- [ ] **Graceful reload procedure**: Deploy code â†’ `php artisan octane:reload` â†’ warm cache with health check requests â†’ verify hit rate >99% â†’ enable traffic.
- [ ] Document and follow through on architectural decision: Octane-specific performance tuning
- [ ] Ensure architecture aligns with core concept: **Bootstrap elimination**: Octane boots the framework once per worker. The 10â€“40ms bootstrap cost (service container construction, config loading, provider registration, route registration) is paid once per worker, not once per request.
- [ ] Ensure architecture aligns with core concept: **Sub-50ms target**: Achievable for API endpoints returning JSON. Requires total request time <50ms server-side, including all I/O (database, Redis, external APIs).
- [ ] Ensure architecture aligns with core concept: **Optimization sequence**: Bootstrap elimination â†’ service provider optimization â†’ query optimization â†’ caching â†’ connection pooling â†’ worker tuning â†’ JIT/OpCache tuning. Each step builds on the previous.
- [ ] Ensure architecture aligns with core concept: **Sandbox overhead**: Octane's per-request Application cloning adds 0.5â€“2ms. Measure and minimize this overhead.
- [ ] Ensure architecture aligns with core concept: **Deferred providers**: Services not needed on every request can be deferred to per-request resolution, reducing worker memory and startup time.
- [ ] Ensure architecture aligns with core concept: **Pre-resolved bindings**: Services used on every request should be pre-resolved at worker boot. Saves the resolution overhead on each request.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Sub-50ms target breakdown for a typical Laravel Octane API request:
- [ ] The critical path is database I/O. One slow query (50ms+) consumes the entire budget. Optimize every query.
- [ ] Connection pool overhead: establishing a new database connection takes 5â€“20ms. With persistent connections in Octane, this cost is paid once per worker.
- [ ] Serialization overhead: large JSON responses (>100KB) take 2â€“10ms to serialize. Use pagination, sparse fields, or streaming for large responses.
- [ ] View rendering adds 5â€“20ms. API endpoints should return JSON, not Blade views, for sub-50ms targets.
- [ ] OpCache preloading saves 1â€“3ms per request by eliminating class autoloading.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Response caching can serve stale or unauthorized data if cache keys don't include user identity. Always include user ID or roles in cache keys for authenticated endpoints.
- [ ] Sub-50ms responses may expose timing side channels. Ensure authentication and authorization checks take consistent time regardless of success/failure.
- [ ] Pre-resolved bindings: services resolved at boot persist across requests. Ensure they don't store request-scoped data that could leak between users.
- [ ] Deferred providers: ensure deferred providers do not include security-critical middleware or guards.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
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
- [ ] High-priority API endpoints achieve <50ms server-side response time
- [ ] Top 3 time consumers identified and optimized
- [ ] Route, config, and event caching active in production
- [ ] Middleware stack optimized for API routes (no unnecessary middleware)
- [ ] Database queries optimized (N+1 eliminated, indexes added, query time reduced)
- [ ] Response caching implemented for appropriate endpoints
- [ ] Worker count and connection pools tuned for workload
- [ ] JIT enabled and verified
- [ ] Optimization changes documented with before/after latency measurements
- [ ] Continuous performance monitoring configured to prevent regressions
- [ ] Request time profiled and top 3 bottlenecks identified
- [ ] Service providers optimized (deferred, pre-resolved, lazy initialization)
- [ ] Route, config, and event caching applied and verified
- [ ] Middleware stack reviewed and unnecessary middleware removed from API routes
- [ ] Database queries profiled: N+1 fixed, indexes added, query optimization applied
- [ ] Serialization optimized (API resources, pagination, field selection)
- [ ] Worker count and connection pools tuned for workload profile
- [ ] JIT enabled and verified active
- [ ] Sub-50ms target verified for high-priority endpoints
- [ ] Optimization changes documented with before/after measurements
- [ ] Continuous performance monitoring configured to detect regressions

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Tuning without measurement
- [ ] Avoid: Ignoring database as bottleneck
- [ ] Avoid: Over-optimizing middleware
- [ ] Avoid: Setting `max_requests` too low
- [ ] Avoid: Not caching at the application level
- [ ] Avoid anti-pattern: **Premature optimization**: Tuning Octane before basic performance work (OpCache, index optimization, query tuning) is done. Optimize in the right sequence.
- [ ] Avoid anti-pattern: **Sub-50ms obsession**: Not every endpoint needs sub-50ms response. Focus on high-traffic API endpoints. Report-generation and admin endpoints can tolerate higher latency.
- [ ] Avoid anti-pattern: **Ignoring the 95th percentile**: Optimizing only median latency while tail latency (p95/p99) remains high. Users experience the tail.
- [ ] Avoid anti-pattern: **All-in-one optimization**: Changing multiple variables simultaneously. Change one setting at a time and measure the impact.
- [ ] Guard against anti-pattern: Application State Leaking Across Requests
- [ ] Guard against anti-pattern: Not Configuring max_requests for Worker Recycling
- [ ] Guard against anti-pattern: Database Connection Pool Exhaustion
- [ ] Guard against anti-pattern: Running Queue Workers Inside Octane
- [ ] Guard against anti-pattern: Not Using Octane Table for Cross-Worker State

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Bootstrap elimination**: Octane boots the framework once per worker. The 10â€“40ms bootstrap cost (service container construction, config loading, provider registration, route registration) is paid once per worker, not once per request., **Sub-50ms target**: Achievable for API endpoints returning JSON. Requires total request time <50ms server-side, including all I/O (database, Redis, external APIs)., **Optimization sequence**: Bootstrap elimination â†’ service provider optimization â†’ query optimization â†’ caching â†’ connection pooling â†’ worker tuning â†’ JIT/OpCache tuning. Each step builds on the previous., **Sandbox overhead**: Octane's per-request Application cloning adds 0.5â€“2ms. Measure and minimize this overhead., **Deferred providers**: Services not needed on every request can be deferred to per-request resolution, reducing worker memory and startup time.
**Decision Trees:** Octane-specific performance tuning
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Service Provider Optimization for Persistence, State Management and Leak Prevention, Connection Pooling Strategies, Octane Metrics and Benchmarks, OpCache Tuning for Octane

