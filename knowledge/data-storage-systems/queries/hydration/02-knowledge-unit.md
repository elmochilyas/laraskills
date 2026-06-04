# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.20 Hydration (hydrate, hydrateRaw)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`hydrate` and `hydrateRaw` create Eloquent model instances from raw data without querying the database. Useful for populating models from cached data, external APIs, or query results processed through the query builder.

---

# Core Concepts

- **hydrate(array)**: Creates a Collection of model instances from an array of attribute arrays. Fires `retrieved` event.
- **hydrateRaw(string, bindings)**: Creates model instances from raw SQL results. Less common.

---

# Mental Models

Hydration is the reverse of serialization. `toArray()` turns a model into an array; `hydrate()` turns an array into a model.

---

# Patterns

**Cache hydration**: Store model data in cache as array, retrieve and hydrate into model instances.

**Query builder to Eloquent bridge**: Run a complex query via `DB::select()`, pass results to `Model::hydrate()` to get Eloquent model instances with relationships.

---

# Common Mistakes

**Forgetting retrieved event**: `hydrate` fires the `retrieved` model event. If the event has side effects, expect them when hydrating.

**Hydrating from stale data**: The hydrated model may have attributes that differ from the database state.

---

# Related Knowledge Units

2.18 Model serialization | 2.19 Model events
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

