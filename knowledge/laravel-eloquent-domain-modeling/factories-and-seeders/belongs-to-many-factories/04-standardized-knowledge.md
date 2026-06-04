# BelongsToMany Factory Relationships

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | BelongsToMany Factories |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Factory relationships for `BelongsToMany` (many-to-many) use `hasAttached()` to seed pivot table records alongside parent and related models. `hasAttached()` handles creating related models, inserting pivot rows, and optionally setting pivot attributes.

## Core Concepts

- **hasAttached() method**: `User::factory()->hasAttached(Role::factory()->count(3))->create()` — creates roles and attaches via pivot
- **Pivot attributes**: Second argument sets pivot data: pass array for uniform values, closure for per-attachment values
- **Existing model attachment**: Pass existing instances — skips creation but still inserts pivot rows
- **Magic has{Relation} methods**: `User::factory()->hasRoles(3)->create()` — shorthand for `hasAttached()`
- **Pivot table resolution**: Factory reads the `BelongsToMany` relationship for pivot table and foreign key names

## When To Use

- You need many-to-many test data with pivot records
- The pivot table has additional attributes beyond the foreign keys
- You need to attach specific related models via the pivot

## When NOT To Use

- The relationship is one-to-many (use `has()`)
- No pivot attributes are needed — simple `attach()` in callback may be clearer

## Best Practices

- **Use closures for pivot attributes that vary per attachment**: When each pivot row needs different data (team_id, expires_at), pass a closure to the second argument: `->hasAttached(Role::factory()->count(3), fn () => ['team_id' => Team::factory()])`.
- **Use existing models for known datasets**: When attaching specific roles (admin, editor), create them first and pass to `hasAttached()`: `->hasAttached([$adminRole, $editorRole])`.

## Examples

```php
User::factory()
    ->hasAttached(
        Role::factory()->count(3),
        ['team_id' => Team::factory()]
    )
    ->create();
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Factory Definition |
| Closely Related | HasMany Factories |
| Closely Related | BelongsTo Factories |
| Closely Related | Recycle Pattern |

## AI Agent Notes

- `hasAttached()` handles many-to-many with pivot data
- Pivot attributes: array for uniform, closure for per-attachment
- Pass existing models for known datasets

## Verification

- [ ] `hasAttached()` used for many-to-many relationships
- [ ] Pivot attributes are specified correctly
- [ ] Existing models used when attaching known datasets
