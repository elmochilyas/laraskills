# Skill: Detect Performance Regressions with Statistical Significance

## Purpose
Detect real performance regressions against baselines using statistical significance (Mann-Whitney U test at 95% confidence), not simple ratio comparisons — eliminating false positives from normal variance (3-5% run-to-run) while catching subtle regressions that compound over deployments via CI integration and forward/backward dashboards.

## When To Use
- CI pipeline performance gates
- Pre-release validation before deploying to production
- Monthly performance review cycles
- Investigating user-reported slowdowns

## When NOT To Use
- Capacity planning exercises
- One-time benchmarking for sizing
- Performance profiling (different activity)

## Prerequisites
- Baseline benchmark results in database (30+ recent runs)
- New benchmark results from CI or manual run
- Statistical testing library (SciPy, built-in tool analysis)
- Understanding of Mann-Whitney U test

## Inputs
- Baseline dataset: latency samples from 30+ recent runs
- New dataset: latency samples from current run
- SLO thresholds (p95 latency target)
- Environment details for both runs

## Workflow

### 1. Verify Environment Consistency
- Compare baseline and new run environments: same hardware, same load
- Check for infrastructure changes: new deployment, config change, scaling event
- If environment changed significantly, establish new baseline — don't compare
- Document any differences that may affect results

### 2. Run Statistical Significance Test
- Use Mann-Whitney U test (non-parametric, no normality assumption)
- Compare full latency distributions, not just percentiles
- 95% confidence level (p < 0.05)
- Apply Benjamini-Hochberg correction when comparing multiple endpoints

### 3. Compare Against Thresholds
- If statistically significant AND practical significance:
  - p95 regression >5%: warning (investigate within 24h)
  - p95 regression >10%: failure (block merge)
  - Throughput drop >10%: failure
  - Error rate >0.5%: failure
- If statistically significant but below practical thresholds: flag but don't block
- If NOT statistically significant: no regression detected, even if means differ

### 4. Check Both Directions
- Forward comparison: new result vs baseline → detect regressions
- Backward comparison: baseline vs new result → detect improvements
- Both directions prevent undetected regressions from being "baked in"
- Document improvements as well as regressions

### 5. Investigate Regressions
- Profile to find cause: CPU-bound, IO-bound, lock contention?
- Compare with continuous profiling data for the same period
- Check deployment timeline for recent changes
- Review latency distribution shape changes (multimodal shift?)

### 6. Update Baseline
- After validating improvement: update baseline to new performance level
- After fixing regression: verify fix, update baseline
- Refresh baseline monthly or after infrastructure changes
- Archive old baselines for trend analysis

## Validation Checklist
- [ ] Mann-Whitney U test applied at 95% confidence
- [ ] Practical significance checked against thresholds (5%/10%)
- [ ] Both forward and backward direction checked
- [ ] Environment consistency verified
- [ ] Baseline updated after validated changes
- [ ] False positive rate <5%

## Related Rules
- Mann-Whitney U test (`05-rules.md:1`)
- 5% warning, 10% failure thresholds (`05-rules.md:27`)
- Check forward and backward (`05-rules.md:54`)
- Baseline after fix/improvement (`05-rules.md:81`)
- False positive rate <5% (`05-rules.md:107`)

## Related Skills
- CI Integration and Baseline Comparison
- Statistical Significance in Benchmarking
- SLO Definition and Error Budgets
- Continuous Profiling Strategy

## Success Criteria
- ALL regressions detected using statistical significance, not ratio comparison
- False positive rate <5%
- Regressions investigated and documented within 24h
- Baselines updated after validated fixes or improvements
- Dashboard shows both forward and backward comparison
