# Decomposition: 2.13 Joins (inner, left, right, cross, joinSub)

## Topic Overview
Query builder joins combine rows from multiple tables based on related columns. Join type selection (inner, left, right, cross) determines which rows are included in the result. `joinSub` allows joining to a subquery.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-13-joins/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.13 Joins (inner, left, right, cross, joinSub)
- **Purpose:** Query builder joins combine rows from multiple tables based on related columns. Join type selection (inner, left, right, cross) determines which rows are included in the result.
- **Difficulty:** Intermediate
- **Dependencies:** 2.10 Query builder methods, 4.24 Join optimization, 2.2 Relationship types

## Dependency Graph
**Depends on:** "2.10 Query builder methods", "4.24 Join optimization", "2.2 Relationship types"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **join()**: INNER JOIN — includes rows where the join condition matches in both tables.; - **leftJoin()**: LEFT JOIN — includes all rows from the left table, NULLs for non-matching right rows.; - **rightJoin()**: RIGHT JOIN — opposite of LEFT JOIN.; - **crossJoin()**: CROSS JOIN — Cartesian product of both tables.; - **joinSub()**: Join to a subquery result. Useful for pre-filtered joins..
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