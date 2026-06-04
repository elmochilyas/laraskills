# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** CI Integration and Baseline Comparison â€” Threshold-Based Pass/Fail, bencher.dev
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use dedicated benchmarking runners**: Shared CI runners introduce 10-20% variance from CPU throttling and competing workloads. Dedicated runners reduce noise.
- [ ] **Run multiple iterations**: 3+ iterations per benchmark, take the median. A single run has 3-8% variance that can cause false positives.
- [ ] **Set thresholds with headroom**: Account for normal variance by setting thresholds at 5-10% rather than 1-2%. False positives destroy trust in the pipeline.
- [ ] **Store baselines in a database**: JSON files in the repo work for simple cases but a database (bencher.dev) enables trend analysis across time.
- [ ] **Fail fast, fail safely**: Fast benchmarks (<5 minutes) catch regressions early. Ensure the CI step has a timeout and the benchmark process handles failures gracefully.
- [ ] CI pipeline includes automated benchmark step
- [ ] Dedicated runner used for benchmarks (or thresholds account for variance)
- [ ] Baseline stored in database or bencher.dev
- [ ] Thresholds defined with appropriate headroom (5-10%)
- [ ] Warm-up phase included in benchmark script
- [ ] CI pipeline includes automated benchmarks that gate deployments
- [ ] Baseline stored in database with trend analysis
- [ ] False positive rate <5%
- [ ] Regressions detected within minutes of commit
- [ ] Team trusts and responds to CI performance gates
- [ ] Dedicated benchmarking runners configured
- [ ] Warm-up phase included in script
- [ ] 3+ iterations per benchmark, median reported
- [ ] Thresholds defined: 5% warning, 10% failure
- [ ] Baseline stored in database (not Git)

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **Pipeline Integration Point**: Run benchmarks after unit tests but before deployment. This catches regressions before artifacts are built.
- [ ] **Regression Detection Levels**: 1) Hard threshold fail (immediate PR block). 2) Statistical regression warning (review within 24h). 3) Gradual drift alert (trend over 7 days).
- [ ] **Baseline Aging**: Old baselines become stale as the environment changes. Refresh the baseline monthly or after infrastructure changes.
- [ ] **Flaky Benchmark Mitigation**: If variance exceeds 10%, investigate the cause (shared runner, network, dataset) before relying on the benchmark for pass/fail decisions.
- [ ] Document and follow through on architectural decision: CI benchmark integration approach
- [ ] Ensure architecture aligns with core concept: **CI Integration**: GitHub Actions / GitLab CI / Jenkins step: install k6/wrk2 â†’ warm up â†’ benchmark â†’ compare against baseline â†’ fail if regression. Store baseline metrics in database or JSON file.
- [ ] Ensure architecture aligns with core concept: **Baseline Selection**: Compare against: previous commit (per-commit feedback) or last tagged release (release-blocker decisions). Baseline includes: RPS, p50/p95/p99 latency, error rate, memory usage.
- [ ] Ensure architecture aligns with core concept: **Threshold Definition**: p95 regression >5% = warning. p95 regression >10% = fail. Error rate >0.5% = fail. Throughput drop >10% = fail. Thresholds must account for normal variability (3-5% is normal).
- [ ] Ensure architecture aligns with core concept: **bencher.dev**: Open-source continuous benchmarking platform with git-compatible storage, GitHub/GitLab integration, statistical comparison, regression detection, and dashboard. Self-hosted or cloud.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use dedicated benchmarking runners**: Shared CI runners introduce 10-20% variance from CPU throttling and competing workloads. Dedicated runners reduce noise.
- [ ] **Run multiple iterations**: 3+ iterations per benchmark, take the median. A single run has 3-8% variance that can cause false positives.
- [ ] **Set thresholds with headroom**: Account for normal variance by setting thresholds at 5-10% rather than 1-2%. False positives destroy trust in the pipeline.
- [ ] **Store baselines in a database**: JSON files in the repo work for simple cases but a database (bencher.dev) enables trend analysis across time.
- [ ] **Fail fast, fail safely**: Fast benchmarks (<5 minutes) catch regressions early. Ensure the CI step has a timeout and the benchmark process handles failures gracefully.

# Performance Checklist (from 04/06)
- [ ] CI benchmarks should be fast (2-5 minutes) to provide quick feedback
- [ ] Longer benchmarks (10-30 minutes) should run nightly, not per-PR
- [ ] wrk2/k6 with dedicated runners can reliably detect 5% regressions
- [ ] Shared runners require 10-15% thresholds to avoid false positives
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Benchmark results may reveal infrastructure capacity. Restrict access to the baseline database.
- [ ] CI pipeline secrets (API keys, tokens) used in benchmarks must be stored securely.
- [ ] Benchmark scripts are code â€” review them for security issues like any other PR.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] CI pipeline includes automated benchmark step
- [ ] Dedicated runner used for benchmarks (or thresholds account for variance)
- [ ] Baseline stored in database or bencher.dev
- [ ] Thresholds defined with appropriate headroom (5-10%)
- [ ] Warm-up phase included in benchmark script
- [ ] Multiple iterations per benchmark (3+)
- [ ] Performance regression alerting configured
- [ ] Baseline refreshed monthly or after infrastructure changes
- [ ] CI pipeline includes automated benchmarks that gate deployments
- [ ] Baseline stored in database with trend analysis
- [ ] False positive rate <5%
- [ ] Regressions detected within minutes of commit
- [ ] Team trusts and responds to CI performance gates
- [ ] Dedicated benchmarking runners configured
- [ ] Warm-up phase included in script
- [ ] 3+ iterations per benchmark, median reported
- [ ] Thresholds defined: 5% warning, 10% failure
- [ ] Baseline stored in database (not Git)
- [ ] Baseline refreshed monthly or after infra changes
- [ ] Pipeline step runs after unit tests, before deploy

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use dedicated benchmarking runners**: Shared CI runners introduce 10-20% variance from CPU throttling and competing workloads. Dedicated runners reduce noise.
- [ ] **Run multiple iterations**: 3+ iterations per benchmark, take the median. A single run has 3-8% variance that can cause false positives.
- [ ] **Set thresholds with headroom**: Account for normal variance by setting thresholds at 5-10% rather than 1-2%. False positives destroy trust in the pipeline.
- [ ] **Store baselines in a database**: JSON files in the repo work for simple cases but a database (bencher.dev) enables trend analysis across time.
- [ ] **Fail fast, fail safely**: Fast benchmarks (<5 minutes) catch regressions early. Ensure the CI step has a timeout and the benchmark process handles failures gracefully.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Flaky benchmarks from shared runners
- [ ] Avoid: Comparing against a single previous run
- [ ] Avoid: Thresholds too tight (1-2%)
- [ ] Avoid: No warm-up in CI pipeline
- [ ] Avoid anti-pattern: **Running benchmarks on the same runner as builds**: Competing CPU/memory from builds invalidates benchmark results. Use dedicated runners.
- [ ] Avoid anti-pattern: **Storing baselines in Git**: Bloats repository size and makes trend analysis difficult. Use a database or dedicated platform (bencher.dev).
- [ ] Avoid anti-pattern: **Complex threshold logic**: Simple thresholds (p95 < 500ms) are more reliable than multi-condition logic that's hard to debug.
- [ ] Avoid anti-pattern: **Benchmarking only before deployment**: Per-PR benchmarking catches regressions at the source. Release-only benchmarking catches them too late.
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
**Core Concepts:** **CI Integration**: GitHub Actions / GitLab CI / Jenkins step: install k6/wrk2 â†’ warm up â†’ benchmark â†’ compare against baseline â†’ fail if regression. Store baseline metrics in database or JSON file., **Baseline Selection**: Compare against: previous commit (per-commit feedback) or last tagged release (release-blocker decisions). Baseline includes: RPS, p50/p95/p99 latency, error rate, memory usage., **Threshold Definition**: p95 regression >5% = warning. p95 regression >10% = fail. Error rate >0.5% = fail. Throughput drop >10% = fail. Thresholds must account for normal variability (3-5% is normal)., **bencher.dev**: Open-source continuous benchmarking platform with git-compatible storage, GitHub/GitLab integration, statistical comparison, regression detection, and dashboard. Self-hosted or cloud.
**Skills:** Performance Regression Detection, Statistical Significance in Benchmarking, Methodology Warmup Sample Size, SLO Definition and Error Budgets
**Decision Trees:** CI benchmark integration approach
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** Performance Regression Detection, Statistical Significance in Benchmarking, Methodology Warmup Sample Size, SLO Definition and Error Budgets

