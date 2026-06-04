# RDS Reserved Instances

## Metadata
- **ID**: KU-05-RDS-RESERVED
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: RDS Reserved Instances
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
RDS Reserved Instances offer up to 66% savings with 3-year All Upfront commitment on database compute costs. While effective for predictable, steady-state database workloads, RIs lock you into specific instance classes and regions. Database Savings Plans (2025+) offer more flexibility with up to 60% savings. For Aurora, Reserved Instances apply to compute (not storage/I/O), making them most valuable for long-running production databases.

## Core Concepts
- **Max savings**: Up to 66% with 3-year All Upfront (Standard RI)
- **Payment options**: All Upfront, Partial Upfront, No Upfront
- **Term lengths**: 1-year or 3-year commitments
- **Scope**: Regional (applies to any AZ in region) or Zonal (reserves capacity in specific AZ)
- **Applies to**: RDS compute only (not storage, I/O, or data transfer)
- **Convertible RIs**: Up to 54% savings, allows changing instance family within same AWS product

## When To Use
- Long-running production databases with predictable workload (24/7 availability)
- Baseline database capacity that is expected to exist for 1-3 years
- Steady workloads where traffic variation is <2:1 peak-to-trough
- Databases sized correctly based on 4-week CloudWatch utilization analysis
- Production Multi-AZ deployments (doubled RI benefit vs two instances)

## When NOT To Use
- Variable workloads >2:1 peak-to-trough (use Serverless v2 or On-Demand)
- Short-lived projects (<1 year): RI commitment exceeds project lifespan
- Databases expected to migrate to different instance family/region
- Aurora Serverless v2 (RIs not available for Serverless)
- Dev/test databases used intermittently (use On-Demand or auto-pause)
- When Database Savings Plans offer better flexibility at comparable discount

## Best Practices
- **Right-size instances before purchasing RIs**: Monitor 4 weeks of CloudWatch metrics (WHY: RI locks you into specific instance class; over-provisioned instance with RI means paying for unused capacity for 1-3 years; right-sizing typically reduces instance size by 1-2 tiers, saving 30-50% before RI discount even applies)
- **Start with 1-year Partial Upfront for new workloads**: Avoid 3-year commitment on unproven traffic (WHY: workload patterns change; 1-year Partial Upfront gives 55% savings vs 66% for 3-year All Upfront; after 1 year, migrate to Database Savings Plans for more flexibility)
- **Use Regional (not Zonal) scope for most databases**: Regional RIs apply to any AZ in region (WHY: Zonal RIs lock to one AZ; if you need to move to different AZ for capacity, Zonal RI is wasted; Regional RIs auto-apply to whatever AZ the instance runs in)
- **Consider Convertible RIs for growing workloads**: Convertible RIs allow instance family changes (WHY: Standard RIs lock instance class; Convertible RIs (54% max vs 66%) let you switch from db.r6g to db.r7g when newer generation launches; valuable if you expect to upgrade Graviton generations)
- **Combine RIs with On-Demand for burst**: Cover 80-90% of baseline with RIs, 10-20% with On-Demand (WHY: covering 100% with RI risks unused commitment; 80-90% of minimum hourly usage is safer; On-Demand covers traffic spikes; better to buy RIs after growth, not before)

## Architecture Guidelines
- RIs for steady production databases running 24/7
- On-Demand for variable workloads, dev/test, burst capacity
- Database Savings Plans for multi-instance fleets with flexibility needs
- Serverless v2 for workloads with >3:1 peak-to-trough ratio
- Let existing RIs expire and migrate to Database Savings Plans for new commitments
- Multi-AZ doubles RI benefit since both primary and standby consume compute

## Performance Considerations
- RIs are purely billing mechanism — no performance impact
- Zonal RIs guarantee capacity in specific AZ (helps with large instance availability)
- Convertible RIs allow newer generation instances for better performance
- RIs do not cover performance-related features (Performance Insights, Enhanced Monitoring)
- Storage and I/O costs are billed separately regardless of RI coverage

## Security Considerations
- RIs don't affect database security posture
- IAM database authentication works identically under RI or On-Demand
- Encryption at rest/in-transit unchanged
- RI purchase does not grant additional access or change security boundaries
- RIs apply to both single-AZ and Multi-AZ deployments equally

## Common Mistakes
1. **Buying RIs before right-sizing instances**: RI locks in oversized instance (Cause: "buy RIs first, optimize later"; Consequence: paying RI discount on capacity you don't need — 2x over-provisioning means $66 RI on $100 On-Demand still costs more than $50 right-sized instance; Better: right-size first, then buy RIs)
2. **3-year commitment on uncertain growth patterns**: Traffic may decrease or migrate to different database (Cause: max savings percentage temptation; Consequence: stuck with RIs for database that was decommissioned or migrated; Better: 1-year or Database Savings Plans for uncertain workloads)
3. **Buying RIs for Serverless v2**: RIs don't apply to Aurora Serverless (Cause: assuming RIs cover all RDS/Aurora; Consequence: RI goes unused; Serverless v2 costs are full On-Demand; Better: Don't buy RIs for Serverless v2; they don't apply)
4. **100% RI coverage with no On-Demand buffer**: No capacity for traffic spikes or unexpected growth (Cause: "maximize savings"; Consequence: traffic growth beyond RI coverage means 100% On-Demand pricing for overflow; Better: 80-90% coverage, 10-20% On-Demand buffer)

## Anti-Patterns
- **3-year All Upfront for untested workload**: Maximum commitment with zero traffic history
- **Zonal RIs without capacity planning**: Locked to AZ that may run out of capacity
- **Standard RIs for expected Graviton migration**: Can't switch to Graviton with Standard RI
- **RI for dev/staging**: Spending upfront commitment on intermittent workloads

## Examples
- **Production DB**: db.r7g.large, $200/month On-Demand, buy 3-year All Upfront RI = $68/month (66% savings)
- **Multi-AZ DB**: 2 x db.r7g.large, $400/month On-Demand, 2 RIs = $136/month total (66% savings)
- **Dev DB**: db.t4g.medium, $50/month On-Demand, no RI — use On-Demand since usage is intermittent

## Related Topics
- Compute Savings Plans (ku-01)
- RDS Savings Plans (ku-48)
- Aurora Serverless v2 Pricing (ku-06)

## AI Agent Notes
- Default: right-size before buying RIs — always
- Default: 1-year Partial Upfront for new workloads; 3-year for proven workloads
- Default: 80-90% RI coverage, 10-20% On-Demand buffer
- Regional scope preferred over Zonal
- Convertible RIs if expecting instance family migration
- Don't buy RIs for Serverless v2
