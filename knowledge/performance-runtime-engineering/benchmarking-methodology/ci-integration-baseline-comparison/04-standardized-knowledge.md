# Standardized Knowledge: CI Integration and Baseline Comparison

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | CI Integration and Baseline Comparison |
| Difficulty | Intermediate |
| Lifecycle | Implement, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Continuous performance benchmarking requires: automated execution (k6, Vegeta in CI pipeline), baseline comparison (compare against last-known-good commit), threshold-based pass/fail (p95 regression >5% fails the build), and historical tracking (bencher.dev or similar platform). Without CI integration, performance regressions go undetected until production incidents.

## Core Concepts

- **CI Integration**: GitHub Actions / GitLab CI / Jenkins step: install k6/wrk2 → warm up → benchmark → compare against baseline → fail if regression. Store baseline metrics in database or JSON file.
- **Baseline Selection**: Compare against: previous commit (per-commit feedback) or last tagged release (release-blocker decisions). Baseline includes: RPS, p50/p95/p99 latency, error rate, memory usage.
- **Threshold Definition**: p95 regression >5% = warning. p95 regression >10% = fail. Error rate >0.5% = fail. Throughput drop >10% = fail. Thresholds must account for normal variability (3-5% is normal).
- **bencher.dev**: Open-source continuous benchmarking platform with git-compatible storage, GitHub/GitLab integration, statistical comparison, regression detection, and dashboard. Self-hosted or cloud.

## When To Use

- Automated performance regression detection in CI/CD pipelines
- Every pull request that may affect performance
- Release validation before deploying to production
- Performance budget enforcement for critical endpoints

## When NOT To Use

- Manual performance testing (ad-hoc profiling)
- Environments where CI runners have high variance (shared hosting, CPU throttling)
- When the benchmark takes longer than the development build itself
- Very early development stages where code changes rapidly

## Best Practices

- **Use dedicated benchmarking runners**: Shared CI runners introduce 10-20% variance from CPU throttling and competing workloads. Dedicated runners reduce noise.
- **Run multiple iterations**: 3+ iterations per benchmark, take the median. A single run has 3-8% variance that can cause false positives.
- **Set thresholds with headroom**: Account for normal variance by setting thresholds at 5-10% rather than 1-2%. False positives destroy trust in the pipeline.
- **Store baselines in a database**: JSON files in the repo work for simple cases but a database (bencher.dev) enables trend analysis across time.
- **Fail fast, fail safely**: Fast benchmarks (<5 minutes) catch regressions early. Ensure the CI step has a timeout and the benchmark process handles failures gracefully.

## Architecture Guidelines

- **Pipeline Integration Point**: Run benchmarks after unit tests but before deployment. This catches regressions before artifacts are built.
- **Regression Detection Levels**: 1) Hard threshold fail (immediate PR block). 2) Statistical regression warning (review within 24h). 3) Gradual drift alert (trend over 7 days).
- **Baseline Aging**: Old baselines become stale as the environment changes. Refresh the baseline monthly or after infrastructure changes.
- **Flaky Benchmark Mitigation**: If variance exceeds 10%, investigate the cause (shared runner, network, dataset) before relying on the benchmark for pass/fail decisions.

## Performance Considerations

- CI benchmarks should be fast (2-5 minutes) to provide quick feedback
- Longer benchmarks (10-30 minutes) should run nightly, not per-PR
- wrk2/k6 with dedicated runners can reliably detect 5% regressions
- Shared runners require 10-15% thresholds to avoid false positives

## Security Considerations

- Benchmark results may reveal infrastructure capacity. Restrict access to the baseline database.
- CI pipeline secrets (API keys, tokens) used in benchmarks must be stored securely.
- Benchmark scripts are code — review them for security issues like any other PR.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Flaky benchmarks from shared runners | Cost optimization | High false-positive rate, team ignores CI gates | Use dedicated benchmarking runners or increase threshold |
| Comparing against a single previous run | Simple implementation | One-run variance (3-8%) causes false positives | Compare against baseline of 30+ recent runs |
| Thresholds too tight (1-2%) | Ignoring normal variance | Constant failures, team disables performance CI | Set thresholds at 5-10% to account for normal variance |
| No warm-up in CI pipeline | Script simplification | Benchmark measures cold-state, not production behavior | Include warm-up phase before recorded benchmark |

## Anti-Patterns

- **Running benchmarks on the same runner as builds**: Competing CPU/memory from builds invalidates benchmark results. Use dedicated runners.
- **Storing baselines in Git**: Bloats repository size and makes trend analysis difficult. Use a database or dedicated platform (bencher.dev).
- **Complex threshold logic**: Simple thresholds (p95 < 500ms) are more reliable than multi-condition logic that's hard to debug.
- **Benchmarking only before deployment**: Per-PR benchmarking catches regressions at the source. Release-only benchmarking catches them too late.

## Examples

```yaml
# GitHub Actions benchmark step
- name: Performance benchmark
  run: |
    wrk2 -t2 -c16 -d30s -R 500 --latency http://app:8080/api/endpoint > result.txt
    # Parse result, compare against baseline, fail if regression
```

## Related Topics

- Performance Regression Detection
- Statistical Significance in Benchmarking
- Methodology Warmup Sample Size
- SLO Definition and Error Budgets

## AI Agent Notes

- CI benchmarking is the practice of automated performance regression detection in the pipeline.
- Dedicated runners are essential for reliable benchmarks. Shared runners introduce unacceptable variance.
- bencher.dev is the leading open-source platform for continuous benchmarking data storage and analysis.
- Thresholds at 5-10% account for normal variance. Tighter thresholds cause false positives and destroy trust.

## Verification

- [ ] CI pipeline includes automated benchmark step
- [ ] Dedicated runner used for benchmarks (or thresholds account for variance)
- [ ] Baseline stored in database or bencher.dev
- [ ] Thresholds defined with appropriate headroom (5-10%)
- [ ] Warm-up phase included in benchmark script
- [ ] Multiple iterations per benchmark (3+)
- [ ] Performance regression alerting configured
- [ ] Baseline refreshed monthly or after infrastructure changes
