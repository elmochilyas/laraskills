# Date/Time Casts

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Date/Time Casts |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Date/time casts transform database date/time values into `Carbon` (or `CarbonImmutable`) objects, providing a rich API for date manipulation, formatting, and timezone handling. Supported casts include `date`, `datetime`, `immutable_date`, `immutable_datetime`, and `timestamp`. The `serializeDate()` method controls date formatting during JSON/array serialization. This cast family is essential for consistent timezone handling and date arithmetic.

## Core Concepts

- **date cast**: Converts to `Carbon` — date portion only, no time
- **datetime cast**: Converts to `Carbon` — preserves date and time
- **immutable_date / immutable_datetime**: Returns `CarbonImmutable` — prevents mutation of the model's internal date objects
- **timestamp cast**: Converts Unix timestamp (integer) to `Carbon`; back to integer on write
- **serializeDate(CarbonInterface $date)**: Override to control date format in JSON/array serialization
- **$dateFormat**: Specifies storage format for date columns (default `'Y-m-d H:i:s'`)
- **$timestamps**: Enables/disables automatic `created_at`/`updated_at` management

## When To Use

- You need consistent Carbon instances from date/time database columns
- You need timezone conversion between storage (UTC) and display
- You need immutable date objects to prevent accidental mutation

## When NOT To Use

- You only need the raw date string (skip the cast for performance)
- You are using a different date library (use custom cast)

## Best Practices

- **Prefer `immutable_datetime` over `datetime`**: Mutable `Carbon` objects cause subtle bugs — calling `->addDay()` on a model attribute mutates the model's internal state without marking it dirty. `CarbonImmutable` returns a new instance on every modification.
- **Override `serializeDate()` for consistent API output**: By default, dates serialize to ISO 8601. If your API requires a different format, override `serializeDate()` on the model rather than formatting dates in every controller.
- **Store in UTC, display in user's timezone**: Store all timestamps in UTC in the database. Use Laravel's timezone config for the application default, and convert to user timezone at the presentation layer.

## Architecture Guidelines

- Use `immutable_datetime` as the default for all datetime columns
- Override `serializeDate()` in a base model for API-wide consistency
- Set `$dateFormat` only when the database requires a non-standard format

## Performance Considerations

- Date casts add minimal overhead — `Carbon::createFromFormat()` is fast
- Watermark dates (created_at, updated_at) should always be Carbon instances for consistency
- Avoid creating Carbon instances in Blade templates when the model already casts the attribute

## Security Considerations

- Never trust user-provided timezone strings — validate against a known list
- Use `CarbonImmutable` to prevent models from leaking mutated date state across requests

## Examples

```php
protected $casts = [
    'created_at' => 'immutable_datetime',
    'updated_at' => 'immutable_datetime',
    'deleted_at' => 'immutable_datetime',
    'birthday' => 'immutable_date:Y-m-d',
    'last_login_at' => 'immutable_datetime',
];

protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d\TH:i:sP');
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Closely Related | Primitive Casts |
| Closely Related | Date Serialization |
| Advanced | Custom Casts |

## AI Agent Notes

- Default to `immutable_datetime` over `datetime` to prevent mutation bugs
- Override `serializeDate()` for consistent API date formatting
- Store all timestamps in UTC

## Verification

- [ ] Date columns use `immutable_datetime` or `immutable_date` casts
- [ ] `serializeDate()` is overridden for consistent JSON output
- [ ] Created_at/updated_at are handled by `$timestamps` rather than manual casts
