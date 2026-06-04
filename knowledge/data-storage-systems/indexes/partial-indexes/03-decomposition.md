# Decomposition: 3.11 Partial indexes (WHERE clause on index, PostgreSQL)

## Topic Overview
Partial indexes index only a subset of rows matching a `WHERE` condition. They are smaller, faster to maintain, and more targeted than full-table indexes. Common use cases: index only active records, unprocessed queue items, or non-deleted rows.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-11-partial-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.11 Partial indexes (WHERE clause on index, PostgreSQL)
- **Purpose:** Partial indexes index only a subset of rows matching a `WHERE` condition. They are smaller, faster to maintain, and more targeted than full-table indexes.
- **Difficulty:** Advanced
- **Dependencies:** 3.1 B-Tree, 3.27 Soft delete column indexing, 15.11 Soft delete with unique constraints

## Dependency Graph
**Depends on:** "3.1 B-Tree", "3.27 Soft delete column indexing", "15.11 Soft delete with unique constraints"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **WHERE predicate**: `CREATE INDEX idx_active_users ON users (email) WHERE status = 'active'`. Only rows with `status = 'active'` are in the index.; - **Query matching**: The query's WHERE clause must match or imply the index predicate. PostgreSQL recognizes implied predicates.; - **Size benefit**: An index on 20% of rows is ~20% the size of a full index. Write maintenance is similarly reduced..
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