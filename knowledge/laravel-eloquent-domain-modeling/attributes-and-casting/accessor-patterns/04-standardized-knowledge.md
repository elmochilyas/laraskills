# Accessor Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Accessor Patterns |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Accessors transform raw model attribute values when accessed via the model instance. Laravel 11's `Attribute::make()` with a `get` closure replaces the legacy `get{Attribute}Attribute()` convention. Accessors decouple stored representation from application-facing representation — a database column storing cents as an integer can expose a formatted dollar string. The closure-based API is composable, testable, and supports caching.

## Core Concepts

- **Attribute::make with get closure**: `protected function name(): Attribute { return Attribute::make(get: fn ($value) => ucfirst($value)); }` — the get closure receives the raw stored value and returns the transformed value
- **Native type transformation**: Accessors are invoked on `$model->attribute` reads; `$value` is the database-native type
- **No storage side effects**: Accessors are read-only transforms — they never write to the database
- **Cached accessors**: `Attribute::make(get: ..., shouldCache: true)` caches the computed value per model instance

## When To Use

- You need to transform a stored value for display (formatting, concatenation, computation)
- You want to expose a derived value that doesn't exist as a database column
- You need backward compatibility for legacy column names while migrating schema

## When NOT To Use

- The transformation has side effects (write to DB, call external APIs)
- The logic belongs in a presenter or view layer (pure presentation formatting)
- The transformation is expensive and not cached — use `shouldCache` or a regular method

## Best Practices

- **Accessors should be pure functions**: Given the same raw value, they should always return the same transformed value. Side effects in accessors cause unpredictable behavior because accessors run implicitly on every attribute read.
- **Cache expensive computations**: Use `shouldCache: true` on `Attribute::make()` when the accessor performs database queries, API calls, or complex calculations. This caches the result per model instance, preventing re-computation on repeated access.
- **Don't put business logic in accessors**: Accessors are view transformations. Business rules that influence persistence behavior belong in model methods or domain services, not accessors.

## Architecture Guidelines

- Define accessors as `protected function attributeName(): Attribute { return Attribute::make(get: fn ($value) => ...); }`
- Use the new `Attribute::make()` API (Laravel 11+); avoid legacy `get{Attribute}Attribute()` methods
- Accessors affect JSON/array serialization — be deliberate with `$appends` to avoid exposing computed values unintentionally

## Performance Considerations

- Accessors run on every read of the attribute unless cached via `shouldCache`
- Expensive accessors (DB queries, API calls) must use `shouldCache` or be replaced with explicit method calls
- Legacy accessors (`get{Attribute}Attribute`) cannot be cached — migrate to `Attribute::make()` with `shouldCache`

## Security Considerations

- Accessors may inadvertently expose sensitive computed data in serialization — use `$hidden` or check before appending
- Never perform authorization checks in accessors — accessors run implicitly and authorization should be explicit

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Side effects in accessors | Convenience | Unpredictable behavior on reads | Keep accessors pure |
| Expensive operations uncached | Missing `shouldCache` | Performance degradation | Use `shouldCache: true` |
| Business logic in accessors | Misunderstanding responsibility | Logic runs on every read | Put in model methods or services |
| Legacy accessors for new code | Habit | No caching, deprecated API | Use `Attribute::make()` |

## Anti-Patterns

- **Accessor as Service Locator**: Calling `app()->make()` or `resolve()` inside an accessor. Accessors are attribute transforms, not service resolvers.
- **Side-Effect Accessor**: An accessor that writes to the database, sends emails, or dispatches jobs. These operations belong in explicit model methods or events.
- **Implicit Authorization in Accessor**: Checking user permissions inside an accessor. Authorization should be explicit in controllers or policies.

## Examples

```php
class User extends Model
{
    protected function fullName(): Attribute
    {
        return Attribute::make(get: fn ($value) => "{$this->first_name} {$this->last_name}");
    }

    protected function totalInDollars(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => number_format($this->total_cents / 100, 2),
            shouldCache: true,
        );
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Closely Related | Mutator Patterns |
| Closely Related | Attribute Caching |
| Closely Related | Append Attributes |
| Advanced | Custom Casts |

## AI Agent Notes

- Accessors return transformed values on read; they never write to the database
- Use `shouldCache: true` for expensive computations
- Accessors are automatically included in `toArray()`/`toJson()` if listed in `$appends`

## Verification

- [ ] Accessor uses `Attribute::make(get: ...)` syntax (not legacy `getAttribute` method)
- [ ] Accessor has no side effects (no DB writes, no external calls)
- [ ] Expensive accessors use `shouldCache: true`
- [ ] Accessor does not perform authorization checks
