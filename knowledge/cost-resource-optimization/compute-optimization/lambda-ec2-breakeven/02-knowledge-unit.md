# K23: Lambda vs EC2 Breakeven Analysis

## Metadata
- **ID**: K23
- **Subdomain**: Compute Optimization
- **Topic**: Lambda vs EC2 Breakeven
- **Source**: Industry Research, CloudZero (2026), Medium Analysis
- **Reliability**: Medium-High

## Executive Summary
The breakeven between Lambda and EC2 occurs at approximately 30 million requests per month at 256MB memory and 500ms average duration. Below this volume, Lambda's scale-to-zero makes it cheaper; above it, EC2's flat-rate pricing wins. The crossover shifts with memory allocation, execution duration, and utilization patterns. At 256MB/500ms, the breakeven is ~30M req/month; longer durations or higher memory push the breakeven lower.

## Core Concepts
- **Breakeven formula**: Lambda cost = request cost + duration cost; EC2 cost = instance hourly rate × hours running
- **Crossover point**: ~30M requests/month at 256MB/500ms avg (1,500 compute-seconds/minute)
- **Key variable**: Utilization percentage — Lambda idle costs $0; EC2 costs the same at 1% or 100% utilization
- **Memory sensitivity**: Doubling memory to 512MB halves the breakeven (~15M requests)
- **Duration sensitivity**: Doubling execution time to 1000ms halves breakeven proportionally

## Mental Models
- **Bar tab vs cover charge**: Lambda charges per drink (execution); EC2 charges for the table (instance hour). Heavy drinkers prefer cover charge.
- **Taxi vs rental car**: Lambda for short trips; EC2/Fargate for all-day driving
- **Iceberg**: Lambda's per-unit cost is higher, but it melts (goes to zero) when idle

## Internal Mechanics
Lambda cost per million requests at 256MB/500ms = $0.20 (requests) + $0.0000166667 × 256/1024 × 0.5 × 1,000,000 = $0.20 + $2.08 = $2.28. EC2 equivalent: t4g.small at ~$12/month handles ~400K requests/day (at 500ms each) before saturation. At 30M requests/month = 1M/day, you need ~2.5 t4g.small instances = ~$30/month. Lambda at 30M req: 30 × $2.28 = $68.40. Breakeven shifts to EC2's favor around 13M req/month.

## Patterns
- **Spiky patterns favor Lambda**: Workloads with 50% idle time see Lambda cost at 50% of EC2 equivalent
- **Steady-state favors EC2**: Below ~20% utilization variance, EC2 beats Lambda on cost
- **Hybrid approach**: Auto-scale EC2 group for baseline + Lambda for overflow (complex but most cost-efficient)
- **Fargate middle ground**: Serverless with predictable billing, sits between Lambda and EC2 on cost spectrum

## Architectural Decisions
- Use Lambda for APIs under 5M requests/month, CRON jobs, event handlers
- Use EC2/Fargate for baseline production web serving above 20M requests/month
- Evaluate Provisioned Concurrency: if needed, EC2 may be cheaper
- Consider Fargate Spot for queue workers at 70% discount with better economics than Lambda

## Tradeoffs
- **Predictable cost (EC2) vs usage-proportional cost (Lambda)**: Lambda costs are harder to forecast month-over-month
- **Cold start overhead (Lambda) vs always-on cost (EC2)**: EC2 warm instances cost more but never have cold starts
- **DevOps overhead vs vendor lock-in**: Managing EC2 gives portability; Lambda is harder to migrate off AWS

## Performance Considerations
- Lambda cold starts add 200-1000ms for PHP (Laravel/Bref) — problematic for user-facing endpoints
- EC2 gives full CPU control; Lambda shares CPU proportional to memory allocation
- Memory cap of 10,240MB per Lambda function; EC2 instances offer up to 768GB

## Production Considerations
- Track actual utilization before committing to either model; use 90-day Cost Explorer analysis
- Consider Fargate as middle ground: no server management with more cost-predictable billing
- Include operational overhead in comparison: Lambda reduces patching, monitoring, capacity planning costs

## Common Mistakes
- Comparing peak-only Lambda cost to average EC2 cost (ignoring EC2 headroom)
- Forgetting EC2 includes OS overhead, patching time, and monitoring agent costs
- Assuming Lambda's per-GB-second rate is the only cost (provisioned concurrency, VPC networking add costs)
- Not factoring Lambda@Edge or Lambda SnapStart availability constraints

## Failure Modes
- Traffic growth above breakeven without switching from Lambda to EC2 — costs grow linearly with no ceiling
- Over-provisioning EC2 "for safety" — Lambda conservatism leads to 20-40% over-spend on EC2
- Multi-region Lambda causing data transfer costs that shift breakeven

## Ecosystem Usage
- **Laravel Vapor**: Forced Lambda path; breakeven analysis critical before committing at scale ($5K+/month)
- **Laravel Forge**: EC2 path; better for sustained traffic above breakeven
- **Laravel Cloud**: Fargate container path; emerges as compromise with different breakeven

## Related Knowledge Units
- K22: Lambda Pricing Breakdown
- K24: Fargate Pricing Analysis
- K26: Graviton Price-Performance
- K27: Laravel Cloud vs Vapor

## Research Notes
Breakeven models from 2020 assumed higher Lambda costs. With Compute Savings Plans extending to Lambda (17% discount), the crossover point shifts ~15% higher toward Lambda. ARM Lambda functions further shift breakeven (34% cheaper). For Laravel workloads specifically, Fargate with Octane hits the cost-performance sweet spot for most production applications at medium-to-high traffic volumes.
