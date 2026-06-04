# Typed Attribute Accessors with DTOs — Standardized Knowledge

## Overview

Typed attribute accessors return rich Data Transfer Objects (DTOs) or typed values from model attributes instead of raw arrays or strings. This enables type-safe property access with IDE autocompletion, constructor validation, and structured data handling for complex attributes like addresses, coordinates, or contact information.

## Key Concepts

- **DTO (Data Transfer Object)** — a plain PHP object with typed, readonly properties
- **Accessor returns DTO** — deserializes stored data into a typed object on read
- **Mutator accepts DTO** — serializes the DTO back to database columns on write
- **`shouldCache`** — caches the expensive DTO construction within a model instance
- **Multi-column mapping** — DTO fields can map to multiple database columns
- **JSON column mapping** — DTO can be stored in a single JSON column

## Implementation Details

```php
class Address
{
    public function __construct(
        public readonly string $line1,
        public readonly string $city,
        public readonly string $postalCode,
        public readonly ?string $line2 = null,
    ) {}
}

protected function address(): Attribute
{
    return Attribute::make(
        get: fn ($value, $attributes) => new Address(
            line1: $attributes['address_line1'],
            city: $attributes['address_city'],
            postalCode: $attributes['address_postal_code'],
            line2: $attributes['address_line2'] ?? null,
        ),
        set: fn (Address $value) => [
            'address_line1' => $value->line1,
            'address_city' => $value->city,
            'address_postal_code' => $value->postalCode,
            'address_line2' => $value->line2,
        ],
        shouldCache: true,
    );
}
```

## Best Practices

- Use `readonly` properties on DTOs to enforce immutability
- Enable `shouldCache` since DTO construction involves deserialization
- Type-hint the set closure with the DTO class for IDE support
- Handle null stored values gracefully (return null DTO or throw)
- Validate DTO data in the constructor, not in the accessor
