# Date Casting — Standardized Knowledge

## Overview

Date casting in Laravel Eloquent allows automatic hydration of date/datetime/timestamp database columns into Carbon instances on read and serialization back to database-compatible values on write. This eliminates manual `Carbon::parse()` calls and ensures consistent date handling across models.

## Key Concepts

- **date cast** — for date-only columns (no time component), returns Carbon instance
- **datetime cast** — for full datetime columns, returns Carbon instance with time
- **timestamp cast** — for Unix integer timestamp columns
- **Immutable variants** — `immutable_date`, `immutable_datetime` return `CarbonImmutable` instances
- **Custom format** — append format string with colon: `'datetime:Y-m-d H:i:s'`
- **Timezone handling** — dates stored in UTC, converted at presentation boundaries

## Implementation Details

Dates are cast by adding the attribute to the model's `$casts` array:

```php
protected $casts = [
    'published_at' => 'datetime:Y-m-d H:i:s',
    'birth_date' => 'date:Y-m-d',
    'created_at' => 'immutable_datetime',
];
```

In Laravel 13, PHP 8.3 attributes can also be used:

```php
#[Cast('datetime:Y-m-d')]
public string $published_at;
```

## Best Practices

- Use the correct cast type matching the database column (date vs datetime vs timestamp)
- Prefer immutable variants in defensive code to prevent accidental mutation
- Format dates at the view/resource boundary, not globally
- Never manually parse cast attributes with `Carbon::parse()`
- Use custom formats only when API contracts require non-standard formats
