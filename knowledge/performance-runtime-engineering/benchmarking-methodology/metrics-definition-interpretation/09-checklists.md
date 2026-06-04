# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Metrics Definition and Interpretation â€” Throughput, Latency Distribution, Memory, CPU
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Report throughput and latency together**: High throughput with high latency is not a win. Always present both metrics side by side.
- [ ] **Track the p50-to-p99 gap**: A small gap (p99 = 2x p50) indicates consistent performance. A large gap (p99 = 10x p50) indicates high latency variability from queuing or GC.
- [ ] **Include resource-per-request**: A 20% throughput gain at 40% more memory reduces overall capacity. Calculate RPS per GB of RAM for efficiency comparisons.
- [ ] **Monitor error rate as a primary metric**: Error rate > 0% under load indicates saturation. Throughput gains that increase error rate are counterproductive.
- [ ] **Correlate metrics**: When throughput plateaus but p50 latency is low, the bottleneck is elsewhere (network, database). When p99 diverges from p50, tail latency is driven by queuing or GC.
- [ ] All four metric categories reported (throughput, latency, error rate, resources)
- [ ] Multiple latency percentiles reported (p50, p95, p99 minimum)
- [ ] Sample size documented with each percentile
- [ ] Error rate reported alongside throughput
- [ ] Memory and CPU metrics included
- [ ] All four core metrics collected and reported for every benchmark
- [ ] Metrics interpreted together as a unified system
- [ ] p50/p95/p99 reported â€” never average latency
- [ ] Error rate validated and <2%
- [ ] Reports include loop type, tool version, and environment documentation
- [ ] All four metrics collected: throughput, latency (p50/p95/p99), error rate, resources
- [ ] Latency reported as percentiles, not average
- [ ] Error rate included and validated (<2%)
- [ ] Resource utilization collected during benchmark window
- [ ] Metrics interpreted as a system, not in isolation

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **Metric Hierarchy**: Throughput is the top-line capacity indicator. Latency measures user experience. Error rate measures reliability. Resource metrics measure efficiency. All are needed for a complete picture.
- [ ] **Reporting Standard**: Always report: throughput (RPS), p50/p95/p99 latency (ms), error rate (%), worker RSS (MB), CPU utilization (%). Include sample size and confidence intervals.
- [ ] **Metric Correlation Patterns**: CPU-bound bottleneck â†’ high CPU, low iowait, throughput plateau. I/O-bound bottleneck â†’ low CPU, high iowait, throughput plateau. Memory-bound â†’ high swap activity, OOM risk.
- [ ] Document and follow through on architectural decision: Metrics selection for benchmarks
- [ ] Document and follow through on architectural decision: Interpreting benchmark results
- [ ] Ensure architecture aligns with core concept: **Throughput (RPS)**: Peak sustainable requests per second. Measured at plateau, not instantaneous. Diminishing returns as concurrency increases beyond the optimal point.
- [ ] Ensure architecture aligns with core concept: **Latency Percentiles**: p50 = median (half of users experience this or better). p95 = 95th percentile (1 in 20 users). p99 = 99th (1 in 100). Gap between p50 and p99 indicates latency variability.
- [ ] Ensure architecture aligns with core concept: **Memory Metrics**: Worker RSS (resident set size â€” physical memory per process), total PHP memory, OpCache usage, GC buffer size. Used for capacity planning and scaling cost calculations.
- [ ] Ensure architecture aligns with core concept: **CPU Utilization**: User + system + iowait. Under 70% user is healthy. Over 90% user indicates CPU-bound bottleneck. High iowait indicates I/O bottleneck from storage or network.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Report throughput and latency together**: High throughput with high latency is not a win. Always present both metrics side by side.
- [ ] **Track the p50-to-p99 gap**: A small gap (p99 = 2x p50) indicates consistent performance. A large gap (p99 = 10x p50) indicates high latency variability from queuing or GC.
- [ ] **Include resource-per-request**: A 20% throughput gain at 40% more memory reduces overall capacity. Calculate RPS per GB of RAM for efficiency comparisons.
- [ ] **Monitor error rate as a primary metric**: Error rate > 0% under load indicates saturation. Throughput gains that increase error rate are counterproductive.
- [ ] **Correlate metrics**: When throughput plateaus but p50 latency is low, the bottleneck is elsewhere (network, database). When p99 diverges from p50, tail latency is driven by queuing or GC.

# Performance Checklist (from 04/06)
- [ ] p50-to-p99 gap indicates queuing or GC pauses. A gap > 5x warrants investigation.
- [ ] Worker RSS grows over time due to memory fragmentation â€” measure at steady state after 30+ minutes.
- [ ] CPU iowait > 10% indicates storage or network I/O bottleneck.
- [ ] Throughput plateau with low latency means bottleneck is elsewhere in the call chain.
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Published benchmark metrics can reveal infrastructure capacity to competitors. Treat as sensitive data.
- [ ] Memory metrics can help attackers estimate server capacity for DoS planning. Keep internal.
- [ ] Error rate monitoring is also a security signal â€” sudden increases may indicate attack.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] All four metric categories reported (throughput, latency, error rate, resources)
- [ ] Multiple latency percentiles reported (p50, p95, p99 minimum)
- [ ] Sample size documented with each percentile
- [ ] Error rate reported alongside throughput
- [ ] Memory and CPU metrics included
- [ ] Metrics correlated to identify bottleneck type
- [ ] Reporting template standardized across benchmarks
- [ ] All four core metrics collected and reported for every benchmark
- [ ] Metrics interpreted together as a unified system
- [ ] p50/p95/p99 reported â€” never average latency
- [ ] Error rate validated and <2%
- [ ] Reports include loop type, tool version, and environment documentation
- [ ] All four metrics collected: throughput, latency (p50/p95/p99), error rate, resources
- [ ] Latency reported as percentiles, not average
- [ ] Error rate included and validated (<2%)
- [ ] Resource utilization collected during benchmark window
- [ ] Metrics interpreted as a system, not in isolation
- [ ] Standard report produced with methodology documentation

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Report throughput and latency together**: High throughput with high latency is not a win. Always present both metrics side by side.
- [ ] **Track the p50-to-p99 gap**: A small gap (p99 = 2x p50) indicates consistent performance. A large gap (p99 = 10x p50) indicates high latency variability from queuing or GC.
- [ ] **Include resource-per-request**: A 20% throughput gain at 40% more memory reduces overall capacity. Calculate RPS per GB of RAM for efficiency comparisons.
- [ ] **Monitor error rate as a primary metric**: Error rate > 0% under load indicates saturation. Throughput gains that increase error rate are counterproductive.
- [ ] **Correlate metrics**: When throughput plateaus but p50 latency is low, the bottleneck is elsewhere (network, database). When p99 diverges from p50, tail latency is driven by queuing or GC.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Reporting only average latency
- [ ] Avoid: Ignoring memory metrics
- [ ] Avoid: Not correlating metrics
- [ ] Avoid: Trusting single-thread benchmarks for multi-threaded systems
- [ ] Avoid anti-pattern: **Cherry-picking favorable metrics**: Reporting only throughput when latency regressed is misleading. Report all primary metrics.
- [ ] Avoid anti-pattern: **Comparing percentiles without sample size context**: p99 from 100 samples is unreliable. p99 from 10,000 samples is meaningful. Always report sample count.
- [ ] Avoid anti-pattern: **Ignoring resource efficiency**: Higher throughput at disproportionate resource cost reduces overall system capacity. Calculate efficiency ratios.
- [ ] Avoid anti-pattern: **Setting targets based on a single metric**: Balanced SLOs require multiple metrics (latency + error rate + throughput).
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
**Core Concepts:** **Throughput (RPS)**: Peak sustainable requests per second. Measured at plateau, not instantaneous. Diminishing returns as concurrency increases beyond the optimal point., **Latency Percentiles**: p50 = median (half of users experience this or better). p95 = 95th percentile (1 in 20 users). p99 = 99th (1 in 100). Gap between p50 and p99 indicates latency variability., **Memory Metrics**: Worker RSS (resident set size â€” physical memory per process), total PHP memory, OpCache usage, GC buffer size. Used for capacity planning and scaling cost calculations., **CPU Utilization**: User + system + iowait. Under 70% user is healthy. Over 90% user indicates CPU-bound bottleneck. High iowait indicates I/O bottleneck from storage or network.
**Skills:** Benchmarking Concepts, Methodology Warmup Sample Size, SLO Definition and Error Budgets, Performance Regression Detection
**Decision Trees:** Metrics selection for benchmarks, Interpreting benchmark results
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** Benchmarking Concepts, HDR Histogram Analysis, SLO Definition and Error Budgets, Capacity Planning

