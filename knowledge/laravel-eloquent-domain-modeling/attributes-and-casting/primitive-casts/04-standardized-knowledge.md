# Primitive Casts

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Primitive Casts |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Primitive casts coerce attribute values between database storage types and PHP types automatically. Supported types — `int`, `bool`, `float`, `string`, `array`, `object`, `collection`, `decimal:N` — handle common type-conversion scenarios without custom accessors or mutators. They are the simplest two-way attribute transformation mechanism, running on both read and write to ensure type consistency.

## Core Concepts

- **int cast**: Converts to PHP `int` — truncates floats, parses numeric strings
- **bool cast**: `1`, `'1'`, `'true'` become `true`; everything else `false`. On write: `true`→1, `false`→0
- **float cast**: Converts to PHP `float` — precision loss possible for large numbers
- **string cast**: Converts to PHP `string` — JSON-encodes arrays/objects
- **array cast**: JSON-decodes to PHP `array` on read; JSON-encodes on write
- **object cast**: JSON-decodes to `stdClass` on read; JSON-encodes on write
- **collection cast**: JSON-decodes to Laravel `Collection` on read; JSON-encodes on write
- **decimal:N cast**: Converts to PHP `string` with exactly N decimal places — avoids float precision issues for monetary values

## When To Use

- You need consistent PHP types from database values (always `int`, always `bool`)
- You store JSON in database columns and want automatic array/object/collection hydration
- You work with monetary values that require exact decimal precision (`decimal:2`)

## When NOT To Use

- You need custom transformation logic (use custom casts or accessors/mutators)
- The JSON structure is complex and needs typed value objects (use `AsArrayObject` or custom casts)
- You need encryption at rest (use `encrypted` casts)

## Best Practices

- **Use `decimal:N` for monetary values**: Float precision errors cause accounting bugs. `decimal:2` stores as string with exact precision. Never use `float` for currency.
- **Prefer `array` cast over serialization**: JSON columns with `array` cast are queryable via MySQL's JSON functions. Serialized PHP columns are opaque to the database.
- **Use `bool` cast for boolean columns**: Without it, `$model->is_active` returns `0` or `1` as integers, causing truthiness issues in Blade conditionals.

## Architecture Guidelines

- Define casts in the `casts()` method (Laravel 11+) or `$casts` property
- Use `decimal:N` for all monetary columns; never `float` or `integer` for money
- JSON columns (`array`, `object`, `collection`) require the database column to be `JSON` or `TEXT`

## Performance Considerations

- Primitive casts are extremely fast — simple PHP type coercions or JSON encode/decode
- JSON decode on every read can add overhead for large JSON blobs; consider caching or splitting into normalized tables

## Security Considerations

- `array`, `object`, `collection` casts deserialize JSON — ensure the JSON source is trusted or sanitized
- Never use `array` cast for columns that might contain malicious serialized content

## Examples

```php
protected $casts = [
    'is_admin' => 'boolean',
    'total_cents' => 'integer',
    'price' => 'decimal:2',
    'metadata' => 'array',
    'tags' => 'collection',
];
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Closely Related | Date/Time Casts |
| Closely Related | Enum Casts |
| Closely Related | Encrypted Casts |
| Advanced | Custom Casts |

## AI Agent Notes

- Use `decimal:N` for money, never `float`
- JSON columns with `array` cast are queryable via MySQL JSON functions
- `bool` cast prevents truthiness bugs in Blade conditionals

## Verification

- [ ] Monetary values use `decimal:N` cast
- [ ] Boolean columns use `bool` cast
- [ ] JSON columns use `array`, `object`, or `collection` casts
- [ ] Casts are defined in the `casts()` method (Laravel 11+) or `$casts` property
