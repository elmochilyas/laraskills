## Always benchmark Swoole with your specific workload before production deployment
---
Category: Testing
---
Run production-representative benchmarks comparing Swoole against FPM and other runtimes before committing to Swoole — do not assume coroutines always improve throughput.
---
Reason: Swoole's coroutine model provides the greatest benefit under high-latency I/O (>50ms per query). For sub-1ms database queries, coroutine overhead (~1µs per yield/resume cycle) makes Swoole approximately 10% slower than FPM. Only workload-specific benchmarks reveal whether your application's I/O profile falls in Swoole's sweet spot or its penalty zone.
---
Bad Example:
```php
// Deploying Swoole without workload-specific benchmarks
// Application uses sub-1ms Redis lookups — Swoole adds overhead, not throughput
```

Good Example:
```php
// Benchmarking first: database queries average 80ms — Swoole's sweet spot
// Swoole selected based on data, not assumption
```
---
Exceptions: Applications with already-measured high-latency I/O (>50ms average query time) can skip the comparison phase and proceed directly to Swoole configuration.
---
Consequences Of Violation: Performance regression instead of improvement, 10%+ throughput loss, team concludes "alternative runtimes don't help" based on a runtime mismatch.

## Enable SWOOLE_HOOK_ALL and verify all PHP libraries for coroutine compatibility
---
Category: Configuration
---
Set hook_flags to SWOOLE_HOOK_ALL in the server configuration and test every PHP library under coroutine concurrency in staging before production deployment.
---
Reason: SWOOLE_HOOK_ALL transparently hooks PHP functions (PDO, MySQLi, Redis, cURL, file operations) to become non-blocking within coroutines. However, some libraries use internal blocking calls that bypass Swoole's hooks, or use thread-local storage that breaks under coroutine concurrency. A library that works perfectly under FPM can block all coroutines on a thread or corrupt shared state when called concurrently.
---
Bad Example:
```php
// Coroutine hooks enabled but library compatibility not verified
$server->set(['hook_flags' => SWOOLE_HOOK_ALL]);
// A blocking library call blocks ALL coroutines on this thread
```

Good Example:
```php
// Hooks enabled AND libraries verified
$server->set(['hook_flags' => SWOOLE_HOOK_ALL]);
// All third-party libraries tested under concurrent coroutine load in staging
```
---
Exceptions: Applications using only Swoole-native coroutine APIs (no third-party library hooks) may skip per-library verification.
---
Consequences Of Violation: A single blocking library call blocks all coroutines on the thread, partial site unresponsiveness, difficult-to-diagnose intermittent failures.

## Set max_request (1000-5000) for worker recycling to prevent memory drift
---
Category: Reliability
---
Configure max_request in every Swoole server configuration to recycle workers periodically and prevent unbounded memory growth.
---
Reason: Swoole workers persist across coroutine executions. Without max_request, the Zend Memory Manager accumulates fragmented pages that the OS cannot reclaim. Over thousands of requests, worker RSS grows 1.5-2x. max_request triggers periodic worker recycling that resets memory state, at the cost of a temporary worker replacement cycle (~100ms spawn overhead).
---
Bad Example:
```php
// No worker recycling — unbounded memory growth
$server->set([
    'worker_num' => swoole_cpu_num(),
    // max_request not set
]);
```

Good Example:
```php
// Worker recycling configured
$server->set([
    'worker_num' => swoole_cpu_num(),
    'max_request' => 2000,  // Worker recycled after 2000 coroutine executions
]);
```
---
Exceptions: Environments where worker processes are short-lived (auto-scaling creates new instances frequently) may set higher values (5000+) or rely on instance lifecycle for recycling.
---
Consequences Of Violation: Monotonic RSS growth, worker memory exhaustion over hours of operation, OOM kills, gradual throughput degradation before crash.

## Set worker_num to CPU cores and never exceed CPU cores × 2
---
Category: Performance
---
Set worker_num to swoole_cpu_num() for CPU-bound workloads and no more than 1.5-2x that for I/O-bound workloads — never exceed 2x CPU cores.
---
Reason: Each Swoole worker runs an independent event loop with thousands of coroutines. Beyond CPU cores × 2, context switching overhead between workers degrades throughput. Unlike FPM (where more workers help I/O-bound workloads), Swoole's coroutines already handle I/O concurrency within each worker. Additional workers add OS-level process contention without meaningful throughput gain.
---
Bad Example:
```php
// Over-provisioned workers — context switching overhead
$server->set([
    'worker_num' => 32,  // 8-core CPU — 4x over-provisioned
]);
```

Good Example:
```php
// Correctly provisioned
$server->set([
    'worker_num' => swoole_cpu_num(),  // 8 for CPU-bound
    // or 12-16 for I/O-bound (1.5-2x)
]);
```
---
Exceptions: Containers with CPU throttling (Kubernetes CPU limits below actual cores) should set worker_num to the effective CPU count, not the physical core count.
---
Consequences Of Violation: Context switching overhead degrades throughput, increased latency variance, wasted memory from excess worker processes.

## Use task_worker_num to isolate blocking operations from the coroutine event loop
---
Category: Architecture
---
Configure a separate task worker pool (task_worker_num = 2-4) for synchronous operations like database writes and file operations that cannot be made coroutine-safe.
---
Reason: A blocking operation within a coroutine blocks ALL coroutines on that worker thread, making the entire worker unresponsive. Task workers run in blocking mode and do not share the coroutine event loop, so blocking operations in task workers do not affect coroutine concurrency. Isolating blocking work to task workers preserves the throughput benefit of coroutines for request handling.
---
Bad Example:
```php
// Blocking file write in coroutine — blocks all coroutines on this worker
$server->on('request', function ($req, $res) {
    file_put_contents('/tmp/log', $data);  // Blocks ALL coroutines
    $res->end('done');
});
```

Good Example:
```php
// Blocking operation dispatched to task worker
$server->on('request', function ($req, $res) use ($server) {
    $server->task(['file' => '/tmp/log', 'data' => $data]);
    $res->end('done');
});
```
---
Exceptions: Applications that exclusively use coroutine-aware I/O operations (PDO via SWOOLE_HOOK_ALL, Redis via coroutine client) may not need task workers.
---
Consequences Of Violation: Worker-wide blocking under coroutine concurrency, partial site unresponsiveness, intermittent timeouts on seemingly unrelated requests.
