# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.24 replicate, fill, forceFill, forceCreate
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`replicate` creates a new unsaved model with the same attributes. `fill` mass-assigns attributes (respecting $fillable). `forceFill` bypasses $fillable protection. `forceCreate` creates a model without mass-assignment protection. These control how model attributes are populated and saved.

---

# Core Concepts

- **replicate(array $except)**: Clones the model without its primary key. Excludes specified attributes (timestamps).
- **fill(array $data)**: Mass-assigns attributes. Only attributes in `$fillable` array can be set.
- **forceFill(array $data)**: Mass-assigns all attributes, bypassing `$fillable` guard.
- **forceCreate(array $data)**: `create()` that bypasses `$fillable`. Use carefully.

---

# Mental Models

`fill` is guarded (respects the model's whitelist). `forceFill` is unguarded (sets anything). `replicate` is a copy constructor for models.

---

# Patterns

**Replicate for duplicate content**: Copy a post as a draft: `$post->replicate(['published_at'])->save()`.

**forceFill for internal operations**: Admin panel updates, system-generated attributes.

---

# Common Mistakes

**Using forceFill with user input**: Bypassing `$fillable` with user-supplied data allows mass-assignment of any attribute. Only use `forceFill` with trusted data.

**Replicate doesn't copy relationships**: Only the model's direct attributes are copied. Related records must be replicated separately.

---

# Related Knowledge Units

2.16 Accessors and mutators | 2.17 Casts
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

