# Trait Boot Convention

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Trait Boot Convention |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

The trait boot convention is a naming convention recognized by Eloquent: any trait defining a static `boot{TraitName}` method has it called automatically during model boot. This allows traits to register event listeners, set up global scopes, and perform one-time initialization without explicit model class setup.

## Core Concepts

- **Naming convention**: Trait `Filterable` → boot method `protected static function bootFilterable(): void`
- **Automatic invocation**: Called during model boot, before `booted()` event
- **One-time execution**: Executes once per model class per request (static initialization)
- **No explicit registration**: The model doesn't need to call `parent::boot()` or trait-specific methods
- **Initialize traits**: `initialize{TraitName}()` runs per-instance during construction

## When To Use

- Traits that register event listeners or global scopes
- Cross-cutting behavior that should be self-configuring (SoftDeletes, HasRoles)
- Package traits that need lifecycle hooks

## When NOT To Use

- Simple helper methods that don't need lifecycle hooks (use regular trait methods)
- Behavior that should be applied conditionally (use observer registration instead)

## Best Practices

- **Use `boot{TraitName}` for event/scope registration**: This is the standard pattern used by Laravel's own traits. It keeps the trait self-contained and reduces boilerplate on the model class.
- **Use `initialize{TraitName}` for default values**: Set default attribute values for the trait's attributes in the initialize method. This runs on every new model instance.
- **Document trait boot ordering**: If a trait depends on another trait's boot method running first, document the dependency. Trait boot order follows the `use` statement order.

## Architecture Guidelines

- `boot{TraitName}` for static initialization (runs once per class)
- `initialize{TraitName}` for instance initialization (runs per new model)
- Both follow the same naming pattern based on the trait name

## Examples

```php
trait SoftDeletes
{
    protected static function bootSoftDeletes(): void
    {
        static::addGlobalScope(new SoftDeletingScope);
    }

    public function initializeSoftDeletes(): void
    {
        if (! isset($this->casts['deleted_at'])) {
            $this->casts['deleted_at'] = 'datetime';
        }
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Trait Decomposition |
| Closely Related | Initialize Trait Convention |
| Closely Related | Trait Boot Ordering |
| Closely Related | Event Catalog |

## AI Agent Notes

- `boot{TraitName}` runs once per class
- `initialize{TraitName}` runs per new instance
- Trait boot order follows `use` statement order

## Verification

- [ ] `boot{TraitName}` registers events/scopes/global setup
- [ ] `initialize{TraitName}` sets instance-level defaults
- [ ] Trait dependencies are documented
