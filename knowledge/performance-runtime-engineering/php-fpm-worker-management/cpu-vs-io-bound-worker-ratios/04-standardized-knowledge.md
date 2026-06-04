# Standardized Knowledge: CPU-Bound vs I/O-Bound Worker Ratios

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | CPU-Bound vs I/O-Bound Worker Ratios |
| Difficulty | Intermediate |
| Lifecycle | Configure, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

The optimal number of workers per CPU core depends on whether the workload is **CPU-bound** (workers are always computing — need fewer workers than cores) or **I/O-bound** (workers spend most time waiting — need more workers to utilize cores during wait time). Rule of thumb: 2-4 workers per core for CPU-bound, 8-12 per core for I/O-bound.

## Core Concepts

- **CPU-bound ratio (2-4/core)**: Each worker keeps the CPU busy. More workers than cores causes context switching overhead without throughput gain. Example: image processing, PDF generation, encryption.
- **I/O-bound ratio (8-12/core)**: Workers block on I/O (database queries, HTTP calls). While one worker waits, other workers can use the CPU. Higher worker counts maximize CPU utilization during I/O wait.
- **Mixed workloads**: Start at 5-8 per core. Profile to determine whether CPU or I/O wait dominates. Adjust based on actual utilization patterns.

## When To Use

- Initial capacity planning for new deployments
- Tuning existing deployments for optimal throughput
- When diagnosing performance issues related to worker count
- When workload profile changes (e.g., adding caching reduces I/O)

## When NOT To Use

- When RAM is the binding constraint (use P95 RSS calculation instead)
- For non-FPM runtimes (Octane, FrankenPHP have different concurrency models)
- As a substitute for load testing — ratios are starting points, not final answers

## Best Practices (WHY)

- **Classify your workload first**: Run a request profile. If CPU utilization is 20% during peak load, the workload is I/O-bound. If CPU utilization is 90%+, it's CPU-bound.
- **Start conservative, then tune**: Begin with the mixed ratio (5-8/core). Measure throughput and latency. Increase or decrease based on CPU utilization.
- **Consider separate pools for different workloads**: If your application has both CPU-heavy (report generation) and I/O-heavy (API) endpoints, create separate pools with different ratios.
- **Don't exceed RAM budget**: The per-core ratio is a CPU consideration, but RAM is typically the binding constraint. The ratio must fit within the RAM budget.

## Architecture Guidelines

- **Workload classification**: Measure CPU utilization during peak load. <50% = I/O-bound, >70% = CPU-bound, 50-70% = mixed.
- **More workers for I/O-bound**: When workers block on I/O, additional workers can use the CPU during wait time. The optimal ratio is bounded by RAM.
- **Fewer workers for CPU-bound**: Beyond core count, additional workers add context switching overhead without throughput gain.

## Performance

- CPU-bound: 2-4 workers/core. More workers = context switching overhead.
- I/O-bound: 8-12 workers/core. More workers = better CPU utilization during I/O wait.
- Mixed: 5-8 workers/core. Adjust based on measured CPU utilization.
- The optimal ratio is RAM-constrained in practice — the P95 RSS calculation often gives a lower value.

## Security

- Over-provisioning workers (too many) caused OOM kills from memory exhaustion
- Under-provisioning workers (too few) causes request queuing and timeouts
- Workload classification helps prevent both scenarios
- CPU-bound workloads with too many workers may experience degraded performance but not security failures

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Assuming "more workers = more throughput" | Intuitive but wrong for CPU-bound | Context switching overhead degrades performance | Profile CPU utilization; right-size by ratio |
| Using CPU ratios without RAM check | Ignoring memory constraint | OOM from exceeding RAM budget | Calculate P95 RSS first; apply ratio within RAM limit |
| One ratio for all workloads | Simplicity | Suboptimal for mixed workloads | Consider separate pools for different endpoint types |
| Setting ratio once, never updating | Assuming workload is static | Workload changes over time; optimal ratio changes | Re-classify workload quarterly |

## Anti-Patterns

- **Using CPU-core-based max_children without RAM check**: RAM is typically the binding constraint. Always calculate the RAM ceiling first, then apply the ratio within that ceiling.
- **Assuming static workload**: Adding caching, upgrading database, or changing API patterns changes the I/O profile. Re-classify after significant changes.
- **Same ratio for all pools**: Different applications have different workload profiles. Size per-pool independently.

## Examples

```ini
; php-fpm pool configuration
; Server: 8 cores, 16GB RAM

; CPU-bound workload (2-4/core = 16-32 workers)
pm.max_children = 24

; I/O-bound workload (8-12/core = 64-96 workers)
pm.max_children = 80

; Mixed workload (5-8/core = 40-64 workers)
pm.max_children = 50
```

## Related Topics

- Pool Sizing Formula
- Worker RSS Capacity Ceiling
- Capacity Planning Safety Margins
- Bottleneck Optimization Strategy
- FPM Status Page Monitoring

## AI Agent Notes

- CPU-bound: 2-4 workers/core. I/O-bound: 8-12 workers/core. Mixed: 5-8 workers/core.
- Classify workload by measuring CPU utilization during peak load.
- RAM is typically the binding constraint — calculate P95 RSS first.
- Consider separate pools for different workload types.
- Re-classify workload after significant changes.

## Verification

- [ ] Workload classified (CPU-bound, I/O-bound, or mixed)
- [ ] CPU utilization measured during peak load for classification
- [ ] Worker ratio selected based on classification (2-4, 5-8, or 8-12 per core)
- [ ] Ratio validated against RAM budget (P95 RSS calculation)
- [ ] Throughput measured at different worker counts to find optimal
- [ ] Re-classification scheduled quarterly
