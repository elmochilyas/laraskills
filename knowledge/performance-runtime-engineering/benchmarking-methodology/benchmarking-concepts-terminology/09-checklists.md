# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Benchmarking Concepts and Terminology â€” Throughput, Latency, Percentiles, Error Rate
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always report multiple percentiles**: p50, p95, and p99 together tell the full latency story. p50 alone hides tail latency problems.
- [ ] **Include error rate in every benchmark**: High throughput with high errors is worse than low throughput. Track error rate as a primary metric.
- [ ] **Measure resource utilization per request**: A 20% throughput gain at 40% more memory may not be worth it. Report resource-per-request.
- [ ] **Account for coordinated omission**: Use open-loop tools (wrk2, k6) for accurate latency measurements. Closed-loop tools systematically underestimate tail latency.
- [ ] **Warm up before measuring**: Run 30-60s of traffic before recording data. Cold OpCache/JIT inflates latency measurements by 20-50%.
- [ ] Four core metrics defined (throughput, latency percentiles, error rate, resource utilization)
- [ ] Warm-up phase included in benchmark methodology
- [ ] Open-loop or constant-RPS mode used for latency measurement
- [ ] Sample size meets statistical requirements (1000+ per percentile)
- [ ] Multiple latency percentiles reported (p50, p95, p99)
- [ ] Benchmark methodology documented with warm-up, tool, loop type, and environment
- [ ] All four core metrics reported for every benchmark run
- [ ] At least 3 iterations per configuration with median reported
- [ ] Sample size meets statistical requirements for target percentile
- [ ] Results are reproducible in the same environment
- [ ] Four core metrics reported (throughput, latency, error rate, resources)
- [ ] Warm-up phase included (30-60s, data discarded)
- [ ] Open-loop tool used for latency measurement
- [ ] Minimum 3 iterations per configuration
- [ ] Sample size requirements met (1000+ for p95, 10000+ for p99)

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **Benchmarking as a discipline**: Separate from profiling and monitoring. Benchmarking tests capacity under controlled load, profiling identifies specific bottlenecks, monitoring tracks ongoing health.
- [ ] **Statistical Foundation**: Minimum 1000 samples for p95, 10,000 for p99, 100,000 for p99.9. Fewer samples produce unreliable percentile estimates.
- [ ] **Environment Control**: Dedicated hardware, consistent dataset, network isolation, no competing workloads. Benchmark results are only valid for the environment they were measured in.
- [ ] Document and follow through on architectural decision: Benchmarking methodology selection
- [ ] Ensure architecture aligns with core concept: **Throughput (RPS)**: Number of requests completed per second. Higher is better. Constrained by the slowest component in the request path.
- [ ] Ensure architecture aligns with core concept: **Latency Percentiles**: p50 (median â€” typical experience), p95 (slow but not unusual â€” 1 in 20), p99 (worst-case regular â€” 1 in 100), max (outlier â€” 1 in N). Always report multiple percentiles.
- [ ] Ensure architecture aligns with core concept: **Error Rate**: Percentage of non-2xx/3xx responses. Should be 0% under normal load. Elevated error rate indicates capacity saturation.
- [ ] Ensure architecture aligns with core concept: **Tail Latency**: p95, p99, and max latency. More important than p50 for user experience â€” slow requests frustrate users disproportionately.
- [ ] Ensure architecture aligns with core concept: **Coordinated Omission**: Bias where closed-loop benchmarks stop measuring when the system is overloaded, underestimating tail latency by 30-60%.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always report multiple percentiles**: p50, p95, and p99 together tell the full latency story. p50 alone hides tail latency problems.
- [ ] **Include error rate in every benchmark**: High throughput with high errors is worse than low throughput. Track error rate as a primary metric.
- [ ] **Measure resource utilization per request**: A 20% throughput gain at 40% more memory may not be worth it. Report resource-per-request.
- [ ] **Account for coordinated omission**: Use open-loop tools (wrk2, k6) for accurate latency measurements. Closed-loop tools systematically underestimate tail latency.
- [ ] **Warm up before measuring**: Run 30-60s of traffic before recording data. Cold OpCache/JIT inflates latency measurements by 20-50%.

# Performance Checklist (from 04/06)
- [ ] Coordinated omission is the most common benchmarking error â€” include queuing time in latency measurements
- [ ] Warm-up requires 1000-5000 requests for JIT/OpCache stabilization before recording
- [ ] Minimum 1000 samples per scenario for statistical significance
- [ ] Profiling tools add 10-200% overhead â€” use sampling profilers for production
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Load testing tools can trigger DDoS protection, WAF rules, and rate limiting. Coordinate with security teams before benchmarks.
- [ ] Published benchmark metrics may reveal capacity information. Treat as sensitive business data.
- [ ] Benchmark data should be anonymized if it contains user-identifiable request patterns.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] Four core metrics defined (throughput, latency percentiles, error rate, resource utilization)
- [ ] Warm-up phase included in benchmark methodology
- [ ] Open-loop or constant-RPS mode used for latency measurement
- [ ] Sample size meets statistical requirements (1000+ per percentile)
- [ ] Multiple latency percentiles reported (p50, p95, p99)
- [ ] Error rate tracked alongside throughput
- [ ] Environment variables controlled and documented
- [ ] Benchmark methodology documented with warm-up, tool, loop type, and environment
- [ ] All four core metrics reported for every benchmark run
- [ ] At least 3 iterations per configuration with median reported
- [ ] Sample size meets statistical requirements for target percentile
- [ ] Results are reproducible in the same environment
- [ ] Four core metrics reported (throughput, latency, error rate, resources)
- [ ] Warm-up phase included (30-60s, data discarded)
- [ ] Open-loop tool used for latency measurement
- [ ] Minimum 3 iterations per configuration
- [ ] Sample size requirements met (1000+ for p95, 10000+ for p99)
- [ ] Environment controlled (dedicated hardware, fixed dataset)
- [ ] Loop type documented in report

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always report multiple percentiles**: p50, p95, and p99 together tell the full latency story. p50 alone hides tail latency problems.
- [ ] **Include error rate in every benchmark**: High throughput with high errors is worse than low throughput. Track error rate as a primary metric.
- [ ] **Measure resource utilization per request**: A 20% throughput gain at 40% more memory may not be worth it. Report resource-per-request.
- [ ] **Account for coordinated omission**: Use open-loop tools (wrk2, k6) for accurate latency measurements. Closed-loop tools systematically underestimate tail latency.
- [ ] **Warm up before measuring**: Run 30-60s of traffic before recording data. Cold OpCache/JIT inflates latency measurements by 20-50%.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Reporting only average latency
- [ ] Avoid: No warm-up phase
- [ ] Avoid: Ignoring memory metrics
- [ ] Avoid: Using wrong tool for the layer
- [ ] Avoid anti-pattern: **Benchmarking without a hypothesis**: Know what you're testing and why. Random benchmarking wastes time and produces unactionable data.
- [ ] Avoid anti-pattern: **Cherry-picking metrics that support a narrative**: Report all metrics, even unfavorable ones. Selective reporting undermines trust.
- [ ] Avoid anti-pattern: **Comparing benchmarks across different environments**: Different hardware, datasets, and network configurations invalidate comparisons.
- [ ] Avoid anti-pattern: **Automating benchmarks without validation**: CI benchmarks need regular manual review to ensure they're still measuring what you think they measure.
- [ ] Guard against anti-pattern: Benchmarking Without Warm-Up Rounds
- [ ] Guard against anti-pattern: Reporting Mean Without Percentiles
- [ ] Guard against anti-pattern: Benchmarking on Development Hardware
- [ ] Guard against anti-pattern: Single-Request Benchmarks (wrk -c1)
- [ ] Guard against anti-pattern: P-Hacking Benchmark Results
- [ ] Warm-up rounds conducted

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Throughput (RPS)**: Number of requests completed per second. Higher is better. Constrained by the slowest component in the request path., **Latency Percentiles**: p50 (median â€” typical experience), p95 (slow but not unusual â€” 1 in 20), p99 (worst-case regular â€” 1 in 100), max (outlier â€” 1 in N). Always report multiple percentiles., **Error Rate**: Percentage of non-2xx/3xx responses. Should be 0% under normal load. Elevated error rate indicates capacity saturation., **Tail Latency**: p95, p99, and max latency. More important than p50 for user experience â€” slow requests frustrate users disproportionately., **Coordinated Omission**: Bias where closed-loop benchmarks stop measuring when the system is overloaded, underestimating tail latency by 30-60%.
**Skills:** Metrics Definition and Interpretation, Coordinated Omission, Methodology Warmup Sample Size, Tool Selection by Layer
**Decision Trees:** Benchmarking methodology selection
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** Metrics Definition and Interpretation, Tool Selection by Layer, Coordinated Omission, Methodology Warmup Sample Size

