# Decomposition: 3.22 Index size estimation and monitoring

## Topic Overview
Index size affects buffer pool efficiency, storage cost, and backup time. Monitor index-to-table size ratio. PostgreSQL: `pg_indexes_size()`, `pg_stat_user_indexes`.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-22-index-size-estimation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.22 Index size estimation and monitoring
- **Purpose:** Index size affects buffer pool efficiency, storage cost, and backup time. Monitor index-to-table size ratio.
- **Difficulty:** Advanced
- **Dependencies:** 3.19 Index maintenance, 3.23 Over-indexing risks

## Dependency Graph
**Depends on:** "3.19 Index maintenance", "3.23 Over-indexing risks"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Index-to-data ratio**: Typical ratio: 0.5-2x for B-Tree indexes. Higher ratios indicate over-indexing.; - **Buffer pool fit**: Indexes must fit in memory for optimal performance. Monitor buffer pool hit rate.; - **Unused indexes**: `pg_stat_user_indexes` (idx_scan = 0) or MySQL `sys.schema_unused_indexes` identifies indexes never used..
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