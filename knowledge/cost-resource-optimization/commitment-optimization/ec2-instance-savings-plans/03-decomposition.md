# Decomposition: EC2 Instance Savings Plans

## Topic Overview
EC2 Instance Savings Plans offer up to 72% discount (vs 66% for Compute SPs) but lock you to a specific instance family in a specific region. They are optimal for teams with stable, predictable workloads that won't change instance family or region. The higher discount compensates for reduced flexibility.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k02-ec2-instance-savings-plans/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### EC2 Instance Savings Plans
- **Purpose:** EC2 Instance Savings Plans offer up to 72% discount (vs 66% for Compute SPs) but lock you to a specific instance family in a specific region.
- **Difficulty:** Foundation
- **Dependencies:** K01: Compute Savings Plans, K03: Spot Instances Strategy, K04: Spot Interruption Costs

## Dependency Graph
**Depends on:**
- K01: Compute Savings Plans
- K03: Spot Instances Strategy
- K04: Spot Interruption Costs

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Max savings
- Lock-in
- Size flexibility
- vs Compute SP
- Payment
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K01: Compute Savings Plans, K03: Spot Instances Strategy, K04: Spot Interruption Costs

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