---
paths:
  - "**/*.php"
  - "**/phpunit.xml"
  - "**/phpunit.xml.dist"
  - "**/pest.php"
  - "**/composer.json"
---
# Laravel 13 Testing

> This file extends [common/testing.md](../common/testing.md), [php/testing.md](../php/testing.md) with Laravel 13 specific content.

## Framework

Use **Pest 4** as the first-class test framework (shipped with Laravel 13). Do not use PHPUnit directly for new tests.

## Test Types (80/20 Split)

- **80% Feature tests**: HTTP endpoints, database operations, authentication, full request/response cycle.
- **20% Unit tests**: Actions, Services, DTOs, Value Objects, helpers.

## Laravel Fakes Over Mocks

Always use Laravel's built-in fakes instead of mocking frameworks:
- `Http::fake()`, `Mail::fake()`, `Queue::fake()`, `Notification::fake()`
- `Storage::fake()`, `Event::fake()`, `Bus::fake()`

## Database

- Use `RefreshDatabase` trait in feature tests.
- Use `Model::factory()` for fixture creation (never raw arrays).
- Use `assertDatabaseHas`, `assertDatabaseCount`, `assertModelExists`.

## Pest Conventions

```php
// tests/Pest.php — setup
uses(
    Tests\TestCase::class,
    Illuminate\Foundation\Testing\RefreshDatabase::class,
)->in('Feature');

// Architecture tests in tests/Architect/
test('strict types')->arch()->expect('App')->toUseStrictTypes();
```

## Reference

See skill: `laravel-tdd` for comprehensive testing with Pest 4.
See rules/laravel/patterns.md for architecture to test against.
