# Aurora Serverless v2 Breakeven

## Metadata
- **ID**: KU-07-AURORA-SERVERLESS-BREAKEVEN
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Aurora Serverless v2 Breakeven
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: Medium-High

## Overview
Aurora Serverless v2 breaks even with provisioned Aurora at approximately a 3:1 peak-to-trough ratio. Below this ratio, provisioned instances with Reserved Instances are cheaper; above it, Serverless v2's pay-per-use model wins. The breakeven shifts with RI coverage: with 3-year RIs, provisioned is 60% cheaper per compute-hour, requiring even higher peak-to-trough ratios for Serverless v2 to compete.

## Core Concepts
- **Breakeven ratio**: ~3:1 peak-to-trough traffic variation (on-demand vs on-demand)
- **RI impact**: Provisioned with 3-year RI is ~$0.10/ACU-equivalent vs Serverless v2 $0.12/ACU-hour (20% cheaper)
- **On-Demand comparison**: Provisioned On-Demand is ~$0.26/hour (r6g.large 8GB) vs Serverless v2 $0.12/ACU-hour (2GB)
- **ACU to instance mapping**: 4 ACUs (~8GB) ≈ r6g.large (8GB)
- **With RI, threshold shifts**: 3:1 → ~5:1 for breakeven

## When To Use
- Highly variable workloads (>5:1 peak-to-trough): Serverless v2 wins regardless of RI comparison
- Moderately variable (2:1 to 5:1): Model both options with your actual traffic pattern
- Dev/test environments: Serverless v2 with auto-pause (min ACU = 0) can be cheaper than idle provisioned
- New deployments with unpredictable traffic patterns: Serverless v2 avoids over-provisioning risk
- Hybrid: provisioned writer for steady base + Serverless v2 readers for variable read scaling

## When NOT To Use
- Steady workloads (<2:1 peak-to-trough): Provisioned with RI is 20-60% cheaper
- Workloads that benefit from RI discounts on provisioned instances
- When minimum ACU charge (0.5 ACU ~$43/month) is significant relative to total cost
- For extremely predictable workloads with flat traffic (provisioned + RI is always cheaper)
- When RDS Proxy with Aurora Serverless triggers the minimum 8 ACU trap (~$300/month)

## Best Practices
- **Run cost model with your actual 90-day traffic pattern**: Don't rely on the 3:1 rule of thumb alone (WHY: 3:1 is for on-demand vs on-demand; with RIs, the breakeven shifts to ~5:1; your specific traffic shape (diurnal, weekly, seasonal patterns) affects the calculation; model actual CloudWatch metrics)
- **Consider hybrid architecture: provisioned writer + Serverless v2 readers**: Combines RI savings with variable read scaling (WHY: writes are typically steady and predictable; reads vary with traffic; a provisioned writer gets RI discount while Serverless reader ACUs scale to match read traffic; often cheaper than either pure approach)
- **Set minimum ACU to working set size, not the absolute minimum**: Minimum 4 ACU for production databases (WHY: minimum 0.5 ACU causes buffer pool thrashing, increasing I/O costs; set minimum to hold working set in memory; 4 ACU minimum adds ~$86/month in floor cost but saves more in avoided I/O charges)
- **Factor RDS Proxy cost into breakeven**: RDS Proxy minimum 8 ACU charge (~$300/month) with Aurora Serverless (WHY: RDS Proxy scales with Aurora Serverless ACU; minimum 8 ACU charge persists even if Aurora is at 0.5 ACU; this can negate Serverless cost advantage for small workloads; use PgBouncer instead if cost-sensitive)
- **Re-evaluate quarterly as traffic patterns evolve**: Workloads change over time (WHY: a 3:1 ratio today may become 2:1 after optimization; Serverless v2 that was optimal may now be more expensive than provisioned + RI; quarterly review captures changes)

## Architecture Guidelines
- Run cost model with actual traffic pattern before choosing
- Provisioned + RI for steady workloads (<2:1 variation)
- Serverless v2 for variable workloads (>5:1 variation)
- Hybrid for workloads between 2:1 and 5:1
- Serverless v2 for dev/test regardless of ratio (auto-pause saves)
- Use Aurora Standard for dev/test; evaluate I/O-Optimized for production with high I/O

## Performance Considerations
- Serverless v2 scale-up is near-instant; scale-down is slower (minutes)
- Buffer pool hit ratio drops if min ACU is too low → increased I/O charges
- Serverless v2 does NOT have cold starts (always warm at configured min)
- At 4 ACU minimum, buffer pool performance matches provisioned r6g.large
- Write-heavy workloads may not benefit from read auto-scaling; ACU scaling responds to CPU + connections

## Security Considerations
- Same security model for Serverless v2 and provisioned Aurora
- IAM database authentication available for both
- Encryption at rest and in transit identical
- Connection pooling (RDS Proxy, PgBouncer) works with both
- Audit logging via Aurora Advanced Auditing for both

## Common Mistakes
1. **Comparing Serverless v2 On-Demand to provisioned On-Demand without RI**: RI discounts change the math significantly (Cause: comparing list prices; Consequence: Serverless v2 appears cheaper than it is; Better: model with expected RI coverage; provisioned + RI is 60% cheaper per compute-hour than on-demand)
2. **Not modeling the actual peak-to-trough ratio over 90 days**: Single-day measurements miss weekly/seasonal patterns (Cause: measuring traffic for 1-2 days; Consequence: ratio may be 2:1 on a Tuesday but 5:1 on a Sunday; Better: use 90-day CloudWatch metrics for accurate peak-to-trough calculation)
3. **Ignoring that minimum ACU charge sets a floor**: Even at 0.5 ACU, minimum cost is ~$43/month (Cause: Serverless v2 "scales to zero" in marketing, but min is 0.5 ACU; Consequence: expecting zero cost at idle; Better: for true scale-to-zero, use auto-pause (min=0) or Neon serverless)
4. **Not factoring storage and I/O costs**: Serverless v2 compute comparison ignores storage (Cause: focusing on ACU pricing; Consequence: storage costs are identical for both; I/O costs differ (Standard vs I/O-Optimized); Better: include storage and I/O in total cost comparison)

## Anti-Patterns
- **Serverless v2 for everything**: Using it for steady workloads where provisioned + RI is 60% cheaper
- **Min ACU = 0.5 in production**: Buffer pool thrashing increases I/O costs
- **No RI on provisioned**: Leaving 60% savings on table for steady workloads
- **RDS Proxy with every Serverless v2**: Minimum 8 ACU charge negates small-workload savings

## Examples
- **Variable workload (5:1 ratio)**: 4 ACU peak, 0.8 ACU trough; Serverless v2 avg = $0.29/hour; Provisioned + RI (r6g.large) = $0.10/hour → Serverless v2 is 2.9x more expensive
- **Highly variable (10:1 ratio)**: 8 ACU peak, 0.8 ACU trough; Serverless v2 avg = $0.53/hour; Provisioned + RI (r6g.xlarge) = $0.20/hour → Serverless v2 is 2.6x more expensive still... actual breakeven requires analyzing the specific duration spent at each level
- **Hybrid**: Provisioned r6g.large writer with RI ($0.10/hour) + Serverless v2 readers (variable) = best of both

## Related Topics
- Aurora Serverless v2 Pricing (ku-06)
- RDS Reserved Instances (ku-05)
- RDS Savings Plans (ku-48)
- Aurora Platform v4 (ku-09)

## AI Agent Notes
- Default: model actual 90-day traffic pattern, don't use rule of thumb alone
- Default: provisioned + RI for steady workloads; Serverless v2 for variable >5:1
- Hybrid provisioned writer + Serverless readers often optimal
- Factor RI discounts (not on-demand pricing) into comparison
- Re-evaluate quarterly as traffic patterns evolve
