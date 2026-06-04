# Octane Concurrent Requests — Concurrent Task Execution Patterns

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Octane Concurrent Requests — Concurrent Task Execution Patterns |
| Difficulty | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Laravel Octane enables concurrent request handling within a single worker through its `Concurrency` facade and concurrent task execution API. Unlike PHP-FPM's single-request-per-process model, Octane workers can dispatch multiple tasks concurrently using the underlying runtime's concurrency primitives — Swoole coroutines, RoadRunner's goroutine-like worker pool, or FrankenPHP's thread pool. This allows parallel database queries, HTTP requests, and computation within a single HTTP request lifecycle.

## Core Concepts

- **Octane Concurrency facade**: `Concurrency::run()` and `Concurrency::defer()` — invoke multiple callables concurrently and wait for all results. Abstracts the underlying runtime's concurrency mechanism.
- **Driver-specific execution**: Swoole uses coroutines (`go()`), RoadRunner uses the plugin's job system, FrankenPHP uses thread pool dispatch.
- **Task workers**: Swoole supports `task_worker_num` — dedicated worker processes for CPU-intensive tasks. Task workers receive tasks via `$server->task()` and process them asynchronously.
- **Non-blocking I/O**: With Swoole, coroutine-aware I/O operations (PDO, Redis, cURL via hooks) are non-blocking. Multiple queries execute in parallel within the same coroutine context.
- **Deferred execution**: `Concurrency::defer()` schedules tasks to run after the response is sent. Useful for logging, analytics, cache warming.
- **Limitations**: Not all I/O operations can be made concurrent. File operations, some stream operations, and non-coroutine-aware extensions block the worker.

## When To Use

- You need to execute multiple independent database queries in parallel within a single request.
- You have fan-out patterns: fetch data from multiple external APIs simultaneously.
- You want to perform background processing (logging, metrics, cache warming) after the response is sent using `defer()`.
- You are using Swoole and have CPU-intensive tasks that can be offloaded to task workers.
- You need to reduce p99 latency for requests that make multiple slow I/O calls.

## When NOT To Use

- Your I/O operations are sequential by nature (each depends on the previous result).
- You are using RoadRunner or FrankenPHP where concurrent request execution is more limited than Swoole's coroutine model.
- The overhead of concurrent dispatch (context switching, coroutine creation) exceeds the parallelization benefit.
- Your database or API endpoints cannot handle the increased concurrent load.
- You don't have proper error handling for concurrent failures.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use `Concurrency::run()` for parallel independent tasks | Executes callables concurrently and returns all results. Reduces total wall-clock time to the slowest task. |
| Use `Concurrency::defer()` for after-response work | Schedules tasks that don't block the response. Improves response time by removing non-critical work from the critical path. |
| Limit concurrency to 5–10 parallel tasks per request | Beyond ~10, the overhead of context switching and resource contention outweighs the benefit. |
| Set timeouts on all concurrent operations | A hung concurrent task blocks the entire set. Always use timeout-aware operations. |
| Handle partial failures gracefully | One task failing should not crash the entire request. Catch exceptions per-task and handle partial results. |
| Avoid shared mutable state in concurrent tasks | Race conditions occur when concurrent tasks modify the same variable. Pass data through return values, not shared references. |
| Monitor concurrent task queue depth | In Swoole, task worker queue depth indicates whether CPU-intensive tasks are backing up. Alert on sustained deep queues. |
| Use task workers for CPU-intensive work (Swoole) | Task workers run in separate processes. They don't block coroutine workers. Keep CPU work off the main reactor. |

## Architecture Guidelines

- **Swoole concurrency**: Uses coroutines within the same worker process. Coroutines are lightweight (~2KB stack) and can number in the thousands. I/O operations yield control to other coroutines automatically.
- **RoadRunner concurrency**: RoadRunner workers are single-request-at-a-time processes. True concurrency requires additional workers or the RoadRunner job plugin for background tasks. Octane's `Concurrency` facade on RoadRunner dispatches tasks via the job system.
- **FrankenPHP concurrency**: Threads handle one request at a time. Concurrency within a request is limited. Use `Concurrency::defer()` for background work but be aware that the thread blocks until deferred tasks complete.
- **Task worker isolation**: Swoole task workers receive serialized tasks via `$server->task()`. The task is processed in a dedicated task worker process, and the result is returned asynchronously via `onTask` callback.
- **Deferred task lifecycle**: Tasks registered via `Concurrency::defer()` execute after the response headers are sent but before the worker returns to the pool. If the worker crashes, deferred tasks are lost.
- **Connection pooling under concurrency**: Concurrent requests share the same database connection pool. Ensure pool size >= number of concurrent database queries. Connection exhaustion causes serialization or failures.

## Performance Considerations

- Concurrent queries can reduce response time from `sum(tasks)` to `max(tasks)`. If you have 3 × 100ms queries, concurrency reduces from 300ms to 100ms.
- Coroutine overhead: Swoole coroutine creation and scheduling adds ~0.1–0.5µs per coroutine. Negligible for I/O-bound tasks.
- Task worker dispatch (Swoole): Serializing the task + IPC overhead adds ~1–5ms. Only beneficial for tasks that take >10ms.
- Connection pool sizing: Each concurrent database query consumes a connection. If the pool has 10 connections and you dispatch 20 concurrent queries, 10 will queue.
- Memory overhead: Each concurrent task holds its own call stack and variable scope. For CPU-bound tasks, this adds memory pressure.

## Security Considerations

- Data isolation: Concurrent tasks share the same worker memory. Ensure tasks do not accidentally share or corrupt request-scoped data.
- Race conditions: Static property access in concurrent tasks can cause data corruption or non-deterministic behavior. Always use thread-safe patterns.
- Error propagation: An uncaught exception in one concurrent task can crash the entire worker. Wrap concurrent tasks in try/catch blocks.
- Task worker serialization (Swoole): Data passed to task workers is serialized via `igbinary` or `php_serialize`. Ensure no sensitive data leaks through serialization.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Using concurrency for CPU-bound work | Concurrent CPU tasks compete for the same core, adding context switching overhead. | Assuming concurrency always improves performance. | Slower than sequential execution due to context switching and cache thrashing. | Use task workers for CPU-bound work. Use concurrency for I/O-bound work. |
| Not setting connection pool limits | Concurrent queries exhaust the database connection pool. | Each concurrent query consumes one connection. | Connection refused errors on some queries. | Set pool size >= max concurrent queries. Monitor pool utilization. |
| Ignoring partial failure | One concurrent task fails silently while others succeed. | No try/catch around individual tasks. | Partial data returned, user sees incomplete results. | Handle exceptions per-task. Return partial results or fail gracefully. |
| Using shared mutable state | Multiple concurrent tasks read/write the same variable. | Race conditions cause non-deterministic results. | Data corruption, hard-to-debug intermittent failures. | Pass data through return values. Use `atomic` or lock primitives if sharing is unavoidable. |
| Not implementing timeouts | A hung concurrent task blocks all others and the request. | Assuming external services always respond. | Request hangs indefinitely, worker is stuck, p99 latency spikes. | Set explicit timeouts on all concurrent operations. |

## Anti-Patterns

- **Concurrent writes to the same database row**: Multiple concurrent tasks updating the same record causes deadlocks or lost updates. Serialize writes to the same resource.
- **Fire-and-forget without error handling**: `Concurrency::defer()` tasks that fail silently lose data. Always log errors from deferred tasks.
- **Deeply nested concurrency**: Concurrent tasks that dispatch more concurrent tasks creates complex dependency chains. Keep concurrency flat (one level of parallelism).
- **Assuming RoadRunner concurrency is like Swoole**: RoadRunner workers cannot execute concurrent PHP code within a single worker. Concurrency requires multiple workers or job dispatch.

## Examples

```php
use Laravel\Octane\Facades\Octane;
use Illuminate\Support\Facades\Concurrency;

// Run multiple tasks concurrently
[$users, $orders, $products] = Concurrency::run([
    fn () => User::all(),
    fn () => Order::recent(),
    fn () => Product::popular(),
]);

// Defer non-critical work
Concurrency::defer(fn () => Log::info('Request completed'));

// Swoole task worker dispatch
use Laravel\Octane\Facades\Octane;

Octane::concurrently([
    fn () => processReport($data),
    fn () => sendNotification($user),
], timeout: 30);
```

## Related Topics

- Worker Configuration by Driver
- Connection Pooling Strategies
- Octane Tick Hooks and Scheduled Tasks
- Service Provider Optimization for Persistence
- Octane Metrics and Benchmarks

## AI Agent Notes

- Concurrent request execution is Octane's most advanced feature. Most teams should master basic Octane operation before attempting concurrency.
- The `Concurrency` facade is the safest way to use concurrency — it abstracts driver differences and handles error propagation.
- Swoole is the only driver where true coroutine-based concurrency within a single worker is available. RoadRunner and FrankenPHP have more limited concurrency models.
- The biggest performance gain from concurrency comes from parallel I/O (multiple database/API calls). CPU-bound concurrency rarely helps and often hurts.

## Verification

- [ ] Write a test with `Concurrency::run()` dispatching 3 slow database queries and verify total time ≈ max(query time), not sum.
- [ ] Test `Concurrency::defer()`: verify deferred tasks execute after the response is sent.
- [ ] Verify error handling: one failing concurrent task does not crash the entire request.
- [ ] Test timeout behavior: verify concurrent operations time out after the configured duration.
- [ ] Monitor connection pool under concurrent load: verify no connection exhaustion.
- [ ] Test with Swoole task workers: dispatch a CPU-intensive task and verify it runs in a separate process.
- [ ] Benchmark: compare sequential vs concurrent execution for your specific workload.
- [ ] Document the concurrency patterns used in your application.
