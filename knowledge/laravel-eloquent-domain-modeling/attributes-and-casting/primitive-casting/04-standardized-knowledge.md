# Primitive Casting — Standardized Knowledge

## Overview

Primitive casting in Laravel Eloquent automatically coerces database values to their correct PHP types on read and back to database-compatible types on write. This eliminates type inconsistencies (e.g., integer columns returned as strings) and ensures type safety without custom cast classes.

## Key Concepts

- **`integer` cast** — coerces to PHP int (use `'integer'`, not `'int'`)
- **`boolean` cast** — coerces tinyint(1) to true/false (use `'boolean'`, not `'bool'`)
- **`float` / `real` cast** — coerces to PHP float
- **`decimal:N` cast** — coerces to string with N decimal places (safe for monetary values)
- **`string` cast** — coerces to PHP string
- **`array` / `object` / `collection` cast** — for JSON columns
- **Nullable handling** — nullable columns return null, not coerced defaults

## Implementation Details

```php
protected $casts = [
    'price' => 'integer',
    'is_active' => 'boolean',
    'rating' => 'float',
    'amount' => 'decimal:2',
    'metadata' => 'array',
    'config' => 'object',
];
```

## Best Practices

- Use the full type string (`integer` not `int`, `boolean` not `bool`)
- Use `decimal:N` for monetary values, never `float`
- Handle nullable columns explicitly — test that null stays null
- Use primitive casts for type coercion, not for business logic or validation
- Combine primitive casts with accessors for computed or derived values
