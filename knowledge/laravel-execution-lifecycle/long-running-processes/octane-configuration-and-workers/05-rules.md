# Octane Configuration and Workers

## Rule Name
Set worker count to CPU core count, not concurrent user count.
---
## Category
Performance | Scalability
---
## Rule
Set `worker_count` to the number of CPU cores (or `auto`) regardless of expected concurrent users. For I/O-bound workloads with Swoole, rely on coroutines for concurrency within each worker.
---
## Reason
Over-subscribing workers beyond CPU cores causes context-switch thrashing, reducing throughput. Workers are for parallelism (CPU cores), not concurrency (coroutines/goroutines).
---
## Bad Example
```php
// config/octane.php
'worker_count' => 100, // 100 workers on a 4-core machine — context-switch hell
```
---
## Good Example
```php
// config/octane.php
'worker_count' => env('OCTANE_WORKER_COUNT', 'auto'),
// 'auto' defaults to CPU core count — 4 on a 4-core machine
```
---
## Exceptions
RoadRunner deployments where each worker is a separate PHP process and memory isolation is preferred over coroutine efficiency.
---
## Consequences Of Violation
Throughput collapses under load due to context-switch overhead; excessive memory consumption from too many worker baselines.

---

## Rule Name
Always set `max_requests` based on profiled memory growth.
---
## Category
Performance | Reliability
---
## Rule
Always configure `max_requests` based on memory profiling data. Never disable it with `0`, `null`, or `-1`.
---
## Reason
`max_requests` is the safety valve against accumulated memory leaks. Without it, workers grow unbounded until the OS OOM killer terminates them — losing the current request and causing cascading failures.
---
## Bad Example
```php
'max_requests' => 0, // Workers never recycle — accumulate until OOM
```
---
## Good Example
```php
// Calculate: (memory_limit - baseline_memory) / per_request_growth
// 40MB baseline, 0.5MB/req growth, 128MB limit => ~176, rounded to 150
'max_requests' => env('OCTANE_MAX_REQUESTS', 150),
```
---
## Exceptions
No common exceptions. Every long-running worker needs a recycling limit.
---
## Consequences Of Violation
Unbounded memory growth; production outages from OOM-killed workers; lost requests during unexpected termination.

---

## Rule Name
Understand that `max_requests` is per-worker, not global.
---
## Category
Reliability
---
## Rule
Always calculate total recycling capacity as `max_requests × worker_count`, not `max_requests` alone.
---
## Reason
Each worker independently counts its requests. With 8 workers × 500 max_requests, the application processes 4000 total requests before full rotation, not 500.
---
## Bad Example
```php
// Assuming max_requests=500 means full rotation after 500 total requests
// With 8 workers, actual rotation happens after 4000 requests
```
---
## Good Example
```php
// Total capacity before full rotation: workers × max_requests
$totalCapacity = $workerCount * $maxRequests; // 8 × 500 = 4000
// Graceful deployment: lower max_requests to cycle workers faster
```
---
## Exceptions
Single-worker development environments where the distinction is irrelevant.
---
## Consequences Of Violation
Misunderstanding capacity leads to wrong tuning decisions; workers may not recycle fast enough during deployments.

---

## Rule Name
Use staged `max_requests` reduction for zero-downtime deployments.
---
## Category
Reliability | Scalability
---
## Rule
Prefer lowering `max_requests` during deployment to cycle workers gradually, rather than restarting all workers simultaneously.
---
## Reason
Lowering `max_requests` causes workers to recycle naturally as they hit the limit. Gradual rotation provides zero-downtime deployment — each worker picks up the new code on restart without a sudden capacity drop.
---
## Bad Example
```php
// Restarting all workers at once — capacity drops to zero momentarily
// php artisan octane:reload — kills all workers then respawns
```
---
## Good Example
```php
// During deployment:
// 1. Set max_requests env to low value (e.g., 10)
// 2. Workers gradually recycle with new code
// 3. Restore normal max_requests after deployment
// php artisan octane:reload --no-restart (if available)
```
---
## Exceptions
Security patches requiring immediate code reload across all workers (trade downtime for security).
---
## Consequences Of Violation
Request queue backs up during full restart; health checks fail; frontend clients see 502 errors.

---

## Rule Name
Configure graceful shutdown timeouts per runtime.
---
## Category
Reliability
---
## Rule
Always set a `max_wait_time` (Swoole) or equivalent graceful shutdown timeout long enough for in-flight requests to complete before worker termination.
---
## Reason
Workers killed mid-request lose the response and may leave side effects (half-processed jobs, open DB transactions). Graceful shutdown waits for in-flight work to finish.
---
## Bad Example
```php
'swoole' => [
    'options' => [
        'max_wait_time' => 1, // 1 second — insufficient for long requests
    ],
],
```
---
## Good Example
```php
'swoole' => [
    'options' => [
        'max_wait_time' => 60, // Match upstream timeout
    ],
],
```
---
## Exceptions
Stateless services where losing a request has no side effects (read-only APIs with idempotent retry).
---
## Consequences Of Violation
In-flight requests are terminated mid-response; partial side effects left behind; retry storms from clients.

---

## Rule Name
Match runtime-specific timeout config to application needs.
---
## Category
Reliability | Scalability
---
## Rule
Always configure `max_execution_time` (Swoole) or `request_timeout` (RoadRunner) to match your application's slowest legitimate request, plus a safety margin.
---
## Reason
Runtime-specific timeouts operate at the worker level, not the PHP-FPM level. A timed-out request in Swoole can block the entire worker if not properly configured, starving other requests.
---
## Bad Example
```php
// Swoole default 30 — kills long-running report generation
'swoole' => [
    'options' => ['max_execution_time' => 30],
],
```
---
## Good Example
```php
// 2x the slowest legitimate request (e.g., 60s report)
'swoole' => [
    'options' => ['max_execution_time' => 120],
],
```
---
## Exceptions
CPU-bound endpoints where hard timeouts are intentional safeguards against infinite loops.
---
## Consequences Of Violation
Legitimate long requests are killed; users see 502 errors; worker and coroutine state left inconsistent.
