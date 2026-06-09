---
description: Enforce TDD workflow with Pest 4 for Laravel 13
---

# TDD Command

## Usage

Enforce a Test-Driven Development workflow using Pest 4 for Laravel 13 features.

### TDD Cycle

1. **RED** — Write a failing test first
2. **GREEN** — Write minimal implementation to pass
3. **REFACTOR** — Clean up while keeping tests green

### Test Structure

```
tests/
  Feature/       — 80% of tests (HTTP, database, auth)
  Unit/          — 20% of tests (Actions, DTOs, Services)
  Architect/     — Architecture enforcement tests
```

### Test Types

- **Feature tests**: Full request/response cycle with `RefreshDatabase`
- **Unit tests**: Isolated logic for Actions, DTOs, Value Objects
- **Architecture tests**: Enforce conventions with Pest `->arch()`

### Coverage Target

```
php artisan test --parallel --coverage --min=80
```

### Before Committing

- [ ] Write failing test (RED)
- [ ] Write implementation (GREEN)
- [ ] Refactor if needed (REFACTOR)
- [ ] Run `./vendor/bin/pint --test`
- [ ] Run `./vendor/bin/phpstan analyse --level=6`
- [ ] Verify 80%+ coverage

## References

- See skill: `laravel-tdd` for comprehensive Pest 4 testing patterns
- See rules/laravel/testing.md for testing conventions
- See rules/common/testing.md for general testing rules
