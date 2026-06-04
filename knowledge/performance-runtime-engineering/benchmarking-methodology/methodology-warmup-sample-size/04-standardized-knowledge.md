# Standardized Knowledge: Methodology — Warm-up Phases, Sample Size, Environment Control

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | Methodology — Warm-up, Sample Size, Environment Control |
| Difficulty | Intermediate |
| Lifecycle | Measure, Evaluate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Benchmark methodology directly determines result validity. Requirements: 30s+ warm-up for OpCache population, JIT compilation, and database connection pool warmup; sample size of 1000+ for p95, 10,000+ for p99, 100,000+ for p99.9; environment control with dedicated hardware, consistent dataset, network isolation, and no competing workloads.

## Core Concepts

- **Warm-up**: First N requests after server start are significantly slower (OpCache cold, JIT compiling, DB connections establishing). Run 30-60s of traffic before recording measurements. Discard warm-up data from analysis.
- **Sample Size**: Statistical confidence depends on sample count. p95 needs 1000 samples for 95% CI ±1-2%. p99 needs 10,000 samples. p99.9 needs 100,000+ samples.
- **Environment Control**: Run on dedicated hardware. Pin CPU frequency to prevent turbo boost variance. Use fixed dataset. Isolate network from external interference. No competing workloads during benchmarking.
- **Comparative Benchmarks**: A/B comparisons must control all variables except the one being tested. Same environment, same dataset, same time window.

## When To Use

- Designing a benchmarking protocol for production-representative results
- Validating that benchmark results are statistically significant and reproducible
- Comparing two configurations (PHP version, OpCache settings, runtime choice)
- Setting up CI benchmark pipelines that produce reliable pass/fail decisions

## When NOT To Use

- Quick ad-hoc performance checks (use Vegeta or hey without full methodology)
- Exploratory testing where precise measurements aren't needed
- Environments where dedicated hardware is unavailable and variance is acceptable

## Best Practices

- **Always warm up**: Run 30-60s (1000-5000 requests) of traffic before recording benchmark data. Cold-state data is 20-50% slower and not representative of steady-state production behavior.
- **Calculate required sample size**: For p95: 1000 samples minimum. For p99: 10,000 minimum. For CI benchmark gates, use 10,000+ samples for reliable pass/fail decisions.
- **Control the environment**: Dedicated hardware, pinned CPU frequency, fixed dataset size, isolated network. Document all environment variables.
- **Run A/B comparisons back-to-back**: Same time window, same environment, same dataset. Any variable besides the one being tested invalidates the comparison.
- **Run multiple iterations**: 3+ iterations per configuration. Report median or mean with standard deviation. A single run may have 3-8% random variance.

## Architecture Guidelines

- **Phased Benchmark Protocol**: 1) Warm-up phase (discard data), 2) Steady-state measurement (record data), 3) cool-down phase (let system idle). Publish methodology details.
- **Statistical Foundation**: Use percentiles not averages. Use median of multiple runs, not a single run. Apply Welch's t-test or Mann-Whitney U test for significance.
- **Dataset Consistency**: Use a fixed, production-representative dataset. Random data generation during benchmarks introduces uncontrolled variance. Pre-generate datasets.
- **Environment Isolation**: No cron jobs, monitoring runs, or other workloads during benchmarks. CPU frequency scaling disabled. Network latency to dependencies measured and documented.

## Performance Considerations

- First 30s after server start: 20-50% slower than steady state due to cold OpCache/JIT/DB connections
- P95 requires 1000 samples for ±1-2% confidence interval at 95% confidence
- P99 requires 10,000 samples for similar confidence
- Normal benchmark variance: 3-8% between runs on identical hardware

## Security Considerations

- Dedicated benchmark environments should be isolated from production to prevent accidental traffic mixing.
- Benchmark datasets should not contain PII. Use synthetic or anonymized data.
- Benchmark results may reveal infrastructure capacity. Treat as confidential business data.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| No warm-up phase | Ignorance of cold-state behavior | 20-50% inflated latency numbers | Run 30-60s warm-up traffic before recording |
| Insufficient sample size | Not understanding statistical requirements | Unreliable percentile estimates, false conclusions | Calculate required sample size (1000+ for p95) |
| Shared benchmark environment | Convenience over methodology | Uncontrolled variance from competing workloads | Use dedicated hardware for all benchmarks |
| Single iteration benchmarking | Time pressure | 3-8% variance can mask real changes | Run minimum 3 iterations, report median |
| Different datasets in A/B comparison | Not controlling variables | Invalid comparison — different data ≠ different performance | Use identical dataset for all configurations |

## Anti-Patterns

- **Skipping methodology documentation**: Without methodology, benchmark results are unverifiable and untrustworthy. Always document warm-up, sample size, environment, and tooling.
- **Benchmarking on production servers**: Production traffic introduces uncontrolled variables. Use staging environments for benchmarks.
- **Trusting single-run results**: Normal variance (3-8%) can look like a regression or improvement from a single run. Always run multiple iterations.
- **Comparing results across different time periods**: Hardware, network, and software environments drift over time. Compare against a baseline taken in the same timeframe.

## Examples

```bash
# Benchmark protocol
# Phase 1: Warm-up (30s)
wrk2 -t4 -c64 -d30s -R 1000 http://target/api/status
# Phase 2: Steady-state measurement (60s, record data)
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api/endpoint
# Phase 3: Repeat 3 times for statistical significance
```

## Related Topics

- Benchmarking Concepts
- Statistical Significance in Benchmarking
- CI Integration and Baseline Comparison
- Performance Regression Detection

## AI Agent Notes

- Warm-up is non-negotiable for valid benchmarks. Cold-state data is 20-50% slower and misleading.
- Sample size requirements scale with percentile: p99 requires 10x more samples than p95.
- Environment control is more important than absolute performance. A well-controlled slow environment produces more useful data than a noisy fast one.
- Normal variance (3-8%) means a 5% change between runs could be noise, not a real difference.

## Verification

- [ ] Warm-up phase duration documented and sufficient (30s+)
- [ ] Sample size calculated for target percentile (1000+ for p95, 10,000+ for p99)
- [ ] Environment variables controlled: dedicated hardware, CPU frequency pinned, network isolated
- [ ] Dataset fixed and production-representative
- [ ] Minimum 3 iterations per configuration
- [ ] No competing workloads during benchmark
- [ ] Methodology documented in full
