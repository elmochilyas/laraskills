## Use dedicated benchmarking runners in CI — never share runners with build jobs
---
Category: Testing
---
Provision dedicated CI runners for performance benchmarks that are isolated from compilation, test, and deployment jobs to eliminate resource contention noise.
---
Reason: Shared CI runners introduce 10-20% variance from CPU throttling, competing memory loads, and disk I/O from other jobs. A benchmark that runs alongside a build job may show a 15% regression that is entirely caused by resource contention, not a code change. Dedicated runners eliminate this noise, enabling reliable detection of 5% regressions. The cost of a dedicated runner is far lower than the cost of false alarms or missed regressions.
---
Bad Example:
```yaml
# Shared runner — high variance, unreliable benchmarks
runs-on: ubuntu-latest  # Shared with all other jobs
```

Good Example:
```yaml
# Dedicated runner — low variance, reliable benchmarks
runs-on: [self-hosted, benchmark]  # Isolated runner
```
---
Exceptions: When CI budget cannot support dedicated runners, increase regression thresholds to 10-15% and accept reduced detection sensitivity.
---
Consequences Of Violation: High false-positive rate from shared-runner noise, team ignores CI performance gates, real regressions slip through.

## Set regression thresholds at 5-10% to account for normal benchmark variance
---
Category: Testing
---
Configure pass/fail thresholds at 5% for warning and 10% for failure — never use thresholds below 5% as they will produce unacceptable false-positive rates.
---
Reason: Even with dedicated runners, benchmark measurements have 2-5% inherent variance from OS scheduling, CPU frequency scaling, and network jitter. Setting thresholds at 1-2% guarantees false positives on every run, destroying team trust in the CI performance gate. Thresholds at 5-10% capture genuine regressions while tolerating normal noise.
---
Bad Example:
```yaml
# Threshold too tight — constant false positives
thresholds:
  p95_regression: 2%  # Normal variance exceeds this — always fails
```

Good Example:
```yaml
# Appropriate thresholds
thresholds:
  p95_warning: 5%     # Investigate
  p95_failure: 10%    # Block merge
  throughput_drop: 10%
```
---
Exceptions: Environments with extremely low-variance benchmarks (dedicated hardware, real-time OS) may use 3-5% thresholds after validating normal variance.
---
Consequences Of Violation: Constant CI failures from normal variance, team disables performance gates, real regressions go undetected.

## Run 3+ benchmark iterations per commit and take the median
---
Category: Testing
---
Execute each benchmark at least 3 times per CI run and use the median (not mean or best) result for comparison against the baseline.
---
Reason: A single benchmark run can be affected by a GC cycle, a cache miss, or a noisy neighbor. The mean is skewed by outliers. Selecting the best run hides variance. The median of 3+ runs provides a stable estimate that resists single-run anomalies while representing typical performance. If the 3 runs have >10% variance, the benchmark environment is too noisy — fix the environment before trusting results.
---
Bad Example:
```bash
# Single run — vulnerable to anomalies
wrk2 ... > result.txt  # Single measurement, may be outlier
```

Good Example:
```bash
# 3 runs, median result
for i in 1 2 3; do
  wrk2 ... > result_$i.txt
done
# Take median p95 across 3 runs
```
---
Exceptions: Benchmarks that take >10 minutes per run may reduce iterations to 2 and require manual review if variance exceeds thresholds.
---
Consequences Of Violation: Single-run anomalies cause false positives or miss regressions, unreliable CI gates, wasted investigation time.

## Store benchmark baselines in a database, not in Git
---
Category: Maintainability
---
Persist benchmark results in a dedicated database (bencher.dev, PostgreSQL, or similar) with trend analysis — never store baselines as JSON files in the Git repository.
---
Reason: JSON files in Git bloat the repository (~100KB per commit × hundreds of commits = GBs), provide no query capability, and make trend analysis impossible. A database enables historical queries ("compare this PR against last 30 days"), trend detection ("p95 has increased 2% per week for 3 months"), and integration with dashboards and alerting. Git-stored baselines also go out of sync on merge commits and branch switches.
---
Bad Example:
```bash
# Baselines in Git — bloat, no trend analysis
git add baseline.json  # 100KB per commit, no querying
```

Good Example:
```bash
# Baselines in database
bencher track --project myapp --commit $COMMIT --data results.json
# Query: "Compare this commit against last 30 days"
```
---
Exceptions: Small teams with simple needs may start with JSON files in Git, but should migrate to a database within 3 months as data accumulates.
---
Consequences Of Violation: Repository bloat, impossible trend analysis, stale baselines that don't reflect recent performance characteristics.

## Refresh the performance baseline monthly or after infrastructure changes
---
Category: Maintainability
---|---
Recalculate the baseline benchmark (typically from the last 30 days of CI runs) every month and after any infrastructure change that could affect performance — stale baselines cause false regressions or missed improvements.
---
Reason: Baseline metrics drift as the application, dependencies, and infrastructure evolve. A baseline from 6 months ago may show a "regression" that is actually the new normal after a PHP version upgrade. Monthly recalculation ensures the baseline reflects the current state while still detecting sudden changes. Infrastructure changes (new CI runner hardware, network topology, PHP version) invalidate the old baseline entirely.
---
Bad Example:
```bash
# Stale baseline — 6 months old
# Baseline: p95=200ms (from January)
# Current: p95=220ms — shows 10% regression
# Actually: PHP 8.3 upgrade in March added 20ms — not a regression
```

Good Example:
```bash
# Monthly baseline refresh
# January baseline: p95=200ms
# March: PHP upgrade → refresh baseline → p95=220ms (new normal)
# April: PR causes p95=240ms — real 9% regression detected
```
---
Exceptions: Applications with frozen code and stable infrastructure may extend baseline refresh to quarterly.
---
Consequences Of Violation: Stale baselines cause false alarms or missed regressions, team loses trust in performance CI gates.
