# Decomposition: 2.14 Unions (union, unionAll)

## Topic Overview
`union` and `unionAll` combine results from multiple queries into a single result set. `union` removes duplicates (adds a sort/distinct pass); `unionAll` keeps all rows. Useful for combining results from different tables with the same column structure or for OR conditions that should use separate indexes.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-14-unions/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.14 Unions (union, unionAll)
- **Purpose:** `union` and `unionAll` combine results from multiple queries into a single result set. `union` removes duplicates (adds a sort/distinct pass); `unionAll` keeps all rows.
- **Difficulty:** Intermediate
- **Dependencies:** 2.10 Query builder methods, 4.11 orWhere on composite index

## Dependency Graph
**Depends on:** "2.10 Query builder methods", "4.11 orWhere on composite index"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **union**: Combines queries, removes duplicate rows (SORT + DISTINCT operation).; - **unionAll**: Combines queries, keeps all rows (faster, no dedup overhead).; - **Column compatibility**: All combined queries must return the same number of columns with compatible types..
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