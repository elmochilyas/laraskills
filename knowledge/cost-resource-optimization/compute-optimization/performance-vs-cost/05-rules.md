## Measure Before Optimizing
---
## Performance
---
Always profile with Laravel debugbar, Blackfire, or Tideways to identify real bottlenecks before investing in optimization.
---
90% of performance guesses are wrong; a single slow query is often the root cause, not CPU or memory. Optimizing the wrong thing wastes engineering time and delays real fixes.
---
Profile: find missing index on `WHERE` clause, add index, resolve p95 latency.
---
Spending 40 hours on Octane migration when the bottleneck is a missing database index.
---
When the bottleneck is already confirmed (e.g., CPU at 95% with 50% idle workers); even then, profile to confirm.
---
Wasted engineering time on irrelevant optimizations, no measurable improvement.
---
## Use Breakeven Analysis for Compute Decisions
---
## Cost Optimization
---
Always calculate total monthly cost at projected throughput for each compute option (Lambda, Fargate, EC2) before choosing.
---
Lambda looks cheap at 10 req/s ($5) but expensive at 1000 req/s ($1500); EC2 looks expensive at 10 req/s ($50) but cheap at 1000 req/s ($200). Without breakeven analysis, you choose the wrong platform for your scale.
---
500 req/s, 500ms: Lambda = $1,234/mo, EC2 (3 x m7g.large) = $216/mo. Choose EC2.
---
Using Lambda for high-traffic API servicing 5000 req/s because "serverless is always cheaper."
---
Traffic at breakeven threshold (<100 req/s for Lambda); model both to be certain.
---
Paying 3-5x more than necessary for compute at scale.
---
## Apply 80/20 Rule
---
## Performance
---
Always target the highest-ROI optimizations first: OPcache > PHP-FPM tuning > Octane > JIT.
---
80% of optimization benefit comes from 20% of changes; OPcache gives 50-70% CPU reduction for 1 config change; full Octane + JIT gives additional 20% for 10x engineering effort.
---
First optimization: enable OPcache (5 minutes, 50% CPU reduction). Second: tune FPM.
---
Jumping straight to Octane migration without enabling OPcache first.
---
CPU-bound workloads where Octane's benefit is large enough to justify early investment.
---
Over-engineering, slow ROI, engineering time wasted on low-impact optimizations.
---
## Calculate Cost Per Request
---
## Monitoring
---
Always track cost per request (total monthly compute / total requests); alarm when trending upward.
---
Cost per request provides a single metric for cost-performance health; trending up means degradation — either traffic pattern changed, code became less efficient, or instance pricing increased.
---
Target: <$0.0001/req for most Laravel apps. Monitor month-over-month.
---
No per-request cost tracking, only aggregate monthly bill monitoring.
---
Apps with zero compute cost (static sites, fully cached); still worth tracking.
---
Silent cost degradation, no alerting when efficiency drops, reactive budget management.
---
## Set Performance Budgets in CI/CD
---
## Maintainability
---
Always define p50, p95, p99 latency targets and enforce them in CI/CD pipeline.
---
Performance budgets prevent regression before it reaches production; alerts when new code degrades performance, enabling immediate remediation rather than weeks of unnoticed decay.
---
CI/CD: p95 < 500ms threshold; if new deployment exceeds, pipeline warns or blocks.
---
No performance baselines; "we'll notice if it gets slow."
---
Rapid prototyping or internal tools where performance SLA is not critical.
---
Undetected performance regression accumulating over releases, reactive firefighting.
