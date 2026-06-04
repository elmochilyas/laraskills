# Decomposition: 3.10 Covering indexes (index-only scans, avoid heap fetches)

## Topic Overview
A covering index contains all columns needed by a query, allowing the database to satisfy the query entirely from the index without accessing the table (heap fetch). This eliminates the most expensive part of query execution: reading rows from the table. In PostgreSQL, this is achieved by adding non-key columns via `INCLUDE`.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-10-covering-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.10 Covering indexes (index-only scans, avoid heap fetches)
- **Purpose:** A covering index contains all columns needed by a query, allowing the database to satisfy the query entirely from the index without accessing the table (heap fetch). This eliminates the most expensive part of query execution: reading rows from the table.
- **Difficulty:** Advanced
- **Dependencies:** 3.1 B-Tree, 3.8 Composite indexes, 3.16 INCLUDE columns, 4.4 Extra column flags

## Dependency Graph
**Depends on:** "3.1 B-Tree", "3.8 Composite indexes", "3.16 INCLUDE columns", "4.4 Extra column flags"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Index-only scan**: The database reads only the index, never the table. Marked as "Using index" in MySQL EXPLAIN, or "Index Only Scan" in PostgreSQL.; - **Heap fetch elimination**: The index has all needed data. The database avoids the random I/O of reading table pages.; - **INCLUDE columns (PostgreSQL)**: `CREATE INDEX ON orders (tenant_id, status) INCLUDE (total)` — adds `total` to the index leaf pages without affecting the tree structure. Useful for adding payload columns without violating uniqueness or leftmost prefix rules..
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