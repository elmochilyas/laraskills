# Decomposition: 3.15 Descending indexes (order by DESC aligned with index order)

## Topic Overview
Descending indexes store index entries in descending order, aligning with `ORDER BY col DESC` queries to avoid explicit reverse scans. Available in both PostgreSQL and MySQL 8.0+. Especially useful for queries that filter by one column and sort descending by another.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-15-descending-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.15 Descending indexes (order by DESC aligned with index order)
- **Purpose:** Descending indexes store index entries in descending order, aligning with `ORDER BY col DESC` queries to avoid explicit reverse scans. Available in both PostgreSQL and MySQL 8.0+.
- **Difficulty:** Advanced
- **Dependencies:** 3.1 B-Tree, 3.9 Composite index column ordering

## Dependency Graph
**Depends on:** "3.1 B-Tree", "3.9 Composite index column ordering"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Index direction**: `CREATE INDEX ON orders (tenant_id, created_at DESC)` — stores entries in descending order for the created_at column.; - **Multi-column direction**: Each column can have its own direction. `(a ASC, b DESC)` — sorts by a ascending, then b descending.; - **Query alignment**: If the query orders by the same direction, the index provides sorted output without additional sort step..
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