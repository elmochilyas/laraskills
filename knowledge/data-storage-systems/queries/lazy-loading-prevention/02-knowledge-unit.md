# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.4 Lazy loading prevention (Model::preventLazyLoading)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Laravel can throw an exception when lazy loading is detected via `Model::preventLazyLoading()`. This forces developers to explicitly eager load every accessed relationship, preventing N+1 queries from reaching production. The standard pattern is to enable prevention in non-production environments and log violations in production.

---

# Core Concepts

- **preventLazyLoading()**: When enabled, accessing a relationship that wasn't eager loaded throws a `LazyLoadingViolationException`.
- **Environment-specific**: Typically enabled for local/staging, disabled (with logging) for production.
- **handleLazyLoadingViolationUsing**: Custom handler that logs violations instead of throwing exceptions in production.
- **Per-model override**: `protected $preventLazyLoading = false` on specific models where lazy loading is acceptable (e.g., small lookup tables).

---

# Mental Models

Lazy loading prevention is a compiler warning for database queries. It makes expensive hidden behavior visible at development time instead of discovering it at production traffic levels.

---

# Internal Mechanics

When a lazy loaded relationship is accessed, Eloquent checks if lazy loading prevention is enabled. If so, it checks if a custom violation handler is registered. If no handler, it throws the exception. If handler exists, it calls the handler (typically logs a warning).

---

# Patterns

**Standard boilerplate**: `Model::preventLazyLoading(! app()->isProduction())` in `AppServiceProvider::boot()`. Throws in local/staging, silently allows in production.

**Production violation logging**: `Model::handleLazyLoadingViolationUsing(fn($model, $relation) => Log::warning(...))`. This captures N+1 patterns that only appear under production data volumes.

**Opt-in for small tables**: On models backed by tiny tables (< 100 rows), set `$preventLazyLoading = false` since the N+1 cost is negligible.

---

# Architectural Decisions

| Setting | When | When Not |
|---------|------|----------|
| Throwing violations | Local dev, staging, CI | Production |
| Logging violations | Production | Only if monitoring is absent |
| Per-model opt-out | Tiny lookup models | Entity models with high query volume |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Catches N+1 during development | Forces explicit eager loading | More verbose queries
Production logging catches scale-only issues | Log noise if many violations | Requires log monitoring discipline

---

# Common Mistakes

**Disabling globally for production without logging**: N+1 goes completely undetected. The app runs fine at low traffic but fails under load.

**Not enabling in CI**: CI passes even though the code has N+1. Violations are only caught locally (if at all).

---

# Related Knowledge Units

2.3 Eager loading | 4.13 N+1 detection and elimination | 2.28 N+1 detection via Telescope
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

