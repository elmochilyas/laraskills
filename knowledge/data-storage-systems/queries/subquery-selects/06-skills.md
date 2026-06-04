# Skill: Select Subqueries with addSelect for Derived Columns

## Purpose

Use `addSelect()` with subqueries to include derived columns in query results — `User::addSelect(['last_post_id' => Post::select('id')->whereColumn('user_id', 'users.id')->latest()])` — for complex computations that don't have dedicated relationship methods.

## When To Use

- Selecting the latest or earliest related record
- Computing aggregates that aren't simple counts (sum, average, max)
- Adding computed columns from related data without JOINs

## When NOT To Use

- Simple relationship counts (use withCount)
- Full relationship data needed (use eager loading)
- Columns that can be derived from existing attributes

## Prerequisites

- Understanding of SQL subqueries
- Query builder fluency for subquery construction

## Inputs

- Subquery expression
- Column alias
- Relationship or table reference

## Workflow

1. Build the subquery: `Post::select('title')->whereColumn('user_id', 'users.id')->latest()->limit(1)`
2. Add it via addSelect: `User::addSelect(['latest_post_title' => $subquery])->get()`
3. Access: `$user->latest_post_title`
4. For complex subqueries, use `whereRaw` or `orderBy` with the subquery column
5. For conditional subqueries, use when() on the query builder

## Validation Checklist

- [ ] Subquery returns a scalar value (single row, single column)
- [ ] Column alias is unique and meaningful
- [ ] Subquery is correlated correctly via whereColumn
- [ ] Query executes without errors
- [ ] Result set includes the derived column

## Common Failures

### Subquery returns multiple rows
The subquery must return a single value. Always use `limit(1)` for single-record subqueries. Use aggregate functions (SUM, MAX) for multi-row subqueries.

### Uncorrelated subquery
The subquery must reference the outer query's table for proper correlation. Use `whereColumn('foreign_key', 'outer_table.primary_key')` to correlate.

## Decision Points

### Subquery vs JOIN?
Subqueries are simpler for single-value computations. JOINs are needed when multiple columns from the related table are required. Subqueries scale better with proper indexing.

### Subquery vs withCount?
withCount for COUNT queries. Subquery selects for non-count aggregates (latest title, total sum, average rating).

## Performance Considerations

Correlated subqueries execute once per row in the outer result. For large result sets, ensure the subquery has efficient index coverage. Use subquery selects judiciously with LIMITed result sets.

## Security Considerations

Subqueies are part of the query and parameterized automatically. Raw subquery values should use parameter binding to prevent SQL injection.

## Related Rules

- Ensure subquery returns a scalar value
- Correlate subquery with whereColumn
- Use addSelect for derived column inclusion

## Related Skills

- Count Related Records
- Query with Subquery Ordering
- Use Raw Expressions Safely

## Success Criteria

- Subquery selects return correct derived values
- Correlated subqueries reference the outer table properly
- Non-aggregate subqueries limit to 1 row
- Results include the alias column with correct data
