---
paths:
  - "**/*.php"
  - "**/composer.json"
---

# Laravel 13 Service Container Rules

> This file extends [common/patterns.md](../common/patterns.md) with Service Container-specific rules.

## Always Use Dependency Injection

Business code must never manually resolve from the container:

```php
// FORBIDDEN in domain/business code:
$service = new UserService();
app(UserService::class);
resolve(UserService::class);
App::make(UserService::class);
```

**Exceptions:** Service Providers, factory definitions, bootstrap files.

## Depend on Abstractions

```php
// GOOD
class PaymentService {
    public function __construct(private PaymentGatewayInterface $gateway) {}
}

// FORBIDDEN
class PaymentService {
    public function __construct(private StripeGateway $gateway) {}
}
```

## Avoid Interface Abuse

Only create interfaces when:
- Multiple implementations exist now
- Multiple implementations are expected
- External services may change

## Contextual Binding

Use when different consumers need different implementations:

```php
$this->app->when(AdminController::class)
    ->needs(PaymentGatewayInterface::class)
    ->give(StripeGateway::class);
```

## Tagged Services

Use tags for plugin-style architectures (payment gateways, notification channels, exporters).

## Binding Lifetimes

| Lifetime | Method | Instance | Use Case |
|----------|--------|----------|----------|
| Singleton | `$app->singleton(...)` | One per app | API clients, config services |
| Scoped | `$app->scoped(...)` | One per request | Tenant context, request state |
| Transient | `$app->bind(...)` | New each time | Stateless services |

**Required:** Use `scoped()` instead of `singleton()` when running Laravel Octane to avoid request-state leakage.

## See Also

- Skill: `laravel-core-internals` for deep container patterns
- Skill: `laravel-tdd` for testing container bindings
- Rule: `rules/laravel/contracts.md` for interface design
