# Decomposition: 3.27 Soft delete column indexing impact (deleted_at as filter)

## Topic Overview
Soft deletes add `WHERE deleted_at IS NULL` to every query. Without a properly designed index, this additional filter degrades query performance on large tables. The `deleted_at` column should be part of composite indexes, not queried in isolation.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-27-soft-delete-column-indexing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.27 Soft delete column indexing impact (deleted_at as filter)
- **Purpose:** Soft deletes add `WHERE deleted_at IS NULL` to every query. Without a properly designed index, this additional filter degrades query performance on large tables.
- **Difficulty:** Intermediate
- **Dependencies:** 3.11 Partial indexes, 15.10 Soft delete pattern, 15.11 Soft delete unique constraints

## Dependency Graph
**Depends on:** "3.11 Partial indexes", "15.10 Soft delete pattern", "15.11 Soft delete unique constraints"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Automatic filter**: `SoftDeletes` trait registers a global scope adding `WHERE deleted_at IS NULL`.; - **Selectivity**: `deleted_at IS NULL` is highly selective when most rows are active (not soft-deleted). Low selectivity when most rows are soft-deleted.; - **Composite integration**: `deleted_at` should be the last column in composite indexes that cover the query's other filter columns..
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