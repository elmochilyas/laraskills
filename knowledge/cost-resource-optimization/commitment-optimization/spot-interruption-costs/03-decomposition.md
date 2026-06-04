# Decomposition: Spot Interruption Costs

## Topic Overview
LeanOps 2026 research found that 41% of Spot workloads lose money after factoring interruption recovery costs. The savings from Spot pricing (up to 90%) are offset by: (1) re-execution of interrupted work, (2) additional compute for recovery/checkpointing, (3) engineering time managing Spot complexity, (4) higher On-Demand usage during fallback. Spot is not automatically cost-effective Ã¢â‚¬â€ it requires workload-specific analysis to determine if the discount compensates for interruption overhead.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k04-spot-interruption-costs/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Spot Interruption Costs
- **Purpose:** LeanOps 2026 research found that 41% of Spot workloads lose money after factoring interruption recovery costs.
- **Difficulty:** Advanced
- **Dependencies:** K03: Spot Instances Strategy, K25: Fargate Spot Workers, K01: Compute Savings Plans

## Dependency Graph
**Depends on:**
- K03: Spot Instances Strategy
- K25: Fargate Spot Workers
- K01: Compute Savings Plans

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- 41% failure rate
- Recovery costs
- Fallback costs
- Engineering overhead
- Success factors
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K03: Spot Instances Strategy, K25: Fargate Spot Workers, K01: Compute Savings Plans

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