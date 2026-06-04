# Decomposition: Subquery Optimization — Advanced Subquery Techniques

## Boundary Analysis
This KU covers subquery optimization in Eloquent: correlated vs uncorrelated subqueries, `whereHas()` performance, `addSelect()` with subqueries, `whereIn()` with subqueries, and the subquery vs JOIN tradeoff. It excludes general index design (`index-aware-queries`), column reduction in subqueries (`select-constraints`), and raw SQL subquery writing outside Eloquent's query builder.

## Atomicity Assessment
**Status:** ✅ Atomic
Subquery optimization is a single, distinct topic focused on understanding and optimizing the subqueries that Eloquent generates. While it intersects with indexing and query design, the core concern — efficient subquery execution — is cohesive.

## Dependency Graph
- **Depends on:** `index-aware-queries` (indexing subquery WHERE columns)
- **Depends on:** Eloquent `whereHas()`, `withCount()`, `addSelect()` fundamentals
- **Depends on:** SQL subquery understanding
- **Referenced by:** `select-constraints` (subquery column reduction)
- **Referenced by:** `unique-enforcement` (subquery-based existence checks)
- **Referenced by:** All relationship querying patterns

## Follow-up Opportunities
- Lateral joins as a superior alternative to correlated subqueries
- CTE (Common Table Expression) patterns in Eloquent
- Database-specific subquery flattening and materialization behavior
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization