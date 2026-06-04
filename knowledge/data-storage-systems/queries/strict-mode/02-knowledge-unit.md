# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.30 Strict mode (preventSilentlyDiscardingAttributes, preventAccessingMissingAttributes)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Laravel strict mode enables guardrails that prevent silent data loss and debugging frustration. `preventSilentlyDiscardingAttributes` throws an exception when mass-assignment discards unfillable attributes. `preventAccessingMissingAttributes` throws when accessing attributes not loaded or set. These catch bugs during development that would otherwise cause subtle production issues.

---

# Core Concepts

- **preventSilentlyDiscardingAttributes**: When mass-assigning, unfillable attributes are silently dropped. This mode throws an exception instead.
- **preventAccessingMissingAttributes**: Accessing a non-existent attribute returns null. This mode throws an exception instead.
- **Environment-specific**: Enable in local/staging/CI. Disable in production (or log instead of throw).

---

# Mental Models

Strict mode is a lint checker for Eloquent attribute access. It catches typos ("statues" instead of "status") and missing fillable declarations at development time.

---

# Patterns

**Enable in development**: `Model::preventSilentlyDiscardingAttributes()` and `Model::preventAccessingMissingAttributes()` in `AppServiceProvider::boot()` for non-production.

**Log in production**: Use `Model::handleMissingAttributeAccessUsing(fn($model, $key) => Log::warning(...))` to catch issues without breaking production.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Catches typos and missing $fillable | Can be annoying during rapid prototyping | Disable for prototyping, enable for production code
Prevents silent data corruption | Requires discipline | Essential for data integrity

---

# Common Mistakes

**Not enabling in development**: Developers write code that accesses `$model->statues` instead of `$model->status`. Returns null. Bug is discovered only when the wrong value reaches the database.

**Enabling with throwing in production**: User-facing exceptions for missing attributes. Use logging handler in production.

---

# Related Knowledge Units

2.17 Casts | 2.24 replicate, fill, forceFill | 2.18 Model serialization
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

