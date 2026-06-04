# Standardized Knowledge: Benchmarking vs Load Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Benchmarking vs Load Testing |
| Difficulty | Foundation |
| Lifecycle | Evaluate, Measure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

**Benchmarking** measures maximum throughput capacity under idealized conditions (synthetic load, fixed endpoint). **Load testing** simulates realistic user journeys with think times, variable concurrency, and multiple endpoints. Benchmarking tells you the ceiling; load testing tells you how your system behaves under that ceiling.

## Core Concepts

- **Benchmarking tools**: wrk/wrk2, Apache Bench, Vegeta. Single endpoint. Fixed concurrency. Measures RPS and latency distributions.
- **Load testing tools**: k6, JMeter, Gatling, Locust. Multi-step user journeys. Variable ramp-up. Measures throughput, error rate, response times under realistic conditions.
- **Key metrics**: RPS (requests per second), p50/p95/p99 latency, error rate, memory footprint, CPU utilization.
- **Coordinated omission**: Closed-loop benchmarks (wrk) underestimate tail latency during saturation. Open-loop models (wrk2, constant-rate) avoid this bias.

## When To Use

- Benchmarking: A/B comparisons (PHP version, framework config, hardware), capacity planning ceiling estimation, CI performance regression detection.
- Load testing: Pre-release validation, SLA verification, scale testing, identifying breaking points.

## When NOT To Use

- Do not use benchmarking alone for capacity planning — it overestimates capacity by ignoring realistic conditions.
- Do not use load testing for quick A/B comparisons — it requires more setup and longer run times.
- Avoid benchmarking with Hello World endpoints — results do not reflect production behavior.

## Best Practices (WHY)

- **Always benchmark with realistic workloads**: Production applications with database queries, template rendering, and caching layers behave completely differently from synthetic endpoints.
- **Use open-loop models for tail latency**: wrk2 (constant-rate) avoids coordinated omission bias that wrk introduces under saturation.
- **Warm up before measuring**: Run 30+ seconds of warm-up traffic before recording results to let OpCache and JIT stabilize.
- **Measure both p50 and p95/p99**: Average latency hides tail performance. The p95-p50 gap reveals I/O variability and saturation effects.

## Architecture Guidelines

- **Closed-loop (wrk)**: Next request issued after previous completes. Models request-response perfectly but underestimates tail latency.
- **Open-loop (wrk2)**: Requests issued at constant rate regardless of completion. Realistic for modeling user arrival patterns.
- **Multi-stage load tests (k6)**: Ramp-up -> steady -> spike -> ramp-down. Reveals scaling behavior, recovery, and breaking points.

## Performance

- PHP 8.4 computed goto dispatch: ~5-8% synthetic benchmark improvement, ~2-4% real-world
- Typed properties reduce opcode count — benchmark differences show 5-15% for property-heavy code
- Function calls require stack frame setup; JIT inlining eliminates this for hot paths
- Per-request heap allocation is fast (~0.1us per allocation) due to slab allocator
- PHP's synchronous I/O blocks entire process; Octane/Swoole use process/coroutine parallelism

## Security

- Load testing can trigger rate limiting and DDoS protections — coordinate with operations team
- Never benchmark production databases with write-heavy workloads
- Isolate benchmark environments from production to avoid performance interference
- Benchmark authentication/authorization endpoints with realistic session states

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Benchmarking with Hello World | Convenience, lack of realistic test data | Results 10-100x better than production | Use production-like request profiles |
| Using only average latency | Simplicity | Misses tail latency issues from saturation | Always report p50, p95, p99, and max |
| No warm-up period | Impatience, unawareness | Cold cache results are not reproducible | Run 30s+ warm-up before measurement |
| Closed-loop under saturation | Default tool behavior | Tail latency underestimated by 2-5x | Use open-loop (wrk2, constant-rate) for tail analysis |

## Anti-Patterns

- **Benchmarking without a baseline**: A single benchmark run is meaningless. Always compare against a known baseline with identical conditions.
- **Over-relying on a single tool**: Each tool has biases. Cross-validate findings with multiple tools (wrk + k6 + ab).
- **Testing only the happy path**: Error handling, queue buildup, and degradation under load reveal the true system behavior.
- **Ignoring resource metrics during benchmarks**: CPU, memory, and I/O metrics during the run explain why performance changes occur.

## Examples

```bash
# Benchmark with Apache Bench
ab -n 10000 -c 50 http://localhost:8080/api/health

# Benchmark with wrk2 (open-loop, constant rate)
wrk2 -t 4 -c 100 -d 30s -R 1000 http://localhost:8080/api/health

# Load test with k6 (multi-stage)
k6 run --vus 10 --duration 5m test-script.js
```

## Related Topics

- Coordinated Omission
- HDR Histogram Analysis
- Statistical Significance in Benchmarking
- CI Performance Regression Detection
- Metrics Definition and Interpretation

## AI Agent Notes

- Benchmarking measures the ceiling; load testing measures behavior under that ceiling.
- Coordinated omission is the most common benchmarking methodology error.
- Always warm up for 30s+ before recording results.
- Use P95 latency, not average, as the primary comparison metric.
- Realistic workloads require database queries, template rendering, and framework bootstrap.

## Verification

- [ ] Benchmark methodology includes warm-up period (30s+)
- [ ] Both p50 and p95/p99 latency reported for all benchmarks
- [ ] Workload reflects production request patterns (not Hello World)
- [ ] Open-loop model used for tail latency measurement
- [ ] Resource metrics (CPU, RAM, I/O) captured during benchmark runs
- [ ] Baseline established before making changes
- [ ] Multiple tools used for cross-validation
