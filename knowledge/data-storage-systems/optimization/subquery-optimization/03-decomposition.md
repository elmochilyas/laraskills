# Decomposition: 4.25 Subquery optimization (lateral joins in PostgreSQL, derived table optimization)

## Topic Overview
Subqueries are powerful but easy to misuse. Eloquent's relationship subqueries (addSelect, orderBy with subquery) can generate inefficient correlated subqueries. PostgreSQL lateral joins convert row-by-row subquery execution into an optimized loop.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-25-subquery-optimization/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.25 Subquery optimization (lateral joins in PostgreSQL, derived table optimization)
- **Purpose:** Subqueries are powerful but easy to misuse. Eloquent's relationship subqueries (addSelect, orderBy with subquery) can generate inefficient correlated subqueries.
- **Difficulty:** Advanced
- **Dependencies:** 4.8 whereDate sargability breakage, 4.10 Function wraps in WHERE clause, 4.18 Keyset pagination, 12.18 Lateral joins in PostgreSQL

## Dependency Graph
**Depends on:** "4.8 whereDate sargability breakage", "4.10 Function wraps in WHERE clause", "4.18 Keyset pagination", "12.18 Lateral joins in PostgreSQL"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Correlated subquery**: References columns from the outer query and executes once per outer row. This is the most dangerous subquery pattern for large datasets.; - **Derived table (subquery in FROM)**: Materialized as a temporary result set before the outer query runs. Cannot reference outer query columns directly (use LATERAL for that).; - **LATERAL join (PostgreSQL)**: Allows the subquery to reference columns from preceding FROM items. Executes the subquery for each row of the driving table, but can use indexes.; - **Semi-join / anti-join transformation**: The optimizer can rewrite `WHERE id IN (SELECT ...)` into a semi-join, avoiding full materialization of the subquery result.; - **Subquery flattening**: Optimizers convert simple subqueries into joins when safe. EXISTS, IN, = ANY patterns are most likely to be flattened..
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