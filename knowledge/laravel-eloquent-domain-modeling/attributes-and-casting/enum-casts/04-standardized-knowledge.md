# Enum Casts

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Enum Casts |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Enum casts map database values (strings or integers) to PHP 8.1 native enums, providing type-safe attribute access with built-in validation. Laravel supports both backed enums (string/int) and unit enums (non-backed). For backed enums, the cast converts between the database scalar and the PHP enum instance automatically. Enum casts eliminate manual string comparisons and switch statements, replacing them with typed enum comparisons.

## Core Concepts

- **Backed enum cast**: `$casts = ['status' => StatusEnum::class]` — database stores `value` (backing scalar), Laravel returns enum instance
- **Unit enum cast (Laravel 11+)**: Same syntax for unit enums — database stores enum `name` (string)
- **Enum validation**: Invalid database values trigger `\ValueError` from `from()` — Laravel catches and returns `null`
- **Array/Collection of enums**: `AsEnumArrayObject` / `AsEnumCollection` for JSON columns with multiple enum values
- **Type-safe comparisons**: `$model->status === StatusEnum::Active` — no string constants needed

## When To Use

- You have columns with a finite set of valid values (status, type, category)
- You want type-safe comparisons instead of string/integer constants
- You want PHP-level validation that invalid values can't be assigned

## When NOT To Use

- The set of values changes frequently (add/remove values = schema change)
- The values need to be stored differently across environments
- The column stores free-form text (use string cast)

## Best Practices

- **Always use backed enums for database storage**: Unit enums store the `name` (string), which is fragile under refactoring (renaming a case changes stored values). Backed enums with explicit `value` are stable under renames.
- **Handle invalid database values gracefully**: If the database contains an invalid enum value, `from()` throws `\ValueError`. Either migrate the data or handle null returns in application code.
- **Use enums for state machines**: Combine enum casts with model methods that validate state transitions (e.g., `canTransitionTo(StatusEnum::Paid)`).

## Architecture Guidelines

- Place enums in `App\Enums\*`
- Define enum cases with explicit backing values (string or int) — never rely on auto-generated values
- Use `AsEnumCollection` for JSON arrays of enum values

## Performance Considerations

- Enum casts are fast — `from()` is a simple lookup
- `\ValueError` on invalid values is caught internally; no performance impact for valid data

## Security Considerations

- Enum validation ensures only defined values are accepted — protects against invalid data injection
- Invalid enum values from the database return `null` — handle null checks to avoid type errors

## Examples

```php
enum InvoiceStatus: string
{
    case Draft = 'draft';
    case Sent = 'sent';
    case Paid = 'paid';
    case Cancelled = 'cancelled';
}

class Invoice extends Model
{
    protected $casts = [
        'status' => InvoiceStatus::class,
    ];
}

// Usage
$invoice->status === InvoiceStatus::Paid; // type-safe comparison
$invoice->status->value; // 'paid'
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Primitive Casts |
| Closely Related | Collection Casts |
| Closely Related | Custom Casts |
| Advanced | State Machines |

## AI Agent Notes

- Use backed enums (string/int) for database columns — never unit enums for storage
- Handle null returns from invalid database values
- Use `AsEnumCollection` for JSON arrays of enum values

## Verification

- [ ] Backed enums are used for database columns (not unit enums)
- [ ] Enum cases have explicit backing values
- [ ] Null handling is in place for potentially invalid database values
- [ ] Enum is used in model casts, not manual conversion
