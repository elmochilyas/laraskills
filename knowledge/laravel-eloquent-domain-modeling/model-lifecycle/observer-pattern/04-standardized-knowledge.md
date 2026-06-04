# Observer Pattern

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Observer Pattern |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

The Observer pattern in Eloquent groups related lifecycle event listeners into a single class. Observers decouple event handling from the model, letting models focus on data while observers handle cache invalidation, audit logging, notifications, and synchronization.

## Core Concepts

- **Observer class**: Plain PHP class with methods named after model events
- **Method-to-event mapping**: `created(Model $model)` maps to the `created` event
- **Method signatures**: Each observer method receives the model instance
- **Registration**: Via `Model::observe()` or `#[ObservedBy]` attribute
- **Multiple observers**: A model can have multiple observers; all fire in registration order

## When To Use

- Grouping related event listeners into a single class
- Separating cross-cutting concerns (cache, audit, notifications) from model logic
- Testing event listeners independently

## When NOT To Use

- The listener logic is trivial (a closure in `booted()` is simpler)
- The observer would have only one method (consider a direct listener)
- The logic belongs in a domain event listener (use domain events for business reactions)

## Best Practices

- **One observer per concern**: `CacheObserver`, `AuditObserver`, `NotificationObserver`. Each observer has a single responsibility. This makes testing and reasoning about side effects straightforward.
- **Register with `#[ObservedBy]` attribute**: The attribute makes observer registration visible on the model class itself, rather than hidden in a service provider.
- **Don't put business logic in observers**: Observers handle infrastructure concerns (cache, logs, sync). Business logic reactions belong in domain event listeners.

## Architecture Guidelines

- Observers in `App\Observers\*`
- Registered via `#[ObservedBy]` attribute on the model
- One observer per infrastructure concern
- Observers should not call other observers or create circular dependencies

## Performance Considerations

- Each observer method adds a method call per event — negligible overhead
- Expensive operations in observers (API calls, email) should be queued
- Use `saveQuietly()` for bulk operations to skip observer execution

## Examples

```php
class CacheObserver
{
    public function saved(Order $order): void
    {
        Cache::forget("order:{$order->id}");
    }

    public function deleted(Order $order): void
    {
        Cache::forget("order:{$order->id}");
    }
}

#[ObservedBy(CacheObserver::class)]
#[ObservedBy(AuditObserver::class)]
class Order extends Model {}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Event Catalog |
| Closely Related | Observer Registration |
| Closely Related | Observer Anti-Patterns |
| Closely Related | Attribute Registration |

## AI Agent Notes

- One observer per concern
- Register with `#[ObservedBy]` attribute
- Observers handle infrastructure, not business logic

## Verification

- [ ] Observers are organized by concern (one per concern)
- [ ] Registered via `#[ObservedBy]` attribute
- [ ] Business logic is not in observers (use domain events)
