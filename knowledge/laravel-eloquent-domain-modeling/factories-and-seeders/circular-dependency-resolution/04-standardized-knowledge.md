# Circular Dependency Resolution

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Circular Dependency Resolution |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Circular factory dependencies occur when models reference each other (e.g., `User` and `Post`), and factories attempt to create each other in callbacks or definitions. Without intervention, this creates infinite recursion. Laravel provides strategies to resolve this: `recycle()`, lazy resolution, deferred creation, and nullable relationship design.

## Core Concepts

- **Direct circular dependency**: Factory A creates Model B, whose factory creates Model A — infinite loop
- **Indirect circular dependency**: A → B → C → A
- **Recycle resolution**: Pre-creating shared models breaks the cycle by satisfying references
- **Lazy callback resolution**: Postponing related model creation to `afterCreating`
- **Nullable relationship design**: Making one side nullable to allow creation without the circular reference

## When To Use

- Two or more models have bidirectional relationships
- Factory callbacks trigger infinite recursion
- Stack overflow errors during seeding

## When NOT To Use

- The relationship is genuinely single-direction (the code has a bug)
- The dependency can be eliminated by redesigning the relationship

## Best Practices

- **Pre-create one side of the cycle**: Determine which model can exist independently and create it first with `recycle()`. The dependent model then references the pre-created instance.
- **Use `afterCreating` for the dependent relationship**: Create the circular relationship in `afterCreating` instead of `definition()`. This breaks the recursion because the base model already exists.
- **Make one side nullable at the database level**: If one model can exist without the other, make the foreign key nullable. The relationship is established in a second step.

## Architecture Guidelines

- Identify which model is the "primary" entity that can exist independently
- Pre-create that model with `recycle()` in the factory chain
- The dependent model's factory references the recycled instance

## Performance Considerations

- Circular dependency resolution typically adds no overhead beyond the pre-creation step
- Recursive factory calls can crash PHP (stack overflow) — resolve before hitting large counts

## Examples

```php
// Pre-create users to break Post → User → Post cycle
$users = User::factory()->count(10)->create();

Post::factory()
    ->count(50)
    ->recycle($users)
    ->create();
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Factory Definition |
| Closely Related | Recycle Pattern |
| Closely Related | Factory Relationships |

## AI Agent Notes

- Pre-create one side of the cycle with `recycle()`
- Use `afterCreating` for dependent relationships
- Make one side nullable if the relationship can be optional

## Verification

- [ ] Circular dependency is identified and documented
- [ ] `recycle()` or `afterCreating` resolves the cycle
- [ ] Stack overflow does not occur during factory execution
