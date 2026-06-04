# Skill: Optimize Eloquent Subquery Performance

## Purpose
Write efficient correlated and uncorrelated subqueries in Eloquent by indexing WHERE columns, limiting scalar subqueries, and choosing the optimal subquery type for the data volume.

## When To Use
- Scalar values per parent row (COUNT, MAX, MIN, latest related record)
- Avoiding row multiplication from JOINs when related columns are not needed
- Highly selective existence checks — `whereHas()` on a small subset of parents
- Computed columns in SELECT that aggregate related data

## When NOT To Use
- You need actual columns from the related table (use JOIN)
- The subquery returns millions of rows for `WHERE IN` (use JOIN or EXISTS)
- The subquery is correlated and the outer query returns 100k+ rows (use JOIN)
- Simple relationship existence checks with indexes (use JOIN for large datasets)

## Prerequisites
- Index-aware query design
- Understanding of `whereHas()`, `withCount()`, `addSelect()`
- Ability to read `EXPLAIN` output

## Inputs
- Query pattern with relationship constraints
- Table and index information
- Expected data volume

## Workflow
1. Ensure the subquery's WHERE columns (especially foreign keys) are indexed
2. Choose subquery type:
   - Use `whereHas()` for selective existence checks (few parents match)
   - Use `whereIn()` with subquery for uncorrelated existence checks (manageable result set)
   - Use `withCount()` / `withExists()` for simple aggregation
   - Use `addSelect()` with subquery for computed columns
3. Add `->limit(1)` with `->latest()` to every scalar subquery in `addSelect()`
4. Limit subqueries in SELECT to 2-3 per query
5. Test with production-scale data — benchmark before deploying
6. Verify with `EXPLAIN` — confirm index usage

## Validation Checklist
- [ ] Foreign key columns used in subquery WHERE clauses are indexed
- [ ] Scalar subqueries in `addSelect()` have `->limit(1)` with explicit ordering
- [ ] `EXPLAIN` confirms subquery execution plan (not full table scans)
- [ ] No more than 3 subqueries in a single SELECT
- [ ] `whereIn()` with subquery not used when subquery returns millions of rows
- [ ] Performance tested with production-scale data

## Common Failures
- Using `whereHas()` without indexing — full table scan per outer row
- Multiple subqueries in SELECT without profiling — 30k+ subquery executions
- `whereIn()` with subquery returning all IDs — temporary table with millions of rows
- Missing `limit(1)` on scalar subquery — runtime error on multi-row return
- Confusing correlated vs uncorrelated — misunderstanding performance profile

## Decision Points
- `whereHas()` vs `whereIn()` with subquery: `whereHas()` (correlated) for selective existence checks; `whereIn()` with subquery (uncorrelated) for manageable result sets — single execution vs per-row execution
- Subquery vs JOIN: subqueries avoid row multiplication but can be slower per-row; JOINs multiply rows but can be faster for large datasets
- `withCount()` vs manual subquery: prefer `withCount()` for simple aggregates — handles bindings and edge cases automatically

## Performance Considerations
- `whereHas()` on 100k parents with unindexed subquery = 100k full table scans — catastrophic
- Subqueries in SELECT execute once per outer row
- `whereIn()` with subquery materializes the entire subquery result — millions of IDs cause memory exhaustion
- PostgreSQL flattens correlated subqueries into JOINs automatically; MySQL does this less aggressively

## Security Considerations
- Subqueries in `addSelect()` can expose computed data — ensure they respect row-level authorization
- Always use the query builder, not raw strings, to avoid SQL injection

## Related Rules
- Always Index Subquery WHERE Columns (performance-and-integrity/subquery-optimization)
- Add limit(1) for Every Scalar Subquery (performance-and-integrity/subquery-optimization)
- Prefer Uncorrelated Subqueries When Possible (performance-and-integrity/subquery-optimization)
- Test with Production-Scale Data (performance-and-integrity/subquery-optimization)
- Limit Subqueries in SELECT to 2-3 Per Query (performance-and-integrity/subquery-optimization)

## Related Skills
- Design Index-Aware Queries
- Implement Select Constraints
- Write Advanced Subqueries in Query Strategy

## Success Criteria
- Subquery WHERE columns indexed — no full table scans
- Scalar subqueries include `->limit(1)` — no multi-row errors
- Subqueries in SELECT limited to 2-3 per query
- Subquery vs JOIN decision justified by profiling data
