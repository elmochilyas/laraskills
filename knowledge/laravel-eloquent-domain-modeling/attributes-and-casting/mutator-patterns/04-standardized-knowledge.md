# Mutator Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Mutator Patterns |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Mutators transform values at assignment time — before they enter the model's `$attributes` array and are persisted. Laravel 11's `Attribute::make(set: ...)` closure replaces the legacy `set{Attribute}Attribute()` convention. Mutators normalize input, enforce domain invariants, and translate presentation-layer values into storage formats. They are the write-side counterpart to accessors.

## Core Concepts

- **Attribute::make with set closure**: `protected function title(): Attribute { return Attribute::make(set: fn (string $value) => trim($value)); }` — the set closure receives the assigned value and returns the value to store
- **Input normalization**: Mutators handle trimming, lowercasing, format conversion at assignment time
- **Pre-persist transformation**: Mutators run on `$model->attribute = $value`, before `save()` or `update()`
- **Multi-attribute mutators**: The set closure can return an array of key-value pairs to modify multiple attributes at once

## When To Use

- You need to normalize or validate input at the model boundary (trim, lowercase, format)
- You need to convert presentation values to storage format (dollar string to cents integer)
- You need to update multiple model attributes atomically from a single assignment

## When NOT To Use

- The transformation is read-only (use an accessor)
- The logic involves external validation or API calls (use a FormRequest or action)
- The transformation has side effects beyond the model's own attributes

## Best Practices

- **Mutators should not throw exceptions for business rule violations**: Use FormRequest validation for input rules. Mutators are for normalization, not validation. Business rule exceptions belong in model methods or action classes.
- **Return arrays for multi-attribute updates**: When a single logical value maps to multiple columns (e.g., a password that needs a `password` and `password_changed_at` column), return an array from the set closure to update all relevant attributes atomically.
- **Mutators + casts interact**: The mutator runs first, then the cast transforms the mutator's output. Understand this ordering when both are defined for the same attribute.

## Architecture Guidelines

- Mutators use `Attribute::make(set: ...)` syntax; avoid legacy `set{Attribute}Attribute()` methods
- For simple type coercion, use casts instead of mutators (`protected $casts = ['is_admin' => 'boolean']`)
- Multi-attribute mutators should return explicit key-value arrays, not rely on `$this->attribute =` assignments inside the closure

## Performance Considerations

- Mutators run on every write to the attribute — expensive transformations should be avoided
- Expensive normalization (API calls, external lookups) belongs in actions or jobs, not mutators

## Security Considerations

- Mutators can sanitize input (trim, strip tags) but should not be the only security layer
- Mass-assignment protection (`$fillable`/`$guarded`) still applies — mutators don't bypass it

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Validation in mutators | Convenience | Mixing concerns | Use FormRequest for validation |
| Side effects in mutators | Over-engineering | Hidden external calls | Use events or actions |
| Throwing exceptions in mutators | Misunderstanding | Unexpected failures on assignment | Validate before assignment |
| Legacy mutators for new code | Habit | Deprecated API | Use `Attribute::make(set: ...)` |

## Anti-Patterns

- **Side-Effect Mutator**: Sending emails or dispatching jobs inside a mutator. Side effects belong in model events or explicit action calls.
- **API-Calling Mutator**: Making HTTP requests inside a mutator to normalize data. This couples assignment to network availability.
- **Business-Rule Mutator**: Throwing domain exceptions inside a mutator when a business rule is violated. Business rules belong in explicit model methods.

## Examples

```php
class User extends Model
{
    protected function email(): Attribute
    {
        return Attribute::make(set: fn (string $value) => strtolower(trim($value)));
    }

    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => [
                'password' => bcrypt($value),
                'password_changed_at' => now(),
            ],
        );
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Closely Related | Accessor Patterns |
| Closely Related | Multi-Attribute Mutators |
| Closely Related | Attribute Casting |
| Advanced | Custom Casts |

## AI Agent Notes

- Mutators normalize input at assignment time; they don't validate business rules
- Return an array from the set closure for multi-attribute updates
- Mutators run before casts for the same attribute

## Verification

- [ ] Mutator uses `Attribute::make(set: ...)` syntax
- [ ] Mutator has no side effects (no external calls, no dispatches)
- [ ] Mutator does not throw business rule exceptions
- [ ] Multi-attribute mutators return explicit key-value arrays
