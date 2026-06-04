# CastsInboundAttributes Interface

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | CastsInboundAttributes Interface |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

`CastsInboundAttributes` is a write-only specialization of the custom cast contract. It implements only the `set` direction — transforming user-assigned values into database-safe representations without defining a `get` transformation. This is useful when the stored format is already the preferred PHP representation, or when read-time transformation is handled by accessors or presentation layers.

## Core Concepts

- **Unidirectional contract**: Only `set` is required — raw database values flow through without transformation on read
- **Same set contract as CastsAttributes**: `$model`, `$key`, `$value`, `$attributes` parameters follow the same pattern
- **Return contract**: Must return an array of `['column' => value]` pairs
- **No automatic coercion**: Raw value from `$attributes` is returned as-is on read
- **Interface signals intent**: Implementing `CastsInboundAttributes` tells Laravel to skip the get transformation

## When To Use

- You need to transform/normalize data only on write (hashing, encoding, encrypting)
- The stored format is already the correct PHP representation (no read-time transformation needed)
- Read-time formatting is handled by accessors, API resources, or Blade directives

## When NOT To Use

- You need bidirectional transformation (use `CastsAttributes`)
- You only need read-only transformation (use an accessor)
- The transformation needs the model instance on read

## Best Practices

- **Use for one-directional data normalization**: Hashing, encoding, or encrypting where the stored value is the final PHP form. For example, a `Hashed` cast hashes on write but the hash string is used as-is on read.
- **Combine with accessors for full read/write control**: Use `CastsInboundAttributes` for write normalization and an accessor for read formatting — cleaner than a bidirectional cast with internal conditionals.
- **Document the one-directional nature**: Since the `get` direction is absent, developers reading the code should know that the raw database value is what they see on read.

## Architecture Guidelines

- Implement `CastsInboundAttributes` in `App\Casts\*` for write-only casting
- Register the same way as `CastsAttributes`: `$casts = ['attribute' => InboundCast::class]`
- The return array from `set` can contain multiple key-value pairs for multi-attribute updates

## Performance Considerations

- No read-time overhead — the raw database value is returned as-is
- Write-time transformation adds the same cost as `CastsAttributes::set()`

## Examples

```php
class HashedCast implements CastsInboundAttributes
{
    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        return [$key => bcrypt($value)];
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | CastsAttributes Interface |
| Closely Related | Castable Interface |
| Closely Related | Custom Casts |
| Advanced | Value Object Casting |

## AI Agent Notes

- Only implement `set` — no `get` needed
- Return array of key-value pairs from `set`
- Use for write-only normalization (hashing, encoding)

## Verification

- [ ] Only `set` method is implemented (no `get`)
- [ ] `set` returns an array of key-value pairs
- [ ] Raw database value is correct PHP representation on read
