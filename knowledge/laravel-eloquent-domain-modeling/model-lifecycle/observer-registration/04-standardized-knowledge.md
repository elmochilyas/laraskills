# Observer Registration

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Observer Registration |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Observers are registered on Eloquent models using the `#[ObservedBy]` PHP 8 attribute or the `observe()` method in a service provider. Registration determines which observers listen to which models' lifecycle events.

## Core Concepts

- **#[ObservedBy] attribute**: Declarative registration directly on the model class — `#[ObservedBy(OrderObserver::class)]`
- **Model::observe()**: Programmatic registration — `Order::observe(OrderObserver::class)` in a service provider's `boot()` method
- **Multiple observers**: Both mechanisms support registering multiple observers on a single model
- **Registration order**: Observers fire in the order they are registered
- **Event discovery**: Registered observers are discovered via the `getObservableEvents()` method

## When To Use

- `#[ObservedBy]` for most cases — visible on the model, no service provider changes needed
- `observe()` when registration is conditional on environment or configuration

## Best Practices

- **Prefer `#[ObservedBy]` over `observe()` calls**: The attribute makes observer registration visible and discoverable on the model class, keeping the service provider lean.
- **Use `observe()` for conditional registration**: If an observer should only register in certain environments or configurations, use `Model::observe()` in a service provider.
- **Register in `AppServiceProvider::boot()` or dedicated service provider**: If using `observe()`, group registration calls in one place for maintainability.

## Architecture Guidelines

- Default: `#[ObservedBy(Observer::class)]` on the model
- For conditional: `Model::observe()` in `AppServiceProvider::boot()` or `App\Providers\ObserverServiceProvider`
- Observers in `App\Observers\*` namespace

## Examples

```php
#[ObservedBy(OrderObserver::class)]
#[ObservedBy(AuditObserver::class)]
class Order extends Model {}

// Conditional registration
class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (config('app.debug')) {
            Order::observe(DebugOrderObserver::class);
        }
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Observer Pattern |
| Closely Related | Attribute Registration |
| Closely Related | Observer Anti-Patterns |

## AI Agent Notes

- Default: `#[ObservedBy]` on the model
- Conditional: `Model::observe()` in service provider
- Group `observe()` calls in one place for maintainability

## Verification

- [ ] Observers registered via `#[ObservedBy]` or `observe()`
- [ ] Conditional registrations use `observe()` in service provider
- [ ] Registration calls are grouped in one place
