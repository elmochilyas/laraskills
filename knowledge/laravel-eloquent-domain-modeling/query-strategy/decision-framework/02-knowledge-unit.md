# Decision Framework

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
The Query Builder vs Eloquent Decision Framework provides structured guidance for choosing between `DB::table()` (Query Builder) and `Model::query()` (Eloquent ORM) for any given database operation. The core tension is between developer convenience and raw performance: Eloquent provides model hydration, relationship loading, scopes, and event hooks but adds overhead. Query Builder gives minimal abstraction, maximum speed, and direct SQL control. The decision depends on whether domain logic, read-model projections, bulk operations, or reporting queries are involved. A mature codebase uses both — defaulting to Eloquent for domain operations and dropping to Query Builder (or `toBase()`) for performance-critical paths and reporting.

## Core Concepts
- **Eloquent (ORM)** — full object-relational mapping with model hydration, relationships, accessors, mutators, events, serialization, scopes
- **Query Builder** — thin SQL abstraction; returns `stdClass` objects; no model layer; direct SQL generation
- **Model Hydration** — the process of converting database rows into Eloquent Model instances (includes trait booting, attribute casting, event initialization)
- **`toBase()`** — Eloquent method that skips hydration, returning `stdClass` results from a model-backed query
- **Read Model** — a non-Eloquent representation of data optimized for reading (projection, denormalization)
- **CQRS Read Path** — in Command Query Responsibility Segregation, reads are separate from writes; Query Builder (or raw read models) are preferred for the read path

## Mental Models
- **Spectrum of Abstraction** — Eloquent (highest abstraction) → Eloquent + toBase() → Query Builder → Raw SQL (lowest abstraction). Prefer the highest abstraction that meets performance requirements.
- **Write = Eloquent, Read = Hybrid** — use Eloquent for complex writes (events, validation, relationships); use Query Builder or `toBase()` for reads that don't need domain logic.
- **Cost-Benefit of Hydration** — each hydrated model costs ~1-5µs + memory for casting, traits, and events; on 10k rows, that's 10-50ms of overhead. Pay the cost only when you need model features.
- **Domain Boundary** — within domain services and use cases, use Eloquent; at the infrastructure/integration boundary (reports, exports, bulk APIs), use Query Builder.

## Internal Mechanics
Hydration overhead breakdown:
1. PDO row fetched as `stdClass` (~0.1µs)
2. Eloquent creates a new Model instance (~0.5µs)
3. Sets attributes from the row (~0.3µs)
4. Boots traits on first model creation (~1-2µs one-time)
5. Appends `$appends` accessors on serialization (~variable)
6. Fires `retrieved` event (~0.5µs)

Total: approximately 2-5µs per hydrated model. For 1000 rows, 2-5ms overhead. For 100k rows, 200-500ms — significant for API responses but acceptable for background jobs.

Query Builder skips steps 2-6 entirely, returning raw `stdClass` objects directly from PDO.

## Patterns
- **Default to Eloquent** — use `Model::query()` as the default for all new queries; optimize only when profiling shows it matters
- **Drop to `toBase()` for Bulk Reads** — `User::where('active', true)->toBase()->get()` — skips hydration, returns `stdClass`
- **Use Query Builder for Reporting** — complex reporting queries with aggregations, multiple joins, and raw expressions are cleaner in Query Builder
- **Use Eloquent for Writes** — model events, validation, and relationship management justify hydration overhead
- **Hybrid: Query Builder with Model Hydration** — use `DB::table('users')->get()` then manually hydrate with `new User((array) $row)` for specific cases

## Architectural Decisions

### Eloquent: When to Use
- You need model events (`creating`, `saved`, `deleted`)
- You need relationships (eager loading, lazy loading)
- You need accessors/mutators or attribute casting
- You need scopes (local, global) for query logic
- You need serialization (`toArray()`, `toJson()`, API resources)
- You need form model binding or route model binding
- You are writing domain logic (services, actions, use cases)

### Query Builder: When to Use
- You need maximum raw performance
- You are doing bulk inserts/updates (1000+ rows)
- You are building complex reporting/analytical queries
- You don't need model features (simple read-only queries)
- You are working with pivot tables directly
- You need database-specific SQL features (JSON operators, full-text, CTEs)
- You want to avoid N+1 from lazy loading (forced explicit joins)

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Eloquent: rich domain logic (events, casts, relationships) | Hydration overhead (2-5µs per row) | Profile before optimizing; premature optimization is wasteful |
| Eloquent: expressive, readable query DSL | Eloquent can generate suboptimal SQL | Use `toSql()` and `explain()` to verify query plans |
| Query Builder: maximum performance | No events, no casts, no relationships | Use for reads; keep writes in Eloquent |
| Query Builder: explicit SQL control | More boilerplate; manual hydration | Acceptable for reporting; painful for domain logic |
| `toBase()`: best of both | Only skips hydration; still uses Eloquent builder | Use as first optimization step before switching to QB |
|  |  |  |

## Performance Considerations
- Hydration overhead is proportional to row count: negligible for single records (< 1µs), significant for large result sets (100ms+ for 50k rows)
- Eloquent's `cursor()` still hydrates models one at a time; `toBase()` + `cursor()` returns raw objects
- Query Builder uses less memory per row (no model object, no attribute bag, no relationships array)
- Eloquent's lazy loading can cause N+1 hidden in loops; Query Builder forces explicit joins

## Production Considerations
- **Standardize on a decision rule** — establish a team convention: "Use Eloquent for all database operations unless profiling proves it's a bottleneck"
- **Monitor query count and timing** — use Laravel Telescope or Debugbar to track Eloquent vs Query Builder query distribution
- **Prefer `toBase()` over `DB::table()`** — when you need Eloquent builder features (scopes, relation constraints) but not hydration, `toBase()` is the right middle ground
- **Audit N+1** — use `Model::preventLazyLoading()` in development and `Model::handleLazyLoadingViolationUsing()` in production to catch unintended lazy loads
- **Keep Decision Reversible** — structure read-model queries behind repositories or query objects so switching strategy doesn't require changing all callers

## Common Mistakes
- **Using Eloquent for mass updates** — `User::where(...)->update([...])` runs a single UPDATE query (no hydration); this is fine. But `User::where(...)->get()->each->update([...])` hydrates every row and updates one-by-one — a common performance mistake.
- **Using Query Builder when events are needed** — skipping Eloquent for inserts means `created`/`creating` events never fire, breaking dependent logic
- **Over-optimizing with Query Builder** — switching to QB for a query that runs 3 times a day with 10 rows is premature optimization
- **Missing relationship constraint methods** — Query Builder doesn't have `whereHas`, `with`, `has`. Reimplementing them manually is error-prone.

## Failure Modes
- **Missing soft deletes** — using Query Builder on a table with soft deletes returns soft-deleted records; Eloquent's `SoftDeletingScope` is bypassed
- **Missing global scopes** — if business logic depends on global scopes (e.g., multi-tenant filtering), Query Builder bypasses all of them
- **Event-driven failures** — skipping model events (e.g., cache invalidation in `saved`) when using Query Builder for writes causes stale caches or missing audit logs
- **Inconsistent serialization** — stdClass objects don't serialize the same as models; if response formatting expects `toArray()`, Query Builder results will differ

## Ecosystem Usage
- **Laravel Nova** — uses Eloquent for resource CRUD, Query Builder for metrics/reporting cards
- **Laravel Horizon** — uses Eloquent for job monitoring, Query Builder for tag management
- **Laravel Telescope** — uses Eloquent for entry display, Query Builder for quick aggregations
- **Laravel Excel** (Maatwebsite) — uses Query Builder internally for large spreadsheet exports for performance
- **Laravel Backup** (Spatie) — uses Query Builder for backup database queries

## Related Knowledge Units

### Prerequisites
Builder Fundamentals, Subqueries, Performance Tradeoffs

### Related Topics
To Base Pattern, Hybrid Strategies, Local Scopes, Global Scopes

### Advanced Follow-up Topics
Custom Builder Pattern, Domain-Specific Query Methods

## Research Notes
- **Source Analysis:** Framework decision points: `Model::newQuery()` creates an Eloquent Builder; `Model::newBaseQueryBuilder()` creates a Query Builder. `toBase()` calls `$this->getQuery()` which returns the underlying Query Builder.
- **Key Insight:** The decision framework is not binary — it's a sliding scale. The most pragmatic approach for most applications is: start with Eloquent, use `toBase()` as the first optimization step, drop to Query Builder only when `toBase()` is insufficient.
- **Version-Specific Notes:** Laravel 11 introduced `Model::preventLazyLoading()` as a boot-time concern. Laravel 10+ has `Model::shouldBeStrict()` which combines prevention of lazy loading, silently discarding fills, and accessing missing attributes.
