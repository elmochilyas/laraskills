# Decomposition: 7.9 Load balancing across replicas (round-robin, least connections)

## Topic Overview
Laravel's default read replica selection is random per query. Better strategies: round-robin (distributes evenly), least connections (routing to least busy replica), or weighted (larger replicas get more traffic). Implemented via ProxySQL, custom DB connector, or Octane connection pool.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-9-load-balancing-replicas/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.9 Load balancing across replicas (round-robin, least connections)
- **Purpose:** Laravel's default read replica selection is random per query. Better strategies: round-robin (distributes evenly), least connections (routing to least busy replica), or weighted (larger replicas get more traffic).
- **Difficulty:** Intermediate
- **Dependencies:** 7.2 Read/write config, 7.8 Connection pooling replicas

## Dependency Graph
**Depends on:** "7.2 Read/write config", "7.8 Connection pooling replicas"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Random (Laravel default)**: `'read' => ['host' => ['r1', 'r2', 'r3']]` — random pick per query. Simple but can skew.; - **Round-robin**: Distributes uniformly. Good for equal-sized replicas.; - **Least connections**: Routes to replica with fewest active queries. Best for heterogeneous replicas.; - **Weighted**: Larger replicas get proportionally more requests. Requires ProxySQL or custom routing..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization