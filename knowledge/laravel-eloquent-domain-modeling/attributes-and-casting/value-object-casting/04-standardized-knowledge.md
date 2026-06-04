# Value Object Casting

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Value Object Casting |
| Classification | Expert |
| Last Updated | 2026-06-02 |

## Overview

Value object casting combines custom Eloquent casts with value objects to provide seamless transformation between database storage and domain-primitive PHP objects. The cast handles serialization (value object → DB value) and deserialization (DB value → value object) transparently. This pattern enables type-safe, self-validating attributes that behave like native PHP types.

## Core Concepts

- **Custom cast as serializer**: The cast's `get()` creates the value object; `set()` extracts the DB value
- **Bidirectional mapping**: Database format → value object → database format, with validation at each boundary
- **Null handling**: If the column is nullable, the cast should return null and accept null
- **Castable shortcut**: Value objects implementing `Castable` can provide their own cast logic via `castUsing()`

## When To Use

- You have value objects that need to map to/from database columns
- The value object contains logic beyond simple getters (validation, computation, formatting)
- The same value object is used across multiple models

## When NOT To Use

- The value object is a simple data container with no logic (use `array` cast or JSON)
- The mapping is trivial (same fields, same types) — just use primitive casts
- The value object is only used in memory and never persisted

## Best Practices

- **Use the `Castable` interface for reusable value objects**: When a value object is used across multiple models, implementing `Castable` eliminates duplicate cast class references.
- **Handle null explicitly in the cast**: Both `get()` and `set()` should handle null values. Returning null from `get()` for nullable columns preserves the null semantics.
- **Keep the cast focused on serialization**: The cast's job is convert between formats, not to validate business rules (that's the value object's constructor).

## Architecture Guidelines

- Value objects in `App\ValueObjects\*`, casts in `App\Casts\*`
- If using `Castable`, the cast class can be in the same file or a dedicated class
- The cast should handle both scalar values and value object instances in `set()`

## Performance Considerations

- Value object construction on every read — acceptable for typical access patterns
- For hot paths (attributes read in loops), consider caching the value object on the model instance
- Immutable value objects create new instances on modification — GC-friendly for short-lived requests

## Examples

```php
// Cast integrating a value object
class EmailCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?Email
    {
        return $value === null ? null : new Email($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value === null) {
            return [$key => null];
        }
        return [$key => (string) $value];
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Value Object Fundamentals |
| Prerequisite | CastsAttributes Interface |
| Closely Related | Castable Interface |
| Closely Related | Immutability Patterns |
| Closely Related | Money/Email/Address Patterns |

## AI Agent Notes

- Cast converts between DB format and value objects
- Handle null explicitly in both `get()` and `set()`
- Use `Castable` for value objects used across multiple models

## Verification

- [ ] Cast handles null values in both `get()` and `set()`
- [ ] Value object constructor validates input
- [ ] `set()` accepts both scalar and value object instances
- [ ] Cast is registered in the model's `$casts` array
