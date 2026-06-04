# Immutable Casting — Standardized Knowledge

## Overview

Immutable casting ensures that custom cast attributes return a new instance on every read, preventing accidental in-place mutation from affecting the model's internal state or other consumers. This is critical for arrays, collections, and mutable value objects.

## Key Concepts

- **Fresh instance on every read** — `get()` returns a new instance, not a cached mutable reference
- **Defensive copy** — clone mutable objects before returning them from the cast
- **Readonly value objects** — immutable by design, safe to share references
- **Array copy-on-write** — PHP arrays are effectively immutable when assigned (copy-on-write)
- **Dirty detection** — immutable casts ensure dirty detection works correctly on save

## Implementation Details

```php
class ContactInfoCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ContactInfo
    {
        $data = json_decode($value ?: '{}', true);
        return new ContactInfo(
            email: $data['email'] ?? '',
            phone: $data['phone'] ?? '',
        );
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        return json_encode($value instanceof ContactInfo ? $value->toArray() : $value);
    }
}
```

## Best Practices

- Always return a new instance from `get()` for mutable types
- Use `readonly` properties on value objects to enforce immutability
- Document the immutability contract in the cast class docblock
- Test that mutation of returned values does not affect model state
- Consider performance impact of repeated allocation (profile if needed)
