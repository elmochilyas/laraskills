# Skill: Order Query Results by Subquery Computed Values

## Purpose

Use `orderBy()` with subqueries to sort results by derived values from related tables — `User::orderByDesc(Post::select('created_at')->whereColumn('user_id', 'users.id')->latest()->limit(1))` — enabling sorting by latest post date, highest order total, or other per-row computed values.

## When To Use

- Sorting by the latest related record's attribute
- Sorting by an aggregate of related records
- Complex ordering that requires related table data

## When NOT To Use

- Simple column sorts on the queried table
- Sorting by relationship count (use withCount + orderBy)
- In-memory sorting of small collections

## Prerequisites

- Understanding of SQL subqueries in ORDER BY
- Index on the subquery's WHERE and ORDER columns

## Inputs

- Subquery expression for the sort value
- Sort direction (ascending or descending)
- Nested query for correlation

## Workflow

1. Build the subquery returning the sort key: `Post::select('title')->whereColumn('user_id', 'users.id')->latest()->limit(1)`
2. Apply orderBy: `User::orderByDesc($subquery)->get()`
3. For aggregate sorts: `User::orderByDesc(Comment::selectRaw('COUNT(*)')->whereColumn('user_id', 'users.id'))->get()`
4. Verify index usage with EXPLAIN
5. Limit the result set to avoid performance issues with large datasets

## Validation Checklist

- [ ] Subquery in ORDER BY returns a scalar value
- [ ] Subquery is properly correlated with whereColumn
- [ ] Index exists on the subquery's WHERE column
- [ ] Sort direction is correct
- [ ] Performance is acceptable for expected result set size

## Common Failures

### Missing index on subquery column
Ordering by a subquery without an index on the FK column causes full table scan for each row. Always index the subquery's WHERE column.

### Uncorrelated subquery
The subquery doesn't reference the outer query. Result is a constant, and ordering doesn't work as expected. Use `whereColumn` to correlate.

## Decision Points

### Subquery order vs in-memory sort?
Subquery order for large datasets where database-side sorting is necessary. In-memory sort for small collections where the overhead of correlated subqueries isn't justified.

### orderBy subquery vs join + orderBy?
Subquery order is simpler for single-value sorts. JOIN + orderBy is needed when multiple related columns are used in the sort.

## Performance Considerations

Correlated subqueries in ORDER BY execute once per row. For 1000 results, the subquery runs 1000 times. Index the FK column to make each execution efficient. Use LIMIT on the outer query to limit total subquery executions.

## Security Considerations

Subqueries in ORDER BY use parameterized binding automatically. Ensure raw expressions within subqueries use proper parameterization.

## Related Rules

- Index the subquery FK column for performance
- Correlate subquery with whereColumn
- Limit outer result set to limit subquery executions

## Related Skills

- Select Subqueries with addSelect
- Query with Ordering and Grouping
- Use Raw Expressions Safely

## Success Criteria

- Query results are correctly sorted by derived values
- Subquery FK columns are indexed
- Correlated subqueries reference the outer table correctly
- Performance is acceptable for production workloads
