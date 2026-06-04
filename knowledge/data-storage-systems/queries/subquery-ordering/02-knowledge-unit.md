# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.9 Subquery ordering (orderBy with subquery)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Subquery ordering sorts parent results by a computed value from related tables. For example, ordering users by their most recent order date or by total spending. This avoids the N+1 pattern of sorting in PHP after loading all data.

---

# Core Concepts

- **orderBy with subquery**: `User::orderByDesc(Order::select('created_at')->whereColumn('user_id', 'users.id')->latest()->limit(1))`.
- **Performance**: The subquery executes as part of the query plan. An index on the subquery's WHERE and ORDER BY columns is critical.

---

# Mental Models

Subquery ordering pushes the sort computation to the database, where indexes can optimize it. It's the database saying "sort these by a value computed from another table."

---

# Patterns

**Sort by related aggregate**: `User::orderByDesc(Order::selectRaw('COALESCE(SUM(total), 0)')->whereColumn(...))`.

**Sort by latest related**: Users sorted by most recent login date.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Database-optimized sorting | Subquery executes per row | Heavy on large datasets without proper indexes
No PHP collection sorting | Complex query plan | EXPLAIN required for verification

---

# Common Mistakes

**No index on the subquery**: The subquery `WHERE user_id = users.id ORDER BY created_at DESC LIMIT 1` needs an index on `(user_id, created_at)`. Without it, the outer query is slow.

---

# Related Knowledge Units

2.8 Subquery selects | 4.25 Subquery optimization | 3.26 Index alignment with query patterns
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

