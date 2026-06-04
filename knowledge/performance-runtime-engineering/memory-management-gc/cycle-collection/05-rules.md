---
## Rule Name

Monitor gc_status in Long-Running Processes

## Category

Performance

## Rule

Always monitor `gc_status()` in Octane, Swoole, and FrankenPHP workers. Track root buffer entries, collection count, and GC time ratio over time.

## Reason

GC state accumulates across requests in persistent workers. Without monitoring, cyclic memory leaks go undetected until OOM kills workers, causing service disruption.

## Bad Example

```php
// No GC monitoring — memory grows silently until OOM
```

## Good Example

```php
$status = gc_status();
$ratio = $status['collector_time'] / max($status['application_time'], 1);
if ($ratio > 0.05) {
    Log::warning("GC overhead > 5%");
}
if ($status['roots'] > 5000) {
    Log::warning("Root buffer filling rapidly");
}
```

## Exceptions

PHP-FPM environments where GC state resets per request.

## Consequences Of Violation

Undetected cyclic memory leaks, worker OOM kills, degraded performance from GC overhead.

---

## Rule Name

Collect Cycles at Request Boundaries in Octane

## Category

Reliability

## Rule

Call `gc_collect_cycles()` periodically at request boundaries (every 100–500 requests) in Octane workers.

## Reason

Without periodic collection, the root buffer fills until the automatic threshold (10,000) triggers a collection at an unpredictable time. Strategic collection at known boundaries provides deterministic GC behavior and prevents buffer overflow pauses.

## Bad Example

```php
// No collection — relies on automatic threshold
// GC runs at unpredictable times, causing latency spikes
```

## Good Example

```php
static $count = 0;
if (++$count % 100 === 0) {
    gc_collect_cycles();
}
```

## Exceptions

Workers with low cycle generation rates where the root buffer never approaches threshold.

## Consequences Of Violation

Unpredictable GC pauses during request processing, latency spikes when threshold is hit during critical operations.

---

## Rule Name

Use WeakReference to Prevent Cycle Formation

## Category

Architecture

## Rule

Use `WeakReference` instead of strong references for observer patterns, cache values, and parent back-references.

## Reason

Each strong reference that creates a cycle adds entries to the GC root buffer. Over thousands of requests, these accumulate. WeakReference eliminates cycles at the source, keeping the root buffer small and reducing GC overhead.

## Bad Example

```php
$subject->listeners[] = $listener;  // Strong ref — potential cycle
```

## Good Example

```php
$subject->listeners[] = WeakReference::create($listener);  // No cycle
```

## Exceptions

When the referenced object must be guaranteed to live as long as the referencer.

## Consequences Of Violation

Increased root buffer entries, more frequent GC runs, higher GC CPU overhead, potential for cycle accumulation.

---

## Rule Name

Upgrade to PHP 8.5+ to Reduce False-Positive GC Runs

## Category

Performance

## Rule

Upgrade to PHP 8.5+ to eliminate ~30% of false-positive GC runs caused by static closures and Enum singletons.

## Reason

PHP 8.5 skips static closures (first-class callables) and Enum singletons during root buffer detection. These were common false positives in framework-heavy apps, causing unnecessary GC runs that consumed CPU without reclaiming memory.

## Bad Example

```bash
# PHP 8.4 — GC runs 30% more often due to false positives
# CPU wasted on marking, scanning, and sweeping non-garbage
```

## Good Example

```bash
# PHP 8.5+ — static closures and Enums excluded from root buffer
# GC runs only when actual cycles exist
```

## Exceptions

Applications that do not use first-class callable syntax or Enums extensively.

## Consequences Of Violation

30% more GC runs than necessary, wasted CPU on false-positive cycle collection.

---

## Rule Name

Do Not Call gc_collect_cycles on Every Request

## Category

Performance

## Rule

Never call `gc_collect_cycles()` on every request in a web application. Batch calls to every 100–500 requests.

## Reason

Each `gc_collect_cycles()` call takes 50–500µs to scan the root buffer. Calling it on every request adds this cost to every response, while in most cases there are no cycles to collect. Batching the calls amortizes the cost over many requests.

## Bad Example

```php
// 50-500µs added to every request
public function handle($request, Closure $next) {
    $response = $next($request);
    gc_collect_cycles();  // Usually collects nothing
    return $response;
}
```

## Good Example

```php
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

Batch processing pipelines where cycles are created and must be collected between batches.

## Consequences Of Violation

50–500µs added to every request, unnecessary CPU consumption for mostly-no-op collection calls.
