# Decomposition: Spot Instances Strategy

## Topic Overview
Spot Instances offer up to 90% discount vs On-Demand with a 5-15% per-hour interruption rate. They are ideal for stateless, fault-tolerant, and interruptible workloads: queue workers, batch processing, CI/CD, and non-production environments. The key to successful Spot usage is designing for interruptions Ã¢â‚¬â€ using Spot as the default with On-Demand fallback, distributing across instance types and AZs, and implementing graceful shutdown handling.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k03-spot-instances-strategy/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Spot Instances Strategy
- **Purpose:** Spot Instances offer up to 90% discount vs On-Demand with a 5-15% per-hour interruption rate.
- **Difficulty:** Foundation
- **Dependencies:** K01: Compute Savings Plans, K04: Spot Interruption Costs, K25: Fargate Spot Workers

## Dependency Graph
**Depends on:**
- K01: Compute Savings Plans
- K04: Spot Interruption Costs
- K25: Fargate Spot Workers

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Max discount
- Interruption rate
- 2-minute notice
- Best for
- Not for
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K01: Compute Savings Plans, K04: Spot Interruption Costs, K25: Fargate Spot Workers

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