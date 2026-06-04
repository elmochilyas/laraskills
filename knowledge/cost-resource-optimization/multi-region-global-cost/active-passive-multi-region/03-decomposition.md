# Decomposition: Active-Passive Multi-Region Cost

## Topic Overview
Active-passive multi-region architecture is significantly cheaper than active-active for most Laravel applications. In active-passive, the secondary region runs minimal compute (or zero with headless DR) until failover occurs. This reduces cross-region costs by 50-70% compared to active-active.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k53-active-passive-multi-region/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Active-Passive Multi-Region Cost
- **Purpose:** Active-passive multi-region architecture is significantly cheaper than active-active for most Laravel applications.
- **Difficulty:** Intermediate
- **Dependencies:** K51: Cross-Region Data Transfer, K52: Aurora Global Database Cost, K54: Route 53 Routing Costs

## Dependency Graph
**Depends on:**
- K51: Cross-Region Data Transfer
- K52: Aurora Global Database Cost
- K54: Route 53 Routing Costs

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Active-passive
- Active-active
- Cost difference
- Failover RTO
- Headless DR
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K51: Cross-Region Data Transfer, K52: Aurora Global Database Cost, K54: Route 53 Routing Costs

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