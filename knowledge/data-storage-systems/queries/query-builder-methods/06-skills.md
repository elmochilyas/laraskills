# Skill: Build Complex Queries with the Fluent Query Builder

## Purpose

Use Laravel's query builder methods — select, where, join, groupBy, having, orderBy, limit, offset — to construct SQL queries fluently, specifying explicit columns, applying conditions, joining tables, and controlling pagination for efficient data retrieval.

## When To Use

- Complex queries beyond Eloquent's ORM capabilities
- Reporting and aggregation queries
- Database-specific optimizations
- High-performance queries where Eloquent overhead is undesirable

## When NOT To Use

- Standard CRUD operations (Eloquent is simpler)
- Simple queries with no joins or aggregations
- Queries needing model events or accessors

## Prerequisites

- Understanding of SQL clauses
- Knowledge of the database schema

## Inputs

- Query purpose (select, insert, update, delete)
- Columns to retrieve
- Conditions, joins, ordering, and limits

## Workflow

1. Start with `DB::table('users')` to target the table
2. Explicitly specify columns: `->select('id', 'name', 'email')` — never default `SELECT *`
3. Add conditions: `->where('status', 'active')->where('plan', 'premium')`
4. Add joins: `->join('orders', 'users.id', '=', 'orders.user_id')`
5. Add grouping and having: `->groupBy('plan')->having('count', '>', 5)`
6. Add ordering: `->orderBy('created_at', 'desc')`
7. Add pagination: `->limit(15)->offset(30)`
8. Execute with `->get()`, `->first()`, `->paginate()`, or `->cursor()`

## Validation Checklist

- [ ] Explicit select() specifies columns instead of SELECT *
- [ ] LIMIT has a corresponding ORDER BY for predictable results
- [ ] GROUP BY columns appear in SELECT if not aggregated
- [ ] JOIN columns are indexed
- [ ] Query uses parameter binding for user-influenced values

## Common Failures

### Default SELECT *
Transfers all columns including large text fields. Always specify only needed columns with explicit `select()`.

### LIMIT without ORDER BY
Result order is unpredictable. Always specify ORDER BY for paginated queries.

## Decision Points

### Query Builder vs Eloquent?
Query Builder for complex queries, reporting, and performance-critical paths. Eloquent for standard CRUD with model events, accessors, and relationships.

### Raw SQL vs Query Builder?
Query Builder for most queries — it's portable across databases and secure against SQL injection. Raw SQL for database-specific features (JSON operators, full-text, window functions).

## Performance Considerations

Query Builder is faster than Eloquent (no hydration overhead). Explicit select() reduces data transfer. JOIN columns must be indexed. Avoid OFFSET on large datasets — use cursor pagination.

## Security Considerations

Query Builder automatically parameterizes where values. Raw expressions need manual parameter binding via `->whereRaw('col = ?', [$value])`. Never concatenate user input into queries.

## Related Rules

- Always specify explicit select() columns
- Add ORDER BY with LIMIT/OFFSET
- Index JOIN columns

## Related Skills

- Execute Joins with Query Builder
- Build Advanced Where Clauses
- Use Raw Expressions Safely

## Success Criteria

- Queries use explicit columns instead of SELECT *
- Paginated queries have ORDER BY
- JOIN columns are indexed for performance
- GROUP BY queries satisfy ONLY_FULL_GROUP_BY mode
- User input is parameterized to prevent SQL injection
