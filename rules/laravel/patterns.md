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

## Reference

See skill: `laravel-patterns` for comprehensive Laravel patterns.
See skill: `laravel-tdd` for testing patterns.
See skill: `laravel-security` for security patterns.
