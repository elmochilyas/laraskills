# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Performance Regression Detection â€” CI Baseline Comparison, Threshold-Based Pass/Fail
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Multi-stage detection**: Hard threshold fail (immediate PR block), statistical regression warning (review within 24h), gradual drift alert (trend over 7 days). Each stage triggers different escalation.
- [ ] **Baseline from 30+ runs**: A single previous run has 3-8% variance. Compare against a rolling window of 30+ recent runs for statistical significance.
- [ ] **Use statistical tests**: 5% change may be noise at 100 samples but significant at 10,000. Statistical tests account for sample size and variance automatically.
- [ ] **Account for normal variability**: Establish the coefficient of variation (CV) for each metric. If p95 latency has 5% CV, a 5% change is normal; a 15% change is a regression.
- [ ] **Alert on trend, not just point-in-time**: A metric that degrades 2% per week for 5 weeks (10% total) is more concerning than a 10% spike that recovers.
- [ ] Baseline established with 30+ benchmark runs
- [ ] Statistical tests configured (Mann-Whitney U or Welch's t-test)
- [ ] Multi-tier alerting implemented (hard, statistical, gradual)
- [ ] Per-endpoint variance calculated and thresholds tuned
- [ ] False positive rate monitored and <5%
- [ ] ALL regressions detected using statistical significance, not ratio comparison
- [ ] False positive rate <5%
- [ ] Regressions investigated and documented within 24h
- [ ] Baselines updated after validated fixes or improvements
- [ ] Dashboard shows both forward and backward comparison
- [ ] Mann-Whitney U test applied at 95% confidence
- [ ] Practical significance checked against thresholds (5%/10%)
- [ ] Both forward and backward direction checked
- [ ] Environment consistency verified
- [ ] Baseline updated after validated changes

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **Detection Pipeline**: Benchmark run â†’ metric extraction â†’ baseline comparison â†’ statistical test â†’ pass/warn/fail â†’ notification. Fail blocks deployment, warn creates ticket, pass proceeds.
- [ ] **Statistical Methods**: Mann-Whitney U test for non-normal distributions (benchmark metrics are often non-normal). Welch's t-test for normal distributions with unequal variance. CUSUM for change point detection.
- [ ] **Alert Severity Tiers**: P0 (hard threshold exceeded â†’ immediate incident), P1 (statistical regression â†’ review within 24h), P2 (gradual drift â†’ review this sprint).
- [ ] **False Positive Mitigation**: Run 3+ benchmark iterations and take median. Apply Bonferroni correction for multiple metrics. Allow auto-remediation (re-run benchmark once on failure).
- [ ] Document and follow through on architectural decision: Regression detection approach
- [ ] Ensure architecture aligns with core concept: **Baseline Establishment**: Collect 30+ benchmark runs from the last-known-good commit. Calculate mean and standard deviation for each metric. Refresh baseline after infrastructure changes.
- [ ] Ensure architecture aligns with core concept: **Statistically Significant Change**: Use Welch's t-test or Mann-Whitney U test to determine if the new benchmark differs from baseline with 95% confidence. A 5% change may be significant at 10,000 samples but noise at 100 samples.
- [ ] Ensure architecture aligns with core concept: **Threshold-Based Alerts**: Hard thresholds catch catastrophic regressions immediately (p95 > 2s = fail). Statistical thresholds catch gradual regressions that accumulate over commits (5% week-over-week = investigation).
- [ ] Ensure architecture aligns with core concept: **Change Point Detection**: CUSUM (Cumulative Sum) or E-Divisive algorithms detect when a time series metric has shifted. Catches slow regressions that accumulate over releases.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Multi-stage detection**: Hard threshold fail (immediate PR block), statistical regression warning (review within 24h), gradual drift alert (trend over 7 days). Each stage triggers different escalation.
- [ ] **Baseline from 30+ runs**: A single previous run has 3-8% variance. Compare against a rolling window of 30+ recent runs for statistical significance.
- [ ] **Use statistical tests**: 5% change may be noise at 100 samples but significant at 10,000. Statistical tests account for sample size and variance automatically.
- [ ] **Account for normal variability**: Establish the coefficient of variation (CV) for each metric. If p95 latency has 5% CV, a 5% change is normal; a 15% change is a regression.
- [ ] **Alert on trend, not just point-in-time**: A metric that degrades 2% per week for 5 weeks (10% total) is more concerning than a 10% spike that recovers.

# Performance Checklist (from 04/06)
- [ ] P95 requires 1000+ samples for reliable detection of 5% regressions
- [ ] P99 requires 10,000+ samples for the same sensitivity
- [ ] Time-series analysis with CUSUM requires 20+ data points before detecting shifts
- [ ] Running statistical tests adds <1ms overhead â€” negligible
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Regression detection baselines are sensitive capacity data. Restrict access.
- [ ] False alerts reduce trust in the system. Configure alerting carefully to avoid alert fatigue.
- [ ] Self-healing systems that auto-revert on regression detection must have manual override capability.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] Baseline established with 30+ benchmark runs
- [ ] Statistical tests configured (Mann-Whitney U or Welch's t-test)
- [ ] Multi-tier alerting implemented (hard, statistical, gradual)
- [ ] Per-endpoint variance calculated and thresholds tuned
- [ ] False positive rate monitored and <5%
- [ ] CI pipeline gates deployments on regression detection
- [ ] Change point detection configured for gradual drift
- [ ] ALL regressions detected using statistical significance, not ratio comparison
- [ ] False positive rate <5%
- [ ] Regressions investigated and documented within 24h
- [ ] Baselines updated after validated fixes or improvements
- [ ] Dashboard shows both forward and backward comparison
- [ ] Mann-Whitney U test applied at 95% confidence
- [ ] Practical significance checked against thresholds (5%/10%)
- [ ] Both forward and backward direction checked
- [ ] Environment consistency verified
- [ ] Baseline updated after validated changes

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Multi-stage detection**: Hard threshold fail (immediate PR block), statistical regression warning (review within 24h), gradual drift alert (trend over 7 days). Each stage triggers different escalation.
- [ ] **Baseline from 30+ runs**: A single previous run has 3-8% variance. Compare against a rolling window of 30+ recent runs for statistical significance.
- [ ] **Use statistical tests**: 5% change may be noise at 100 samples but significant at 10,000. Statistical tests account for sample size and variance automatically.
- [ ] **Account for normal variability**: Establish the coefficient of variation (CV) for each metric. If p95 latency has 5% CV, a 5% change is normal; a 15% change is a regression.
- [ ] **Alert on trend, not just point-in-time**: A metric that degrades 2% per week for 5 weeks (10% total) is more concerning than a 10% spike that recovers.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Comparing against a single previous run
- [ ] Avoid: Using only hard thresholds
- [ ] Avoid: Too many alerts
- [ ] Avoid: No warm-up in benchmark
- [ ] Avoid anti-pattern: **Statistical tests without understanding sample size**: A Mann-Whitney U test with 100 samples needs a larger effect size than with 10,000 samples. Configure minimum effect size thresholds.
- [ ] Avoid anti-pattern: **Auto-reverting without investigation**: Automatic rollback on regression detection can mask flaky infrastructure. Always investigate before reverting.
- [ ] Avoid anti-pattern: **One-size-fits-all thresholds**: Different endpoints have different variance. API endpoints may have 3% CV while page loads have 10% CV. Set per-endpoint thresholds.
- [ ] Avoid anti-pattern: **Reactive-only detection**: If you only detect regressions after they reach production, you're missing the CI gate opportunity. Per-PR detection catches regressions at the source.
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
**Core Concepts:** **Baseline Establishment**: Collect 30+ benchmark runs from the last-known-good commit. Calculate mean and standard deviation for each metric. Refresh baseline after infrastructure changes., **Statistically Significant Change**: Use Welch's t-test or Mann-Whitney U test to determine if the new benchmark differs from baseline with 95% confidence. A 5% change may be significant at 10,000 samples but noise at 100 samples., **Threshold-Based Alerts**: Hard thresholds catch catastrophic regressions immediately (p95 > 2s = fail). Statistical thresholds catch gradual regressions that accumulate over commits (5% week-over-week = investigation)., **Change Point Detection**: CUSUM (Cumulative Sum) or E-Divisive algorithms detect when a time series metric has shifted. Catches slow regressions that accumulate over releases.
**Skills:** CI Integration and Baseline Comparison, Statistical Significance in Benchmarking, SLO Definition and Error Budgets, Continuous Profiling Strategy
**Decision Trees:** Regression detection approach
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** CI Integration and Baseline Comparison, Statistical Significance in Benchmarking, SLO Definition and Error Budgets, Metrics Definition and Interpretation

