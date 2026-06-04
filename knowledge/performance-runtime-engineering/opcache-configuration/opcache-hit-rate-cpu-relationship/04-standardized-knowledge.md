# OpCache Hit Rate Inversely Correlates with CPU Load

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Hit Rate Inversely Correlates with CPU Load |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

When OpCache hit rate drops, every miss triggers file compilation - a CPU-intensive operation. Lower hit rates directly increase CPU load as the Zend Engine recompiles uncached files on every request. This creates a performance death spiral: as traffic increases, more cache misses occur (if under-provisioned), increasing CPU load, which slows request processing, causing queue buildup.

## Core Concepts

- Each miss costs: 5-15ms of CPU time for lexing, parsing, and compiling a PHP file. With 200 files per request, one miss = 1-3 seconds of compilation.
- Hit rate to CPU correlation: 95% hit rate with 500 req/s and 200 files/request = 5,000 compilations per second leading to server saturation.
- Cache sizing prevents this: Proper memory_consumption and max_accelerated_files ensure >99% hit rate, eliminating compilation as a CPU consumer.

## When To Use

- Diagnosing unexplained CPU spikes in production.
- Sizing OpCache for optimal performance.

## When NOT To Use

- When CPU issues are clearly from database queries or application code.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Monitor hit rate before investigating code for CPU issues | An under-provisioned OpCache mimics a CPU-bound bottleneck. |
| Keep hit rate >99% | Each percentage point below 99% adds ~0.5-1% CPU utilization. |
| Check cache_full first during CPU spikes | The most common cause of sudden CPU increase. |

## Architecture Guidelines

- Under-provisioned OpCache creates a compounding effect: higher traffic -> more evictions -> lower hit rate -> higher CPU -> slower requests -> more concurrent requests -> more evictions.
- Preloading reduces per-request compilation, helping maintain higher effective hit rate.

## Performance Considerations

- Each file compilation: 5-15ms CPU time.
- 1% hit rate decrease = 0.5-1% CPU increase.
- file_cache reduces cold-start latency by 50-70%.
- Preloading eliminates first-hit compilation for preloaded files.

## Security Considerations

- No direct security implications.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Investigating application code for CPU spikes without checking OpCache | CPU spike caused by recompilation, not application logic. | Wasted investigation hours. | Check opcache_get_status() first. |

## Anti-Patterns

- Throwing more hardware at CPU issues caused by OpCache under-provisioning.
- Tuning application performance while OpCache is thrashing.

## Examples

```php
// Quick health check
$status = opcache_get_status();
if ($status['cache_full']) {
    echo "Increase max_accelerated_files!";
}
$hitRate = $status['statistics']['hits'] / ($status['statistics']['hits'] + $status['statistics']['misses']) * 100;
if ($hitRate < 99) {
    echo "Increase memory_consumption or max_accelerated_files!";
}
```

## Related Topics

- OpCache Monitoring and Hit Rate
- OpCache Memory Sizing
- Max Accelerated Files Calculation

## AI Agent Notes

- When users report high CPU, always ask: "Have you checked OpCache hit rate?" before investigating code.
- The relationship is multiplicative: 95% hit rate on 500 req/s server = 25 misses/s = 125-375ms of compilation per second. Over a minute that's 7.5-22.5 seconds of compilation.
- cache_full is always a red flag for CPU issues.

## Verification

- [ ] Establish baseline hit rate for your application (>99% target).
- [ ] Monitor CPU utilization vs OpCache hit rate correlation.
- [ ] Verify OpCache is properly sized before tuning application code.
- [ ] Implement alerting when hit rate drops below 99%.