# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.25 touch, touchOwners
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

`touch()` updates the `updated_at` timestamp of the current model. `touchOwners()` cascades timestamp updates up the relationship chain (child update triggers parent `updated_at` update). Used for cache invalidation and change tracking.

---

# Core Concepts

- **touch()**: Sets `updated_at` to current time and saves. `$model->touch()`.
- **touchOwners()**: Calls `touch()` on parent models (belongsTo, morphTo relationships). Cascades up the chain.
- **Automatic touching**: `protected $touches = ['parent']` on the child model auto-touches the named relationship when the child is saved.

---

# Mental Models

Touch is a timestamp propagation mechanism. When a child changes, parents know they need to refresh caches or recalculate derived values.

---

# Patterns

**Cache invalidation via touch**: Cache key includes `updated_at` timestamp. Touching the model invalidates the cache.

**Parent update on child change**: `protected $touches = ['post']` in Comment model. When a comment is created/updated/deleted, the parent post's `updated_at` is updated.

---

# Common Mistakes

**touch causing unnecessary saves**: `touch()` triggers a database UPDATE even if the model hasn't changed. In high-frequency updates, this adds write load.

**Cascading touch on deep hierarchies**: `$touches` on multiple levels creates a chain of UPDATE queries. Excessive on deeply nested relationships.

---

# Related Knowledge Units

2.19 Model events | 2.3 Eager loading
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

