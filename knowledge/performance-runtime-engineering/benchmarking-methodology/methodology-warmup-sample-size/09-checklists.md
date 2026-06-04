# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Methodology â€” Warm-up Phases, Sample Size Requirements, Environment Control
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always warm up**: Run 30-60s (1000-5000 requests) of traffic before recording benchmark data. Cold-state data is 20-50% slower and not representative of steady-state production behavior.
- [ ] **Calculate required sample size**: For p95: 1000 samples minimum. For p99: 10,000 minimum. For CI benchmark gates, use 10,000+ samples for reliable pass/fail decisions.
- [ ] **Control the environment**: Dedicated hardware, pinned CPU frequency, fixed dataset size, isolated network. Document all environment variables.
- [ ] **Run A/B comparisons back-to-back**: Same time window, same environment, same dataset. Any variable besides the one being tested invalidates the comparison.
- [ ] **Run multiple iterations**: 3+ iterations per configuration. Report median or mean with standard deviation. A single run may have 3-8% random variance.
- [ ] Warm-up phase duration documented and sufficient (30s+)
- [ ] Sample size calculated for target percentile (1000+ for p95, 10,000+ for p99)
- [ ] Environment variables controlled: dedicated hardware, CPU frequency pinned, network isolated
- [ ] Dataset fixed and production-representative
- [ ] Minimum 3 iterations per configuration
- [ ] Warm-up phase included and data discarded in all benchmarks
- [ ] Sample size meets statistical requirements for target percentile
- [ ] Minimum 3 iterations per configuration, median reported
- [ ] System variability documented and within acceptable tolerance
- [ ] Benchmark methodology produces reproducible results
- [ ] Warm-up phase included (30-60s, data discarded)
- [ ] Sample size meets requirements: 1000+ for p95, 10000+ for p99
- [ ] GC/cache warm-up performed by layer
- [ ] System variability accounted for (same time, isolated environment)
- [ ] Error rate <2% in all iterations

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **Phased Benchmark Protocol**: 1) Warm-up phase (discard data), 2) Steady-state measurement (record data), 3) cool-down phase (let system idle). Publish methodology details.
- [ ] **Statistical Foundation**: Use percentiles not averages. Use median of multiple runs, not a single run. Apply Welch's t-test or Mann-Whitney U test for significance.
- [ ] **Dataset Consistency**: Use a fixed, production-representative dataset. Random data generation during benchmarks introduces uncontrolled variance. Pre-generate datasets.
- [ ] **Environment Isolation**: No cron jobs, monitoring runs, or other workloads during benchmarks. CPU frequency scaling disabled. Network latency to dependencies measured and documented.
- [ ] Document and follow through on architectural decision: Warmup duration and sample size
- [ ] Ensure architecture aligns with core concept: **Warm-up**: First N requests after server start are significantly slower (OpCache cold, JIT compiling, DB connections establishing). Run 30-60s of traffic before recording measurements. Discard warm-up data from analysis.
- [ ] Ensure architecture aligns with core concept: **Sample Size**: Statistical confidence depends on sample count. p95 needs 1000 samples for 95% CI Â±1-2%. p99 needs 10,000 samples. p99.9 needs 100,000+ samples.
- [ ] Ensure architecture aligns with core concept: **Environment Control**: Run on dedicated hardware. Pin CPU frequency to prevent turbo boost variance. Use fixed dataset. Isolate network from external interference. No competing workloads during benchmarking.
- [ ] Ensure architecture aligns with core concept: **Comparative Benchmarks**: A/B comparisons must control all variables except the one being tested. Same environment, same dataset, same time window.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always warm up**: Run 30-60s (1000-5000 requests) of traffic before recording benchmark data. Cold-state data is 20-50% slower and not representative of steady-state production behavior.
- [ ] **Calculate required sample size**: For p95: 1000 samples minimum. For p99: 10,000 minimum. For CI benchmark gates, use 10,000+ samples for reliable pass/fail decisions.
- [ ] **Control the environment**: Dedicated hardware, pinned CPU frequency, fixed dataset size, isolated network. Document all environment variables.
- [ ] **Run A/B comparisons back-to-back**: Same time window, same environment, same dataset. Any variable besides the one being tested invalidates the comparison.
- [ ] **Run multiple iterations**: 3+ iterations per configuration. Report median or mean with standard deviation. A single run may have 3-8% random variance.

# Performance Checklist (from 04/06)
- [ ] First 30s after server start: 20-50% slower than steady state due to cold OpCache/JIT/DB connections
- [ ] P95 requires 1000 samples for Â±1-2% confidence interval at 95% confidence
- [ ] P99 requires 10,000 samples for similar confidence
- [ ] Normal benchmark variance: 3-8% between runs on identical hardware
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Dedicated benchmark environments should be isolated from production to prevent accidental traffic mixing.
- [ ] Benchmark datasets should not contain PII. Use synthetic or anonymized data.
- [ ] Benchmark results may reveal infrastructure capacity. Treat as confidential business data.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] Warm-up phase duration documented and sufficient (30s+)
- [ ] Sample size calculated for target percentile (1000+ for p95, 10,000+ for p99)
- [ ] Environment variables controlled: dedicated hardware, CPU frequency pinned, network isolated
- [ ] Dataset fixed and production-representative
- [ ] Minimum 3 iterations per configuration
- [ ] No competing workloads during benchmark
- [ ] Methodology documented in full
- [ ] Warm-up phase included and data discarded in all benchmarks
- [ ] Sample size meets statistical requirements for target percentile
- [ ] Minimum 3 iterations per configuration, median reported
- [ ] System variability documented and within acceptable tolerance
- [ ] Benchmark methodology produces reproducible results
- [ ] Warm-up phase included (30-60s, data discarded)
- [ ] Sample size meets requirements: 1000+ for p95, 10000+ for p99
- [ ] GC/cache warm-up performed by layer
- [ ] System variability accounted for (same time, isolated environment)
- [ ] Error rate <2% in all iterations

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always warm up**: Run 30-60s (1000-5000 requests) of traffic before recording benchmark data. Cold-state data is 20-50% slower and not representative of steady-state production behavior.
- [ ] **Calculate required sample size**: For p95: 1000 samples minimum. For p99: 10,000 minimum. For CI benchmark gates, use 10,000+ samples for reliable pass/fail decisions.
- [ ] **Control the environment**: Dedicated hardware, pinned CPU frequency, fixed dataset size, isolated network. Document all environment variables.
- [ ] **Run A/B comparisons back-to-back**: Same time window, same environment, same dataset. Any variable besides the one being tested invalidates the comparison.
- [ ] **Run multiple iterations**: 3+ iterations per configuration. Report median or mean with standard deviation. A single run may have 3-8% random variance.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: No warm-up phase
- [ ] Avoid: Insufficient sample size
- [ ] Avoid: Shared benchmark environment
- [ ] Avoid: Single iteration benchmarking
- [ ] Avoid: Different datasets in A/B comparison
- [ ] Avoid anti-pattern: **Skipping methodology documentation**: Without methodology, benchmark results are unverifiable and untrustworthy. Always document warm-up, sample size, environment, and tooling.
- [ ] Avoid anti-pattern: **Benchmarking on production servers**: Production traffic introduces uncontrolled variables. Use staging environments for benchmarks.
- [ ] Avoid anti-pattern: **Trusting single-run results**: Normal variance (3-8%) can look like a regression or improvement from a single run. Always run multiple iterations.
- [ ] Avoid anti-pattern: **Comparing results across different time periods**: Hardware, network, and software environments drift over time. Compare against a baseline taken in the same timeframe.
- [ ] Guard against anti-pattern: Benchmarking Without Warm-Up Rounds
- [ ] Guard against anti-pattern: Reporting Mean Without Percentiles
- [ ] Guard against anti-pattern: Benchmarking on Development Hardware
- [ ] Guard against anti-pattern: Single-Request Benchmarks (wrk -c1)
- [ ] Guard against anti-pattern: P-Hacking Benchmark Results

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
**Core Concepts:** **Warm-up**: First N requests after server start are significantly slower (OpCache cold, JIT compiling, DB connections establishing). Run 30-60s of traffic before recording measurements. Discard warm-up data from analysis., **Sample Size**: Statistical confidence depends on sample count. p95 needs 1000 samples for 95% CI Â±1-2%. p99 needs 10,000 samples. p99.9 needs 100,000+ samples., **Environment Control**: Run on dedicated hardware. Pin CPU frequency to prevent turbo boost variance. Use fixed dataset. Isolate network from external interference. No competing workloads during benchmarking., **Comparative Benchmarks**: A/B comparisons must control all variables except the one being tested. Same environment, same dataset, same time window.
**Skills:** Benchmarking Concepts, Metrics Definition and Interpretation, Coordinated Omission, CI Integration and Baseline Comparison
**Decision Trees:** Warmup duration and sample size
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** Benchmarking Concepts, Statistical Significance in Benchmarking, CI Integration and Baseline Comparison, Performance Regression Detection

