# OpCache Monitoring — opcache_get_status(), Hit Rate Analysis, Metrics Collection, Alerting

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Monitoring — opcache_get_status(), Hit Rate Analysis, Metrics Collection, Alerting |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

OpCache monitoring is essential for maintaining optimal performance. `opcache_get_status()` provides detailed insight into cache health: memory usage, hit rate, cache fullness, wasted memory, and error counters. The key metrics to track are hit rate (target >99%), cache full indicator, oom_restarts (must be 0), hash_restarts (must be 0), and current_wasted_percentage (target <5%). Monitoring these metrics enables early detection of OpCache misconfiguration — undersized memory, insufficient file slots, or excessive churn — before they cause visible performance degradation.

## Core Concepts

- **opcache_get_status(bool $include_scripts = false)**: Returns detailed OpCache status. When `$include_scripts=true`, returns individual file entries (expensive — use sparingly). When `false`, returns aggregate statistics.
- **opcache_get_configuration()**: Returns current OpCache configuration values. Useful for verifying settings in production.
- **Critical metrics**:
  - `opcache_enabled`: Boolean — is OpCache active?
  - `cache_full`: Boolean — has the cache been full at some point?
  - `oom_restarts`: Integer — number of out-of-memory restarts (must be 0)
  - `hash_restarts`: Integer — number of hash table restarts (must be 0)
  - `hit_rate`: Percentage — what fraction of file accesses found cached opcodes
  - `current_wasted_percentage`: Percentage — memory wasted by evicted files
  - `max_accelerated_files`: Integer — total file slots configured
  - `num_cached_scripts`: Integer — currently cached files
  - `interned_strings_usage`: Array — interned string buffer utilization
- **Hit rate calculation**: `hits / (hits + misses) × 100`. A miss occurs when a requested file is not in cache and must be compiled. Target: >99%.
- **Wasted memory**: Memory that was used by evicted files and cannot be reused until compaction. High waste = cache thrashing.
- **Monitoring frequency**: Collect metrics every 60–300 seconds in production. More frequently for debugging. `opcache_get_status(false)` is lightweight (~10µs).

## When To Use

- You are running PHP in production — OpCache monitoring should be part of your standard monitoring stack.
- You want to detect OpCache misconfiguration before it impacts users.
- You are tuning OpCache configuration and need data to guide decisions.
- You have set up Prometheus, Datadog, or another monitoring system.
- You are investigating low hit rates or high CPU usage.
- You deploy frequently and want to verify OpCache health post-deployment.

## When NOT To Use

- You are developing or testing locally — OpCache behavior differs from production.
- You haven't yet configured OpCache — monitor after configuration, not before.
- You are running a CLI one-off script — OpCache status is irrelevant.
- You are on shared hosting without access to `opcache_get_status()`.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Collect metrics every 60 seconds | Frequent enough to detect trends, infrequent enough to avoid overhead. |
| Alert on `cache_full=true` or `oom_restarts > 0` | These indicate imminent performance degradation. Alert immediately. |
| Alert on `hit_rate < 99%` | Below 99%, recompilation is wasting significant CPU. Investigate configuration. |
| Alert on `current_wasted_percentage > 5%` | Waste indicates cache thrashing — files are being evicted and recompiled. |
| Track hit rate trend over time | A gradual decline indicates the application is growing beyond the cache size. |
| Monitor `num_cached_scripts` vs `max_accelerated_files` | If `num_cached_scripts` approaches `max_accelerated_files`, increase `max_accelerated_files`. |
| Check OpCache status after every deployment | A deployment may add files, change patterns, or invalidate cache. Verify post-deploy health. |
| Use `opcache_get_status(false)` in production | `true` includes all individual file entries. For large apps, this returns 20K+ entries and takes ~100ms. Use `false` for routine monitoring. |

## Architecture Guidelines

- **Monitoring data flow**: PHP-FPM status endpoint (or dedicated monitoring route) → call `opcache_get_status(false)` → format metrics → push to monitoring system (Prometheus, Datadog, New Relic). Expose as a `/health/opcache` endpoint.
- **Hit rate trend analysis**: Sample hit rate at a fixed interval. Plot over time. A declining trend indicates gradual cache pressure. Investigate when hit rate drops below 99%.
- **Cache cycle detection**: After a deployment, hit rate starts at ~0% (cache cleared) and rises toward 99%+ as files are compiled. Expected stabilization time: 5–60 seconds. If hit rate stays low, files are being evicted faster than they're compiled — memory is too small.
- **Script-level analysis**: Occasionally (weekly or during debugging) run `opcache_get_status(true)` to identify files with high miss rates. Files that are frequently compiled but never stay cached indicate memory pressure. Files that are never cached indicate blacklist or _max_accelerated_files exhaustion.
- **Integration with APM**: OpCache metrics should be part of your APM dashboard alongside FPM metrics, request rates, and error rates. Correlate OpCache hit rate drops with CPU usage spikes.

## Performance Considerations

- `opcache_get_status(false)` call cost: ~10µs. Safe to call every 60 seconds.
- `opcache_get_status(true)` call cost: ~100µs–10ms depending on file count (returns all 20K entries). Use sparingly (weekly or on-demand).
- Monitoring memory overhead: Negligible — just a small PHP array serialized to monitoring system.
- High monitor frequency (every 5 seconds): Adds unnecessary load. 60 seconds is sufficient for trend detection.
- Cache profiling impact: Parsing individual file entries (`true` mode) adds CPU and memory. Restrict to low-traffic periods.

## Security Considerations

- OpCache status endpoint: Do not expose the raw `opcache_get_status()` output publicly. It reveals filesystem paths, file counts, and configuration details. Restrict to internal networks or authentication.
- Script-level information: `opcache_get_status(true)` returns file paths. An attacker could use this to discover application structure. Never expose this data externally.
- Monitoring access: Ensure monitoring systems access OpCache status via an authenticated endpoint or internal route.
- Failure mode: If monitoring detects `cache_full=true` but the configuration cannot be changed immediately, implement rate limiting or add servers to reduce per-server cache pressure.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Only monitoring hit rate | Hit rate matters, but `oom_restarts` and `hash_restarts` are earlier indicators of problems. | Focusing on the most well-known metric. | Miss early warning signs before hit rate drops. | Monitor all critical metrics: cache_full, oom_restarts, hash_restarts, wasted_percentage, hit_rate. |
| Alerting on hit rate too aggressively | Hit rate naturally spikes during deployment (cache cleared). | Setting alert threshold too high. | PagerDuty alert on every deploy. | Set alert threshold at 90% (not 99%) for the first 5 minutes after deploy. |
| Not tracking hit rate trend | A gradual decline from 99.9% to 99.0% over 6 months is a warning sign. | Only checking current value, not time series. | Miss gradual degradation from application growth. | Plot hit rate over time. Alert on sustained downward trend. |
| Using `opcache_get_status(true)` in routine monitoring | Returns all 20K+ files every 60 seconds. | Not knowing the performance impact. | ~100ms CPU per call, wasted bandwidth for 20K entries. | Use `false` for routine monitoring. Only use `true` for debugging. |
| Not monitoring after deployment | Deployment clears or adds files; post-deploy metrics verify recovery. | "Set and forget" approach. | Miss post-deploy performance degradation. | Add OpCache verification to deployment pipeline. |

## Anti-Patterns

- **Dashboard overload**: Monitoring every OpCache metric without understanding what's actionable. Focus on the 5 critical metrics: cache_full, oom_restarts, hash_restarts, hit_rate, wasted_percentage.
- **Manual monitoring**: Checking `opcache_get_status()` via SSH once a week. Automate collection into your monitoring system.
- **Ignoring stale cache indicators**: `wasted_memory` and `cache_full` are early warning signs. Act on them when they appear, not when hit rate drops.
- **Monitoring only one server**: In a cluster, one server may have different OpCache metrics than others. Monitor all servers individually.

## Examples

```php
// OpCache monitoring endpoint
Route::get('/health/opcache', function () {
    $status = opcache_get_status(false);
    if (!$status || !$status['opcache_enabled']) {
        return response()->json(['healthy' => false], 503);
    }
    
    $stats = $status['opcache_statistics'];
    $memory = $status['memory_usage'];
    
    $metrics = [
        'hit_rate' => round($stats['hit_rate'], 2),
        'cache_full' => $status['cache_full'],
        'oom_restarts' => $stats['oom_restarts'],
        'hash_restarts' => $stats['hash_restarts'],
        'wasted_percentage' => round($memory['current_wasted_percentage'], 2),
        'num_cached' => $stats['num_cached_scripts'],
        'max_cached' => $stats['max_accelerated_files'],
        'memory_used_mb' => round($memory['used_memory'] / 1024 / 1024, 1),
        'memory_free_mb' => round($memory['free_memory'] / 1024 / 1024, 1),
    ];
    
    $healthy = !$metrics['cache_full']
        && $metrics['oom_restarts'] === 0
        && $metrics['hash_restarts'] === 0
        && $metrics['hit_rate'] > 99
        && $metrics['wasted_percentage'] < 5;
    
    return response()->json([
        'healthy' => $healthy,
        'metrics' => $metrics,
    ]);
});
```

```
# Prometheus metrics example
# HELP opcache_hit_rate OpCache hit rate percentage
# TYPE opcache_hit_rate gauge
opcache_hit_rate{server="web01"} 99.8
# HELP opcache_cache_full OpCache is full (1 = true)
# TYPE opcache_cache_full gauge
opcache_cache_full{server="web01"} 0
# HELP opcache_oom_restarts OpCache OOM restarts
# TYPE opcache_oom_restarts gauge
opcache_oom_restarts{server="web01"} 0
# HELP opcache_wasted_percentage OpCache wasted memory percentage
# TYPE opcache_wasted_percentage gauge
opcache_wasted_percentage{server="web01"} 1.2
```

```bash
# Quick CLI check
php -r '
$s = opcache_get_status(false);
printf("Hit rate: %.1f%%\n", $s["opcache_statistics"]["hit_rate"]);
printf("Cache full: %s\n", $s["cache_full"] ? "YES!" : "no");
printf("OOM restarts: %d\n", $s["opcache_statistics"]["oom_restarts"]);
printf("Wasted: %.1f%%\n", $s["memory_usage"]["current_wasted_percentage"]);
'
```

## Related Topics

- OpCache Memory Consumption Monitoring
- OpCache Error Handling and Diagnostics
- OpCache Max Accelerated Files
- Deployment Cache Invalidation
- PHP-FPM Status Page Monitoring

## AI Agent Notes

- OpCache monitoring is one of the highest-ROI monitoring investments. It's a free diagnostic that catches the most common PHP performance problems before they impact users.
- The 5 critical metrics form an early warning system: `oom_restarts` and `hash_restarts` are the earliest signals (immediate action needed), followed by `cache_full`, then `wasted_percentage`, then `hit_rate` decline.
- Trend analysis is more valuable than single-point measurements. A hit rate of 99.5% today is fine; a hit rate that declined from 99.9% to 99.5% over 6 months signals growing memory pressure.
- Post-deployment OpCache monitoring is essential — a deployment that adds 5000 files may exceed `max_accelerated_files` or `memory_consumption`, causing silent performance regression.

## Verification

- [ ] Set up OpCache metrics collection in your monitoring system (Prometheus, Datadog, etc.).
- [ ] Verify all 5 critical metrics are collected: cache_full, oom_restarts, hash_restarts, hit_rate, wasted_percentage.
- [ ] Set alerts on: cache_full=true, oom_restarts>0, hash_restarts>0, hit_rate<99%, wasted_percentage>5%.
- [ ] Verify monitoring endpoint is internal-only (not publicly accessible).
- [ ] Test post-deployment monitoring: deploy and observe hit rate recovery.
- [ ] Create a dashboard showing OpCache metrics alongside PHP-FPM metrics.
- [ ] Document the monitoring setup and alert thresholds.
