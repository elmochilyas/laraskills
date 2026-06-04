# Enum Casting — Standardized Knowledge

## Overview

Enum casting in Laravel Eloquent maps database columns (string or integer) to PHP backed enum instances on read and serializes them back to scalar values on write. This eliminates magic string comparisons and brings compile-time type safety to model attributes.

## Key Concepts

- **Backed enum** — PHP enum with string or int backing value, required for database persistence
- **Unit enum** — PHP enum without backing value, cannot be used in `$casts`
- **Enum serialization** — backed enums automatically serialize to their scalar value in JSON/array output
- **Type safety** — enum instances provide IDE autocompletion and eliminate magic string comparisons
- **Validation** — invalid database values (not matching any case) throw a `CastException` on read

## Implementation Details

Define a backed enum and register it in the model's `$casts`:

```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
}

protected $casts = [
    'status' => OrderStatus::class,
];
```

## Best Practices

- Always use backed enums for database columns — unit enums cause runtime errors
- Type-hint domain methods with enum classes for type safety
- Compare using enum instances (`===`), not raw scalar strings
- Match database column type to enum backing type (string column → string-backed enum)
- Eliminate string constants once enum is defined
