# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** # Octane Tick Hooks â€” Scheduled Callbacks Within Octane Workers
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Register a tick and verify it executes at the expected interval.
- [ ] Test tick exception handling: throw an exception in a tick and verify the worker does not crash.
- [ ] Verify tick does not block requests: measure request latency during tick execution.
- [ ] Test `Octane::stopTicks()`: verify ticks stop during graceful shutdown.
- [ ] Monitor tick execution time: use `$tick->runtime()` and verify ticks stay under 100ms.
- [ ] All ticks registered in boot() with unique descriptive names
- [ ] Tick execution time <100ms for all registered ticks (verified by profiling)
- [ ] Worker does not crash when a tick throws an exception (error logged, worker continues)
- [ ] Octane::stopTicks() stops all ticks gracefully during shutdown
- [ ] Request latency is unaffected by tick execution (verified by benchmark)
- [ ] No duplicate tick registrations across providers
- [ ] Tick documentation maintained listing all registered ticks with purpose, interval, and error behavior
- [ ] Cache warming ticks keep hot cache keys available without excessive overhead
- [ ] GC collection tick prevents cycle accumulation in long-running workers
- [ ] Candidate tasks classified as worker-scoped vs server-scoped
- [ ] All ticks registered in boot() method (not register())
- [ ] All tick callbacks wrapped in try/catch
- [ ] Tick execution time verified <100ms for all ticks
- [ ] Tick overlap prevented with cache locks where needed
- [ ] Ticks use unique, descriptive names

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Registration timing**: Ticks must be registered in service provider `boot()` methods. The `register()` method runs first and is not guaranteed to execute in the worker context.
- [ ] **Execution model**: After each request, the worker checks if any ticks are due. If a tick is due, the worker executes it before picking up the next request. Ticks do not interrupt request handling.
- [ ] **Non-overlapping**: A tick will not fire again while a previous execution of the same tick is still running. The execution time is subtracted from the next tick's interval.
- [ ] **Worker lifecycle**: Ticks are created when the worker boots and destroyed when the worker is recycled or the server stops. `Octane::stopTicks()` is called automatically during graceful shutdown.
- [ ] **Coordination across workers**: Ticks run independently in each worker. If you need a once-per-cluster operation, use `cache()->lock()` with a TTL to coordinate across workers, or use Laravel's scheduler.
- [ ] **Memory considerations**: Each tick callback captures its closure scope. Avoid capturing large variables in the closure to prevent memory leaks.
- [ ] Document and follow through on architectural decision: Use cases for Octane tick hooks
- [ ] Ensure architecture aligns with core concept: **`Octane::tick()`**: Registers a callback that runs every N seconds within each worker. Syntax: `Octane::tick('name', fn () => ..., seconds: 60)`.
- [ ] Ensure architecture aligns with core concept: **Worker-scoped execution**: Each worker runs its own tick callbacks independently. A tick registered in `AppServiceProvider::boot()` runs in every worker.
- [ ] Ensure architecture aligns with core concept: **Tick lifecycle**: Ticks start after the worker finishes its first request and continue until the worker is recycled or the server stops.
- [ ] Ensure architecture aligns with core concept: **`Octane::stopTicks()`**: Stops all tick callbacks for the current worker. Useful during graceful shutdown to prevent ticks from firing during worker drain.
- [ ] Ensure architecture aligns with core concept: **`$tick` parameter**: Callbacks receive a `$tick` object with `$tick->runtime()` to measure execution time and `$tick->name()` to identify the tick.
- [ ] Ensure architecture aligns with core concept: **Tick vs cron**: Ticks are in-process, lightweight, and per-worker. Cron jobs are out-of-process, scheduled on the host, and run once regardless of worker count.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Tick overhead is proportional to execution frequency and duration. A 10ms tick every 60s adds ~0.01% CPU overhead per worker.
- [ ] Long ticks (>100ms) directly impact request latency â€” the worker cannot handle requests while executing a tick.
- [ ] Ticks do not run during request handling. They execute between requests. For a busy worker handling requests back-to-back, ticks may be delayed.
- [ ] Tick timers are approximate. Octane does not guarantee sub-second tick precision. The actual interval may vary by tens of milliseconds.
- [ ] PHP garbage collection should not be called on every tick. A tick that calls `gc_collect_cycles()` every 60s is sufficient for most applications.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Ticks run in the worker process and have access to all application data. Ensure tick callbacks do not log or expose sensitive data.
- [ ] Tick callbacks that make HTTP requests should use internal URLs, not public URLs, to avoid exposing internal endpoints.
- [ ] Tick callbacks that access external services should have short timeouts to prevent worker blocking.
- [ ] Race conditions: If a tick and a request access the same data simultaneously, ensure proper locking or use atomic operations.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Register a tick and verify it executes at the expected interval.
- [ ] Test tick exception handling: throw an exception in a tick and verify the worker does not crash.
- [ ] Verify tick does not block requests: measure request latency during tick execution.
- [ ] Test `Octane::stopTicks()`: verify ticks stop during graceful shutdown.
- [ ] Monitor tick execution time: use `$tick->runtime()` and verify ticks stay under 100ms.
- [ ] Verify tick isolation: confirm ticks in one worker do not affect other workers.
- [ ] Document all registered ticks with their purpose and interval.
- [ ] All ticks registered in boot() with unique descriptive names
- [ ] Tick execution time <100ms for all registered ticks (verified by profiling)
- [ ] Worker does not crash when a tick throws an exception (error logged, worker continues)
- [ ] Octane::stopTicks() stops all ticks gracefully during shutdown
- [ ] Request latency is unaffected by tick execution (verified by benchmark)
- [ ] No duplicate tick registrations across providers
- [ ] Tick documentation maintained listing all registered ticks with purpose, interval, and error behavior
- [ ] Cache warming ticks keep hot cache keys available without excessive overhead
- [ ] GC collection tick prevents cycle accumulation in long-running workers
- [ ] Candidate tasks classified as worker-scoped vs server-scoped
- [ ] All ticks registered in boot() method (not register())
- [ ] All tick callbacks wrapped in try/catch
- [ ] Tick execution time verified <100ms for all ticks
- [ ] Tick overlap prevented with cache locks where needed
- [ ] Ticks use unique, descriptive names
- [ ] No duplicate tick names across providers
- [ ] Tick exceptions logged but don't crash worker
- [ ] Octane::stopTicks() stops all ticks gracefully
- [ ] Request latency unchanged during tick execution (verified by benchmark)
- [ ] Tick documentation created with name, purpose, interval, runtime, error behavior

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Registering ticks in `register()` method
- [ ] Avoid: Using ticks for heavy computation
- [ ] Avoid: Not wrapping in try/catch
- [ ] Avoid: Registering the same tick in multiple providers
- [ ] Avoid: Assuming ticks are synchronized across workers
- [ ] Avoid anti-pattern: **Tick-based job dispatching**: Dispatching queued jobs from a tick is an anti-pattern â€” use Laravel's scheduler instead. Ticks are for worker-scoped work.
- [ ] Avoid anti-pattern: **Database-intensive ticks**: Ticks that run heavy queries block the worker and consume database connections. Keep database operations in ticks minimal.
- [ ] Avoid anti-pattern: **Ticks that mutate shared global state**: A tick that clears a cache key invalidates the cache for all workers, potentially causing a stampede.
- [ ] Avoid anti-pattern: **Ticks with side effects on every execution**: A tick that increments a counter or appends to a log file on every execution will cause unbounded growth. Use aggregation or rotation.
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
**Core Concepts:** **`Octane::tick()`**: Registers a callback that runs every N seconds within each worker. Syntax: `Octane::tick('name', fn () => ..., seconds: 60)`., **Worker-scoped execution**: Each worker runs its own tick callbacks independently. A tick registered in `AppServiceProvider::boot()` runs in every worker., **Tick lifecycle**: Ticks start after the worker finishes its first request and continue until the worker is recycled or the server stops., **`Octane::stopTicks()`**: Stops all tick callbacks for the current worker. Useful during graceful shutdown to prevent ticks from firing during worker drain., **`$tick` parameter**: Callbacks receive a `$tick` object with `$tick->runtime()` to measure execution time and `$tick->name()` to identify the tick.
**Decision Trees:** Use cases for Octane tick hooks
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** State Management and Leak Prevention, Octane Metrics and Benchmarks, Garbage Collection Threshold Tuning, Service Provider Optimization for Persistence

