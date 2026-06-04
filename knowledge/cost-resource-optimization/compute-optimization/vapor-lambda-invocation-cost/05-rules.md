## Factor Vapor's 9x Invocation Multiplier
---
## Cost Optimization
---
Always apply the 9x Lambda invocation multiplier when calculating Vapor's effective cost per request; never compare raw Lambda pricing to Vapor.
---
Vapor's architecture uses multiple Lambda functions per HTTP request (router, PHP-FPM, workers, deployment hooks), making effective cost per request 9x published Lambda rates.
---
Vapor cost = raw Lambda cost × 9x multiplier. Compare to Cloud/Fargate at 1x.
---
Estimating Vapor cost using AWS Lambda pricing directly.
---
Apps with minimal queue workers/scheduled tasks (API-only) may have 4-5x multiplier; measure actual value.
---
Cost projections 9x too low; incorrect Vapor vs Cloud/Fargate comparison.
---
## Measure Actual Lambda Multiplier Monthly
---
## Monitoring
---
Always measure actual Lambda invocation count from Vapor dashboard and CloudWatch; divide by HTTP request count for your specific multiplier.
---
The 9x figure is an industry estimate; your app may have 4-15x depending on queue workers, scheduled tasks, and deployment frequency. Monthly measurement captures changes.
---
CloudWatch: 18M Lambda invocations / 2M HTTP requests = 9x multiplier.
---
Assuming 9x multiplier without verification for a queue-heavy app with actual 15x multiplier.
---
No common exceptions; measurement is the only way to know.
---
Incorrect cost projections from assumed vs actual multiplier.
---
## Track Cost Per Request Trending
---
## Monitoring
---
Always monitor Vapor's cost per request month-over-month; investigate >10% increase.
---
Multiplier changes as app architecture evolves; adding queue workers or scheduled tasks increases multiplier. Cost per request trend reveals architecture bloat before it hits the budget.
---
January: $0.000010/req. February: $0.000012/req. March: $0.000009/req. Stable. Investigate if >$0.00005/req.
---
Only monitoring aggregate monthly Vapor bill, not per-request cost.
---
Architecture bloat silently increases costs, no early warning system.
---
## Use Bref as Intermediate Migration Step
---
## Architecture
---
Consider Bref (direct Lambda PHP) as a transition step between Vapor and Cloud/Fargate when migrating.
---
Bref eliminates Vapor's 9x multiplier (1x invocation), providing immediate cost reduction without full platform migration; then migrate to Cloud/Fargate when ready.
---
Vapor → Bref on Lambda (immediate 9x savings) → Cloud/Fargate (eventual).
---
Migrating directly from Vapor to Cloud in a single high-risk sprint.
---
Very small Vapor deployments where migration effort exceeds potential savings.
---
Higher migration risk, longer payback period, no intermediate cost savings.
---
## Model Multi-Year Cost Trajectory
---
## Cost Optimization
---
Always model Vapor cost trajectory with multiplier effect for 12-24 months; Vapor cost grows super-linearly with traffic.
---
Vapor cost = base Lambda × 9x multiplier × volume; as traffic doubles, Vapor costs may increase by 18x effective Lambda invocations. This super-linear growth is the primary reason to migrate at scale.
---
2M req/month today, projected 10M in 12 months. Vapor: $1,800 → $9,000. Cloud: $500 → $1,200.
---
Monthly Vapor bill review without forward-looking cost model.
---
Cost surprises as traffic grows, reactive migration under budget pressure.
