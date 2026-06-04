# Decomposition: Reserved Instances

## Topic Overview
Reserved Instances (RIs) provide significant discounts (30-72%) on EC2, RDS, and ElastiCache in exchange for a 1- or 3-year commitment. For Laravel applications running on predictable infrastructure (database servers, cache nodes, web servers), RIs reduce compute costs substantially. Standard RIs apply to regional usage; Convertible RIs offer flexibility at slightly lower discounts. Payment options (All Upfront, Partial Upfront, No Upfront) trade cash flow for discount depth.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-reserved-instances/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Reserved Instances
- **Purpose:** Reserved Instances (RIs) provide significant discounts (30-72%) on EC2, RDS, and ElastiCache in exchange for a 1- or 3-year commitment. For Laravel applications running on predictable infrastructure (database servers, cache nodes, web servers), RIs reduce compute costs substantially. Standard RIs apply to regional usage; Convertible RIs offer flexibility at slightly lower discounts. Payment options (All Upfront, Partial Upfront, No Upfront) trade cash flow for discount depth.
- **Difficulty:** Foundation
- **Dependencies:** - Spot Instances (ku-02), - Compute Savings Plans, - Auto Scaling Policies (ku-03)

## Dependency Graph
**Depends on:**
- Spot Instances (ku-02)
- Compute Savings Plans
- Auto Scaling Policies (ku-03)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- RIs: Predictable, always-on compute (production database, cache clusters, web server fleet baseline)
- 3-year commit: Stable workloads with no expected architecture changes in 3 years
- All Upfront: When you have capital budget and want maximum savings
- Convertible RIs: When future instance family changes are possible but workload is long-lived
- RDS RIs: Database servers that run 24/7 (production RDS, Aurora)
**Out of scope:**
- RIs: Do not use for short-lived workloads (<6 months), spot-compatible workloads, or auto-scaling groups that fluctuate significantly
- 3-year commit: Not for development/staging environments that may be decommissioned
- All Upfront: Not when cash flow constraints make upfront payment impractical (Partial Upfront better)
- RIs for spot-eligible workloads: Spot instances are cheaper than RIs; use RIs only for baseline capacity
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization