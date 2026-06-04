# RDS Database Savings Plans

## Metadata
- **ID**: KU-48-RDS-SAVINGS-PLANS
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: RDS Database Savings Plans
- **Version**: 1.0
- **Classification**: Emerging
- **Maturity**: Medium-High

## Overview
RDS Database Savings Plans (introduced 2025) offer up to 60% discount across 10 database services including RDS and Aurora. Unlike RDS Reserved Instances, they apply across instance families and regions, providing flexibility for evolving workloads. They are the recommended alternative to RDS RIs for most scenarios, especially for teams that expect database growth or migration.

## Core Concepts
- **Max savings**: Up to 60% with 3-year commitment
- **Coverage**: RDS, Aurora, and 8 other database services
- **Flexibility**: Applies across instance families, sizes, and regions
- **Payment**: $/hour commitment, not instance-specific
- **vs RDS RI**: More flexible, slightly lower max discount (60% vs 66%)
- **Unused commitment**: $/hour not used is forfeited (like Compute Savings Plans)

## When To Use
- Teams expecting database growth or instance family migration (flexibility matters)
- Multi-instance database fleets with mixed instance types
- Preference for flexibility over maximum possible discount
- New commitments: SPs are preferred over RIs for most scenarios
- Organizations already using Compute Savings Plans (familiar purchasing model)

## When NOT To Use
- Static workloads with no expected changes in 3 years (RIs at 66% beat SPs at 60%)
- Single database instance with predictable usage (RI simpler to manage)
- Aurora Serverless v2 (not covered by Database Savings Plans)
- Organizations that prefer maximum discount over flexibility
- Very small deployments where commitment analysis is not cost-effective

## Best Practices
- **Prefer Database Savings Plans over RDS RIs for new commitments**: SPs offer flexibility at only 6% lower max discount (WHY: SPs apply across instance families and regions; if you migrate from r6g to r7g, SPs auto-apply; RIs would need modification or forfeiture; the 6% difference in max savings is worth the flexibility)
- **Commit to 80-90% of minimum hourly database spend**: Floor, not ceiling (WHY: SPs are $/hour commitment; unused commitment is forfeited; covering 80-90% of minimum hourly usage ensures high utilization while leaving room for traffic variation)
- **Let existing RDS RIs expire, replace with SPs**: Don't modify or cancel RIs early (WHY: RIs are paid upfront; canceling forfeits remaining value; let existing RIs expire naturally; repurchase as SPs for better flexibility going forward)
- **Use 3-year SP for stable production databases**: 60% savings vs 30% for 1-year (WHY: production databases rarely change dramatically; 3-year commitment is low risk for stable workloads; 2x savings vs 1-year)
- **Combine SP with On-Demand for burst**: SP covers baseline; On-Demand covers spikes (WHY: SP + On-Demand cost is lower than 100% SP with unused commitment, or 100% On-Demand with no commitment; optimize by setting SP at 80% of peak, not 100%)

## Architecture Guidelines
- Database SPs for provisioned RDS and Aurora (not Serverless v2)
- RDS RIs for maximum savings on static, single-instance deployments
- On-Demand for dev/test, variable workloads, burst capacity
- Serverless v2 for workloads >3:1 peak-to-trough (no SP/RI available)
- SPs cover compute only, not storage, I/O, or data transfer

## Performance Considerations
- SPs are purely billing mechanism — no performance impact
- Same database performance whether covered by SP, RI, or On-Demand
- SPs don't affect failover, read replica, or backup behavior
- No capacity reservation benefit (unlike Zonal RIs)
- SPs co-apply with existing RIs (RIs apply first, then SPs)

## Security Considerations
- SP purchase does not require additional IAM permissions beyond cost management
- No impact on database encryption, authentication, or network security
- SP utilization data is accessible via Cost Explorer for billing teams only
- No change to compliance posture or audit requirements
- SPs are organizational-level commitments; individual accounts benefit automatically

## Common Mistakes
1. **Committing to 100% of current spend with SPs**: No room for growth, unused commitment forfeited (Cause: "maximize savings"; Consequence: traffic drops 10% → 10% of SP commitment wasted; Better: commit to 80-90% of minimum hourly spend)
2. **Not switching from RDS RIs to SPs upon RI expiry**: Auto-renews RI instead of evaluating SP (Cause: RI auto-renewal default; Consequence: locked into RI for another term; Better: disable RI auto-renewal 60 days before expiry; evaluate SP as replacement)
3. **Assuming SP covers Aurora Serverless v2**: SPs apply to provisioned instances only (Cause: "Database Savings Plans" sounds comprehensive; Consequence: expecting SP discount on Serverless v2; Better: Serverless v2 is not covered by any commitment model)
4. **Ignoring unused commitment monitoring**: SP utilization dropping below 90% (Cause: "set and forget"; Consequence: paying for unused compute commitment; Better: monitor SP utilization monthly; adjust commitment if consistently <90%)

## Anti-Patterns
- **3-year SP for startup with uncertain future**: Long commitment for unstable business
- **SP for dev/test databases**: Commitment pricing for intermittent workloads
- **100% SP coverage with no On-Demand**: No flexibility for traffic variation
- **SP + RI overlap**: Both apply to same usage as waste; choose one

## Examples
- **Production Aurora**: db.r7g.large ($200/month), commit $160/hour SP (80% coverage), save ~$96/month
- **Multi-DB fleet**: 3 x r6g.large + 2 x r7g.xlarge ($1,100/month), SP at $880/month (80%), save ~$528/month
- **Growing app**: One db.r7g.large expected to grow to r7g.xlarge; SP auto-applies to new instance without modification

## Related Topics
- RDS Reserved Instances (ku-05)
- Compute Savings Plans (ku-01)
- Aurora Serverless v2 Pricing (ku-06)

## AI Agent Notes
- Default: prefer SP over RIs for new database commitments
- Default: commit to 80-90% of minimum hourly spend
- Default: 3-year for stable, 1-year for uncertain workloads
- SP does not cover Aurora Serverless v2
- Monitor SP utilization monthly; adjust if <90%
