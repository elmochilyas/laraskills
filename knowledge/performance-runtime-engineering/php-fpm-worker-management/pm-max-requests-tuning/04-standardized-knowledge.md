# Standardized Knowledge: PM Max Requests Tuning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | PM Max Requests Tuning |
| Difficulty | Intermediate |
| Lifecycle | Configure, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

`pm.max_requests` controls how many requests a worker handles before being killed and replaced. This **recycling** prevents memory drift — the gradual increase in worker RSS caused by per-request memory fragmentation. A worker starting at 65MB RSS will grow to ~120MB over 12 hours without recycling. Setting `pm.max_requests` to 500-1000 stabilizes RSS by recycling before memory becomes critical.

## Core Concepts

- **Memory drift**: PHP's allocator does not return all memory to the OS between requests. Small fragmentation accumulates. After ~10,000 requests, RSS can double.
- **Recycling cost**: Killing and spawning a worker consumes ~10-50ms (process fork + PHP bootstrap). Too-frequent recycling wastes CPU on process management.
- **Zero is never appropriate**: `pm.max_requests=0` (unlimited) guarantees memory drift will eventually exhaust RAM. Always set a limit.
- **Tuning range**: 300-500 for memory-leak-prone apps (WordPress with plugins), 1000-2000 for well-behaved apps (Laravel), 5000+ only with monitoring proving no drift.

## When To Use

- Every PHP-FPM production deployment — this is a required safety setting
- Applications with memory fragmentation or suspected memory leaks
- Long-running workers (high request counts per worker)
- When monitoring shows worker RSS increasing over time

## When NOT To Use

- In development environments (frequent recycling slows down development iteration)
- When `pm = ondemand` (workers are already short-lived, recycling is less critical but still recommended)
- As a substitute for fixing memory leaks — set max_requests AND fix the leaks

## Best Practices (WHY)

- **Set a limit for all production deployments**: pm.max_requests=0 guarantees memory drift will eventually exhaust RAM. 500-1000 is the recommended starting range.
- **Detect drift before tuning**: Compare worker RSS at start (just spawned) vs after 500 requests. If growth > 20%, lower max_requests. If growth < 5%, raise max_requests.
- **Consider the spawn cost**: At pm.max_requests=500 with 100 workers, total spawn overhead = ~0.012ms per request — negligible. Don't fear recycling.
- **Preloading reduces spawn cost**: With preloading, PHP bootstrap time drops by 50-80%, making more frequent recycling less costly.

## Architecture Guidelines

- **Spawn cost components**: Fork (~5ms) + PHP bootstrap (~10-30ms) + OpCache population for first unique files (~5-50ms depending on preloading).
- **Quantified tradeoff**: At pm.max_requests=500 with 100 workers, each worker recycles every 500 requests. Total spawn overhead per request is negligible (<0.1% of CPU).
- **Low max_requests (100-200)**: High spawn overhead (~5-10% of total CPU). Only for leak-prone apps.
- **High max_requests (5000+)**: Risk of memory exhaustion if a leak exists. Only with monitoring proving no drift.

## Performance

- Low max_requests (100-200): High spawn overhead (~5-10% of total CPU)
- High max_requests (5000+): Risk of memory exhaustion if a leak exists
- Optimal: 500-1000 for most applications — balances drift prevention with spawn overhead (<1% of total CPU)
- Preloading reduces spawn cost by 50-80%, enabling more frequent recycling at lower cost

## Security

- Residual memory from previous requests may contain sensitive data — recycling clears this
- Workers that never recycle gradually accumulate data from all previous requests processed
- In multi-tenant environments, recycling is a security control against cross-tenant data leakage

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| pm.max_requests=0 (unlimited) | Default, negligence | Memory drift exhausts RAM; 65MB -> 120MB per worker | Always set a limit (500-1000) |
| Setting too low (100-200) | Over-caution about leaks | 5-10% CPU wasted on spawning | Start at 500; adjust based on drift measurement |
| Raising to "reduce overhead" | Misunderstanding cost | Risk of memory exhaustion from drift | The overhead is negligible (<0.1%); optimize for drift, not spawn cost |
| Not adjusting by app type | One-size-fits-all | WordPress plugins leak; Laravel doesn't | 300-500 for leak-prone apps, 1000-2000 for well-behaved |

## Anti-Patterns

- **Setting max_requests=0 because "it's fine"**: Memory drift is gradual and invisible until servers start OOM-killing. Always set a limit.
- **Copying values from tutorials without measurement**: Each application has different memory characteristics. Measure drift, then tune.
- **Thinking recycling is free**: Each spawn costs CPU. Balance drift prevention against spawn overhead. But err on the side of lower max_requests.

## Examples

```ini
; php-fpm pool configuration — recommended starting points
; Well-behaved app (Laravel, Symfony):
pm.max_requests = 1000

; Memory-leak-prone app (WordPress with plugins):
pm.max_requests = 500

; Conservative for new deployments:
pm.max_requests = 500
```

## Related Topics

- Memory Drift Detection and Mitigation
- Worker RSS Capacity Ceiling
- FPM Process Manager Modes
- Preloading Configuration
- FPM Status Page Monitoring

## AI Agent Notes

- pm.max_requests=0 guarantees memory drift will eventually exhaust RAM.
- Optimal range: 500-1000 for most applications.
- Spawn overhead is negligible (<0.1% of CPU at 500 max_requests).
- Measure drift by comparing RSS at spawn vs after 500 requests.
- Preloading reduces spawn cost, enabling more frequent recycling.

## Verification

- [ ] pm.max_requests set to a value > 0 (never 0 in production)
- [ ] Initial setting in 500-1000 range
- [ ] Worker RSS drift measured (compare at spawn vs after max_requests)
- [ ] max_requests adjusted based on drift data
- [ ] Spawn overhead monitored and within acceptable range
- [ ] Preloading evaluated to reduce spawn cost
- [ ] Setting reviewed after significant code changes
