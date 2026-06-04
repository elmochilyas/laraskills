# Decomposition: RDS Reserved Instances

## Topic Overview
RDS Reserved Instances offer up to 66% savings with 3-year All Upfront commitment on database compute costs. While effective for predictable, steady-state database workloads, RIs lock you into specific instance classes and regions. Database Savings Plans (2025+) offer more flexibility with up to 60% savings.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k05-rds-reserved-instances/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### RDS Reserved Instances
- **Purpose:** RDS Reserved Instances offer up to 66% savings with 3-year All Upfront commitment on database compute costs.
- **Difficulty:** Foundation
- **Dependencies:** K06: Aurora Serverless v2 Pricing, K48: RDS Savings Plans, K01: Compute Savings Plans

## Dependency Graph
**Depends on:**
- K06: Aurora Serverless v2 Pricing
- K48: RDS Savings Plans
- K01: Compute Savings Plans

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Max savings
- Payment options
- Term lengths
- Scope
- Applies to
- Convertible RIs
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K06: Aurora Serverless v2 Pricing, K48: RDS Savings Plans, K01: Compute Savings Plans

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