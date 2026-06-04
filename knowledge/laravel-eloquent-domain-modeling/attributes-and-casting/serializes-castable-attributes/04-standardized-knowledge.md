# SerializesCastableAttributes Interface

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | SerializesCastableAttributes |
| Classification | Expert |
| Last Updated | 2026-06-02 |

## Overview

`SerializesCastableAttributes` extends the custom casting system by allowing castable value objects to define their own JSON serialization format. When a model is serialized to JSON or an array, the cast's `serialize()` method is called instead of the default `get()` value. This decouples the in-application representation from the API representation.

## Core Concepts

- **Separate serialization path**: `serialize()` is called during `toArray()`/`toJson()` — distinct from `get()` which runs on property access
- **API representation control**: The value object can have one form in PHP (e.g., a Money object with cents) and a different form in JSON (e.g., `{amount: 19.99, currency: "USD"}`)
- **Optional implementation**: Not required — if `serialize()` is not implemented, the `get()` value is used for serialization
- **Pair with Castable**: Typically implemented alongside `Castable` for self-serializing value objects

## When To Use

- The PHP representation differs from the API representation (Money as object with cents → JSON with formatted amount)
- You want to control how value objects appear in API responses without using API Resources
- You need consistent serialization across all models that use the value object

## When NOT To Use

- The PHP and API representations are identical (don't add the extra method)
- Serialization logic varies per model or context (use API Resources instead)
- You need access to the request context for serialization decisions

## Best Practices

- **Keep `serialize()` focused on format conversion**: It should transform the value object to a serializable format, not apply business logic or authorization.
- **Return plain arrays or scalars**: The return value of `serialize()` must be JSON-serializable — arrays, strings, numbers, booleans, or null.
- **Don't access model state in `serialize()`**: The serialization method receives only the value, not the model instance. If you need model context, use API Resources instead.

## Examples

```php
class MoneyCast implements CastsAttributes, SerializesCastableAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): Money
    {
        return Money::fromCents($value);
    }

    public function serialize(Model $model, string $key, mixed $value, array $attributes): array
    {
        return [
            'amount' => $value->format(),
            'currency' => $value->currency(),
        ];
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        return [$key => $value->toCents()];
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | CastsAttributes Interface |
| Prerequisite | Castable Interface |
| Closely Related | Value Object Casting |
| Closely Related | API Resource Integration |

## AI Agent Notes

- `serialize()` controls JSON/array output for cast attributes
- Return plain arrays or scalars (JSON-serializable)
- Don't access model state in `serialize()`

## Verification

- [ ] `serialize()` method returns JSON-serializable values
- [ ] `serialize()` does not access model state or context
- [ ] PHP representation and API representation intentionally differ (if implementing)
