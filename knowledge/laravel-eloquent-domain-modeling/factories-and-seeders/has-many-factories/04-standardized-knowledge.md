# Has-Many Factory Relationships

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Has-Many Factories |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Factory relationships for `HasMany` allow creating a parent model with child models in a single fluent call. The `has()` method and magic `has{Relation}` methods define child attributes inline, with automatic foreign key assignment. This is the primary mechanism for one-to-many relationship test data.

## Core Concepts

- **has() method**: `User::factory()->has(Post::factory()->count(3))->create()` — creates parent and children
- **Magic has{Relation} methods**: `User::factory()->hasPosts(3)->create()` — shorthand with inferred factory
- **Attribute forwarding**: Second argument overrides child attributes: `->hasPosts(3, ['published' => true])`
- **Nested relationships**: Arbitrary depth: `User::factory()->has(Post::factory()->has(Comment::factory()->count(2)))`
- **Relationship resolution**: Factory reads the `HasMany` relationship to determine foreign key

## When To Use

- You need a parent model with a specific number of child models
- You want to set up related data in a single factory call
- The child model depends on the parent's foreign key

## When NOT To Use

- The relationship is belongs-to (use `for()`)
- The relationship requires complex pivot data (use `hasAttached()`)
- The children should be associated with an existing parent (use `for()` on child factory)

## Best Practices

- **Use `has()` for owned relationships**: When the parent "has" the children (the child table has the foreign key), use `has()`. This creates the parent first, then children with the correct foreign key.
- **Nest for deep graphs**: `User::factory()->has(Post::factory()->has(Comment::factory()->count(3)))->create()` builds a complete graph in one call.

## Architecture Guidelines

- Use `has()` in factory calls or `afterCreating` callbacks
- Magic methods (`hasPosts`) provide readable shorthand
- Attribute forwarding for controlling child state

## Examples

```php
User::factory()
    ->has(Post::factory()->count(3)->state(['published' => true]))
    ->has(Profile::factory())
    ->create();
// Creates 1 user, 3 published posts, 1 profile
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Factory Definition |
| Closely Related | BelongsTo Factories |
| Closely Related | BelongsToMany Factories |
| Closely Related | Recycle Pattern |

## AI Agent Notes

- `has()` for one-to-many parent-child creation
- Magic methods provide readable shorthand
- Attribute forwarding controls child state

## Verification

- [ ] Factory uses `has()` or magic `has{Relation}()` for owned relationships
- [ ] Foreign keys are correctly assigned automatically
- [ ] Count parameter controls number of children
