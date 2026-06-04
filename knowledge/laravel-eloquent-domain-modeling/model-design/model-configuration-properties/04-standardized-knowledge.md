# Model Configuration Properties

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Model Configuration Properties |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Eloquent models expose configuration properties that control table mapping, primary key behavior, timestamp handling, date serialization, and database connection routing. These properties form the explicit configuration layer on top of Laravel's naming conventions. Misconfiguration causes subtle, hard-to-debug bugs.

## Core Concepts

- **`$table`**: Explicit table name override
- **`$primaryKey`**: Primary key column name (default `'id'`)
- **`$incrementing`**: Whether the primary key is auto-incrementing (default `true`)
- **`$keyType`**: PK type (`'int'` or `'string'`)
- **`$timestamps`**: Whether `created_at`/`updated_at` are managed automatically
- **`$dateFormat`**: Storage format for date columns
- **`$connection`**: Database connection name for the model
- **`$fillable` / `$guarded`**: Mass assignment whitelist/blacklist
- **`$hidden` / `$visible`**: Attribute visibility in serialization
- **`$casts`**: Attribute type casting
- **`$with`**: Relationships to eagerly load on every query
- **`$appends`**: Accessors to include in serialization

## When To Use

- Every Eloquent model uses these properties for configuration
- Override defaults when the convention doesn't match your schema

## When NOT To Use

- Don't set properties to their default values unnecessarily (set only when overriding)
- Prefer `casts()` method over `$casts` property in Laravel 11+

## Best Practices

- **Set only what differs from defaults**: Setting `protected $table = 'users'` when the convention already gives `users` is noise. Only override when the convention is wrong.
- **Use `casts()` method in Laravel 11+**: The `casts()` method is more flexible than the `$casts` property, supporting runtime conditions and inheritance.
- **Set `$connection` per-environment via config**: Use `config('database.connections.'. $this->connection)` pattern rather than hard-coding connection names.

## Architecture Guidelines

- Override properties that differ from conventions
- Document why each override exists
- Use `casts()` method over `$casts` property in new code

## Performance Considerations

- `$with` eagerly loads on every query — avoid unless the relation is universally needed
- `$appends` runs accessors on every serialization — be mindful of performance
- `$dateFormat` affects all date serialization — set once in a base model

## Examples

```php
class Order extends Model
{
    protected $table = 'customer_orders';       // Non-conventional name
    protected $primaryKey = 'uuid';              // UUID PK
    public $incrementing = false;                // Non-incrementing
    protected $keyType = 'string';               // String PK
    protected $connection = 'billing';            // Specific connection
    protected $fillable = ['status', 'total_cents'];
    protected $hidden = ['internal_notes'];
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Base Model Class |
| Closely Related | Model Conventions |
| Closely Related | Primary Keys |
| Closely Related | Timestamps |

## AI Agent Notes

- Set only overrides from conventions
- Use `casts()` method over `$casts` property
- Avoid `$with` — it eagerly loads on every query

## Verification

- [ ] Configuration properties are set only when overriding conventions
- [ ] `$fillable` or `$guarded` is defined
- [ ] `$hidden` protects sensitive attributes
- [ ] `$with` is not used (or is justified)
