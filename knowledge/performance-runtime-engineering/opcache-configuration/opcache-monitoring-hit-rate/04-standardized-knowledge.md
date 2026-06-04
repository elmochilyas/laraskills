# OpCache Monitoring and Hit Rate Analysis - cache_full Detection, Waste Management

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Monitoring and Hit Rate Analysis - cache_full Detection, Waste Management |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

OpCache health is determined by hit rate (should be >99% in production) and cache_full events (should be zero). Monitoring opcache_get_status() provides memory usage, hit/miss statistics, and eviction counters. Key indicators: misses growing = cache under-provisioned; cache_full > 0 = max_accelerated_files too low; memory_usage[used_memory] approaching total = need larger buffer.

## Core Concepts

- opcache_get_status(): Returns array with opcache_enabled, cache_full, memory_usage, statistics (hits, misses, blacklist misses), interned_strings_usage.
- Hit rate: hits / (hits + misses). Target >99%. Below 95% indicates severe under-provisioning.
- cache_full flag: Set to true when max_accelerated_files exceeded. Requires OpCache reset to clear.
- Wasted memory: Internal fragmentation from file updates (when validate_timestamps=1). Reset OpCache periodically to reclaim.
- Blacklist misses: Files excluded from caching via opcache.blacklist. Minimize this list.

## When To Use

- Any production deployment with OpCache enabled.
- Diagnosing performance issues (CPU spikes, slow requests).

## When NOT To Use

- Development environment where OpCache is disabled.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Monitor opcache_hit_rate in production dashboards | Detects cache under-provisioning before users notice. |
| Alert on cache_full=true | Indicates max_accelerated_files is too low. |
| Reset OpCache periodically if wasted_memory >5% | Reclaims fragmentation from file updates. |

## Architecture Guidelines

- Monitoring data available via opcache_get_status(false) - lightweight, no reset.
- FPM status endpoint can expose OpCache metrics.
- Integrate with Prometheus/node_exporter via custom exporter.

## Performance Considerations

- Every 1% decrease in hit rate increases CPU usage ~0.5-1%.
- file_cache reduces cold-start latency by 50-70% in containers.
- Preloading reduces per-request class loading time by 1-3ms.

## Security Considerations

- opcache_get_status() exposes internal memory layout. Restrict access in production.
- The FPM status page should be protected by authentication or IP restriction.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Ignoring cache_full | Once max_accelerated_files is exceeded, new files never cached. | Gradual, silent performance degradation. | Monitor and alert on cache_full=true. |

## Anti-Patterns

- Only checking OpCache status during incidents: Should be continuous monitoring.
- Looking at hits/misses without context: 90% hit rate on a busy server means thousands of compilations per second.

## Examples

```php
$status = opcache_get_status();
$hitRate = $status['statistics']['hits'] /
           ($status['statistics']['hits'] + $status['statistics']['misses']) * 100;
$isFull = $status['cache_full'] ? 'YES' : 'NO';
$memoryUsed = $status['memory_usage']['used_memory'] / $status['memory_usage']['total_memory'] * 100;
```

## Related Topics

- OpCache Memory Sizing
- Max Accelerated Files Calculation
- OpCache File Cache and Container Cold Start

## AI Agent Notes

- Three critical metrics: hit rate (>99%), cache_full (false), wasted_percentage (<5%).
- Hit rate 95-99% = investigate. Below 95% = urgent.
- cache_full never clears automatically after being set - requires reset or restart.
- When a user reports high CPU, always check OpCache status first.

## Verification

- [ ] Implement opcache_get_status() monitoring via FPM status endpoint.
- [ ] Set alert for hit_rate <99%.
- [ ] Set alert for cache_full=true.
- [ ] Set alert for wasted_percentage >5%.
- [ ] Verify monitoring after deployment and cache warmup.
- [ ] Document baseline hit rate for your application.