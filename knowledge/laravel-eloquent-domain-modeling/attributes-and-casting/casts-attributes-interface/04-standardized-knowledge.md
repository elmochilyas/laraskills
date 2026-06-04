# CastsAttributes Interface

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | CastsAttributes Interface |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

The `CastsAttributes` interface is the foundational primitive for custom attribute casting in Eloquent. It defines a bidirectional transformation contract (`get`/`set`) between raw database values and PHP types. Every custom casting concept — value objects, inbound-only casts, castable objects, and serialization control — builds on this interface.

## Core Concepts

- **Bidirectional transformation**: `get` transforms stored values to PHP representations; `set` transforms PHP values to database-safe formats
- **Model instance awareness**: Both `get` and `set` receive the Eloquent model instance, enabling access to sibling attributes
- **Null passthrough**: If the raw value is null, `get` receives null and should return null unless a non-null default is intended
- **Key-value return from set**: `set` returns an array of key-value pairs, allowing modification of multiple attributes
- **No automatic serialization**: The cast is responsible for all serialization/deserialization

## When To Use

- You need to transform data between database and PHP in a way that built-in casts don't support
- You're implementing a value object that needs bidirectional conversion
- You need access to the model instance during casting

## When NOT To Use

- A built-in cast covers your use case (int, bool, array, etc.)
- You only need read-only transformation (use an accessor)
- You only need write-only transformation (use `CastsInboundAttributes` or a mutator)

## Best Practices

- **Handle null explicitly**: `get` should return null when the value is null unless a default is intended. Casts that auto-coerce null can cause subtle bugs when nullable columns are introduced.
- **Use the model instance for context, not logic**: The model instance is available in `get` and `set`, but using it to call relationships or methods creates hidden coupling. Use it only for attribute name resolution or sibling value access.
- **Return the full key-value pair from set**: Even if only one attribute is being set, `set` should return `[$key => $value]` for consistency. This also allows future multi-attribute mutations.

## Architecture Guidelines

- Implement `CastsAttributes` in `App\Casts\*`
- Register with `$casts = ['attribute' => CustomCast::class]`
- For parameterized casts, accept parameters via constructor and pass colon-delimited values: `CustomCast::class . ':param1,param2'`

## Performance Considerations

- Custom casts run on every attribute read and write — keep `get` and `set` methods fast
- Avoid database queries or external calls inside cast methods
- For expensive transformations, consider caching at the model level

## Examples

```php
class MoneyCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): Money
    {
        return new Money($value / 100, Currency::USD);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value instanceof Money) {
            $value = $value->amount * 100;
        }
        return [$key => $value];
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Primitive Casts |
| Closely Related | CastsInboundAttributes Interface |
| Closely Related | Castable Interface |
| Closely Related | Cast Parameters |
| Advanced | Value Object Casting |

## AI Agent Notes

- Implement both `get` and `set` for bidirectional casting
- Handle null explicitly — don't auto-coerce
- `set` must return an array of key-value pairs
- Keep cast methods fast — no DB queries or external calls

## Verification

- [ ] `get` and `set` methods are implemented
- [ ] Null values are handled explicitly
- [ ] `set` returns an array of key-value pairs
- [ ] Cast methods perform no database queries or external calls
- [ ] Cast is registered in the model's `$casts` array
