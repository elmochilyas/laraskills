# Decomposition: ElastiCache Graviton Savings

## Topic Overview
ElastiCache Graviton nodes (m7g/r7g) are 20% cheaper than equivalent x86 nodes (m7i/r7i) with identical or better performance for Redis/Valkey workloads. Migration is a simple scaling operation during maintenance window. For a production ElastiCache cluster with replication, this translates to 20% direct cost reduction on cache infrastructure.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k16-elasticache-graviton/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### ElastiCache Graviton Savings
- **Purpose:** ElastiCache Graviton nodes (m7g/r7g) are 20% cheaper than equivalent x86 nodes (m7i/r7i) with identical or better performance for Redis/Valkey workloads.
- **Difficulty:** Intermediate
- **Dependencies:** K15: Redis Memory Optimization, K26: Graviton Price-Performance

## Dependency Graph
**Depends on:**
- K15: Redis Memory Optimization
- K26: Graviton Price-Performance

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Savings
- Performance
- Migration
- Available sizes
- Redis compatibility
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K15: Redis Memory Optimization, K26: Graviton Price-Performance

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