# Decomposition: 3.19 Index maintenance (bloat, fillfactor, rebuilding, VACUUM)

## Topic Overview
Indexes degrade over time due to bloat (dead entries), fragmentation, and stale statistics. PostgreSQL uses VACUUM and REINDEX for maintenance. MySQL uses OPTIMIZE TABLE and ALGORITHM=INPLACE index rebuilds.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-19-index-maintenance/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.19 Index maintenance (bloat, fillfactor, rebuilding, VACUUM)
- **Purpose:** Indexes degrade over time due to bloat (dead entries), fragmentation, and stale statistics. PostgreSQL uses VACUUM and REINDEX for maintenance.
- **Difficulty:** Advanced
- **Dependencies:** 1.15 pg_repack, 3.1 B-Tree, 3.20 Concurrent index creation

## Dependency Graph
**Depends on:** "1.15 pg_repack", "3.1 B-Tree", "3.20 Concurrent index creation"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Bloat**: Dead index entries from UPDATE/DELETE operations. PostgreSQL B-Tree doesn't reuse dead space immediately.; - **fillfactor**: Percentage of each index page reserved for future updates. Default 90 (PostgreSQL). Lower values reduce page splits.; - **pg_repack**: Rebuilds indexes without ACCESS EXCLUSIVE lock. Essential for production.; - **REINDEX**: PostgreSQL rebuilds index from scratch. Requires exclusive lock. CONCURRENTLY option in PG 12+..
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