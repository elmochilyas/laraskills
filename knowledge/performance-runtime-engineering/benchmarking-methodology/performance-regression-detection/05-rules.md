## Automate regression detection in CI with statistical significance checks
---
Category: Reliability
---
Integrate automated benchmarks in CI pipelines with statistical significance testing. Never flag a regression based on a single run's variance.
---
Reason: Normal benchmark variance (3-8%) means a 5% change between runs could be noise. Statistical tests (Welch's t-test, Mann-Whitney U) distinguish real regressions from noise, preventing false positives that waste investigation time.
---
Bad Example:
```bash
# Flagging any change >5% as a regression
# 50% false positive rate due to normal variance
```

Good Example:
```bash
# Statistical significance check
# 10,000+ samples per run, 3 iterations
# p-value < 0.05 = statistically significant regression
```
---
Exceptions: Large regressions (>20%) where statistical significance is obvious.
---
Consequences Of Violation: Frequent false positives, investigation fatigue, missed real regressions in noise.

## Establish baseline from dedicated benchmark runs, not production
---
Category: Methodology
---
Create performance baselines from dedicated benchmark environments, not production traffic data.
---
Reason: Production traffic varies by time of day, day of week, and user behavior. Dedicated benchmarks control all variables (dataset, traffic pattern, environment), producing stable baselines that can reliably detect regressions.
---
Bad Example:
```bash
# Using production p95 from this week vs last week
# Traffic patterns differ — invalid comparison
```

Good Example:
```bash
# Dedicated benchmark run on staging
wrk2 -t4 -c64 -d60s -R 2000 --latency http://staging/endpoint
# Baseline stored in CI artifact
```
---
Exceptions: Applications where dedicated staging environments are not available.
---
Consequences Of Violation: Invalid baselines, missed regressions masked by traffic pattern changes.
