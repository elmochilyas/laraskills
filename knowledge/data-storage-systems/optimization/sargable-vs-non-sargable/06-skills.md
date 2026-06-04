# Skill: Write Sargable WHERE Conditions

## Purpose
Write WHERE clauses that can use indexes (sargable) by avoiding function wrapping on indexed columns.

## When To Use
- When writing any WHERE clause on an indexed column
- During code review to catch non-sargable patterns
- When optimizing slow queries showing full table scans

## When NOT To Use
- When the table is small (<1000 rows) — index usage is less critical
- When using functional indexes (PostgreSQL) that index the expression

## Prerequisites
- Understanding of B-Tree indexes
- Knowledge of common sargable patterns

## Inputs
- SQL query or Eloquent query to review

## Workflow
1. Identify all WHERE clauses referencing indexed columns
2. Check if the column is wrapped in a function (LOWER, DATE, YEAR, CAST, TRIM, etc.)
3. If wrapped: rewrite to make the column standalone
4. Verify with EXPLAIN that the access type improves

## Validation Checklist
- [ ] No indexed column wrapped in a function in WHERE
- [ ] Range queries used instead of date functions: `WHERE date >= ? AND date < ?` not `WHERE YEAR(date) = ?`
- [ ] Case-insensitive collation used instead of `LOWER()`
- [ ] EXPLAIN shows index usage after rewrite

## Common Failures
- `whereDate()`, `whereMonth()`, `whereYear()` in Eloquent — these wrap columns in functions
- `LOWER(col)` for case-insensitive search — use case-insensitive collation or functional index
- `CAST(col AS type)` — cast the input value, not the column

## Decision Points
- If column function is unavoidable: create a functional index on the expression
- If case-insensitive search is needed: change column collation to case-insensitive
- If date extraction is needed: use range comparison instead of YEAR/DATE/MONTH

## Performance
- Sargable: uses B-Tree index — O(log n) lookup
- Non-sargable: full table scan — O(n) scan
- Difference on 1M rows: <1ms vs 100-500ms

## Security
- No direct security implications
- Casting input values prevents SQL injection from type confusion

## Related Rules
- 4-7-1: Always EXPLAIN Before Optimizing
- 4-7-4: Review And Apply Core Concepts

## Related Skills
- Write Sargable Date Filters
- Detect Function Wraps in WHERE
- Avoid Leading Wildcard LIKE

## Success Criteria
- Non-sargable patterns identified and rewritten
- WHERE clauses allow index usage after rewrite
- EXPLAIN confirms index scan instead of full table scan
