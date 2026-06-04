---
## Rule Name

Monitor gc_status in Long-Running Workers

## Category

Performance

## Rule

Always log `gc_status()` at regular intervals (every 100 requests) in Octane, Swoole, and FrankenPHP workers. Never rely solely on RSS monitoring for leak detection.

## Reason

RSS monitoring detects memory growth but does not identify the cause. GC telemetry (`roots`, `collected`, `collector_time`, `application_time`) provides specific signals for cycle accumulation and GC overhead, enabling targeted fixes.

## Bad Example

```php
// Only monitoring RSS — no insight into GC behavior
$rss = memory_get_usage(true);
```

## Good Example

```php
// GC telemetry alongside RSS
$status = gc_status();
Log::info('GC status', [
    'roots' => $status['roots'],
    'collected' => $status['collected'],
    'gc_ratio' => $status['collector_time'] / max($status['application_time'], 1),
    'protected' => $status['protected'],
]);
```

## Exceptions

PHP-FPM environments where gc_status resets per request and is meaningless.

## Consequences Of Violation

Undetected cycle accumulation until OOM, inability to distinguish cycle leaks from static accumulation, reactive incident response.

---

## Rule Name

Alert on Collector Time Ratio Exceeding 5%

## Category

Performance

## Rule

Set an alert when `collector_time / application_time > 5%` in `gc_status()`.

## Reason

A GC time ratio above 5% indicates that excessive garbage collection is consuming measurable CPU. This means cycles are forming faster than they should be, wasting CPU on marking, scanning, and sweeping.

## Bad Example

```php
// Ignoring 12% GC ratio — "GC is normal PHP behavior"
// 12% of all CPU is spent collecting garbage
```

## Good Example

```php
$gcRatio = $status['collector_time'] / max($status['application_time'], 1);
if ($gcRatio > 0.05) {
    Log::warning("GC overhead {$gcRatio}% — investigate cycle sources");
}
```

## Exceptions

Batch processing phases where large object graphs are intentionally created and destroyed.

## Consequences Of Violation

12%+ CPU wasted on garbage collection, latency spikes from GC pauses, undetected cycle accumulation.

---

## Rule Name

Track Root Buffer Entries Over Time, Not as an Absolute

## Category

Maintainability

## Rule

Monitor the trend of `gc_status()['roots']` over time, not its absolute value at a single point.

## Reason

A single reading of 200 roots may be fine or may be the start of a leak. The key signal is monotonic growth — roots increasing across requests indicates cycles are accumulating faster than collection resolves them.

## Bad Example

```php
// Single-point check — meaningless
if (gc_status()['roots'] > 5000) { alert(); }
```

## Good Example

```php
// Trend detection — compare with previous reading
$current = gc_status()['roots'];
$growth = $current - $previousRoots;
if ($growth > 100 && $current > 1000) {
    Log::warning("Root buffer growing: +{$growth} since last check");
}
$previousRoots = $current;
```

## Exceptions

No common exceptions. Always track trends.

## Consequences Of Violation

False positives from single-point measurements that catch normal cycling, missed gradual leaks that grow over hours.

---

## Rule Name

Cross-Reference gc_status with RSS Monitoring

## Category

Reliability

## Rule

Always correlate `gc_status()` data with process RSS (VmRSS) when investigating memory growth.

## Reason

RSS growing while roots are flat indicates a non-cycle leak (static property accumulation, closure buildup). RSS growing while roots also grow indicates cycle accumulation. RSS flat means no leak regardless of root count.

## Bad Example

```php
// Checking only roots — misses static accumulation leaks
$status = gc_status();
if ($status['roots'] < 5000) { echo "No leak"; }
// RSS has grown 30MB — leak is from static arrays, not cycles
```

## Good Example

```php
$pid = getmypid();
$status = file_get_contents("/proc/$pid/status");
preg_match('/VmRSS:\s+(\d+)/', $status, $m);
$rssKB = (int)$m[1];

$gcRoots = gc_status()['roots'];
if ($rssKB > $baselineRSS * 1.1 && $gcRoots < 1000) {
    Log::warning("RSS growing but roots flat — likely static accumulation");
}
```

## Exceptions

No common exceptions. Cross-referencing provides the complete memory picture.

## Consequences Of Violation

Misdiagnosis of leak type, wasted investigation time on the wrong code path.

---

## Rule Name

Collect Baseline gc_status at Worker Start

## Category

Maintainability

## Rule

Capture a `gc_status()` baseline at worker start and compare against periodic readings.

## Reason

`gc_status()` counters (`collected`, `running_time`) accumulate from process start. Without a baseline, it is impossible to know how much GC activity occurred over the worker's lifetime versus inherited from previous requests.

## Bad Example

```php
// No baseline — don't know if "collected: 5000" is high or normal
$status = gc_status();
echo "Collected: {$status['collected']}";
```

## Good Example

```php
// Baseline at worker start
$baseline = gc_status();
// ... after N requests
$current = gc_status();
$cyclesSinceBaseline = $current['collected'] - $baseline['collected'];
$gcTimeSinceBaseline = $current['collector_time'] - $baseline['collector_time'];
```

## Exceptions

No common exceptions. Always establish a baseline.

## Consequences Of Violation

Inability to measure GC activity over a specific interval, meaningless absolute counter values.
