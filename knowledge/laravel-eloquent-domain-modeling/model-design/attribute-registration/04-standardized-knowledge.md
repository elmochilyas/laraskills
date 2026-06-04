# Attribute Registration

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Attribute Registration |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

PHP 8 attributes on Eloquent models register observers, scopes, custom collection classes, and custom builder classes directly on the model class definition. This declarative approach replaces manual registration in `boot()` methods, making configuration more discoverable and reducing boilerplate.

## Core Concepts

- **#[ObservedBy]**: Registers observer classes on the model — equivalent to `Model::observe()`
- **#[ScopedBy]**: Registers global scopes — equivalent to `addGlobalScope()`
- **#[CollectedBy]**: Sets a custom collection class — equivalent to `newCollection()`
- **#[UseEloquentBuilder]**: Sets a custom builder class — equivalent to `newEloquentBuilder()`

## When To Use

- Registering observers, scopes, custom collections, or custom builders on models
- Prefer attributes over manual `boot()` registration for better discoverability

## When NOT To Use

- The registration requires runtime conditions (use `boot()` for conditional registration)
- Multiple attributes on a single model are hard to read (group them)
- PHP 7 compatibility is required

## Best Practices

- **Prefer attributes over boot methods**: `#[ObservedBy(OrderObserver::class)]` is more discoverable than `Order::observe()` in a service provider. The configuration lives on the model where it belongs.
- **Use multiple attributes for multiple observers**: `#[ObservedBy(LogObserver::class)] #[ObservedBy(CacheObserver::class)]` — each observer gets its own attribute.
- **Combine with trait decomposition**: Put attribute registration on the model class alongside trait usage for a complete picture of the model's behavior.

## Architecture Guidelines

- Attributes are resolved during model boot — no separate registration step needed
- Multiple attributes of the same type stack (multiple observers, multiple scopes)
- Attributes work with inheritance — child models inherit parent attributes

## Examples

```php
#[ObservedBy(OrderObserver::class)]
#[ScopedBy(TenantScope::class)]
#[CollectedBy(OrderCollection::class)]
#[UseEloquentBuilder(OrderBuilder::class)]
class Order extends Model
{
    //
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Base Model Class |
| Closely Related | Observer Registration |
| Closely Related | Global Scopes |
| Closely Related | Custom Builders |

## AI Agent Notes

- PHP 8 attributes replace manual boot registration
- `#[ObservedBy]`, `#[ScopedBy]`, `#[CollectedBy]`, `#[UseEloquentBuilder]`
- Attributes stack — multiple allowed per type

## Verification

- [ ] Attributes used for observer/scope/collection/builder registration where feasible
- [ ] Runtime-conditional registration still uses `boot()` methods
- [ ] Multiple attributes of same type used correctly
