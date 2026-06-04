# Skill: Optimize Subqueries

## Purpose
Write efficient subqueries by understanding correlated vs non-correlated patterns, using EXISTS over IN for large sets, and leveraging LATERAL joins in PostgreSQL.

## When To Use
- When writing subqueries for filtering, aggregation, or computed columns
- When Eloquent `addSelect` with subquery generates correlated queries
- When EXPLAIN shows "DEPENDENT SUBQUERY"

## When NOT To Use
- When a simple JOIN would express the same logic more efficiently

## Prerequisites
- Understanding of correlated vs non-correlated subqueries
- Knowledge of EXISTS, IN, and JOIN transformations

## Inputs
- Query using subqueries (WHERE IN, addSelect, whereHas, exists)

## Workflow
1. Run EXPLAIN on the subquery-heavy query
2. Check for "DEPENDENT SUBQUERY" (MySQL) or correlated scan patterns (PostgreSQL)
3. If correlated: verify the correlated column has an index
4. If `WHERE IN (SELECT ...)` with large subquery result: rewrite as EXISTS or JOIN
5. If PostgreSQL and LATERAL available: consider LATERAL join for per-row correlated data
6. Prefer `whereHas` (EXISTS) over `whereIn` with subquery for large result sets

## Validation Checklist
- [ ] Correlated subqueries have indexes on the correlated column
- [ ] EXISTS used instead of IN for large subquery result sets
- [ ] No "DEPENDENT SUBQUERY" in MySQL EXPLAIN for hot queries
- [ ] LATERAL considered for PostgreSQL per-row subqueries

## Common Failures
- `WHERE IN (SELECT ...)` with large subquery result materializing all rows
- No index on correlated column in subquery — full scan per outer row
- LATERAL without proper index on the inner query columns

## Decision Points
- Small subquery result (<100): IN is acceptable
- Large subquery result (>100): use EXISTS or JOIN
- PostgreSQL + per-row data: use LATERAL JOIN
- Simple existence check: use `whereHas` (generates EXISTS)

## Performance
- Correlated subquery without index: O(n × m) — n outer rows × m inner scan
- EXISTS with index: O(n × log m) — short-circuits on first match
- LATERAL with index: O(n × log m) — per-row indexed lookup
- Non-correlated: O(m + n) — materialized once

## Security
- Subqueries in `whereIn` with user input arrays need validation
- Raw SQL subqueries require careful parameter binding

## Related Rules
- 4-25-1: Always EXPLAIN Before Optimizing
- 4-25-4: Review And Apply Core Concepts

## Related Skills
- Optimize JOIN Queries
- Avoid Eloquent Anti-Patterns

## Success Criteria
- Subqueries execute efficiently with proper indexes
- No correlated subqueries without matching indexes
- Appropriate pattern chosen (IN vs EXISTS vs JOIN vs LATERAL)
