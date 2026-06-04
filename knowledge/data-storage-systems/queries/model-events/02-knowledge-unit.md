# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.19 Model events (retrieved, creating, created, updating, updated, saving, saved, deleting, deleted, trashed, forceDeleted)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Model events fire at specific points in the model lifecycle: retrieval, creation, update, save, delete, restore, and force delete. They enable side-effect logic (logging, cache invalidation, notifications) to be attached to model operations without cluttering controllers.

---

# Core Concepts

- **Event types**: `retrieved` (after DB read), `creating`/`created` (before/after INSERT), `updating`/`updated` (before/after UPDATE), `saving`/`saved` (before/after both INSERT and UPDATE), `deleting`/`deleted` (before/after DELETE), `trashed` (soft delete), `forceDeleted` (force delete).
- **Returning false**: In `creating`, `updating`, `saving`, `deleting`, returning `false` cancels the operation.
- **Observers**: Classes that group multiple model events. Registered in `AppServiceProvider::boot()`.

---

# Mental Models

Model events are database hooks at the ORM level. They fire within the same database transaction as the model operation (when applicable). `updating` vs `saved` = before vs after the DB write.

---

# Patterns

**Automatic slug generation**: `static::creating(fn($model) => $model->slug = Str::slug($model->title))`.

**Cache invalidation**: `static::saved(fn($model) => Cache::forget("post:{$model->id}"))`.

**Observer for cross-cutting concerns**: Logging, audit trails, notifications grouped in an Observer class.

---

# Common Mistakes

**Performing heavy operations in events**: API calls, long computations, or queue dispatches inside model events — these block the HTTP response.

**Model events not firing in bulk operations**: `User::query()->update(...)` does NOT fire model events. Only individual model `save()`, `update()`, `delete()` calls fire events.

---

# Related Knowledge Units

2.20 Hydration | 2.25 touch/touchOwners | 2.21 upsert
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

