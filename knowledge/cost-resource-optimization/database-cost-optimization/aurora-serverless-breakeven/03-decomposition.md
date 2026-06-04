# Decomposition: Aurora Serverless v2 Breakeven

## Topic Overview
Aurora Serverless v2 breaks even with provisioned Aurora at approximately a 3:1 peak-to-trough ratio. Below this ratio, provisioned instances with Reserved Instances are cheaper; above it, Serverless v2's pay-per-use model wins. The breakeven shifts with RI coverage: with 3-year RIs, provisioned is 60% cheaper per compute-hour, requiring even higher peak-to-trough ratios for Serverless v2 to compete.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k07-aurora-serverless-breakeven/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Aurora Serverless v2 Breakeven
- **Purpose:** Aurora Serverless v2 breaks even with provisioned Aurora at approximately a 3:1 peak-to-trough ratio.
- **Difficulty:** Intermediate
- **Dependencies:** K06: Aurora Serverless v2 Pricing, K05: RDS Reserved Instances, K48: RDS Savings Plans

## Dependency Graph
**Depends on:**
- K06: Aurora Serverless v2 Pricing
- K05: RDS Reserved Instances
- K48: RDS Savings Plans

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Breakeven ratio
- RI impact
- On-Demand comparison
- ACU to instance mapping
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K06: Aurora Serverless v2 Pricing, K05: RDS Reserved Instances, K48: RDS Savings Plans

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