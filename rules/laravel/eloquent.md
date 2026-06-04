---
paths:
  - "**/*.php"
  - "**/database/migrations/**"
---

# Laravel 13 Eloquent Rules

> This file extends [common/patterns.md](../common/patterns.md) and [php/patterns.md](../php/patterns.md) with Eloquent-specific rules.

## Architecture

- Eloquent is a **persistence layer**, not the application architecture.
- Models may contain domain behavior (`markAsPaid()`, `cancel()`) but NEVER infrastructure concerns (email, PDF, API calls).
- Use **DTOs** to cross service boundaries — never pass raw request data or arrays.
- Use **Value Objects** for domain concepts (Email, Money, Address) with custom casts.
- Avoid generic `UserRepository` that wraps Eloquent — use Query Objects, Actions, or Custom Builders instead.
- Meaningful domain repositories (multiple persistence implementations, external API data sources, complex reusable query logic) are acceptable — see Repository Justification Criteria in `docs/architecture-decisions/repository-vs-direct-eloquent.md`.

## Relationships

- Always define explicit relationships with return types (`BelongsTo`, `HasMany`, etc.).
- Always use **Morph Maps** for polymorphic relations (`Relation::enforceMorphMap()`).
- Always index polymorphic columns (`$table->morphs('commentable')`).
- Use `HasOneThrough` / `HasManyThrough` for deep relationships instead of nested loops.

## Performance

- **N+1 queries are production bugs** — never ship them.
- Enable `Model::preventLazyLoading()` in local/testing environments.
- Always use **constrained eager loading** for large datasets.
- Use **aggregate methods** (`withCount`, `withSum`, `withAvg`) instead of loading collections.
- Never use `SELECT *` — always specify columns: `User::select(['id', 'name', 'email'])`.
- Always specify columns in relationship eager loads: `with(['posts:id,user_id,title'])`.
- Use `cursorPaginate()` for large datasets, `paginate()` for UI pagination.

## Scopes & Builders

- Prefer **local scopes** over global scopes — they are explicit.
- Global scopes must be **documented** and **easily escapable**.
- Scopes must be **composable** — each does exactly one thing.
- Use **Custom Builders** when query logic grows beyond simple scopes.
- Use **Query Macros** for application-wide reusable query patterns.

## Casts & Attributes

- Use **custom casts** for complex data types.
- Use **`encrypted` cast** for sensitive data at rest.
- Use **PHP native enums** with backed strings for all finite state fields.
- Never encrypt searchable fields — store a hash alongside encrypted values for lookup.

## Events & Observers

- Observers must remain **lightweight** — only cache invalidation, logging, slug generation.
- Heavy side effects belong in **event listeners** dispatched from domain events.
- Use domain events to decouple workflows (`OrderPaid` → multiple listeners).
- Observers must NOT perform payment processing, email sending, or external API calls.

## Enterprise Checklist

Before merging, verify:
- [ ] No N+1 — all accessed relations eager loaded
- [ ] Specific columns selected (no `SELECT *`)
- [ ] Poly morphic relations use Morph Maps
- [ ] Aggregates computed in SQL
- [ ] Enums used for finite states
- [ ] Sensitive fields encrypted
- [ ] Observers are lightweight
- [ ] Events decouple side effects
- [ ] Queries are paginated

## See Also

- Skill: `laravel-eloquent` for comprehensive advanced Eloquent patterns
- Skill: `laravel-database` for SQL optimization, indexing strategy, and query analysis
- Skill: `laravel-patterns` for Actions, DTOs, and Services
- Skill: `laravel-tdd` for testing Eloquent models
- Rule: `rules/laravel/database.md` for enforced database engineering rules
- Agent: `laravel-eloquent` for automated Eloquent optimization
