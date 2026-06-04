# Standardized Knowledge: Memory Drift and Recycling Overhead

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | Memory Drift and Recycling Overhead |
| Difficulty | Foundation |
| Lifecycle | Configure, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Worker recycling via `pm.max_requests` is a deliberate tradeoff: **lower worker RSS** (good) vs **higher process spawn overhead** (bad). Each spawn costs ~10-50ms of CPU time for process fork, PHP bootstrap, and OpCache warming. The optimal `pm.max_requests` minimizes the sum of drift-related memory waste and spawn-related CPU waste.

## Core Concepts

- **Memory drift mechanics**: PHP's per-request allocator leaves fragmented memory pages that the OS cannot reclaim. Over ~10,000 requests, RSS grows 1.5-2x.
- **Spawn cost components**: Fork (~5ms) + PHP bootstrap (~10-30ms) + OpCache population for first unique files (~5-50ms depending on preloading).
- **Quantified tradeoff**: At pm.max_requests=500 with 100 workers, each worker recycles every 500 requests. Total spawn overhead = 100 workers × (1 recycle / 500 requests) × 30ms spawn cost = 6ms per 500 requests = 0.012ms per request. Negligible.
- **Overhead minimization**: Preloading (reduces spawn cost by 50-80%), COW-friendly PHP compilation (OpCache reduces per-worker memory needs), and process-mode static (avoids spawn/waste contention).

## When To Use

- When tuning pm.max_requests for optimal performance
- When evaluating the cost of worker recycling
- When deciding between preloading or other spawn-cost reduction techniques
- When explaining why pm.max_requests=0 is dangerous

## When NOT To Use

- When the application already has pm.max_requests set appropriately (500-1000)
- As a reason to set pm.max_requests too high ("to reduce overhead")
- When the spawn overhead is measurable but negligible compared to drift risk

## Best Practices (WHY)

- **The real risk is memory drift, not spawn overhead**: Spawn overhead at 500 max_requests is <0.1% of CPU. The risk of memory exhaustion from drift is far greater.
- **Preloading reduces spawn cost significantly**: With preloading, PHP bootstrap time drops by 50-80%, making more frequent recycling nearly free.
- **Measure drift before tuning**: Compare worker RSS at spawn vs after max_requests. If growth > 20%, lower max_requests. If growth < 5%, you could raise max_requests.
- **Don't raise max_requests to "reduce overhead"**: The overhead is already negligible. Raising max_requests increases memory drift risk without meaningful benefit.

## Architecture Guidelines

- **Memory drift mechanics**: PHP's per-request allocator (Zend Memory Manager) uses a chunked allocator. Fragmented pages cannot be returned to the OS between requests.
- **Spawn cost components**: Fork (~5ms) + PHP bootstrap (~10-30ms) + OpCache population (~5-50ms depending on preloading).
- **Overhead minimization strategies**: Preloading (50-80% spawn cost reduction), OpCache (reduces per-worker compilation), COW-friendly design (shares memory between forked workers).

## Performance

- pm.max_requests=500 with 100 workers: spawn overhead = 0.012ms per request (<0.1% of CPU)
- pm.max_requests=200: spawn overhead = 0.03ms per request (~0.3% of CPU) — still negligible
- pm.max_requests=0: no spawn overhead but memory drift doubles RSS over 12 hours
- Preloading reduces spawn cost by 50-80%
- The tradeoff strongly favors lower max_requests (500-1000) for memory stability

## Security

- Workers with high memory drift are more likely to be OOM-killed
- OOM events can cause data corruption in applications without proper error handling
- Residual memory from previous requests may contain sensitive data — recycling clears this
- Regular recycling is a security control against cross-request data leakage

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Raising max_requests to "reduce overhead" | Misunderstanding spawn cost | Memory drift risk increases | The overhead is already negligible; optimize for drift |
| pm.max_requests=0 (unlimited) | Default, unawareness | Memory drift doubles RSS | Always set a limit (500-1000) |
| Setting too low (100-200) | Over-caution | 0.3% CPU overhead — acceptable | Start at 500; adjust based on measured drift |
| Not using preloading | Missing optimization | Spawn cost higher than necessary | Use preloading to reduce spawn cost by 50-80% |

## Anti-Patterns

- **Optimizing spawn overhead at the expense of memory stability**: The overhead is negligible (<0.1% CPU). Memory drift is the real risk. Err on the side of lower max_requests.
- **Not quantifying the tradeoff**: The quantified tradeoff (0.012ms/request at 500 max_requests) shows that spawn overhead is almost always worth accepting for memory stability.
- **Ignoring preloading's impact on spawn cost**: Preloading dramatically reduces the cost of recycling. If spawn cost is a concern, implement preloading instead of raising max_requests.

## Examples

```php
<?php
// Quantifying the tradeoff:
// At pm.max_requests=500 with 100 workers:
// - Each worker processes 500 requests before recycling
// - Spawn cost: ~30ms per recycle
// - Total spawn overhead: 100 workers × 1 recycle/500 requests × 30ms
//   = 6ms per 500 requests = 0.012ms per request = 0.0012% of request time
// This is negligible compared to the memory drift prevented.

// Without recycling (max_requests=0):
// - Worker starts at 65MB RSS
// - After ~10,000 requests: 120MB RSS
// - 100 workers × 55MB additional = 5.5GB extra memory pressure
```

## Related Topics

- PM Max Requests Tuning
- Memory Drift Detection
- Preloading Configuration
- Worker RSS Capacity Ceiling
- OpCache Configuration

## AI Agent Notes

- The recycling tradeoff: lower RSS (good) vs higher spawn overhead (bad).
- Spawn overhead at 500 max_requests is <0.1% of CPU — negligible.
- Memory drift is the real risk: RSS can double over 12 hours without recycling.
- Preloading reduces spawn cost by 50-80%.
- Always optimize for memory stability, not spawn frequency.

## Verification

- [ ] pm.max_requests set to a value between 500-1000
- [ ] Memory drift measured (RSS at spawn vs after max_requests)
- [ ] Spawn overhead quantified and confirmed negligible
- [ ] Preloading evaluated for spawn cost reduction
- [ ] No use of pm.max_requests=0 in production
- [ ] Drift measurement repeated after code changes
