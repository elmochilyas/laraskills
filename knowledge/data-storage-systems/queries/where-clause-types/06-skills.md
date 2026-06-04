# Skill: Apply Where Clause Types for Sargable Queries

## Purpose

Use Laravel's where method family correctly — plain equality, whereIn, whereBetween, whereNull, whereDate, whereColumn, whereExists — selecting the appropriate type based on sargability, index usage, and query requirements.

## When To Use

- Writing WHERE conditions in query builder or Eloquent
- Optimizing existing queries that use whereDate or function-wrapped conditions
- Building complex filtering logic with OR groupings

## When NOT To Use

- Simple CRUD operations where Eloquent's magic where methods suffice
- Queries requiring raw SQL that cannot be expressed with where methods

## Prerequisites

- Understanding of index usage and sargability
- Familiarity with query builder basics

## Inputs

- Column names and comparison values
- Query filter requirements
- Index availability on filtered columns

## Workflow

1. Start with `where('col', 'val')` for simple equality — sargable, uses index
2. Use `whereIn('col', [1,2,3])` for multiple equality values — sargable
3. Use `whereBetween('col', [$a, $b])` for range conditions — sargable
4. Use `whereNull('col')` for IS NULL checks — uses B-Tree index
5. Replace `whereDate('col', $date)` with `whereBetween('col', [$date->startOfDay(), $date->endOfDay()])` — maintains sargability
6. Use `whereColumn('a', 'b')` for column-to-column comparisons

## Validation Checklist

- [ ] whereDate calls replaced with range queries for indexed columns
- [ ] OR conditions grouped with closures to prevent composite index breakage
- [ ] whereIn used instead of multiple orWhere calls for same column

## Common Failures

### whereDate on indexed columns
`WHERE DATE(created_at) = ?` breaks index usage. Use range query instead.

### orWhere without grouping
`where('a', 1)->orWhere('b', 2)` may not use composite index on (a, b). Group with a closure.

## Decision Points

### whereDate vs range query?
Use range query (`whereBetween`) for indexed date columns to maintain sargability. whereDate only for non-critical, small-table queries.

### whereIn vs multiple orWhere?
Use whereIn — it's a single condition, uses the index, and is more readable.

## Performance Considerations

whereDate and similar function wraps break index usage entirely. whereIn and whereBetween are sargable. Plain where is most efficient. Always verify with EXPLAIN.

## Security Considerations

All where methods use parameter binding automatically, preventing SQL injection. Raw whereRaw needs explicit bindings.

## Related Rules

- Replace whereDate with range queries for sargability
- Group OR conditions to preserve composite index usage
- Use whereIn for multiple equality checks

## Related Skills

- Execute Joins with Query Builder
- Use Raw Expressions Safely
- Analyze Query Execution Plans

## Success Criteria

- All date filters on indexed columns use range queries
- OR conditions are properly grouped
- whereIn replaces multiple orWhere for same-column filters
- EXPLAIN shows index usage on filtered columns
