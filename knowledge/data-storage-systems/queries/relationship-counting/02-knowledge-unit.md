# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.7 Relationship counting (withCount, withMin, withMax, withSum, withAvg, withExists)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Relationship aggregate methods load computed values (count, sum, avg, min, max, exists) as attributes on the parent model without hydrating the related models. This is the most impactful memory optimization in Eloquent — it replaces loading entire collections (thousands of models) with a single scalar value per parent.

---

# Core Concepts

- **withCount('relation')**: Adds `{relation}_count` attribute. SQL: `SELECT parent.*, (SELECT COUNT(*) FROM related WHERE ...) AS comments_count`.
- **withSum/Max/Min/Avg**: Same pattern, different aggregate functions. Adds `{relation}_sum_{column}` attribute.
- **withExists**: Adds `{relation}_exists` boolean. SQL: `EXISTS (SELECT 1 FROM ...)`.
- **Closure constraints**: All methods accept closures for filtered aggregates: `withCount(['comments' => fn($q) => $q->where('approved', true)])`.

---

# Mental Models

Aggregate loading replaces "load a collection to count it" with "ask the database for the number." It's the difference between fetching every comment to count them vs running `SELECT COUNT(*) WHERE post_id = ?`.

---

# Internal Mechanics

Each aggregate is added as a scalar subquery in the SELECT clause. The subquery is executed once per parent query, not per parent row. The result is stored as an attribute on the hydrated model. No related models are hydrated.

---

# Patterns

**Always use withCount instead of loading relationships for counts**: `Post::withCount('comments')` instead of `Post::with('comments')` then `$post->comments->count()`.

**Use withSum for aggregation**: `Order::withSum('items', 'price')` instead of loading order items and summing in PHP.

**Filtered aggregates for dashboards**: `User::withCount(['posts' => fn($q) => $q->where('published', true)])` — count only published posts.

---

# Architectural Decisions

| Method | When | When Not |
|--------|------|----------|
| withCount | Need just the count | Need the actual related models |
| withSum | Need sum of a related column | Need full related data |
| withExists | Need boolean existence check | Need the count |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Drastically reduces memory usage | Adds subquery to SELECT | Slightly larger result set per row
Avoids hydrating thousands of models | Limited to simple aggregates | Can't access related model properties

---

# Common Mistakes

**Loading full relationship just for count**: `$post->comments` loads all Comment models, then `->count()` on the collection. Wastes memory on large comment sets.

**Not constraining aggregates**: `withCount('comments')` counts ALL comments. If the endpoint only needs approved comments, use the closure form.

---

# Related Knowledge Units

2.3 Eager loading | 4.15 SQL-side vs collection-side aggregation | 2.5 Constrained eager loading
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

