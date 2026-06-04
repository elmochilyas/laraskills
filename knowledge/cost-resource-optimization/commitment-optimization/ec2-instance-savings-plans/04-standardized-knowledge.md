# EC2 Instance Savings Plans

## Metadata
- **ID**: KU-05-EC2-INSTANCE-SAVINGS-PLANS
- **Subdomain**: compute-commitment-optimization
- **Domain**: cost-resource-optimization
- **Topic**: EC2 Instance Savings Plans
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
EC2 Instance Savings Plans offer up to 72% discount (vs 66% for Compute SPs) but lock you to a specific instance family in a specific region. They are optimal for teams with stable, predictable workloads that won't change instance family or region. For Laravel apps sure to stay on r6g or t4g instances for the long term, this saves an additional 6% over Compute SPs. The tradeoff is zero flexibility — if you migrate to Graviton or different instance families, the SP becomes stranded.

## Core Concepts
- **Max savings**: Up to 72% vs On-Demand (3-year All Upfront)
- **Lock-in**: Instance family and region (e.g., all m7g in us-east-1)
- **Size flexibility**: Can change instance sizes within the family
- **vs Compute SP**: +6% max savings in exchange for less flexibility
- **Payment**: All Upfront, Partial Upfront, No Upfront
- **Stranded SP**: Unused commitment when instance family changes

## When To Use
- EC2 Instance SP: Stable instance family known for 3+ years
- EC2 Instance SP: Maximum discount required (72% vs 66% for Compute SP)
- EC2 Instance SP: No plans to migrate to Graviton or different instance types
- EC2 Instance SP: Single-family fleet (all web servers on r6g.large)
- EC2 Instance SP: As second layer on top of Compute SP for highest-savings baseline

## When NOT To Use
- EC2 Instance SP: Uncertain about future instance family or region
- EC2 Instance SP: Planning Graviton migration (e.g., moving from x86 to ARM)
- EC2 Instance SP: Mixed instance family fleet (Compute SP covers all families)
- EC2 Instance SP: Workloads on Fargate or Lambda (Instance SP doesn't cover these)
- EC2 Instance SP: First-time commitment buyer (start with Compute SP for flexibility)

## Best Practices
- **Layer EC2 Instance SP on top of Compute SP**: Use Compute SP for flexible workloads, Instance SP for known baseline (WHY: Compute SP covers any instance family at ~66% off; EC2 Instance SP covers a specific family at ~72% off; layering maximizes savings across the fleet)
- **Only commit for instance families with 3-year stability**: r6g, m7g, t4g — common Laravel instance types (WHY: if you switch families mid-commit, the SP applies to zero usage; stranded SP is pure waste; choose families unlikely to change in 3 years)
- **Use size flexibility within the family**: Can switch between 2xlarge and 4xlarge within same family (WHY: EC2 Instance SP applies to normalized compute units; scaling up/down within family maintains discount; no need to purchase exact instance size)
- **Purchase regional SPs, not zonal**: Regional SPs cover any AZ in the region (WHY: zonal SPs lock to specific AZ; regional SPs work with load-balanced, multi-AZ deployments common in production Laravel apps)

## Architecture Guidelines
- Use EC2 Instance SP only after Compute SP baseline is established
- Purchase for the most expensive, most stable instance type first
- Combine with Auto Scaling: SP covers baseline, Spot covers scaling
- Monitor stranded SP ratio (unused commitment / total commitment) — target <5%
- Set up Cost Explorer alerts for SP utilization drops below 90%

## Performance Considerations
- Same as On-Demand performance (purely billing mechanism)
- Size flexibility allows instance upgrades within family (e.g., r6g.large to r6g.xlarge) at same discount
- No performance degradation from SP billing

## Security Considerations
- Same IAM restrictions as Compute SPs
- Higher financial risk due to lock-in (stranded SPs are unrecoverable cost)
- Limit purchasing authority to senior FinOps roles
- Monitor via AWS Budgets for auto-renewal prevention

## Common Mistakes
1. **Buying EC2 Instance SP before Compute SP**: Maximum savings but minimum flexibility (Cause: maximizing discount percentage; Consequence: stranded SP if instance strategy changes; Better: Compute SP first, Instance SP second)
2. **No size flexibility awareness**: Purchasing for exact instance size (Cause: treating SP like RI; Consequence: missing savings from size upgrades within family; Better: use normalized units — any size within family gets same discount)
3. **Single-family lock-in for heterogeneous fleet**: Instance SP on family used by 30% of fleet (Cause: applying SP to largest family only; Consequence: 70% of fleet gets no SP discount; Better: Compute SP for heterogeneous fleet)

## Anti-Patterns
- **Instance SP for Fargate or Lambda**: Doesn't apply — these services need Compute SP
- **Instance SP for development accounts**: Dev environments change instance families frequently
- **Auto-renew without review**: Especially dangerous for Instance SPs (lock-in may no longer apply)

## Examples
- **Stable r6g fleet**: 20 x r6g.large production web servers, no change expected for 3 years. Purchase EC2 Instance SP for $2.02/hr (3yr All Upfront). Savings: from $1,450/month On-Demand to ~$406/month (72% off).
- **Layered strategy**: Compute SP at $1.00/hr covers mixed fleet + Fargate. EC2 Instance SP at $0.50/hr covers r6g baseline. Combined savings: ~68% vs On-Demand.

## Related Topics
- Compute Savings Plans (ku-04)
- Reserved Instances (ku-01)
- Spot Instances (ku-02)
- Spot Interruption Costs (ku-07)

## AI Agent Notes
- Default: recommend Compute SP first; only suggest EC2 Instance SP when instance family is stable
- Layer Instance SP on top of Compute SP for maximum savings
- Never purchase EC2 Instance SP for heterogeneous or evolving fleets
- Monitor stranded SP ratio

## Verification
- [ ] Compute Savings Plans baseline established before EC2 Instance SP
- [ ] Instance family stable with 3+ year outlook
- [ ] EC2 Instance SP layered on top of Compute SP
- [ ] Regional SP purchased (not zonal)
- [ ] Size flexibility understood and utilized
- [ ] Stranded SP ratio <5%
