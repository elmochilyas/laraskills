# Castable Interface

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Castable Interface |
| Classification | Expert |
| Last Updated | 2026-06-02 |

## Overview

The `Castable` interface inverts the casting architecture — instead of defining a separate cast class and referencing it from the model, the value object itself declares how it should be cast. By implementing `Castable`, a value object provides a static `castUsing()` method that returns the cast class responsible for transforming it. This enables self-contained value objects that carry their own serialization logic, reducing duplication across models.

## Core Concepts

- **Self-defining casts**: The value object knows how to cast itself via `castUsing()`
- **Architectural inversion**: The model only needs to know the value object class; the value object provides the cast
- **Static resolution**: `castUsing()` is static — the cast class is resolved from the container during registration
- **Decoupling from cast implementation**: The cast class can be internal or separate; the model sees only the value object
- **Registration**: Use value object class in `$casts`: `'attribute' => ValueObject::class`

## When To Use

- A value object is used across multiple models and needs consistent casting
- You want the value object to be self-contained (data + serialization logic)
- You want to eliminate duplication of cast class references

## When NOT To Use

- The value object is only used in one model (a dedicated cast class is simpler)
- The cast logic depends on the model context (use `CastsAttributes` directly)
- The value object should not have infrastructure concerns (some teams prefer separation)

## Best Practices

- **Keep `castUsing()` simple**: It should return a class name or factory closure. Complex logic in `castUsing()` runs at registration time, not at cast time.
- **Use factory closures for cast configuration**: If the cast needs constructor parameters, return a closure from `castUsing()` that instantiates the cast with the right configuration.
- **One cast class per value object**: Don't reuse cast classes across unrelated value objects. Each value object's cast logic is specific to its serialization format.

## Architecture Guidelines

- Implement `Castable` on the value object class
- `castUsing()` returns the fully qualified cast class name or a factory closure
- Register in the model with `$casts = ['attribute' => ValueObject::class]`
- The cast class should be placed alongside the value object or in `App\Casts\*`

## Performance Considerations

- Resolution of the cast class from `castUsing()` happens once during model boot — no per-access overhead
- Factory closures add minimal overhead compared to class name strings

## Examples

```php
class Money implements Castable
{
    public function __construct(
        public readonly int $cents,
        public readonly string $currency = 'USD',
    ) {}

    public static function castUsing(): string
    {
        return MoneyCast::class;
    }
}

// Model usage
protected $casts = [
    'price' => Money::class,
];
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | CastsAttributes Interface |
| Closely Related | Cast Parameters |
| Closely Related | Value Object Casting |
| Advanced | SerializesCastableAttributes |

## AI Agent Notes

- `castUsing()` returns the cast class name or factory closure
- Value object knows how to serialize itself
- One cast class per value object — no reuse across unrelated objects

## Verification

- [ ] Value object implements `Castable`
- [ ] `castUsing()` returns a valid cast class name or factory closure
- [ ] Model registers with value object class in `$casts`
- [ ] Value object is used across multiple models (justifying the pattern)
