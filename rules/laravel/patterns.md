---
paths:
  - "**/*.php"
  - "**/composer.json"
---
# Laravel 13 Patterns

> This file extends [common/patterns.md](../common/patterns.md), [php/patterns.md](../php/patterns.md) with Laravel 13 specific content.

## Thin Controllers, Explicit Actions

- Controllers only handle transport: request validation, authorization, calling actions, returning responses.
- Move business logic into **Actions** (single-purpose) or **Services** (multi-step orchestration).
- Actions receive DTOs, never raw Request objects.

## PHP 8 Attribute-Driven Configuration

Use Laravel 13 PHP 8 attributes for model, queue, and command configuration. See skill: `laravel-patterns` for full examples.

## Modular Structure

Organize by feature/domain (`app/Modules/User/`), not by type (`app/Models/`, `app/Controllers/`).

```
app/Modules/User/
├── Actions/
├── DTOs/
├── Models/
├── Policies/
├── Resources/
├── Controllers/
├── Requests/
└── Tests/
```

## DTOs

Use readonly DTOs for all data crossing service boundaries. See skill: `laravel-patterns` for patterns.

## Testing

- 80% feature tests, 20% unit tests.
- Use Pest 4 for all new tests.
- Use fakes (Http, Mail, Queue, Notification, Storage, Event, Bus) instead of mocks.
- Write architecture tests to enforce conventions.

## Architecture Flow

Follow the **Controller → Action → Domain Service → Contract → Infrastructure** flow. See skill: `laravel-core-internals` and rule: `rules/laravel/architecture.md`.

## Container & DI

Always use constructor injection, depend on contracts, never resolve from the container in business code. See rule: `rules/laravel/service-container.md` and rule: `rules/laravel/service-providers.md`.

## Facades

Use facades only for infrastructure concerns (Cache, Log, DB). Inject contracts in business logic. See rule: `rules/laravel/facades.md` and rule: `rules/laravel/contracts.md`.

## Middleware

Single responsibility per middleware. Global for cross-cutting, route for domain-specific. See rule: `rules/laravel/middleware.md`.

## Reference

See skill: `laravel-patterns` for comprehensive Laravel patterns.
See skill: `laravel-eloquent` for advanced Eloquent architecture and performance.
See skill: `laravel-database` for database engineering, SQL optimization, and PostgreSQL.
See skill: `laravel-tdd` for testing patterns.
See skill: `laravel-security` for security patterns.
See skill: `laravel-core-internals` for container, DI, providers, facades, request lifecycle, and contracts.
See rule: `rules/laravel/eloquent.md` for enforced Eloquent rules.
See rule: `rules/laravel/database.md` for enforced database engineering rules.
