# Skill: Implement Concurrent Request Execution with Octane Concurrency Facade

## Purpose
Use Octane's `Concurrency` facade to parallelize independent I/O operations within a single request — reducing wall-clock response time from sum(task_times) to max(task_time) — with proper error handling, timeouts, connection pool management, and driver-aware execution patterns.

## When To Use
- A single request makes multiple independent database queries that can run in parallel
- A request fetches data from multiple external APIs simultaneously (fan-out pattern)
- You want to perform non-critical work (logging, metrics, cache warming) after the response is sent using `defer()`
- You are using Swoole and have CPU-intensive work to offload to task workers
- You need to reduce p99 latency for requests that combine multiple slow I/O calls

## When NOT To Use
- I/O operations are sequential (each depends on the previous result)
- You are using RoadRunner or FrankenPHP where concurrent execution is limited (single request per worker)
- The overhead of concurrent dispatch exceeds the parallelization benefit (<10ms per task)
- Your database or API endpoints cannot handle the increased concurrent load
- You haven't implemented proper error handling for concurrent failures

## Prerequisites
- Laravel application running under Octane with a chosen driver
- Understanding of driver-specific concurrency capabilities:
  - Swoole: true coroutine-based concurrency within a single worker
  - RoadRunner: limited concurrency (single request per worker, job-based background work)
  - FrankenPHP: limited concurrency (single request per thread, defer for after-response)
- List of independent I/O operations that can be parallelized
- Database connection pool size (to avoid connection exhaustion)
- Timeout requirements for each external service call

## Inputs
- List of independent database queries or API calls per endpoint
- Average response time for each I/O call
- Database connection pool size and max_connections
- External API timeout requirements
- Driver type (Swoole, RoadRunner, or FrankenPHP)

## Workflow

### 1. Identify Parallelizable I/O Operations
- Review request handlers that make multiple I/O calls
- Identify calls that are independent (no data dependency between them)
- Candidate operations: multiple SELECT queries on different tables, multiple external API calls, multiple cache reads
- Non-candidates: sequential queries (second depends on first's result), CPU-bound computation
- Document the current sequential response time and the expected parallel response time

### 2. Implement Concurrency::run() for Parallel I/O
- Replace sequential I/O calls with parallel dispatch using `Concurrency::run()`
- Pass an array of callables, each performing one I/O operation
- Destructure results to individual variables:
```php
[$users, $orders, $products] = Concurrency::run([
    fn () => User::all(),
    fn () => Order::recent(),
    fn () => Product::popular(),
]);
```
- Ensure each callable is self-contained (no shared mutable state with other callables)
- Pass all required data via `use` clauses in the closure

### 3. Set Timeouts on All Concurrent Operations
- Add a `timeout` parameter to `Concurrency::run()`:
```php
[$data] = Concurrency::run([
    fn () => Http::timeout(5)->get('http://api.example.com/data'),
], timeout: 10);
```
- The timeout applies to the entire concurrent set — if any task exceeds the timeout, all pending tasks are cancelled
- Set timeouts based on your application's latency budget: 5-10s for user-facing requests, 30s for background
- For external API calls, set per-task timeouts lower than the overall concurrent timeout
- Never leave concurrent operations without timeout (worker could hang indefinitely)

### 4. Handle Partial Failures Gracefully
- Wrap each concurrent task in individual try/catch:
```php
[$users, $orders] = Concurrency::run([
    fn () => User::all(),
    fn () => rescue(fn () => Order::recent(), fallback: collect()),
]);
```
- For critical operations: let the exception propagate (request fails if this task fails)
- For non-critical operations: use `rescue()` or try/catch with fallback values
- Return partial results when some tasks succeed and others fail
- Log errors from failed tasks for monitoring

### 5. Implement Concurrency::defer() for Background Work
- Move non-critical work out of the response path using `Concurrency::defer()`:
```php
Concurrency::defer(fn () => Log::info('Request completed', $context));
Concurrency::defer(fn () => cache()->put('last_request', now(), 60));
```
- Deferred tasks execute after the response is sent to the client
- Use for: analytics, logging, cache warming, metrics aggregation
- Not suitable for: critical work that must complete before response, work that requires user context after response
- Be aware: if the worker crashes after sending the response but before deferred tasks complete, deferred work is lost

### 6. Size Connection Pool for Concurrent Load
- Calculate peak concurrent database queries: `max_concurrent_queries = concurrency_factor × connections_per_query`
- Ensure database connection pool >= max concurrent queries
- If connection pool is too small: concurrent queries will queue and serialize, negating the parallelization benefit
- Monitor connection pool utilization under concurrent load to validate sizing

### 7. Add Driver-Specific Optimizations

**Swoole** (true coroutine concurrency):
- Use `Octane::concurrently()` for Swoole coroutine dispatch
- Offload CPU-intensive work to task workers: `Octane::task(fn () => heavyComputation())`
- Task workers run in separate processes and don't block the main reactor

**RoadRunner** (limited concurrency):
- `Concurrency::run()` dispatches tasks via the job system (not true in-process concurrency)
- For true parallelism: increase worker count and let Octane handle request-level concurrency
- Use background jobs for work that shouldn't block the response

**FrankenPHP** (limited concurrency):
- `Concurrency::run()` dispatches tasks via thread pool (each thread handles one task)
- Be aware that threads share memory — ensure no race conditions in task callables
- Use `Concurrency::defer()` for non-critical after-response work

### 8. Test Concurrent Execution Performance
- Create a test endpoint that dispatches 3 concurrent queries each taking ~100ms
- Verify wall-clock time is ~100ms (not 300ms)
- Test error handling: make one task fail, verify other tasks still return results
- Test timeout behavior: make a task hang, verify timeout fires and request completes (with partial results)
- Test under load: verify concurrent execution doesn't exhaust connection pool
- Benchmark: compare p50/p95/p99 latency before and after concurrency implementation

## Validation Checklist
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

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| No wall-clock improvement | Response time still sum of tasks | Connection pool too small, queries serialize | Increase pool size or reduce concurrency level |
| Worker hangs | Request never returns | No timeout set on concurrent operation | Add explicit timeout parameter |
| Partial data returned silently | User sees incomplete page | Failed task not logged, fallback value used | Log all task failures, consider returning 500 for critical failures |
| Connection pool exhausted | Database connection errors | Concurrent queries exceed pool capacity | Cap concurrency at pool size or increase pool |
| RoadRunner tasks not truly concurrent | Tasks run sequentially | Expecting in-process concurrency from RoadRunner | Use additional workers or background jobs |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Concurrency::run() vs sequential | Use concurrent if tasks are independent AND each task takes >10ms AND connection pool can handle the parallelism |
| Critical vs non-critical error handling | Critical: let exception propagate (fail the request). Non-critical: catch and return fallback value |
| Timeout value | Use 5-10s for user-facing requests, 30s for background. Base on p99 of the slowest task × 2 |
| Driver-specific vs generic Concurrency facade | Start with the generic Concurrency facade. Switch to driver-specific only when the generic facade is insufficient |
| Task workers vs main worker | Use task workers (Swoole) for CPU-bound work. Keep I/O-bound work in the main worker with coroutines |

## Performance Considerations
- Concurrent I/O reduces response time from sum(tasks) to max(tasks) — 3 × 100ms queries become 100ms
- Coroutine overhead (Swoole): ~0.1-0.5µs per coroutine — negligible for I/O-bound tasks
- Task worker dispatch overhead (Swoole): ~1-5ms — only beneficial for tasks >10ms
- Connection pool contention: each concurrent query needs a connection. Pool size must >= concurrent queries
- Beyond 5-10 concurrent tasks, diminishing returns from context switching and pool contention
- CPU-bound concurrent tasks are slower than sequential — use only for I/O

## Security Considerations
- Concurrent tasks share the same worker memory — ensure no accidental data sharing between tasks
- Static property access in concurrent tasks can cause non-deterministic behavior or data corruption
- Task worker data (Swoole) is serialized — ensure no sensitive data leaks through serialization
- Deferred tasks run after response — ensure they don't need user context that may be cleaned up
- Timeout-enforced task cancellation may leave external operations in an inconsistent state

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Use Concurrency::run() for parallel independent I/O tasks, never for CPU-bound work | `05-rules.md:1` | Step 1-2: identify and implement parallel I/O |
| Always set explicit timeouts on concurrent operations | `05-rules.md:31` | Step 3: timeout configuration |
| Handle partial failures gracefully in concurrent task execution | `05-rules.md:60` | Step 4: partial failure handling |
| Limit concurrent tasks to 5-10 per request to avoid diminishing returns | `05-rules.md:89` | Step 6: connection pool sizing |

## Related Skills

| Skill | Relation |
|-------|----------|
| Configure Octane Workers by Driver | Worker count affects concurrent execution capacity |
| Calculate and Manage Connection Budgets for Octane Workers | Connection pool sizing directly impacts concurrent execution |
| Perform FPM-to-Octane Migration | Concurrent execution is an advanced Octane feature to adopt post-migration |
| Monitor and Debug Octane Workers | Concurrent task failures appear in worker monitoring |

## Success Criteria
- Response time for concurrent I/O endpoints reduced from sum(task_times) to max(task_time)
- Timeouts enforce upper bound on concurrent operation duration
- Partial failures handled gracefully (critical errors fail the request, non-critical return fallbacks)
- Connection pool sized correctly (no exhaustion under peak concurrent load)
- Driver-specific concurrency patterns used correctly
- Deferred tasks execute after response without blocking
- Latency benchmarks show measurable improvement from concurrency implementation
- No race conditions or data corruption from concurrent task execution
