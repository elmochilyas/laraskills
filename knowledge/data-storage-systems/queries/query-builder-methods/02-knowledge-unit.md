# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.10 Query builder methods (select, where, join, groupBy, having, orderBy, limit, offset)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's query builder provides a fluent interface for constructing SQL queries. The core methods — select, where, join, groupBy, having, orderBy, limit, offset — map directly to SQL clauses. Understanding their generated SQL and index requirements is essential.

---

# Core Concepts

- **select()**: Specifies columns. `select('id', 'name')` generates `SELECT id, name`. Default is `SELECT *`.
- **where()**: Adds WHERE conditions. Multiple `where()` calls are ANDed.
- **join()**: Adds JOIN clauses. Supports inner, left, right, cross joins.
- **groupBy() / having()**: For aggregation queries. GROUP BY columns must appear in SELECT if not aggregated.
- **orderBy()**: Adds ORDER BY. `orderBy('created_at', 'desc')`.
- **limit() / offset()**: Pagination. `limit(15)->offset(30)` generates `LIMIT 15 OFFSET 30`.

---

# Mental Models

Each query builder method maps to one SQL clause. The order of method calls doesn't matter — the query builder compiles SQL in a fixed order.

---

# Patterns

**Explicit select()**: Always specify columns instead of defaulting to `SELECT *`. Reduces data transfer and prevents over-fetching.

**where with array**: `->where(['status' => 'active', 'plan' => 'premium'])` for multiple equality conditions.

**Raw expressions**: Use `selectRaw()`, `whereRaw()`, `havingRaw()` when standard methods can't express the needed SQL.

---

# Common Mistakes

**Default SELECT ***: Transfers all columns including large text fields. Specify only needed columns.

**LIMIT without ORDER BY**: Result order is unpredictable. Always specify ORDER BY for paginated queries.

**GROUP BY without aggregate**: MySQL ONLY_FULL_GROUP_BY mode rejects non-aggregated, non-grouped columns in SELECT.

---

# Related Knowledge Units

2.11 Where clause types | 2.13 Joins | 4.16 Offset pagination deep-page problems
## Ecosystem Usage

Laravel's Eloquent ORM is the dominant PHP ORM in the ecosystem. Community patterns are shared through Laracasts, Laravel News, and open-source packages. Features like eager loading and model events are used in virtually every Laravel project.

## Failure Modes

N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Performance Considerations

Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subquery selects in addSelect avoid N+1 count queries. lazy() and cursor() use generators to reduce memory for large result sets.

## Production Considerations

Enable preventLazyLoading in production to catch N+1 issues early. Use Telescope or Debugbar to monitor query counts. Set strict mode to catch missing attributes. Configure query logging carefully as enableQueryLog retains queries in memory.

## Research Notes

Laravel 11 introduced new strict mode features. The once() method prevents duplicate relationship loads. Model casting to enums reduces validation code. The community trend is toward lighter models with dedicated action classes.

## Internal Mechanics

Eloquent models extend Illuminate\Database\Eloquent\Model. The query builder compiles Eloquent expressions into SQL. Relationships are resolved through lazy loading or eager loading. Model hydration converts database rows into PHP objects with type casting.

## Architectural Decisions

Decision: Eloquent ORM vs Query Builder vs Raw SQL. Use Eloquent for standard CRUD. Use Query Builder for complex queries. Use Raw SQL for database-specific optimizations.

## Tradeoffs

Benefit: Productivity via magic methods. Cost: Performance overhead vs raw SQL. Benefit: Relationship abstraction. Cost: N+1 risk if not careful. Benefit: Model events for business logic. Cost: Hidden side effects.

