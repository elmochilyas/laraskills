# Decomposition: 3.17 Nulls NOT DISTINCT (PostgreSQL 15+ unique indexes allowing nulls)

## Topic Overview
In standard SQL, `NULL` values are considered distinct in unique indexes, allowing multiple rows with `NULL` in a unique column. PostgreSQL 15+ introduced `NULLS NOT DISTINCT` to treat NULLs as equal, enforcing single-row nullability in unique constraints.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-17-nulls-not-distinct/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.17 Nulls NOT DISTINCT (PostgreSQL 15+ unique indexes allowing nulls)
- **Purpose:** In standard SQL, `NULL` values are considered distinct in unique indexes, allowing multiple rows with `NULL` in a unique column. PostgreSQL 15+ introduced `NULLS NOT DISTINCT` to treat NULLs as equal, enforcing single-row nullability in unique constraints.
- **Difficulty:** Advanced
- **Dependencies:** 3.11 Partial indexes, 15.5 NULLS NOT DISTINCT, 15.11 Soft delete unique constraints

## Dependency Graph
**Depends on:** "3.11 Partial indexes", "15.5 NULLS NOT DISTINCT", "15.11 Soft delete unique constraints"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Default behavior**: `UNIQUE INDEX (email)` allows multiple NULL emails. `NULL != NULL` in SQL.; - **NULLS NOT DISTINCT**: `CREATE UNIQUE INDEX ON users (email) NULLS NOT DISTINCT` — only one NULL allowed.; - **Soft delete interaction**: Combined with partial index `WHERE deleted_at IS NULL`, enables unique constraint on non-deleted rows..
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