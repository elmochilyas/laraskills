# Aurora Platform v4

## Metadata
- **ID**: KU-09-AURORA-PLATFORM-V4
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Aurora Platform v4
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Aurora Platform Version 4 (released April 2026) delivers 27% faster query completion and 28% lower cost compared to v3. The improvements come from optimized distributed storage, improved query execution, and better I/O path efficiency. This is a free upgrade (no migration cost) for existing Aurora users and directly reduces both performance bottlenecks and database spend.

## Core Concepts
- **Query speed**: 27% faster completion vs v3
- **Cost reduction**: 28% lower total cost vs v3
- **Free upgrade**: No additional licensing or migration fee
- **Compatibility**: Full backward compatibility with v3
- **Storage improvements**: Optimized distributed storage layer reduces I/O latency

## When To Use
- Existing Aurora v3 users: upgrade immediately — 28% cost reduction with zero effort
- New Aurora deployments: use v4 by default (no reason to use v3)
- Any Aurora workload: v4 improves both performance and cost simultaneously
- Upgrade during maintenance window: automatic process, minimal to no downtime

## When NOT To Use
- Non-Aurora databases (RDS, Neon, Supabase): v4 is Aurora-specific
- Workloads pinned to v3 for compatibility reasons (rare, check release notes)
- Databases undergoing active migration to different platform (don't upgrade before migration)
- Systems where Aurora v4 is not yet available in the target region (check AWS regional availability)

## Best Practices
- **Upgrade from v3 to v4 immediately**: The 28% cost reduction requires no code changes (WHY: v4 is fully backward compatible; the upgrade process is simple parameter group change; there is no downside to upgrading; combined with 27% faster queries, you get both cost and performance improvements)
- **Re-evaluate instance sizing after upgrade**: v4's 27% performance improvement may allow downsizing (WHY: if your instance is sized for v3 performance, v4's improvement means same performance with less compute; consider reducing instance size by one tier after upgrade and monitoring for 2 weeks)
- **Upgrade during maintenance window for zero-downtime**: Aurora handles v4 migration with minimal connection interruption (WHY: Aurora performs engine upgrade with <30s downtime; schedule during low-traffic period; application retry logic handles the brief interruption)
- **Test query performance improvements**: v4 may change query execution plans (WHY: 27% faster completion is average; some queries may see more or less improvement; benchmark critical queries before and after upgrade to identify any regressions)
- **Combine v4 with Graviton for maximum savings**: v4 cost reduction + Graviton 20% savings = ~42% total reduction (WHY: v4 and Graviton are independent optimizations; v4 savings come from storage/execution improvements; Graviton savings from ARM pricing; stack both for maximum benefit)

## Architecture Guidelines
- v4 is the default platform version for all new Aurora deployments
- Upgrade existing v3 clusters during next maintenance window
- No architectural changes needed — v4 is a transparent upgrade
- Combine v4 with I/O-Optimized configuration if I/O charges exceed 25% of compute
- Monitor Performance Insights after upgrade to identify query pattern changes

## Performance Considerations
- 27% faster query completion on average across workloads
- Optimized I/O path reduces storage latency
- No change to connection limits, ACU scaling, or failover behavior
- Write-heavy workloads see proportionally more improvement due to storage optimizations
- Read replica performance also improves with v4

## Security Considerations
- v4 includes latest security patches and TLS support
- Same encryption at rest and in transit as v3
- No changes to IAM database authentication
- Upgrade process follows existing security compliance requirements
- No new attack surface introduced

## Common Mistakes
1. **Delaying upgrade to v4**: Waiting months for "stability" when v4 is backward compatible (Cause: "don't upgrade immediately" conservative ops practice; Consequence: paying 28% more than necessary for months; Better: v4 is production-tested; upgrade within 30 days of availability)
2. **Not right-sizing after upgrade**: Keeping same instance class despite 27% performance improvement (Cause: "if it works, don't change it"; Consequence: over-provisioned instance, missing additional savings; Better: evaluate instance downsizing after 2 weeks of v4 metrics)
3. **Ignoring v4 regional availability**: v4 may not be available in all AWS regions at launch (Cause: assuming global availability; Consequence: cannot upgrade in region where v4 is not yet deployed; Better: check AWS regional table or wait for regional rollout)
4. **Not testing query execution plan changes**: v4 optimizer changes may affect specific queries (Cause: "backward compatible" assumption; Consequence: rare regression on specific query patterns; Better: run Performance Insights before and after upgrade on critical queries)

## Anti-Patterns
- **Staying on v3 indefinitely**: Paying 28% extra for no benefit
- **Skipping instance rightsizing after v4**: Leaving savings on the table
- **Upgrade without rollback plan**: Aurora supports rollback for limited window
- **Not checking Aurora v4 prerequisites**: Some parameter group settings may need adjustment

## Examples
- **Pre-v4**: r6g.large Aurora instance, $200/month compute, 1000 IOPS average
- **Post-v4**: Same r6g.large, $144/month (28% reduction), 1270 IOPS effective (27% improvement)
- **After rightsizing**: Downsize to r6g.small (if performance allows), $72/month = 64% total reduction

## Related Topics
- Aurora Serverless v2 Pricing (ku-06)
- Aurora Serverless v2 Breakeven (ku-07)
- RDS Reserved Instances (ku-05)

## AI Agent Notes
- Default: upgrade Aurora v3 to v4 immediately — 28% cost reduction, free, no code changes
- Default: evaluate instance downsizing after 2 weeks on v4
- Combine v4 + Graviton for ~42% total database cost reduction
- Monitor query performance for 2 weeks post-upgrade
- v4 is a free optimization — no reason to delay
