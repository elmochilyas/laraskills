# Model Conventions

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Model Conventions |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Laravel Eloquent uses convention-over-configuration to derive table names, foreign keys, and pivot table names from model class names. Understanding these conventions prevents silent misalignment between models and database schema. When conventions don't fit, explicit configuration overrides are available.

## Core Concepts

- **Table naming convention**: Snake_case, pluralized class name — `User` → `users`, `FlightTicket` → `flight_tickets`
- **Foreign key convention**: Snake_case model name + `_id` — `User` → `user_id`, `BlogPost` → `blog_post_id`
- **Pivot table naming**: Alphabetical order of singular model names joined by `_` — `User` + `Role` → `role_user`
- **Primary key convention**: `id` column by default, auto-incrementing integer

## When To Use

- The database schema follows Laravel conventions (default recommendation)
- New projects where you control the schema

## When NOT To Use (Override)

- Legacy databases with non-conventional naming
- Existing schemas with different pluralization rules
- Multi-word model names where the default plural is incorrect

## Best Practices

- **Override `$table` when the convention doesn't fit**: If the table name is `people` not `persons`, set `protected $table = 'people'`. Don't fight the convention — override it.
- **Override foreign keys explicitly in relationships**: `$this->belongsTo(User::class, 'author_id')` — explicit is better than implicit for non-standard foreign keys.
- **Use `protected $primaryKey` for non-standard primary keys**: If the PK is `uuid` not `id`, set `protected $primaryKey = 'uuid'` and `public $incrementing = false`.

## Architecture Guidelines

- Follow conventions for new projects; override for legacy
- Document all overrides with comments explaining why the convention doesn't apply
- Test that model-table mappings are correct with a schema assertion test

## Examples

```php
class FlightTicket extends Model
{
    protected $table = 'flight_tickets';       // Explicit (same as convention)
    protected $primaryKey = 'uuid';            // Non-standard PK
    public $incrementing = false;              // UUID, not auto-increment
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Base Model Class |
| Closely Related | Table Names |
| Closely Related | Primary Keys |
| Closely Related | Foreign Key Conventions |

## AI Agent Notes

- Table name = snake_case, plural of class name
- Foreign key = snake_case model + `_id`
- Pivot table = singular names in alphabetical order
- Override when conventions don't fit

## Verification

- [ ] Table name follows convention or `$table` is explicitly set
- [ ] Foreign keys follow convention or are explicitly specified in relationships
- [ ] Pivot table naming follows alphabetical convention
