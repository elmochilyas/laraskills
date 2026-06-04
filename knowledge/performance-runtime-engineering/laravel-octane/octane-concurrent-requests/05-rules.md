## Use Concurrency::run() for parallel independent I/O tasks, never for CPU-bound work
---
Category: Performance
---
Dispatch parallel database queries, HTTP calls, and API requests via Concurrency::run() to reduce wall-clock time, but never use it for CPU-intensive computation that competes for the same core.
---
Reason: Concurrent I/O tasks reduce response time from sum(tasks) to max(tasks) — three 100ms queries become 100ms instead of 300ms. CPU-bound tasks, however, compete for the same CPU core, adding context switching overhead that makes concurrent execution slower than sequential. The sweet spot is high-latency I/O (>10ms per call) where the parallelization benefit exceeds the dispatch overhead.
---
Bad Example:
```php
// CPU-bound work — concurrent execution adds overhead, not speed
$results = Concurrency::run([
    fn () => computeHeavyReport($data),   // CPU-bound — competes for core
    fn () => processLargeArray($input),   // CPU-bound — same core, slower
]);
```

Good Example:
```php
// I/O-bound work — concurrent execution reduces wall-clock time
[$users, $orders] = Concurrency::run([
    fn () => User::all(),       // I/O-bound — database query
    fn () => Order::recent(),   // I/O-bound — database query
]);
```
---
Exceptions: Swoole task workers (separate processes) can handle CPU-bound work concurrently. RoadRunner and FrankenPHP cannot within a single worker.
---
Consequences Of Violation: Slower than sequential execution for CPU-bound tasks, wasted concurrency overhead, no throughput improvement.

## Always set explicit timeouts on concurrent operations
---
Category: Reliability
---
Pass a timeout parameter to Concurrency::run() (or wrap individual tasks in timeout-aware calls) to prevent a hung task from blocking the entire concurrent set indefinitely.
---
Reason: A single hung concurrent task (external API that doesn't respond, database query caught in a lock) blocks all parallel tasks and the entire request. Without a timeout, the worker hangs until the underlying TCP timeout fires (often 30-120 seconds), consuming a worker slot for the entire duration. A 10-30 second timeout ensures the request completes (even if partially failed) rather than hanging the worker.
---
Bad Example:
```php
// No timeout — hung task blocks indefinitely
[$orders] = Concurrency::run([
    fn () => Http::timeout(120)->get('http://slow-api.example.com'),
]);
```

Good Example:
```php
// Explicit timeout
[$orders] = Concurrency::run([
    fn () => Http::timeout(5)->get('http://slow-api.example.com'),
], timeout: 10);  // Overall timeout: 10 seconds
```
---
Exceptions: Background tasks with no user-facing latency requirements may use longer timeouts with separate error monitoring.
---
Consequences Of Violation: Hung workers under external service degradation, worker pool exhaustion, p99 latency spikes, cascading request timeouts.

## Handle partial failures gracefully in concurrent task execution
---
Category: Reliability
---
Wrap each concurrent task in individual try/catch blocks so that one failing task does not crash the entire request or prevent other tasks from returning their results.
---
Reason: In a set of concurrent tasks, one task may fail (database timeout, API error, rate limit) while others succeed. Without per-task error handling, a single exception propagates and crashes the entire concurrent operation, losing the results of all completed tasks. Per-task error handling allows returning partial results or fallback data, providing a degraded but functional response rather than a 500 error.
---
Bad Example:
```php
// One failure crashes all tasks
[$users, $orders] = Concurrency::run([
    fn () => User::all(),
    fn () => Order::recent(),  // If this throws, User::all() result is lost
]);
```

Good Example:
```php
// Per-task error handling — partial results returned
[$users, $orders] = Concurrency::run([
    fn () => User::all(),
    fn () => rescue(fn () => Order::recent(), fallback: collect()),
]);
```
---
Exceptions: When all tasks are critical and any failure must produce an error response, the exception should propagate.
---
Consequences Of Violation: Cascade failures where one slow/failing task causes complete request failure, unnecessary 500 errors, wasted successful results from other tasks.

## Limit concurrent tasks to 5-10 per request to avoid diminishing returns
---
Category: Performance
---
Cap the number of parallel tasks dispatched via Concurrency::run() to 5-10 per request to avoid overhead from context switching and connection pool contention exceeding the parallelization benefit.
---
Reason: Beyond 5-10 concurrent tasks, the overhead of dispatch, context switching, and connection pool contention grows faster than the parallelization benefit. If each of 20 concurrent tasks consumes a database connection from a pool of 10, the last 10 tasks wait for connections — serializing the work they were meant to parallelize. The response time becomes max(task_time) + queue_time rather than max(task_time).
---
Bad Example:
```php
// 20 concurrent tasks — connection pool exhaustion
$results = Concurrency::run([
    fn () => DB::table('a')->first(),  // Takes connection 1
    fn () => DB::table('b')->first(),  // Takes connection 2
    // ... 18 more tasks, but only 10 pool connections
]);
```

Good Example:
```php
// Batch into groups of 5
$results = Concurrency::run($firstBatch, timeout: 10);
$more = Concurrency::run($secondBatch, timeout: 10);
```
---
Exceptions: I/O calls to independent external services (not competing for the same connection pool) may scale to higher concurrency levels.
---
Consequences Of Violation: Diminishing returns on concurrent execution, connection pool contention serializing parallel work, no wall-clock improvement over sequential.
