# KU-01-RESERVED-INSTANCES: Reserved Instances

## Metadata
- **ID**: KU-01-RESERVED-INSTANCES
- **Subdomain**: Commitment Optimization
- **Topic**: Reserved Instances
- **Source**: Commitment Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Reserved Instances (RIs) provide significant discounts (30-72%) on EC2, RDS, and ElastiCache in exchange for a 1- or 3-year commitment. For Laravel applications running on predictable infrastructure (database servers, cache nodes, web servers), RIs reduce compute costs substantially. Standard RIs apply to regional usage; Convertible RIs offer flexibility at slightly lower discounts. Payment options (All Upfront, Partial Upfront, No Upfront) trade cash flow for discount depth.

## Core Concepts
- **Standard RI**: 72% discount (3yr All Upfront); fixed attributes (instance family, region); highest savings
- **Convertible RI**: 54% discount (3yr All Upfront); can change instance family, OS, tenancy; lower savings than Standard
- **Payment options**: All Upfront (maximum discount) > Partial Upfront > No Upfront (minimum discount)
- **Term**: 1-year (lower discount) vs 3-year (higher discount); choose based on workload stability
- **Regional vs zonal RIs**: Regional RI covers any AZ in region; Zonal RI reserves capacity in specific AZ
- **RDS RI**: Separate RI purchase for RDS instances; 30-60% discount depending on term and payment

## Mental Models
- Default: purchase RIs for baseline always-on compute only
- Always include RDS and ElastiCache RI recommendations alongside EC2
- Use 3-year All Upfront for stable production workloads

## Internal Mechanics
- RIs do not affect compute performance (same instance performance as On-Demand)
- Capacity reservation (zonal RI) ensures instance availability during contention events
- No performance penalty for Convertible vs Standard RI (same underlying instance)
- RDS RIs apply at the instance level; no replication performance impact

## Patterns
- Purchase RIs for baseline capacity only
- Use All Upfront 3-year for maximum savings
- Separate RIs for database and compute
- Monitor RI utilization
- Use regional RIs for flexibility

## Architectural Decisions
- Purchase RIs in the region where production runs
- Combine RIs with Auto Scaling: keep baseline instances running via RI coverage, scale up with On-Demand/Spot
- Use AWS Organizations to share RIs across accounts (consolidated billing)
- Purchase RIs for: production web servers (baseline), production RDS/Aurora, production ElastiCache nodes
- Do NOT purchase RIs for: staging/development, CI/CD runners, ephemeral workers
- For multi-account setups, purchase RIs in a central "management" account; benefits apply to all accounts

## Tradeoffs
**When To Use:**
- RIs: Predictable, always-on compute (production database, cache clusters, web server fleet baseline)
- 3-year commit: Stable workloads with no expected architecture changes in 3 years
- All Upfront: When you have capital budget and want maximum savings
- Convertible RIs: When future instance family changes are possible but workload is long-lived
- RDS RIs: Database servers that run 24/7 (production RDS, Aurora)

**When NOT To Use:**
- RIs: Do not use for short-lived workloads (<6 months), spot-compatible workloads, or auto-scaling groups that fluctuate significantly
- 3-year commit: Not for development/staging environments that may be decommissioned
- All Upfront: Not when cash flow constraints make upfront payment impractical (Partial Upfront better)
- RIs for spot-eligible workloads: Spot instances are cheaper than RIs; use RIs only for baseline capacity

## Performance Considerations
- RIs do not affect compute performance (same instance performance as On-Demand)
- Capacity reservation (zonal RI) ensures instance availability during contention events
- No performance penalty for Convertible vs Standard RI (same underlying instance)
- RDS RIs apply at the instance level; no replication performance impact

## Production Considerations
- RI purchase requires IAM permissions: `ec2:DescribeReservedInstances`, `ec2:PurchaseReservedInstancesOffering`
- Limit RI purchasing authority to specific IAM roles (financial impact)
- RIs are financial commitment; monitor via AWS Budgets to prevent unexpected renewals
- Unused RIs can be sold in the Reserved Instance Marketplace (third-party, less discount)

## Common Mistakes
- **Over-purchasing RIs**: Buying more RI capacity than baseline needs (Cause: estimating peak instead of baseline; Consequence: paying for unused capacity at RI rate; Better: purchase RI for the 24/7 minimum instance count only)
- **No RDS RIs**: Purchasing EC2 RIs but forgetting RDS/Aurora RIs (Cause: treating RDS as separate from EC2; Consequence: paying On-Demand for 24/7 production database; Better: purchase RDS RIs for all production database instances)
- **1-year Partial Upfront for stable workload**: Choosing 1-year Partial over 3-year All Upfront (Cause: avoiding commitment; Consequence: leaving 20-30% additional savings on the table; Better: 3-year All Upfront for truly stable production workloads)

## Failure Modes
- **Buying RIs for all instances including variable capacity**: Wastes savings on underutilized RIs
- **No RI for production database**: Database is the most expensive always-on resource; RIs have highest impact there
- **Setting RI to auto-renew**: Auto-renewal continues commitment for workloads that may be decommissioned

## Ecosystem Usage
- **Stable production**: 6 x r6g.large web servers always on; purchase 6 Standard RIs (3yr All Upfront). Auto Scaling adds 0-4 more on Spot during peak.
- **RDS RI**: Production Aurora db.r6g.large; purchase 1 RDS RI (3yr All Upfront, ~60% discount)
- **ElastiCache RI**: Redis cache.r6g.large cluster; purchase 2 RIs for primary + replica

## Related Knowledge Units
- Spot Instances (ku-02)
- Compute Savings Plans
- Auto Scaling Policies (ku-03)

## Research Notes
Derived from Commitment Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.