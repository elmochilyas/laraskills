# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** # Octane Concurrent Requests â€” Concurrent Task Execution Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Write a test with `Concurrency::run()` dispatching 3 slow database queries and verify total time â‰ˆ max(query time), not sum.
- [ ] Test `Concurrency::defer()`: verify deferred tasks execute after the response is sent.
- [ ] Verify error handling: one failing concurrent task does not crash the entire request.
- [ ] Test timeout behavior: verify concurrent operations time out after the configured duration.
- [ ] Monitor connection pool under concurrent load: verify no connection exhaustion.
- [ ] Response time for concurrent I/O endpoints reduced from sum(task_times) to max(task_time)
- [ ] Timeouts enforce upper bound on concurrent operation duration
- [ ] Partial failures handled gracefully (critical errors fail the request, non-critical return fallbacks)
- [ ] Connection pool sized correctly (no exhaustion under peak concurrent load)
- [ ] Driver-specific concurrency patterns used correctly
- [ ] Deferred tasks execute after response without blocking
- [ ] Latency benchmarks show measurable improvement from concurrency implementation
- [ ] No race conditions or data corruption from concurrent task execution
- [ ] Independent I/O operations identified and documented
- [ ] `Concurrency::run()` implemented with proper result destructuring
- [ ] Timeout configured on all concurrent operations (overall and per-task)
- [ ] Per-task error handling implemented (critical vs non-critical)
- [ ] `Concurrency::defer()` used for appropriate after-response work
- [ ] Connection pool sized for peak concurrent queries
- [ ] Driver-specific optimizations applied (Swoole task workers, etc.)

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Swoole concurrency**: Uses coroutines within the same worker process. Coroutines are lightweight (~2KB stack) and can number in the thousands. I/O operations yield control to other coroutines automatically.
- [ ] **RoadRunner concurrency**: RoadRunner workers are single-request-at-a-time processes. True concurrency requires additional workers or the RoadRunner job plugin for background tasks. Octane's `Concurrency` facade on RoadRunner dispatches tasks via the job system.
- [ ] **FrankenPHP concurrency**: Threads handle one request at a time. Concurrency within a request is limited. Use `Concurrency::defer()` for background work but be aware that the thread blocks until deferred tasks complete.
- [ ] **Task worker isolation**: Swoole task workers receive serialized tasks via `$server->task()`. The task is processed in a dedicated task worker process, and the result is returned asynchronously via `onTask` callback.
- [ ] **Deferred task lifecycle**: Tasks registered via `Concurrency::defer()` execute after the response headers are sent but before the worker returns to the pool. If the worker crashes, deferred tasks are lost.
- [ ] **Connection pooling under concurrency**: Concurrent requests share the same database connection pool. Ensure pool size >= number of concurrent database queries. Connection exhaustion causes serialization or failures.
- [ ] Document and follow through on architectural decision: Using Octane concurrent task execution
- [ ] Document and follow through on architectural decision: When to use concurrent vs sequential
- [ ] Ensure architecture aligns with core concept: **Octane Concurrency facade**: `Concurrency::run()` and `Concurrency::defer()` â€” invoke multiple callables concurrently and wait for all results. Abstracts the underlying runtime's concurrency mechanism.
- [ ] Ensure architecture aligns with core concept: **Driver-specific execution**: Swoole uses coroutines (`go()`), RoadRunner uses the plugin's job system, FrankenPHP uses thread pool dispatch.
- [ ] Ensure architecture aligns with core concept: **Task workers**: Swoole supports `task_worker_num` â€” dedicated worker processes for CPU-intensive tasks. Task workers receive tasks via `$server->task()` and process them asynchronously.
- [ ] Ensure architecture aligns with core concept: **Non-blocking I/O**: With Swoole, coroutine-aware I/O operations (PDO, Redis, cURL via hooks) are non-blocking. Multiple queries execute in parallel within the same coroutine context.
- [ ] Ensure architecture aligns with core concept: **Deferred execution**: `Concurrency::defer()` schedules tasks to run after the response is sent. Useful for logging, analytics, cache warming.
- [ ] Ensure architecture aligns with core concept: **Limitations**: Not all I/O operations can be made concurrent. File operations, some stream operations, and non-coroutine-aware extensions block the worker.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Concurrent queries can reduce response time from `sum(tasks)` to `max(tasks)`. If you have 3 Ã— 100ms queries, concurrency reduces from 300ms to 100ms.
- [ ] Coroutine overhead: Swoole coroutine creation and scheduling adds ~0.1â€“0.5Âµs per coroutine. Negligible for I/O-bound tasks.
- [ ] Task worker dispatch (Swoole): Serializing the task + IPC overhead adds ~1â€“5ms. Only beneficial for tasks that take >10ms.
- [ ] Connection pool sizing: Each concurrent database query consumes a connection. If the pool has 10 connections and you dispatch 20 concurrent queries, 10 will queue.
- [ ] Memory overhead: Each concurrent task holds its own call stack and variable scope. For CPU-bound tasks, this adds memory pressure.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Data isolation: Concurrent tasks share the same worker memory. Ensure tasks do not accidentally share or corrupt request-scoped data.
- [ ] Race conditions: Static property access in concurrent tasks can cause data corruption or non-deterministic behavior. Always use thread-safe patterns.
- [ ] Error propagation: An uncaught exception in one concurrent task can crash the entire worker. Wrap concurrent tasks in try/catch blocks.
- [ ] Task worker serialization (Swoole): Data passed to task workers is serialized via `igbinary` or `php_serialize`. Ensure no sensitive data leaks through serialization.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Write a test with `Concurrency::run()` dispatching 3 slow database queries and verify total time â‰ˆ max(query time), not sum.
- [ ] Test `Concurrency::defer()`: verify deferred tasks execute after the response is sent.
- [ ] Verify error handling: one failing concurrent task does not crash the entire request.
- [ ] Test timeout behavior: verify concurrent operations time out after the configured duration.
- [ ] Monitor connection pool under concurrent load: verify no connection exhaustion.
- [ ] Test with Swoole task workers: dispatch a CPU-intensive task and verify it runs in a separate process.
- [ ] Benchmark: compare sequential vs concurrent execution for your specific workload.
- [ ] Document the concurrency patterns used in your application.
- [ ] Response time for concurrent I/O endpoints reduced from sum(task_times) to max(task_time)
- [ ] Timeouts enforce upper bound on concurrent operation duration
- [ ] Partial failures handled gracefully (critical errors fail the request, non-critical return fallbacks)
- [ ] Connection pool sized correctly (no exhaustion under peak concurrent load)
- [ ] Driver-specific concurrency patterns used correctly
- [ ] Deferred tasks execute after response without blocking
- [ ] Latency benchmarks show measurable improvement from concurrency implementation
- [ ] No race conditions or data corruption from concurrent task execution
- [ ] Independent I/O operations identified and documented
- [ ] `Concurrency::run()` implemented with proper result destructuring
- [ ] Timeout configured on all concurrent operations (overall and per-task)
- [ ] Per-task error handling implemented (critical vs non-critical)
- [ ] `Concurrency::defer()` used for appropriate after-response work
- [ ] Connection pool sized for peak concurrent queries
- [ ] Driver-specific optimizations applied (Swoole task workers, etc.)
- [ ] Wall-clock time reduced from sum(tasks) to max(tasks) verified
- [ ] Error handling test: partial failures don't crash the request
- [ ] Timeout test: concurrent operations time out gracefully
- [ ] Connection pool test: no exhaustion under concurrent load
- [ ] Latency benchmark: p95 improved after concurrency implementation

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using concurrency for CPU-bound work
- [ ] Avoid: Not setting connection pool limits
- [ ] Avoid: Ignoring partial failure
- [ ] Avoid: Using shared mutable state
- [ ] Avoid: Not implementing timeouts
- [ ] Avoid anti-pattern: **Concurrent writes to the same database row**: Multiple concurrent tasks updating the same record causes deadlocks or lost updates. Serialize writes to the same resource.
- [ ] Avoid anti-pattern: **Fire-and-forget without error handling**: `Concurrency::defer()` tasks that fail silently lose data. Always log errors from deferred tasks.
- [ ] Avoid anti-pattern: **Deeply nested concurrency**: Concurrent tasks that dispatch more concurrent tasks creates complex dependency chains. Keep concurrency flat (one level of parallelism).
- [ ] Avoid anti-pattern: **Assuming RoadRunner concurrency is like Swoole**: RoadRunner workers cannot execute concurrent PHP code within a single worker. Concurrency requires multiple workers or job dispatch.
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
**Core Concepts:** **Octane Concurrency facade**: `Concurrency::run()` and `Concurrency::defer()` â€” invoke multiple callables concurrently and wait for all results. Abstracts the underlying runtime's concurrency mechanism., **Driver-specific execution**: Swoole uses coroutines (`go()`), RoadRunner uses the plugin's job system, FrankenPHP uses thread pool dispatch., **Task workers**: Swoole supports `task_worker_num` â€” dedicated worker processes for CPU-intensive tasks. Task workers receive tasks via `$server->task()` and process them asynchronously., **Non-blocking I/O**: With Swoole, coroutine-aware I/O operations (PDO, Redis, cURL via hooks) are non-blocking. Multiple queries execute in parallel within the same coroutine context., **Deferred execution**: `Concurrency::defer()` schedules tasks to run after the response is sent. Useful for logging, analytics, cache warming.
**Decision Trees:** Using Octane concurrent task execution, When to use concurrent vs sequential
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Worker Configuration by Driver, Connection Pooling Strategies, Octane Tick Hooks and Scheduled Tasks, Service Provider Optimization for Persistence, Octane Metrics and Benchmarks

