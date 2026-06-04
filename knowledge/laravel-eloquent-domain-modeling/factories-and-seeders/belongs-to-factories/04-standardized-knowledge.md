# BelongsTo Factory Relationships

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | BelongsTo Factories |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Factory relationships for `BelongsTo` associate a child model with its parent during creation using the `for()` method or magic `for{Relation}` methods. This is the inverse of `has()` — the child references a parent, and the foreign key is auto-populated on the child.

## Core Concepts

- **for() method**: `Post::factory()->for(User::factory())->create()` — creates both user and post, wiring `user_id`
- **Magic for{Relation} methods**: `Post::factory()->forUser(['name' => 'Admin'])->create()` — shorthand with parent attribute overrides
- **Existing parent models**: Pass an existing instance: `Post::factory()->for($user)->create()` — skips parent creation
- **BelongsTo resolution**: Factory determines foreign key column from the relationship definition
- **Attribute forwarding**: Second argument to `for()` overrides attributes on the parent

## When To Use

- Creating a child model that references a specific parent
- You need to create a parent only for this child (use factory)
- You have an existing parent and want to attach children (pass model instance)

## When NOT To Use

- The relationship is has-many (use `has()`)
- The parent should be shared across children (use `recycle()`)

## Best Practices

- **Prefer `for()` with existing models for shared parents**: When multiple children should belong to the same parent, create the parent once and pass it to `for()`. This avoids redundant parent creation.
- **Use magic methods for readability**: `Post::factory()->forUser(['name' => 'Admin'])` reads more naturally than `->for(User::factory(), ['name' => 'Admin'])`.
- **Factory for new parent, instance for existing**: Pass a factory when you need a new parent; pass a model instance when reusing an existing one.

## Examples

```php
// New parent
Post::factory()->for(User::factory()->admin())->create();

// Existing parent (reused)
$user = User::factory()->create();
Post::factory()->count(5)->for($user)->create();
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Factory Definition |
| Closely Related | HasMany Factories |
| Closely Related | BelongsToMany Factories |
| Closely Related | Recycle Pattern |

## AI Agent Notes

- `for()` creates or reuses the parent for the child
- Pass a factory for new parent, instance for existing
- Magic `for{Relation}()` for readability

## Verification

- [ ] `for()` used for belongs-to relationships
- [ ] Existing model instance passed for shared parents
- [ ] Factory creates parent when no existing instance provided
