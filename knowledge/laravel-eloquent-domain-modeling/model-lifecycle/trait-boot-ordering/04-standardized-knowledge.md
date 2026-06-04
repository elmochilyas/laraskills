# Trait Boot Ordering

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Trait Boot Ordering |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Trait boot methods execute in a specific order determined by the `use` statement. When multiple traits define `boot{TraitName}` or `initialize{TraitName}` methods, their execution order follows trait composition. Understanding this order is critical when traits have inter-dependencies.

## Core Concepts

- **Boot order**: Traits boot in the order listed in the `use` statement
- **Initialize order**: Trait initialize methods also follow `use` statement order
- **Dependency resolution**: If trait A depends on trait B's boot method, B must be listed first
- **Method conflicts**: `insteadof` and `as` operators resolve conflicting method names

## When To Use

- Multiple traits with boot/initialize methods on the same model
- Traits that depend on other traits' setup
- Debugging boot-order-dependent behavior

## Best Practices

- **List dependent traits first**: If `HasRoles` depends on `HasTeams`, list `HasTeams` before `HasRoles` in the `use` statement.
- **Avoid inter-trait dependencies where possible**: Self-contained traits are easier to reason about. If traits must depend on each other, document the dependency explicitly.
- **Test trait combinations**: If traits are composed in different orders across models, write tests verifying the composed behavior works correctly.

## Architecture Guidelines

- Order traits by dependency: foundational traits first, dependent traits after
- Document trait dependencies in trait docblocks
- Use `insteadof` for explicit conflict resolution when two traits define the same method

## Examples

```php
class User extends Model
{
    use HasTeams,     // Must boot first (foundational)
        HasRoles,    // Depends on HasTeams
        SoftDeletes, // Independent
        HasUuid;     // Independent
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Trait Boot Convention |
| Prerequisite | Initialize Trait Convention |
| Closely Related | Trait Decomposition |
| Closely Related | Event Dispatch Order |

## AI Agent Notes

- Trait boot order follows `use` statement order
- List dependent traits after their dependencies
- Document inter-trait dependencies

## Verification

- [ ] Traits are ordered by dependency in `use` statement
- [ ] Inter-trait dependencies are documented
- [ ] Trait combinations are tested
