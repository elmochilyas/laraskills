# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.13 Joins (inner, left, right, cross, joinSub)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Query builder joins combine rows from multiple tables based on related columns. Join type selection (inner, left, right, cross) determines which rows are included in the result. `joinSub` allows joining to a subquery. Join performance depends on index availability on the joined columns.

---

# Core Concepts

- **join()**: INNER JOIN — includes rows where the join condition matches in both tables.
- **leftJoin()**: LEFT JOIN — includes all rows from the left table, NULLs for non-matching right rows.
- **rightJoin()**: RIGHT JOIN — opposite of LEFT JOIN.
- **crossJoin()**: CROSS JOIN — Cartesian product of both tables.
- **joinSub()**: Join to a subquery result. Useful for pre-filtered joins.

---

# Mental Models

Joins add columns from other tables. INNER JOIN filters (excludes non-matching). LEFT JOIN adds (nulls for missing). Use the join type that matches the data requirement: "must have" = INNER, "optionally has" = LEFT.

---

# Patterns

**Index join columns**: The column used in the ON clause must be indexed. For `join('orders', 'orders.user_id', 'users.id')`, `orders.user_id` must be indexed.

**Reads vs writes separation**: For reporting (read-only), LEFT JOIN is acceptable. For transactional queries, prefer INNER JOIN to avoid unexpected NULLs.

**joinSub for complex filtering**: Pre-filter a large table before joining to reduce the joined dataset size.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Single query replaces multiple Eloquent queries | Rawer than relationship syntax | Loss of relationship hydration
joinSub reduces data volume | More complex query | Harder to debug

---

# Common Mistakes

**Missing index on join column**: A join on an unindexed column causes a full table scan on the joined table for every row.

**joinSub without alias**: `joinSub($query, 'alias', 'alias.id', '=', 'table.col')` — forgetting the alias causes ambiguous column errors.

---

# Related Knowledge Units

2.10 Query builder methods | 4.24 Join optimization | 2.2 Relationship types
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

