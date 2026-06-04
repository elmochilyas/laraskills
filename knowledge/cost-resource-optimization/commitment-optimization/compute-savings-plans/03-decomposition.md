# Decomposition: Compute Savings Plans

## Topic Overview
Compute Savings Plans offer up to 66% discount across EC2, Fargate, and Lambda with the highest flexibility among AWS commitment models. You commit to a $/hour spend for 1 or 3 years, and AWS automatically applies discounted rates to any eligible compute usage. Unlike Reserved Instances, there is no instance family, region, or OS lock-in.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k01-compute-savings-plans/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Compute Savings Plans
- **Purpose:** Compute Savings Plans offer up to 66% discount across EC2, Fargate, and Lambda with the highest flexibility among AWS commitment models.
- **Difficulty:** Foundation
- **Dependencies:** K02: EC2 Instance Savings Plans, K03: Spot Instances Strategy, K48: RDS Savings Plans

## Dependency Graph
**Depends on:**
- K02: EC2 Instance Savings Plans
- K03: Spot Instances Strategy
- K48: RDS Savings Plans

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Max savings
- Coverage
- Flexibility
- Commitment
- Term
- Payment
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K02: EC2 Instance Savings Plans, K03: Spot Instances Strategy, K48: RDS Savings Plans

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