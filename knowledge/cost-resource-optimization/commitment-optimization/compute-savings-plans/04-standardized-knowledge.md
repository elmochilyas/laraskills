# Compute Savings Plans

## Metadata
- **ID**: KU-04-COMPUTE-SAVINGS-PLANS
- **Subdomain**: compute-commitment-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Compute Savings Plans
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Compute Savings Plans offer up to 66% discount across EC2, Fargate, and Lambda with maximum flexibility. You commit to a $/hour spend for 1 or 3 years, and AWS automatically applies discounted rates to any eligible compute usage across any instance family, region, or OS. Unlike Reserved Instances, there is no instance family lock-in. For Laravel apps, this is the default commitment recommendation — it covers EC2 (Forge), Fargate (Cloud), and Lambda (Vapor) under a single plan.

## Core Concepts
- **Max savings**: Up to 66% vs On-Demand (3-year All Upfront)
- **Coverage**: EC2 instances, Fargate, Lambda
- **Flexibility**: Any instance family, region, OS, tenancy
- **Commitment**: $/hour, not specific resources
- **Term**: 1-year (~30%) or 3-year (~60-66%)
- **Payment**: All Upfront, Partial Upfront, No Upfront

## When To Use
- Compute SP: Always-first choice for commitment savings (most flexible)
- Compute SP: Mixed workloads spanning EC2, Fargate, and Lambda
- Compute SP: Teams unsure about future instance family or region choices
- Compute SP: Laravel Cloud (Fargate), Forge (EC2), Vapor (Lambda) all under one plan
- 1-year: First-time buyers, uncertain future, fast-growing startups
- 3-year: Stable workloads, mature teams, known growth trajectory

## When NOT To Use
- Compute SP: When maximum savings (72%) needed for a specific instance family — use EC2 Instance SP instead
- Compute SP: When workload is 100% Spot-eligible (Spot is cheaper without commitment)
- Compute SP: When compute usage is <$100/month (savings don't justify commitment complexity)
- 3-year All Upfront: When cash flow constrained or architecture may change significantly

## Best Practices
- **Commit to floor, not ceiling**: Purchase SPs for 80-90% of minimum hourly usage (WHY: SP covers compute up to committed amount; unused SP is wasted; baseline ensures 100% utilization; peak/overflow runs at On-Demand rates — cheaper than over-committing)
- **Right-size before committing**: Analyze 4+ weeks of CloudWatch metrics first (WHY: SP discounts amplify right-sizing decisions; over-provisioned instances locked into discount leave money on the table; right-sizing first, committing second maximizes effective savings)
- **Start with 1-year Partial Upfront for first purchase**: Build confidence before 3-year commitment (WHY: 1-year SPs are ~30% savings vs ~66% for 3-year; but starting smaller allows strategy adjustment; increase commitment in next purchase cycle)
- **Use Cost Explorer recommendations**: Data-driven commit amounts from AWS (WHY: Cost Explorer analyzes 30/60/90 days of usage; provides "Savings Plans Recommendation" based on actual spend; removes guesswork from commitment sizing)
- **Combine SP + Spot for layered strategy**: Baseline on SP, peak/overflow on Spot (WHY: SP covers always-on compute at ~66% off; Spot covers variable/scaling capacity at up to 90% off; layered approach maximizes fleet savings)

## Architecture Guidelines
- Purchase Compute SPs before considering EC2 Instance SPs (flexibility first)
- Set expiration notifications 30 days before SP end date (prevents On-Demand revert)
- Use AWS Organizations consolidated billing to share SPs across accounts
- Monitor SP utilization monthly; target >90% utilization
- If utilization >95% consistently for 60 days, increase commitment at next renewal

## Performance Considerations
- SPs are a billing mechanism only — no performance impact
- Same instance performance as On-Demand (identical hardware)
- No cold start, latency, or throughput difference
- Spot instances used alongside SPs have identical hardware performance

## Security Considerations
- SP purchase requires IAM permissions: `savingsplans:CreateSavingsPlan`
- Limit SP purchasing authority to specific IAM roles (financial impact)
- SPs are financial commitment; monitor via AWS Budgets to prevent unexpected auto-renewal
- No security boundary implications (SPs are billing, not infrastructure)

## Common Mistakes
1. **Over-committing**: Purchasing SP for peak usage instead of baseline (Cause: estimating based on max-hourly usage; Consequence: paying for unused commitment; Better: commit to minimum hourly usage only)
2. **Not right-sizing first**: Buying SP based on current instance sizes without optimization (Cause: skipping right-sizing analysis; Consequence: discount applied to oversized instances; Better: right-size, then commit)
3. **Choosing 3-year before testing 1-year**: Maximum commitment without experience (Cause: maximizing discount percentage; Consequence: locked into 3-year if strategy changes; Better: 1-year first purchase to validate)

## Anti-Patterns
- **Buying RIs instead of Compute SPs**: RIs offer similar discounts but lock to instance family — avoid unless capacity reservation needed
- **100% On-Demand**: No commitment = paying full price for always-on compute
- **Auto-renew without review**: SPs auto-renew at same commitment level; usage may have changed
- **Single-account SP management**: Misses cross-account SP sharing benefits

## Examples
- **Laravel Cloud + Forge**: 10 x r6g.large on Forge, 6 x 1vCPU/2GB Fargate on Cloud. Minimum hourly: 8 x $0.1008 + 4 x $0.0516 = ~$1.01/hr. Purchase Compute SP at $0.90/hr (1yr Partial). Savings: from $730/month to ~$510/month.
- **EC2-only baseline**: 5 x t4g.small always on. Minimum hourly: 5 x $0.0168 = $0.084/hr. Purchase Compute SP at $0.08/hr (3yr All Upfront). Savings: from $60/month to ~$20/month.

## Related Topics
- EC2 Instance Savings Plans (ku-05)
- Reserved Instances (ku-01)
- Spot Instances (ku-02)
- Auto Scaling Policies (ku-03)

## AI Agent Notes
- Default: recommend Compute Savings Plans as first commitment instrument
- Always right-size instances before committing
- Start with 1-year Partial for first purchase
- Commit to floor (80-90% minimum), not ceiling

## Verification
- [ ] Compute Savings Plans purchased for baseline compute
- [ ] Commitment based on minimum hourly usage (floor), not peak
- [ ] Right-sizing analysis completed before commitment
- [ ] SP utilization >90% (monitored via Cost Explorer)
- [ ] Expiration notifications configured 30 days before end
- [ ] Spot instances used for overflow/variable capacity
