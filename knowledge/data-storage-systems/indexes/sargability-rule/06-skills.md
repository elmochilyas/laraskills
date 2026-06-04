# Skill: Apply the Sargability Rule for Index-Friendly WHERE Conditions

## Purpose

Write WHERE conditions that can use indexes (sargable) by keeping the indexed column alone on one side of the comparison — avoiding function wraps (`DATE(col)`, `LOWER(col)`, `YEAR(col)`) and rewriting them as range queries or using expression indexes.

## When To Use

- Writing WHERE conditions in query builder or Eloquent
- Reviewing existing queries for index usage
- Converting non-sargable patterns to sargable alternatives

## When NOT To Use

- Columns that are not indexed (sargability doesn't matter)
- Expression indexes already exist for the non-sargable pattern

## Prerequisites

- Understanding of B-Tree index structure
- Knowledge of common non-sargable patterns

## Inputs

- WHERE condition expression
- Index columns
- Query performance requirements

## Workflow

1. Identify function wraps: `DATE(col)`, `YEAR(col)`, `LOWER(col)`, `CAST(col AS ...)`
2. Rewrite range queries: replace `WHERE DATE(created_at) = ?` with `WHERE created_at >= ? AND created_at < ?`
3. Use collation for case-insensitive: replace `LOWER(email) = ?` with case-insensitive column collation
4. Use functional indexes when rewriting is impossible
5. Verify with EXPLAIN — no full table scan for sargable queries

## Validation Checklist

- [ ] No function wraps on indexed columns in WHERE conditions
- [ ] LIKE patterns use prefix wildcards only (LIKE 'prefix%'), not leading wildcards
- [ ] Date filters use range queries instead of DATE()/YEAR()/MONTH()
- [ ] EXPLAIN confirms index usage for rewritten queries

## Common Failures

### whereDate in Laravel
`Model::whereDate('created_at', today())` generates `DATE(created_at) = ?`. Breaks index. Use `whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])`.

### LIKE with leading wildcard
`LIKE '%search'` — cannot use B-Tree index because the starting character is unknown.

## Decision Points

### Rewrite query vs functional index?
Rewrite if possible (range query instead of DATE()). Use functional index when the function wrap is inherent to the query logic (case-insensitive search).

### Case-insensitive: collation vs functional index?
Collation is set-and-forget for the column. Functional index requires matching the function in every query. Prefer collation for case-insensitive columns.

## Performance Considerations

Non-sargable queries force full table scans. For large tables, this can increase query time from milliseconds to seconds or minutes.

## Security Considerations

Sargability doesn't affect security. However, ensuring all queries use indexes prevents DoS scenarios where a single query consumes excessive resources.

## Related Rules

- Rewrite whereDate as range queries
- Use prefix-only LIKE patterns
- Use collation for case-insensitive search

## Related Skills

- Design Functional/Expression Indexes
- Detect Implicit Type Conversion That Breaks Indexes
- Design B-Tree Indexes for Equality and Range Queries

## Success Criteria

- No function wraps on indexed WHERE columns
- Date filters use range queries
- LIKE uses prefix only (no leading wildcard)
- EXPLAIN confirms index usage without full table scan
