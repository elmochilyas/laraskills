# Skill: Execute Joins with Query Builder

## Purpose

Use query builder join methods — join (INNER), leftJoin, rightJoin, crossJoin, joinSub — to combine rows from multiple tables based on related columns, selecting the correct join type and ensuring indexed join columns for performance.

## When To Use

- Combining data from multiple related tables
- Reporting and aggregation across tables
- Pre-filtering data before joining via joinSub

## When NOT To Use

- Simple relationship queries (use Eloquent eager loading)
- Queries where Eloquent's relationship methods are more readable

## Prerequisites

- Understanding of SQL JOIN types and their row inclusion semantics
- Knowledge of indexing for join columns

## Inputs

- Tables to join and their relationships
- Join conditions (ON clause columns)
- Desired result set (which rows to include/exclude)

## Workflow

1. Determine the correct join type: inner for strict matches, left for optional related data
2. Ensure the join column (FK) is indexed on the joined table
3. Write the join: `->join('orders', 'orders.user_id', '=', 'users.id')`
4. For complex filtering, use `joinSub` to pre-filter the joined dataset
5. Add table aliases for readability in complex queries

## Validation Checklist

- [ ] Join columns are indexed on the joined table
- [ ] LEFT JOIN used only when NULLs for non-matching rows are acceptable
- [ ] joinSub includes a table alias to prevent ambiguous column errors
- [ ] INNER JOIN preferred over LEFT JOIN when optional rows are not needed

## Common Failures

### Missing index on join column
A join on an unindexed FK column causes a full table scan of the joined table for every row.

### joinSub without alias
`joinSub($query, 'alias', 'alias.id', '=', 'table.col')` — omitting the alias causes ambiguous column errors.

## Decision Points

### INNER vs LEFT JOIN?
Use INNER JOIN when the relationship must exist. Use LEFT JOIN when the related row is optional and NULLs are acceptable in the result.

### joinSub vs nested where?
joinSub pre-filters the joined table before the join, reducing intermediate result set size. Prefer for large tables.

## Performance Considerations

Join columns must be indexed. Left joins on large tables with missing indexes are a common performance killer. joinSub can reduce intermediate result sizes.

## Security Considerations

All join conditions use parameter binding. Raw join expressions need explicit bindings via addBinding.

## Related Rules

- Index foreign key columns used in JOINs
- Prefer INNER JOIN over LEFT JOIN when possible
- Use joinSub for pre-filtered joins on large tables

## Related Skills

- Apply Where Clause Types for Sargable Queries
- Build Complex Queries with the Fluent Query Builder
- Use Raw Expressions Safely

## Success Criteria

- JOIN queries use indexed FK columns
- Correct join type selected for the query semantics
- joinSub properly aliased and performing pre-filtering as intended
- EXPLAIN shows index lookups (not full table scans) on joined tables
