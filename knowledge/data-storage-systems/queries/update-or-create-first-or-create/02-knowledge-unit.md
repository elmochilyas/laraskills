# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.26 updateOrCreate, firstOrCreate, firstOrNew
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

These methods provide "find or create" semantics: try to find a matching record, and if none exists, create one. `firstOrCreate` creates and persists. `firstOrNew` creates an unsaved instance. `updateOrCreate` updates if exists, creates if not. All perform two operations (SELECT + INSERT) and are not atomic without a transaction.

---

# Core Concepts

- **firstOrCreate(attrs)**: Find by attrs, or create and persist. Returns the model.
- **firstOrNew(attrs)**: Find by attrs, or create a new unsaved instance. Returns the model (unsaved if new).
- **updateOrCreate(attrs, values)**: Find by attrs, update with values, or create with attrs + values.

---

# Mental Models

These are convenience methods for the "find or create" pattern. They are NOT atomic — a concurrent request can create a duplicate between the SELECT and INSERT.

---

# Patterns

**Use upsert for atomic create-or-update**: In concurrent environments, wrap `updateOrCreate` in a database transaction or use `upsert` which is atomic.

**firstOrCreate for reference data**: Countries, categories, statuses — data that rarely causes concurrent conflicts.

**firstOrNew for draft-like behavior**: Create an unsaved model instance to show a form, save explicitly when submitted.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Simple, readable code | No built-in atomicity | Race condition under concurrent requests
Returns model directly | Two queries per operation | Performance impact on hot paths

---

# Common Mistakes

**Race condition with firstOrCreate**: Two requests simultaneously execute `firstOrCreate`. Both SELECT returns null. Both INSERT. Second INSERT violates unique constraint. Wrap in transaction or use upsert.

**Using firstOrCreate in a loop**: `foreach ($items as $item) { Model::firstOrCreate(...) }` — N+1 pattern at the database level. Use upsert for batch operations.

---

# Related Knowledge Units

2.21 upsert | 2.22 insertOrIgnore
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

