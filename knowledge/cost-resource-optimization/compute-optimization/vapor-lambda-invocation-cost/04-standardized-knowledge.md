# Vapor Lambda Invocation Multiplier

## Metadata
- **ID**: KU-28-VAPOR-MULTIPLIER
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Vapor Lambda Invocation Cost
- **Version**: 1.0
- **Classification**: Speculative
- **Maturity**: Medium

## Overview
A single HTTP request via Laravel Vapor can count as 9+ Lambda invocations due to Vapor's architectural layers: request handling, PHP-FPM bridge, worker processes, and auxiliary functions. This multiplier effect means Vapor's effective cost per request is significantly higher than raw Lambda pricing suggests. Understanding this multiplier is critical when comparing Vapor against Cloud (Fargate) or Forge (EC2).

## Core Concepts
- **Multiplier source**: Vapor uses multiple Lambda functions per HTTP request (router → PHP-FPM bridge → application → workers → response)
- **9x estimate**: Each HTTP request triggers ~9+ Lambda invocations including front controller, PHP-FPM bridge, queue worker polling, deployment hooks
- **Impact**: Effectively multiplies Lambda cost by 9x vs running the same workload directly on Lambda via Bref
- **Hidden costs**: Vapor's scheduled tasks, queue workers, and deployment scripts run as additional Lambda functions
- **Bref comparison**: Direct Lambda (Bref PHP runtime) = 1 invocation per HTTP request

## When To Use
- Estimating Vapor's true cost before comparing with Cloud or Forge
- Building migration business case from Vapor to Cloud/Fargate
- Understanding why Vapor becomes uneconomical above ~20M requests/month
- Cost allocation: attributing Lambda costs to specific Vapor features (web, queues, cron)
- Architecture review: evaluating Vapor's overhead vs alternatives

## When NOT To Use
- Ignoring the multiplier in Vapor cost projections (leads to incorrect savings estimates)
- Assuming the multiplier is identical for all Vapor apps (varies by architecture)
- Comparing Vapor to raw Lambda pricing without the multiplier
- Using the 9x figure as exact; it's an estimate that varies
- Dismissing Vapor entirely based on multiplier without considering value of managed deployment

## Best Practices
- **Measure your actual Lambda invocation multiplier**: Use Vapor cost dashboard + CloudWatch metrics (WHY: the 9x figure is an industry estimate; your app may have 4-15x depending on queue workers, scheduled tasks, and deployment frequency; measure over 30 days for accuracy)
- **Factor multiplier into all Vapor vs Cloud vs Forge comparisons**: Never compare raw Lambda pricing to Fargate/EC2 (WHY: Vapor's effective cost per request = raw Lambda cost × multiplier; a $0.00000228/request Lambda cost becomes $0.0000205/request with 9x; Fargate at ~$0.000004/request with Octane is suddenly 5x cheaper)
- **Track per-request cost trending monthly**: Multiplier changes as app architecture evolves (WHY: adding queue workers increases multiplier; adding scheduled tasks increases multiplier; per-request cost trend reveals architecture bloat before it hits the budget)
- **Use Bref as migration intermediate step**: Vapor → Bref (direct Lambda) → Cloud (Fargate) for gradual migration (WHY: Bref eliminates the multiplier (1x invocation); immediate cost reduction without platform change; then migrate to Cloud/Fargate when ready)
- **Model multi-year cost trajectory**: Multiplier effect compounds with traffic growth (WHY: Vapor cost = base Lambda × multiplier × volume; as volume grows, multiplier amplifies growth; a 2x traffic increase = 2x cost increase, not 9x; but 2x traffic on Vapor = 18x more Lambda invocations vs a Bref-based alternative)

## Architecture Guidelines
- Bref + custom deployment for Lambda-native Laravel at scale (1x multiplier)
- Cloud (Fargate) for medium-to-high volume (no multiplier, flat container pricing)
- Forge (EC2) for maximum scale with cost optimization (no multiplier, Graviton + Savings Plans)
- Vapor only for small-to-medium deployments where managed convenience justifies premium
- Monitor per-request cost; set alert if it exceeds $0.00005/request

## Performance Considerations
- The multiplier doesn't affect raw request latency (all invocations happen in parallel)
- Queue-heavy apps see higher multipliers due to Lambda-based workers
- API-only apps may see lower multipliers (~4-5x) if workers are minimal
- PHP-FPM on Lambda is slower than Octane on Fargate/EC2
- Deployment frequency adds to monthly invocation count

## Security Considerations
- More Lambda invocations = more functions with IAM roles (larger attack surface)
- Vapor deployment scripts run with elevated permissions
- Each Lambda function in the chain is a potential security boundary
- Monitor for unexpected Lambda invocation patterns (possible abuse via your API)
- Vapor manages SSL/TLS at CloudFront level centrally

## Common Mistakes
1. **Estimating Vapor cost using raw Lambda pricing**: Ignoring the 9x multiplier (Cause: AWS publishes Lambda pricing; Vapor's multiplier is not prominently documented; Consequence: cost projections are 9x too low; Better: use Vapor's actual bill, not raw Lambda pricing)
2. **Not monitoring per-request cost trending**: Multiplier changes silently as app grows (Cause: cost monitoring is at aggregate level; Consequence: per-request cost increases without detection; Better: track cost/request monthly; investigate >10% month-over-month increase)
3. **Comparing Vapor cost to Fargate without multiplier**: Vapor appears competitive in raw comparisons (Cause: comparing Lambda list price to Fargate list price; Consequence: Fargate is actually 3-5x cheaper for Vapor-comparable workloads due to multiplier elimination; Better: factor multiplier into all comparisons)
4. **Assuming invocation count matches request count**: Background workers and scheduled tasks inflate multiplier (Cause: focusing on web requests only; Consequence: underestimating Vapor's total cost by 20-40%; Better: measure all Lambda invocations across all Vapor services)

## Anti-Patterns
- **Vapor cost calculated on HTTP request count alone**: Ignores 60%+ of actual Lambda invocations
- **Scaling traffic on Vapor without recalculating breakeven**: Cost growth is super-linear
- **Assuming multiplier is fixed**: Changes with architecture; re-measure quarterly
- **No cost monitoring per Vapor feature**: Can't identify which feature drives Lambda costs

## Examples
- **Small Vapor app (1M req/month)**: 9M Lambda invocations, raw Lambda ~$20, Vapor multiplier adds ~$160 — total ~$180/month; Cloud would cost ~$50-100/month
- **Medium Vapor app (20M req/month)**: 180M Lambda invocations, raw Lambda ~$400, Vapor multiplier adds ~$3,200 — total ~$3,600/month; Cloud would cost ~$800-1,200/month
- **Large Vapor app (500M req/month)**: 4.5B Lambda invocations, raw Lambda ~$10,000, Vapor multiplier adds ~$80,000 — total $90,000/month; Cloud Private would cost ~$54,000/month (Trybe case)

## Related Topics
- Laravel Cloud vs Vapor (ku-27)
- Lambda Pricing Breakdown (ku-22)
- Lambda vs EC2 Breakeven (ku-23)
- Trybe Cost Reduction (ku-41)

## AI Agent Notes
- Default: always factor 9x multiplier into Vapor cost calculations
- Default: measure actual multiplier from Vapor bill + CloudWatch
- Multiplier varies by app architecture; re-measure quarterly
- Bref eliminates multiplier for Lambda-native Laravel
- Multiplier is the primary reason Vapor becomes uneconomical >20M req/month
