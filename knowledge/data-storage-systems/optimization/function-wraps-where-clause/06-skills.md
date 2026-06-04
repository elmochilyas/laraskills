# Skill: Detect and Fix Function Wraps in WHERE

## Purpose
Identify and eliminate function wrapping on indexed columns in WHERE clauses that break sargability.

## When To Use
- When reviewing query performance
- When EXPLAIN shows full table scan despite existing indexes
- During code review for database queries

## When NOT To Use
- When functional indexes (PostgreSQL) or expression indexes (MySQL 8.0+) index the wrapped expression
- When querying small tables where index usage is unnecessary

## Prerequisites
- Understanding of sargability
- Knowledge of functional/expression indexes

## Inputs
- SQL or Eloquent query with suspected function wraps

## Workflow
1. Identify indexed columns in WHERE clauses
2. Check for function wrapping: `LOWER(col)`, `UPPER(col)`, `YEAR(col)`, `DATE(col)`, `TRIM(col)`, `CAST(col)`
3. Rewrite: move function to the value side: `LOWER(col) = ?` → `col = LOWER(?)`
4. If function on column is unavoidable: create a functional/expression index
5. Verify with EXPLAIN that index scan replaces full table scan

## Validation Checklist
- [ ] No function wrapping on indexed columns in WHERE
- [ ] Functional indexes created for unavoidable function wraps
- [ ] `orderByRaw` does not use functions on indexed columns (causes filesort)
- [ ] EXPLAIN confirms index usage

## Common Failures
- `orderByRaw('LOWER(name)')` — causes filesort; use functional index or case-insensitive collation
- Casting column with `CAST(id AS CHAR)` — cast the input instead
- `LOWER(email) = ?` on indexed email column — use case-insensitive collation

## Decision Points
- If column function is needed: create functional index on expression
- If case-insensitive comparison needed: change column collation to case-insensitive (ci)
- If cast comparison needed: cast the parameter value, not the column

## Performance
- Function wrap: O(n) full table scan or index scan with per-row function evaluation
- Sargable: O(log n) index lookup
- Functional index: O(log n) on the expression

## Security
- Casting inputs prevents type confusion vulnerabilities
- Functional indexes do not expose additional security surface

## Related Rules
- 4-10-1: Always EXPLAIN Before Optimizing
- 4-10-4: Review And Apply Core Concepts

## Related Skills
- Write Sargable WHERE Conditions
- Write Sargable Date Filters

## Success Criteria
- Function wraps identified and removed where possible
- Functional indexes created for unavoidable cases
- EXPLAIN confirms index usage after fix
