# Recycle Pattern

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Recycle Pattern |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

The `recycle()` method enables reuse of existing model instances across multiple factory-created models. Instead of creating a new parent for every child, `recycle()` shares pre-existing models, reducing redundant database writes and creating realistic shared-data scenarios. It also resolves circular dependency issues.

## Core Concepts

- **recycle() method**: `Post::factory()->count(100)->recycle($user)->create()` — all 100 posts belong to the same user
- **Recycle set**: Pass a collection: `recycle(User::all())` — factory cycles through existing users round-robin
- **Global recycle**: Applies to the entire factory graph (children created via `has()`, `for()`, `hasAttached()`)
- **Recycle resolution**: Factory matches model class to relationships and reuses the instance

## When To Use

- Creating many children that should share a small set of parents
- Avoiding circular dependency infinite loops
- Reducing database writes during seeding
- Creating realistic data where entities share resources

## When NOT To Use

- Each child should have an independent parent (use `for()` with factory)
- The parent count should match the child count exactly (use `for()` per child)

## Best Practices

- **Use `recycle()` for performance in large seed sets**: Creating 1000 posts with `recycle(10 users)` creates 10 users instead of 1000 — a 99% reduction in writes.
- **Use `recycle()` to resolve circular dependencies**: When two factories reference each other, pre-create one type and recycle it to break the cycle.
- **Use recycle sets for balanced distribution**: Pass a collection to distribute children evenly across parents in round-robin order.

## Architecture Guidelines

- `recycle()` at the top of the factory chain for graph-wide reuse
- Single instance for singleton-like reuse; collection for distributed reuse
- Combine with `has()`, `for()`, `hasAttached()` for complete graph control

## Examples

```php
$user = User::factory()->create();

Post::factory()
    ->count(100)
    ->recycle($user)
    ->create();
// All 100 posts belong to $user
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Factory Definition |
| Closely Related | Circular Dependency Resolution |
| Closely Related | HasMany Factories |
| Closely Related | Factory Performance |

## AI Agent Notes

- `recycle()` shares models across factory-created instances
- Pass collection for round-robin distribution
- Use to break circular dependencies and reduce writes

## Verification

- [ ] `recycle()` used for shared parent scenarios
- [ ] Circular dependencies resolved with `recycle()`
- [ ] Collection passed for round-robin distribution when needed
