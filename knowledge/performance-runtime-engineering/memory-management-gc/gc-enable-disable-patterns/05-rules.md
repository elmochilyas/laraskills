---
## Rule Name

Never Permanently Disable GC in Long-Running Processes

## Category

Reliability

## Rule

Never call `gc_disable()` without a matching `gc_enable()` in any process that handles more than a single request (Octane, Swoole, FrankenPHP, queue workers).

## Reason

Permanently disabling GC means the root buffer grows unbounded. Each request adds potential cycle roots. Over thousands of requests, the buffer exhausts available memory, eventually causing OOM termination.

## Bad Example

```php
// Octane worker — permanently disabled GC
gc_disable();
// Roots accumulate across all requests for this worker
```

## Good Example

```php
// Safe pattern — disable around critical section, re-enable after
gc_disable();
// latency-critical section
gc_enable();
gc_collect_cycles();
```

## Exceptions

PHP-FPM short-lived processes where the entire heap is destroyed per request.

## Consequences Of Violation

Unbounded root buffer growth in long-running workers, eventual OOM kill, request failures under sustained load.

---

## Rule Name

Pair gc_disable with gc_enable in Critical Sections

## Category

Architecture

## Rule

Always pair `gc_disable()` with a subsequent `gc_enable()` call, and use `gc_collect_cycles()` at the boundary to process accumulated roots.

## Reason

`gc_disable()` sets a protection flag that prevents automatic collection. If `gc_enable()` is not called, the root buffer continues accumulating indefinitely. When `gc_enable()` is called without prior `gc_collect_cycles()`, the accumulated roots all trigger collection at once, causing a larger-than-expected pause.

## Bad Example

```php
gc_disable();
// ... critical section ...
gc_enable();  // Large pause as all accumulated roots are processed
```

## Good Example

```php
gc_disable();
// ... critical section ...
gc_collect_cycles();  // Process accumulated roots at controlled point
gc_enable();
```

## Exceptions

No common exceptions. Always pair and collect at boundaries.

## Consequences Of Violation

Unbounded root accumulation or unexpectedly large GC pauses when re-enabling.

---

## Rule Name

Call gc_collect_cycles at Batch Boundaries, Not Per Request

## Category

Performance

## Rule

Call `gc_collect_cycles()` at batch boundaries (every 100 requests or after heavy object processing), never on every request.

## Reason

Each `gc_collect_cycles()` call takes 50–500µs to scan the root buffer. Calling it on every request adds unnecessary CPU overhead. Batching the calls amortizes the cost while still preventing unbounded accumulation.

## Bad Example

```php
// Per-request GC collection — adds 50-500µs to every request
public function handle($request, Closure $next) {
    $response = $next($request);
    gc_collect_cycles();
    return $response;
}
```

## Good Example

```php
// Batch collection — every 100 requests
public function handle($request, Closure $next) {
    static $count = 0;
    $response = $next($request);
    if (++$count % 100 === 0) {
        gc_collect_cycles();
    }
    return $response;
}
```

## Exceptions

Short-lived batch processing jobs where GC collection is part of the batch workflow.

## Consequences Of Violation

50–500µs added to every request latency, unnecessary CPU overhead from redundant GC scans.

---

## Rule Name

Profile Before Disabling GC as a Performance Tactic

## Category

Performance

## Rule

Never disable GC for performance reasons without first profiling to confirm that GC pauses are a measurable bottleneck.

## Reason

GC pauses are typically 50–500µs — negligible for most web applications (which have 50–500ms response times). Disabling GC adds operational risk (unbounded root buffer growth) that is only justified if GC is proven to cause p99 latency spikes.

## Bad Example

```bash
# Disabled GC as a "performance optimization" without profiling
# GC was running 200µs per collection — irrelevant for 200ms API
```

## Good Example

```bash
# 1. Profile p99 latency — find spikes at 500µs
# 2. Correlate with gc_status() — collector_time spikes at same time
# 3. Only then consider GC disable around critical sections
```

## Exceptions

Real-time systems with sub-millisecond latency requirements where any GC pause is unacceptable.

## Consequences Of Violation

Unnecessary operational risk from unbounded root buffer growth, zero performance benefit, added debugging complexity.

---

## Rule Name

Monitor gc_status protected Flag When Using gc_disable

## Category

Maintainability

## Rule

Always check `gc_status()['protected']` before and after GC-critical sections to verify that `gc_disable()`/`gc_enable()` state transitions happened as expected.

## Reason

Nested operations, exception paths, or early returns can leave GC in an unexpected state. Checking the protected flag catches cases where `gc_disable()` was called without the corresponding `gc_enable()`.

## Bad Example

```php
gc_disable();
try {
    // critical section that may throw
    riskyOperation();
} finally {
    // Forgot to check protection state
}
```

## Good Example

```php
gc_disable();
assert(gc_status()['protected'] === true);
try {
    riskyOperation();
} finally {
    gc_collect_cycles();
    gc_enable();
    assert(gc_status()['protected'] === false);
}
```

## Exceptions

No common exceptions. Always verify GC protection state.

## Consequences Of Violation

Stale GC protection state after exceptions, undetected permanent disable, eventual OOM.
