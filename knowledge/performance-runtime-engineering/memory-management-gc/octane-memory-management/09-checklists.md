# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # Octane Memory Management â€” State Leak Prevention, Sandbox Patterns, Service Provider Auditing, WeakReference
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Configure `octane:watch` during development and fix all warnings.
- [ ] Audit all service providers: categorize each as safe/needs-review/unsafe.
- [ ] Replace all `static $` properties with container bindings or scoped services.
- [ ] Run a 24-hour soak test with 10K+ requests â€” verify RSS growth <10%.
- [ ] Test multi-user scenarios: log in as User A, then User B â€” verify no data crossover.
- [ ] Worker RSS stable over 24 hours (<2% per hour growth)
- [ ] max_requests configured for optimal balance
- [ ] Connection pooling prevents resource exhaustion
- [ ] No state leaks detected (tested with concurrent requests)
- [ ] Memory management configuration documented
- [ ] Worker RSS growth baseline established
- [ ] max_requests set to 500-1000
- [ ] Connection pooling configured
- [ ] Service providers audited (no request-scoped singletons)
- [ ] Static properties refactored
- [ ] Octane::booted() used for per-worker init
- [ ] unset() called for large request-scoped variables
- [ ] 24-hour soak test passed (RSS growth <2%/hour)
- [ ] Configuration documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Sandbox lifecycle**: Worker starts â†’ Octane::booted() runs â†’ wait for request â†’ clone application â†’ create sandbox â†’ handle request â†’ reset sandbox â†’ forget scoped instances â†’ wait for next request.
- [ ] **What's shared across requests**: Config (config/, .env), events (EventServiceProvider registrations), logging (Log channels), routing (routes/web.php, api.php), middleware registrations.
- [ ] **What's fresh per request**: Application instance clone, request-scoped singletons (database connections, auth, session), facades with request-scoped backing.
- [ ] **Service provider categories**: 1) Providers that register shared services (safe â€” boot once, persist), 2) Providers that register request-scoped services (need `scoped()` binding), 3) Providers that register event listeners (need idempotency â€” use `Octane::booted()`).
- [ ] **Static property audit**: Search for `public static $`, `protected static $`, `private static $` across all application and package code. Mark each for Octane safety review.
- [ ] **Package compatibility**: Not all Laravel packages are Octane-compatible. Maintain a compatibility matrix. Use `Octane::booted()` to wrap package initialization when needed.
- [ ] Document and follow through on architectural decision: State management strategy for Octane
- [ ] Ensure architecture aligns with core concept: **State leak**: Data from Request A persists in the worker and affects Request B. Caused by static properties, singleton misuse, or per-request listeners registered on shared event dispatchers.
- [ ] Ensure architecture aligns with core concept: **Sandbox pattern**: Octane creates a "sandboxed" application instance per request. Framework-level services (config, events, logging) are shared across requests. Application-level services are cloned fresh.
- [ ] Ensure architecture aligns with core concept: **Octane::booted()**: Callback that runs once per worker during boot. Used for one-time initialization that should not repeat on every request.
- [ ] Ensure architecture aligns with core concept: **Service provider auditing**: Reviewing each service provider to ensure it doesn't register per-request state, bind request-scoped data as singletons, or register listeners that accumulate.
- [ ] Ensure architecture aligns with core concept: **WeakReference (PHP 7.4+)**: A reference that does not prevent garbage collection. Used for caches or object mappings where the referenced object should be freed when no longer needed.
- [ ] Ensure architecture aligns with core concept: **`$app->forgetInstance()` / `$app->forgetScopedInstances()`**: Methods to clear singleton instances from the container. Called at request boundaries to reset request-scoped singletons.
- [ ] Ensure architecture aligns with core concept: **max_requests**: Configuration that recycles workers after N requests. Safety net for undetected memory leaks. Typical values: 500â€“2000.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Monitor per-worker RSS over 24 hours â€” establish baseline growth rate
- [ ] Set max_requests to 500-1000 to recycle workers before fragmentation accumulates
- [ ] Configure connection pooling: set `DB::pool()` or configure database max_connections per worker count
- [ ] Audit service providers: move request-scoped bindings from singleton() to scoped()
- [ ] Replace static properties with instance properties or container bindings
- [ ] Use `Octane::booted()` for per-worker initialization instead of provider boot()
- [ ] Explicitly unset() large variables at the end of request handling
- [ ] Enable `octane:watch` during development to detect state leaks automatically
- [ ] Run a 24-hour soak test with production traffic â€” RSS should grow <2% per hour
- [ ] Document the memory management configuration

# Performance Checklist (from 04/06)
- [ ] Sandbox cloning overhead: 0.5â€“2ms per request. Negligible compared to the 10â€“40ms bootstrap it replaces.
- [ ] `$app->forgetScopedInstances()` cost: ~0.1â€“1ms depending on number of scoped bindings.
- [ ] WeakReference resolution: ~0.1Âµs â€” hash table lookup. Negligible.
- [ ] Static property audit cost: manual effort, not runtime. Use automated tools (PHPStan, Larastan) to reduce audit time.
- [ ] max_requests = 500: 0.2% of requests pay the bootstrap cost (result of worker recycling). Acceptable safety net.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Data leakage between users: the most critical security concern. State leaks can cause User A to see User B's data. This is a data privacy issue with legal implications.
- [ ] Authentication state: If the auth singleton is not properly scoped, user authentication state leaks across requests. Always test multi-user scenarios.
- [ ] Session isolation: Octane uses Laravel's session drivers. Never use `$_SESSION` directly â€” it persists across requests in the worker.
- [ ] Third-party packages: A single Octane-unsafe package can introduce data integrity vulnerabilities across the entire application.
- [ ] Race conditions: Concurrent requests in Swoole with shared state can cause data corruption. Use mutexes or atomic operations for shared resources.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Configure `octane:watch` during development and fix all warnings.
- [ ] Audit all service providers: categorize each as safe/needs-review/unsafe.
- [ ] Replace all `static $` properties with container bindings or scoped services.
- [ ] Run a 24-hour soak test with 10K+ requests â€” verify RSS growth <10%.
- [ ] Test multi-user scenarios: log in as User A, then User B â€” verify no data crossover.
- [ ] Verify all third-party packages work correctly under Octane.
- [ ] Implement WeakReference-based caching for objects that may need collection.
- [ ] Set `max_requests` based on observed memory growth in soak test.
- [ ] Document the Octane memory management approach and audit findings.
- [ ] Worker RSS stable over 24 hours (<2% per hour growth)
- [ ] max_requests configured for optimal balance
- [ ] Connection pooling prevents resource exhaustion
- [ ] No state leaks detected (tested with concurrent requests)
- [ ] Memory management configuration documented
- [ ] Worker RSS growth baseline established
- [ ] max_requests set to 500-1000
- [ ] Connection pooling configured
- [ ] Service providers audited (no request-scoped singletons)
- [ ] Static properties refactored
- [ ] Octane::booted() used for per-worker init
- [ ] unset() called for large request-scoped variables
- [ ] 24-hour soak test passed (RSS growth <2%/hour)
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using static properties on service providers
- [ ] Avoid: Registering event listeners in `register()` method
- [ ] Avoid: Binding request-scoped services as singletons
- [ ] Avoid: Not calling `$app->forgetInstance()` for temporary singletons
- [ ] Avoid: Assuming packages are Octane-compatible
- [ ] Avoid anti-pattern: **Setting max_requests very low (100)**: Hides leaks but negates Octane's bootstrap elimination benefit. Every 100th request pays the full bootstrap cost. Fix the leak, don't hide it.
- [ ] Avoid anti-pattern: **Global state management through facades**: `\Cache::put()`, `\Log::info()` â€” facades use static access, but their underlying instances are managed by the container. This is safe. The anti-pattern is storing state on the facade's static instance.
- [ ] Avoid anti-pattern: **Conditional service provider registration**: `if (app()->environment('production')) { $this->app->register(...) }` â€” `app()` calls work during `register()` but may not behave as expected. Use `$this->app` instead.
- [ ] Avoid anti-pattern: **Ignoring octane:watch warnings**: `octane:watch` detects static property modifications during development. Treat warnings as production-blocking bugs.
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste

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
**Core Concepts:** **State leak**: Data from Request A persists in the worker and affects Request B. Caused by static properties, singleton misuse, or per-request listeners registered on shared event dispatchers., **Sandbox pattern**: Octane creates a "sandboxed" application instance per request. Framework-level services (config, events, logging) are shared across requests. Application-level services are cloned fresh., **Octane::booted()**: Callback that runs once per worker during boot. Used for one-time initialization that should not repeat on every request., **Service provider auditing**: Reviewing each service provider to ensure it doesn't register per-request state, bind request-scoped data as singletons, or register listeners that accumulate., **WeakReference (PHP 7.4+)**: A reference that does not prevent garbage collection. Used for caches or object mappings where the referenced object should be freed when no longer needed.
**Rules:**
- General: Use WeakReference for In-Memory Caches
**Skills:** Octane Architecture and Execution Model, Service Provider Optimization, State Management and Leak Prevention, Connection Pooling Strategies
**Decision Trees:** State management strategy for Octane
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Service Provider Optimization for Persistence, Worker Configuration by Driver, Memory Leak Detection Patterns, GC Threshold Tuning for Octane, Connection Pooling Strategies

