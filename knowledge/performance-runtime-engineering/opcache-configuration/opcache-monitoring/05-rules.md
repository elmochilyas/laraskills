---
## Rule Name

Monitor the Five Critical OpCache Metrics

## Category

Performance

## Rule

Always monitor these five OpCache metrics: `cache_full`, `oom_restarts`, `hash_restarts`, `hit_rate`, and `current_wasted_percentage`.

## Reason

These five metrics form a complete early warning system for OpCache health. `oom_restarts` and `hash_restarts` are the earliest signals (immediate action needed), followed by `cache_full`, then `wasted_percentage`, then `hit_rate` decline.

## Bad Example

```php
// Only monitoring hit rate — misses early warning signs
$hitRate = $status['opcache_statistics']['hit_rate'];
```

## Good Example

```php
$metrics = [
    'oom_restarts' => $status['opcache_statistics']['oom_restarts'],
    'hash_restarts' => $status['opcache_statistics']['hash_restarts'],
    'cache_full' => $status['cache_full'],
    'hit_rate' => $status['opcache_statistics']['hit_rate'],
    'wasted_percentage' => $status['memory_usage']['current_wasted_percentage'],
];
```

## Exceptions

No common exceptions. All five metrics should be tracked.

## Consequences Of Violation

Missed early warning signs, reactive incident response instead of proactive configuration tuning, performance degradation reaching users before detection.

---

## Rule Name

Alert Immediately on Non-Zero Restart Counters

## Category

Reliability

## Rule

Set alerts to trigger immediately when `oom_restarts > 0` or `hash_restarts > 0` in `opcache_get_status()`.

## Reason

Non-zero restart counters mean OpCache has already experienced allocation failures. OOM restarts indicate `memory_consumption` is too small; hash restarts indicate `max_accelerated_files` is too small. These are the earliest signals of misconfiguration.

## Bad Example

```bash
# Noticed oom_restarts=15 during a weekly check
# Performance has been degraded for days
```

## Good Example

```bash
# Alert triggers immediately on oom_restarts > 0
# Configuration adjusted same day — no user impact
```

## Exceptions

No common exceptions. Any non-zero restart counter requires immediate investigation.

## Consequences Of Violation

Extended periods of cache thrashing, CPU wasted on recompilation, degraded p95 latency, user-facing performance issues.

---

## Rule Name

Target Hit Rate Above 99%

## Category

Performance

## Rule

Alert when OpCache hit rate drops below 99%. Investigate and remediate immediately.

## Reason

Below 99% hit rate, more than 1% of file accesses result in recompilation, wasting significant CPU. Each recompilation costs 5–50ms per file. At scale, this becomes a major CPU drain.

## Bad Example

```php
// 97% hit rate — "close enough"
// 3% of file accesses are recompiling — significant CPU waste
```

## Good Example

```php
if ($status['opcache_statistics']['hit_rate'] < 99) {
    alert('OpCache hit rate below 99% — check memory_consumption and max_accelerated_files');
}
```

## Exceptions

Temporary dip immediately after deployment or cache reset (first 60 seconds of warm-up).

## Consequences Of Violation

Up to 15%+ CPU wasted on recompilation, increased latency from compilation during request processing.

---

## Rule Name

Use opcache_get_status(false) for Routine Monitoring

## Category

Performance

## Rule

Always pass `false` to `opcache_get_status()` for routine monitoring. Never use `true` in production monitoring loops.

## Reason

With `true`, the function returns all individual file entries — for a large application (20K+ files), this takes ~100ms and consumes significant memory and bandwidth. With `false`, it returns only aggregate statistics (~10µs call cost).

## Bad Example

```php
// Routine monitoring — returns 20K individual file entries
$status = opcache_get_status(true);  // ~100ms every 60 seconds
```

## Good Example

```php
// Routine monitoring — aggregate statistics only
$status = opcache_get_status(false);  // ~10µs — negligible overhead
```

## Exceptions

On-demand debugging sessions where per-file analysis is needed (not routine monitoring).

## Consequences Of Violation

Wasted CPU and memory on routine monitoring calls, unnecessary bandwidth for 20K+ file entries, monitoring itself becoming a performance concern.

---

## Rule Name

Track Hit Rate Trend Over Time

## Category

Performance

## Rule

Always track OpCache hit rate as a time-series metric to detect gradual degradation, not just as a single-point measurement.

## Reason

A single-point measurement of 99.5% hit rate may look healthy, but a trend declining from 99.9% to 99.5% over six months signals growing memory pressure as the application grows. Single-point checks miss this gradual degradation.

## Bad Example

```bash
# Checking hit rate only during incidents
# Missed the gradual decline from 99.9% to 99.0% over 8 months
```

## Good Example

```bash
# Time-series dashboard: hit_rate over time
# Alert on sustained downward trend, not absolute value
```

## Exceptions

No common exceptions. Always track metrics over time.

## Consequences Of Violation

Gradual performance degradation unnoticed until it becomes user-visible, reactive rather than proactive tuning.

---

## Rule Name

Check OpCache Status After Every Deployment

## Category

Reliability

## Rule

Always verify OpCache health metrics as part of the post-deployment validation step.

## Reason

Deployments may add files, change file patterns, or alter the codebase size. A deployment that exceeds `memory_consumption` or `max_accelerated_files` causes silent performance regression that persists until the configuration is updated.

## Bad Example

```bash
# Deployed new feature with 3000 additional files
# max_accelerated_files is 20000, now at 21000 — hash table overflows
# No check — performance degrades silently
```

## Good Example

```bash
# Post-deployment check
php -r '
$s = opcache_get_status(false);
$stats = $s["opcache_statistics"];
if ($stats["oom_restarts"] > 0 || $stats["hash_restarts"] > 0) {
    echo "CRITICAL: OpCache reconfiguration needed after deploy\n";
    exit(1);
}
echo "Hit rate: " . round($stats["hit_rate"], 1) . "%\n";
'
```

## Exceptions

No common exceptions. Always verify post-deployment.

## Consequences Of Violation

Silent performance regression after deployment, undetected until users report slowdowns.

---

## Rule Name

Do Not Expose Raw OpCache Status Publicly

## Category

Security

## Rule

Never expose the raw output of `opcache_get_status()` via a public-facing HTTP endpoint.

## Reason

`opcache_get_status()` reveals filesystem paths, file counts, memory usage details, and configuration values. An attacker can use this information to map the application structure and identify potential attack surfaces.

## Bad Example

```php
// Public route exposing raw OpCache data
Route::get('/debug/opcache', function () {
    return opcache_get_status(true);  // Exposes all file paths
});
```

## Good Example

```php
// Internal-only health endpoint with sanitized metrics
Route::get('/health/opcache', function () {
    $status = opcache_get_status(false);
    return response()->json([
        'healthy' => $status['opcache_statistics']['hit_rate'] > 99,
        'hit_rate' => $status['opcache_statistics']['hit_rate'],
    ]);
})->middleware('auth:api');  // Requires authentication
```

## Exceptions

Internal monitoring systems that already have authenticated access to the application.

## Consequences Of Violation

Exposure of application file structure to attackers, information leakage aiding reconnaissance.
