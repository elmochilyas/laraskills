# Standardized Knowledge: Metrics Definition and Interpretation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | Metrics Definition and Interpretation |
| Difficulty | Foundation |
| Lifecycle | Measure, Evaluate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

A complete performance benchmark reports: throughput (RPS), latency percentiles (p50/p95/p99/p99.9), error rate (%), memory footprint (RSS per worker), and CPU utilization (%). Each metric tells a different story: throughput = capacity, p50 = typical user experience, p95 = worst-case regular, error rate = saturation point, memory = scaling cost, CPU = headroom.

## Core Concepts

- **Throughput (RPS)**: Peak sustainable requests per second. Measured at plateau, not instantaneous. Diminishing returns as concurrency increases beyond the optimal point.
- **Latency Percentiles**: p50 = median (half of users experience this or better). p95 = 95th percentile (1 in 20 users). p99 = 99th (1 in 100). Gap between p50 and p99 indicates latency variability.
- **Memory Metrics**: Worker RSS (resident set size — physical memory per process), total PHP memory, OpCache usage, GC buffer size. Used for capacity planning and scaling cost calculations.
- **CPU Utilization**: User + system + iowait. Under 70% user is healthy. Over 90% user indicates CPU-bound bottleneck. High iowait indicates I/O bottleneck from storage or network.

## When To Use

- Establishing a complete performance picture for a system
- Comparing throughput and latency across different configurations
- Capacity planning — determining when and how much to scale
- Identifying bottleneck type (CPU-bound, I/O-bound, memory-bound)

## When NOT To Use

- When only a single dimension matters (e.g., peak throughput for capacity planning)
- For quick smoke tests where only error rate matters
- When the metrics overhead distorts the measurement

## Best Practices

- **Report throughput and latency together**: High throughput with high latency is not a win. Always present both metrics side by side.
- **Track the p50-to-p99 gap**: A small gap (p99 = 2x p50) indicates consistent performance. A large gap (p99 = 10x p50) indicates high latency variability from queuing or GC.
- **Include resource-per-request**: A 20% throughput gain at 40% more memory reduces overall capacity. Calculate RPS per GB of RAM for efficiency comparisons.
- **Monitor error rate as a primary metric**: Error rate > 0% under load indicates saturation. Throughput gains that increase error rate are counterproductive.
- **Correlate metrics**: When throughput plateaus but p50 latency is low, the bottleneck is elsewhere (network, database). When p99 diverges from p50, tail latency is driven by queuing or GC.

## Architecture Guidelines

- **Metric Hierarchy**: Throughput is the top-line capacity indicator. Latency measures user experience. Error rate measures reliability. Resource metrics measure efficiency. All are needed for a complete picture.
- **Reporting Standard**: Always report: throughput (RPS), p50/p95/p99 latency (ms), error rate (%), worker RSS (MB), CPU utilization (%). Include sample size and confidence intervals.
- **Metric Correlation Patterns**: CPU-bound bottleneck → high CPU, low iowait, throughput plateau. I/O-bound bottleneck → low CPU, high iowait, throughput plateau. Memory-bound → high swap activity, OOM risk.

## Performance Considerations

- p50-to-p99 gap indicates queuing or GC pauses. A gap > 5x warrants investigation.
- Worker RSS grows over time due to memory fragmentation — measure at steady state after 30+ minutes.
- CPU iowait > 10% indicates storage or network I/O bottleneck.
- Throughput plateau with low latency means bottleneck is elsewhere in the call chain.

## Security Considerations

- Published benchmark metrics can reveal infrastructure capacity to competitors. Treat as sensitive data.
- Memory metrics can help attackers estimate server capacity for DoS planning. Keep internal.
- Error rate monitoring is also a security signal — sudden increases may indicate attack.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Reporting only average latency | Convenience | Hides outliers, misleading performance picture | Report p50, p95, p99 latency distribution |
| Ignoring memory metrics | Focusing only on speed | Capacity planning errors, OOM risks | Report RSS, OpCache usage alongside throughput |
| Not correlating metrics | Siloed analysis | Wrong conclusions (e.g., optimizing throughput when bottleneck is memory) | Analyze throughput, latency, memory, and CPU together |
| Trusting single-thread benchmarks for multi-threaded systems | Convenience | Underestimates real-world capacity | Match load generator concurrency to production |

## Anti-Patterns

- **Cherry-picking favorable metrics**: Reporting only throughput when latency regressed is misleading. Report all primary metrics.
- **Comparing percentiles without sample size context**: p99 from 100 samples is unreliable. p99 from 10,000 samples is meaningful. Always report sample count.
- **Ignoring resource efficiency**: Higher throughput at disproportionate resource cost reduces overall system capacity. Calculate efficiency ratios.
- **Setting targets based on a single metric**: Balanced SLOs require multiple metrics (latency + error rate + throughput).

## Examples

```
Benchmark Results:
Throughput: 2,200 RPS (+69% vs FPM baseline)
Latency: p50=15ms, p95=45ms, p99=120ms (gap: 8x — investigate queuing)
Error Rate: 0.02%
Worker RSS: 68MB average, 82MB P95
CPU: User=65%, Sys=12%, Iowait=3%
Memory per RPS: 36KB (2,200 RPS ÷ 80MB average RSS)
```

## Related Topics

- Benchmarking Concepts
- HDR Histogram Analysis
- SLO Definition and Error Budgets
- Capacity Planning

## AI Agent Notes

- Always report throughput AND latency together. Throughput without latency context is meaningless for user experience.
- P50-to-p99 gap is one of the most telling indicators of system health. A gap > 5x suggests queuing problems.
- Metrics without resource context are incomplete. Always include memory and CPU with throughput and latency.
- Error rate is as important as latency — high throughput with errors is worse than lower throughput with no errors.

## Verification

- [ ] All four metric categories reported (throughput, latency, error rate, resources)
- [ ] Multiple latency percentiles reported (p50, p95, p99 minimum)
- [ ] Sample size documented with each percentile
- [ ] Error rate reported alongside throughput
- [ ] Memory and CPU metrics included
- [ ] Metrics correlated to identify bottleneck type
- [ ] Reporting template standardized across benchmarks
