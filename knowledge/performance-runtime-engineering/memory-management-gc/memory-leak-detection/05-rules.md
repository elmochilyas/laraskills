---
## Rule Name

Implement Memory Checkpoint Middleware in Octane

## Category

Reliability

## Rule

Always implement middleware that records `memory_get_usage(true)` before and after each request in Octane workers, tracking baseline drift.

## Reason

A rising baseline across requests is the earliest and most reliable indicator of a memory leak. Without checkpointing, leaks are detected only when workers OOM — a reactive rather than proactive approach.

## Bad Example

```php
// No memory monitoring — leaks detected only at crash
```

## Good Example

```php
class MemoryCheckpointMiddleware {
    private int $baseline = 0;
    
    public function handle($request, Closure $next) {
        gc_collect_cycles();
        $start = memory_get_usage(true);
        $response = $next($request);
        gc_collect_cycles();
        $end = memory_get_usage(true);
        
        if ($this->baseline === 0) $this->baseline = $end;
        $leak = $end - $this->baseline;
        if ($leak > 5 * 1024 * 1024) {
            Log::warning("Memory leak suspected: +{$leak} bytes");
        }
        return $response;
    }
}
```

## Exceptions

PHP-FPM environments where memory resets per request.

## Consequences Of Violation

Leaks undetected until worker OOM, service disruption, data loss from crashed workers.

---

## Rule Name

Monitor Worker RSS Over Time, Not Just memory_get_usage

## Category

Monitoring

## Rule

Track process RSS (VmRSS from `/proc/pid/status`) alongside `memory_get_usage()` for complete memory monitoring.

## Reason

`memory_get_usage()` reports PHP heap memory only. RSS includes PHP heap + extension allocations + shared libraries + stack + Zend MM cached chunks. A leak in an extension or in the Zend MM cache may be visible in RSS but not in `memory_get_usage()`.

## Bad Example

```php
// Only checking PHP heap — may miss extension-level leaks
$heap = memory_get_usage(true);
```

## Good Example

```php
$pid = getmypid();
$status = file_get_contents("/proc/$pid/status");
preg_match('/VmRSS:\s+(\d+)\s+kB/', $status, $matches);
$rssKB = (int)$matches[1];
$heapBytes = memory_get_usage(true);
// Cross-reference both values
```

## Exceptions

Windows environments where `/proc` is not available (use `Get-Process` or equivalent).

## Consequences Of Violation

Incomplete memory monitoring, missed extension-level leaks, under-estimated total memory usage.

---

## Rule Name

Audit Static Properties for Octane Compatibility

## Category

Architecture

## Rule

Audit all static properties in the codebase before deploying to Octane. Every `public static` or `private static` property is a potential state leak.

## Reason

Static properties persist across requests inside the same Octane worker. Data written to a static property in Request A is visible in Request B. This causes both data leakage between users and cumulative memory growth.

## Bad Example

```php
class UserService {
    private static array $cache = [];  // Accumulates across requests
}
```

## Good Example

```php
class UserService {
    private array $cache = [];  // Instance property — request-scoped
}
```

## Exceptions

Stateless caches that are initialized once and never modified per-request.

## Consequences Of Violation

Data leakage between users, linear memory growth, intermittent bugs that are hard to reproduce.

---

## Rule Name

Call gc_collect_cycles Before Each Memory Checkpoint

## Category

Testing

## Rule

Always call `gc_collect_cycles()` before measuring `memory_get_usage()` for leak detection.

## Reason

Without prior GC collection, `memory_get_usage()` includes memory held by uncollected cycles. This inflates the reading and can cause false-positive leak detections.

## Bad Example

```php
$before = memory_get_usage(true);  // Includes uncollected cycles
// ... process ...
$after = memory_get_usage(true);   // Also includes cycles
$delta = $after - $before;         // May be inflated
```

## Good Example

```php
gc_collect_cycles();               // Clear collectable garbage
$before = memory_get_usage(true);  // Stable baseline
// ... process ...
gc_collect_cycles();               // Clear collectable garbage
$after = memory_get_usage(true);   // Stable measurement
$delta = $after - $before;         // Real allocation delta
```

## Exceptions

No common exceptions. Always clear GC-deferred memory before measurement.

## Consequences Of Violation

False-positive leak alarms, wasted investigation time, inflated memory readings.

---

## Rule Name

Set max_requests as Safety Net, Not Leak Fix

## Category

Maintainability

## Rule

Use `max_requests` as a safety net to prevent OOM from undetected leaks, but always investigate and fix the root cause of memory growth.

## Reason

Setting `max_requests` with a low value (e.g., 100) masks leaks by recycling workers before memory grows — but also wastes the bootstrap elimination benefit of Octane. Every Nth request pays the full bootstrap cost. Fix the leak instead.

## Bad Example

```php
'max_requests' => 100,  // Masks leak but wastes 1% of requests on bootstrap
```

## Good Example

```php
// First: fix the leak (no baseline drift over 5000 requests)
// Then: set max_requests as genuine safety net
'max_requests' => 2000,
```

## Exceptions

Development environments where quick iteration is more important than identifying leaks.

## Consequences Of Violation

Wasted bootstrap overhead from frequent recycling, masked leak symptoms, undiagnosed root causes.
