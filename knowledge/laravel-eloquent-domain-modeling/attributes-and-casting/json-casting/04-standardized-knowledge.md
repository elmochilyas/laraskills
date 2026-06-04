# JSON Casting — Standardized Knowledge

## Overview

JSON casting in Laravel Eloquent allows structured data stored in JSON database columns to be automatically hydrated as PHP arrays or Collections on read and serialized back to JSON on write. This provides convenient access to dynamic or denormalized data without needing normalized relationships.

## Key Concepts

- **`array` cast** — returns a PHP associative array from a JSON column
- **`collection` cast** — returns an `Illuminate\Support\Collection` instance
- **`json` cast** — returns the raw JSON string without decode/encode
- **`object` cast** — returns a `stdClass` instance
- **Dirty detection** — reassigning the entire attribute marks it dirty; in-place mutation does not
- **Null handling** — null JSON columns return empty array/Collection instead of null

## Implementation Details

```php
protected $casts = [
    'metadata' => 'array',
    'tags' => 'collection',
    'raw_config' => 'json',
    'settings' => 'object',
];
```

## Best Practices

- Prefer `array` cast as the default — most versatile and performant
- Use `collection` cast when the Collection API (map, filter, reduce) is needed
- Reassign modified JSON attributes, don't mutate in-place
- Validate JSON shape at domain boundaries, not in the cast
- Choose JSON over normalized tables only when the schema is genuinely dynamic
