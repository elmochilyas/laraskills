# Multi-Attribute Mutators

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Multi-Attribute Mutators |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Multi-attribute mutators allow a single property assignment to update multiple model attributes atomically. By returning an associative array from the `set` closure of an `Attribute::make()` definition, a mutator can modify several columns at once. This is useful when a logical value (e.g., a password) maps to multiple database columns (e.g., `password` and `password_changed_at`), or when setting a value requires updating a related counter or timestamp.

## Core Concepts

- **Array return from set closure**: Returning `['col1' => value1, 'col2' => value2]` from a set closure updates multiple attributes
- **Atomic update**: All returned key-value pairs are set in a single operation; no partial update risk
- **Non-return defaults**: If the set closure returns a scalar, only the attribute itself is updated (standard mutator behavior)
- **Key naming**: Array keys must match model attribute/column names exactly

## When To Use

- A single conceptual value maps to multiple database columns
- Setting one value should automatically update a related timestamp or counter
- You need to maintain denormalized data consistently

## When NOT To Use

- The related attributes are in different models (use model events or actions)
- The multi-attribute update should be conditional on business logic (use explicit model methods)
- The attributes are unrelated — a multi-attribute mutator implies a logical relationship

## Best Practices

- **Document the multi-attribute relationship**: Since a single assignment (`$model->password = '...'`) now updates two columns, document this behavior clearly. The implicit nature of multi-attribute mutators can be surprising during debugging.
- **Don't rely on multi-attribute mutators for business logic**: They are a mapping convenience, not a substitute for explicit model methods like `changePassword()` that encapsulate the full operation.

## Architecture Guidelines

- Use multi-attribute mutators for tightly coupled attribute pairs (password + changed_at, status + timestamp)
- For complex multi-field updates with validation, prefer explicit model methods
- Ensure array keys correspond to fillable/guarded attributes correctly

## Performance Considerations

- Multi-attribute mutators add no extra queries — the attributes are set in memory before `save()`
- Avoid expensive operations inside multi-attribute mutators (they run synchronously on assignment)

## Examples

```php
class User extends Model
{
    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => [
                'password' => bcrypt($value),
                'password_changed_at' => now(),
            ],
        );
    }

    protected function lastLoginAt(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => [
                'last_login_at' => $value,
                'last_login_ip' => request()->ip(), // avoid — side effect
            ],
        );
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Mutator Patterns |
| Closely Related | Accessor Patterns |
| Closely Related | Attribute Casting |
| Advanced | Custom Casts |

## AI Agent Notes

- Returning an array from a set closure updates multiple attributes
- Document multi-attribute behavior — implicit updates can be surprising
- Prefer explicit model methods for complex multi-field updates

## Verification

- [ ] Multi-attribute mutator returns an associative array with valid column keys
- [ ] Mutator has no side effects beyond the model's own attributes
- [ ] Multi-attribute relationship is documented in code comments
