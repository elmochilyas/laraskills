# Decomposition: RDS Savings Plans

## Topic Overview
RDS Database Savings Plans (introduced 2025) offer up to 60% discount across 10 database services including RDS and Aurora. Unlike RDS Reserved Instances, they apply across instance families and regions, providing flexibility for evolving workloads. They are the recommended alternative to RDS RIs for most scenarios, especially for teams that expect database growth or migration.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k48-rds-savings-plans/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### RDS Savings Plans
- **Purpose:** RDS Database Savings Plans (introduced 2025) offer up to 60% discount across 10 database services including RDS and Aurora.
- **Difficulty:** Intermediate
- **Dependencies:** K05: RDS Reserved Instances, K01: Compute Savings Plans, K06: Aurora Serverless v2 Pricing

## Dependency Graph
**Depends on:**
- K05: RDS Reserved Instances
- K01: Compute Savings Plans
- K06: Aurora Serverless v2 Pricing

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Max savings
- Coverage
- Flexibility
- Payment
- vs RDS RI
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K05: RDS Reserved Instances, K01: Compute Savings Plans, K06: Aurora Serverless v2 Pricing

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization