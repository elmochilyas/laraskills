# Standardized Knowledge: Performance Regression Detection

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | Performance Regression Detection |
| Difficulty | Enterprise |
| Lifecycle | Operate, Measure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Performance regression detection requires automated comparison of current metrics against a statistically significant baseline. Simple threshold checks (p95 > 500ms = fail) are insufficient — normal variance, environment differences, and gradual degradation require statistical tests (Mann-Whitney U test, change point detection) with configurable sensitivity.

## Core Concepts

- **Baseline Establishment**: Collect 30+ benchmark runs from the last-known-good commit. Calculate mean and standard deviation for each metric. Refresh baseline after infrastructure changes.
- **Statistically Significant Change**: Use Welch's t-test or Mann-Whitney U test to determine if the new benchmark differs from baseline with 95% confidence. A 5% change may be significant at 10,000 samples but noise at 100 samples.
- **Threshold-Based Alerts**: Hard thresholds catch catastrophic regressions immediately (p95 > 2s = fail). Statistical thresholds catch gradual regressions that accumulate over commits (5% week-over-week = investigation).
- **Change Point Detection**: CUSUM (Cumulative Sum) or E-Divisive algorithms detect when a time series metric has shifted. Catches slow regressions that accumulate over releases.

## When To Use

- Automated CI/CD pipeline performance gates
- Production performance monitoring with alerting
- Capacity planning — detecting gradual degradation before saturation
- Release validation across multiple environments

## When NOT To Use

- Manual ad-hoc performance checks
- Environments with very high variance (>15-20% run-to-run)
- Very early development where baselines change frequently
- When false positives would halt all deployments (tune sensitivity first)

## Best Practices

- **Multi-stage detection**: Hard threshold fail (immediate PR block), statistical regression warning (review within 24h), gradual drift alert (trend over 7 days). Each stage triggers different escalation.
- **Baseline from 30+ runs**: A single previous run has 3-8% variance. Compare against a rolling window of 30+ recent runs for statistical significance.
- **Use statistical tests**: 5% change may be noise at 100 samples but significant at 10,000. Statistical tests account for sample size and variance automatically.
- **Account for normal variability**: Establish the coefficient of variation (CV) for each metric. If p95 latency has 5% CV, a 5% change is normal; a 15% change is a regression.
- **Alert on trend, not just point-in-time**: A metric that degrades 2% per week for 5 weeks (10% total) is more concerning than a 10% spike that recovers.

## Architecture Guidelines

- **Detection Pipeline**: Benchmark run → metric extraction → baseline comparison → statistical test → pass/warn/fail → notification. Fail blocks deployment, warn creates ticket, pass proceeds.
- **Statistical Methods**: Mann-Whitney U test for non-normal distributions (benchmark metrics are often non-normal). Welch's t-test for normal distributions with unequal variance. CUSUM for change point detection.
- **Alert Severity Tiers**: P0 (hard threshold exceeded → immediate incident), P1 (statistical regression → review within 24h), P2 (gradual drift → review this sprint).
- **False Positive Mitigation**: Run 3+ benchmark iterations and take median. Apply Bonferroni correction for multiple metrics. Allow auto-remediation (re-run benchmark once on failure).

## Performance Considerations

- P95 requires 1000+ samples for reliable detection of 5% regressions
- P99 requires 10,000+ samples for the same sensitivity
- Time-series analysis with CUSUM requires 20+ data points before detecting shifts
- Running statistical tests adds <1ms overhead — negligible

## Security Considerations

- Regression detection baselines are sensitive capacity data. Restrict access.
- False alerts reduce trust in the system. Configure alerting carefully to avoid alert fatigue.
- Self-healing systems that auto-revert on regression detection must have manual override capability.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Comparing against a single previous run | Simple implementation | 3-8% variance causes false positives | Compare against baseline of 30+ runs |
| Using only hard thresholds | Easy to implement | Misses gradual regressions that accumulate over commits | Add statistical tests and change point detection |
| Too many alerts | Alerting on every metric at every severity | Alert fatigue, team ignores performance CI | Tier alerts by severity, reduce noise at lower tiers |
| No warm-up in benchmark | Methodology shortcut | Measures cold-state performance, not production behavior | Include warm-up phase, detect regressions on steady-state data |

## Anti-Patterns

- **Statistical tests without understanding sample size**: A Mann-Whitney U test with 100 samples needs a larger effect size than with 10,000 samples. Configure minimum effect size thresholds.
- **Auto-reverting without investigation**: Automatic rollback on regression detection can mask flaky infrastructure. Always investigate before reverting.
- **One-size-fits-all thresholds**: Different endpoints have different variance. API endpoints may have 3% CV while page loads have 10% CV. Set per-endpoint thresholds.
- **Reactive-only detection**: If you only detect regressions after they reach production, you're missing the CI gate opportunity. Per-PR detection catches regressions at the source.

## Examples

```python
# Statistical regression detection
from scipy import stats
baseline = [45, 47, 44, 46, 48, 45, 47, 46, 44, 45]  # 10 runs
current = [52, 54, 51, 53, 55, 52]  # current run
stat, p_value = stats.mannwhitneyu(baseline, current, alternative='two-sided')
if p_value < 0.05:
    # Statistically significant difference detected
    mean_baseline = sum(baseline) / len(baseline)
    mean_current = sum(current) / len(current)
    regression_pct = ((mean_current - mean_baseline) / mean_baseline) * 100
```

## Related Topics

- CI Integration and Baseline Comparison
- Statistical Significance in Benchmarking
- SLO Definition and Error Budgets
- Metrics Definition and Interpretation

## AI Agent Notes

- Statistical regression detection is more reliable than hard thresholds for gradual degradation.
- Mann-Whitney U test is preferred over t-test because benchmark metrics are often non-normal distributions.
- Baseline should include 30+ data points minimum. Fewer than 30 gives unreliable statistical comparison.
- Three-tier detection (hard threshold, statistical regression, gradual drift) covers both catastrophic and creeping regressions.

## Verification

- [ ] Baseline established with 30+ benchmark runs
- [ ] Statistical tests configured (Mann-Whitney U or Welch's t-test)
- [ ] Multi-tier alerting implemented (hard, statistical, gradual)
- [ ] Per-endpoint variance calculated and thresholds tuned
- [ ] False positive rate monitored and <5%
- [ ] CI pipeline gates deployments on regression detection
- [ ] Change point detection configured for gradual drift
