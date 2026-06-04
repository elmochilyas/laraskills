# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.14 Unions (union, unionAll)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`union` and `unionAll` combine results from multiple queries into a single result set. `union` removes duplicates (adds a sort/distinct pass); `unionAll` keeps all rows. Useful for combining results from different tables with the same column structure or for OR conditions that should use separate indexes.

---

# Core Concepts

- **union**: Combines queries, removes duplicate rows (SORT + DISTINCT operation).
- **unionAll**: Combines queries, keeps all rows (faster, no dedup overhead).
- **Column compatibility**: All combined queries must return the same number of columns with compatible types.

---

# Mental Models

UNION is a vertical concatenation of query results. UNION ALL is "stack the results on top of each other." UNION is UNION ALL + sort + dedup.

---

# Patterns

**OR optimization**: Replace `where('a')->orWhere('b')` with two queries unioned — each can use its own index optimally.

**Cross-table search**: Search `users.name` and `posts.title` in a single result set. Union the two queries.

**Use unionAll when possible**: `unionAll` avoids the sort+distinct overhead of `union`. Only use `union` when duplicates must be eliminated.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Each query can use its own index | Multiple SELECT statements | More complex query structure
unionAll is fast | Includes all duplicates | May return more rows than expected

---

# Common Mistakes

**Using union when unionAll suffices**: The sort+distinct pass for `union` is expensive. If duplicates are impossible or acceptable, use `unionAll`.

**ORDER BY in individual queries**: ORDER BY inside a unioned query is only allowed with LIMIT. Order the entire union result with a final ORDER BY.

---

# Related Knowledge Units

2.10 Query builder methods | 4.11 orWhere on composite index
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

