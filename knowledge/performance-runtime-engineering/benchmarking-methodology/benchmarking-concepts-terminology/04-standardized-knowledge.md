# Standardized Knowledge: Benchmarking Concepts and Terminology

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | Benchmarking Concepts and Terminology |
| Difficulty | Foundation |
| Lifecycle | Evaluate, Measure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Performance benchmarking measures four core metrics: throughput (requests per second — capacity), latency (response time — speed, reported as percentiles p50/p95/p99), error rate (percentage of failed requests — reliability), and resource utilization (CPU/memory — efficiency). Understanding these metrics and their statistical properties is essential before running any benchmark.

## Core Concepts

- **Throughput (RPS)**: Number of requests completed per second. Higher is better. Constrained by the slowest component in the request path.
- **Latency Percentiles**: p50 (median — typical experience), p95 (slow but not unusual — 1 in 20), p99 (worst-case regular — 1 in 100), max (outlier — 1 in N). Always report multiple percentiles.
- **Error Rate**: Percentage of non-2xx/3xx responses. Should be 0% under normal load. Elevated error rate indicates capacity saturation.
- **Tail Latency**: p95, p99, and max latency. More important than p50 for user experience — slow requests frustrate users disproportionately.
- **Coordinated Omission**: Bias where closed-loop benchmarks stop measuring when the system is overloaded, underestimating tail latency by 30-60%.

## When To Use

- Establishing baseline performance metrics for a system
- Comparing performance across different configurations, versions, or architectures
- Setting SLO targets based on measured capability
- Validating that performance requirements are met before production deployment

## When NOT To Use

- When the measurement overhead distorts the system's behavior (use sampling instead)
- For debugging specific performance issues — use profiling tools instead of load testing
- When the environment is not representative of production (results won't translate)

## Best Practices

- **Always report multiple percentiles**: p50, p95, and p99 together tell the full latency story. p50 alone hides tail latency problems.
- **Include error rate in every benchmark**: High throughput with high errors is worse than low throughput. Track error rate as a primary metric.
- **Measure resource utilization per request**: A 20% throughput gain at 40% more memory may not be worth it. Report resource-per-request.
- **Account for coordinated omission**: Use open-loop tools (wrk2, k6) for accurate latency measurements. Closed-loop tools systematically underestimate tail latency.
- **Warm up before measuring**: Run 30-60s of traffic before recording data. Cold OpCache/JIT inflates latency measurements by 20-50%.

## Architecture Guidelines

- **Benchmarking as a discipline**: Separate from profiling and monitoring. Benchmarking tests capacity under controlled load, profiling identifies specific bottlenecks, monitoring tracks ongoing health.
- **Statistical Foundation**: Minimum 1000 samples for p95, 10,000 for p99, 100,000 for p99.9. Fewer samples produce unreliable percentile estimates.
- **Environment Control**: Dedicated hardware, consistent dataset, network isolation, no competing workloads. Benchmark results are only valid for the environment they were measured in.

## Performance Considerations

- Coordinated omission is the most common benchmarking error — include queuing time in latency measurements
- Warm-up requires 1000-5000 requests for JIT/OpCache stabilization before recording
- Minimum 1000 samples per scenario for statistical significance
- Profiling tools add 10-200% overhead — use sampling profilers for production

## Security Considerations

- Load testing tools can trigger DDoS protection, WAF rules, and rate limiting. Coordinate with security teams before benchmarks.
- Published benchmark metrics may reveal capacity information. Treat as sensitive business data.
- Benchmark data should be anonymized if it contains user-identifiable request patterns.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Reporting only average latency | Convenience, lack of percentile awareness | Outliers hidden, misleading performance picture | Always report p50, p95, p99 latency distribution |
| No warm-up phase | Impatience or ignorance of cold-state behavior | 20-50% inflated latency numbers | Run 30-60s warm-up traffic before recording |
| Ignoring memory metrics | Focusing only on speed | Capacity planning errors, OOM risks | Report RSS, OpCache usage, GC activity alongside throughput |
| Using wrong tool for the layer | Tool familiarity over suitability | Wrong conclusions (e.g., using ab for user journey testing) | Match tool to layer: k6 for journeys, wrk2 for throughput |

## Anti-Patterns

- **Benchmarking without a hypothesis**: Know what you're testing and why. Random benchmarking wastes time and produces unactionable data.
- **Cherry-picking metrics that support a narrative**: Report all metrics, even unfavorable ones. Selective reporting undermines trust.
- **Comparing benchmarks across different environments**: Different hardware, datasets, and network configurations invalidate comparisons.
- **Automating benchmarks without validation**: CI benchmarks need regular manual review to ensure they're still measuring what you think they measure.

## Examples

```bash
# Comprehensive benchmark command
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api/endpoint
# Reports: throughput, p50/p75/p90/p99/p99.9/max latency, error count
```

## Related Topics

- Metrics Definition and Interpretation
- Tool Selection by Layer
- Coordinated Omission
- Methodology Warmup Sample Size

## AI Agent Notes

- The four core metrics (throughput, latency, error rate, resource utilization) must always be reported together. Any one metric in isolation is misleading.
- Coordinated omission is the single most common and impactful benchmarking error. Default to open-loop tools.
- Tail latency (p95/p99) is more important than median for user-facing applications.
- Resource utilization metrics (CPU, memory per request) are essential for capacity planning.

## Verification

- [ ] Four core metrics defined (throughput, latency percentiles, error rate, resource utilization)
- [ ] Warm-up phase included in benchmark methodology
- [ ] Open-loop or constant-RPS mode used for latency measurement
- [ ] Sample size meets statistical requirements (1000+ per percentile)
- [ ] Multiple latency percentiles reported (p50, p95, p99)
- [ ] Error rate tracked alongside throughput
- [ ] Environment variables controlled and documented
