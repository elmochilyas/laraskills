# Trait Decomposition

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Trait Decomposition |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

PHP traits are the primary mechanism for decomposing cross-cutting concerns across Eloquent models. Eloquent's `boot{TraitName}` and `initialize{TraitName}` conventions allow traits to hook into model lifecycle events without overriding core methods. This enables clean separation of concerns (soft deletes, multi-tenancy, audit logging) by composing model behavior from reusable trait units.

## Core Concepts

- **Boot Trait Convention**: `static::boot{TraitName}()` — called during model boot; registers event listeners, global scopes
- **Initialize Trait Convention**: `initialize{TraitName}()` — called during model construction; sets default attribute values
- **Trait boot order**: Traits boot in the order they are listed in the `use` statement
- **Conflict resolution**: `insteadof` and `as` operators for trait method conflicts

## When To Use

- Cross-cutting concerns shared across models (soft deletes, timestamps, audit logging)
- Package features that apply to multiple models (Spatie's `HasRoles`, `InteractsWithMedia`)
- Encapsulating model lifecycle registration logic

## When NOT To Use

- The behavior is only needed in one model (just add it directly to the model)
- The trait would require complex trait-to-trait dependencies
- The behavior is better expressed as a dedicated class (observer, custom cast)

## Best Practices

- **Use `boot{TraitName}` for event registration**: Register model event listeners in the boot method. This is the standard pattern followed by Laravel's own traits (`SoftDeletes`, `HasTimestamps`).
- **Use `initialize{TraitName}` for default values**: Set default attribute values for the trait's attributes in the initialize method. This runs on every new model instance.
- **Name traits clearly**: `HasRoles`, `InteractsWithMedia`, `SoftDeletes`. The `Has`/`Interacts`/`Is` prefix signals a trait that adds capabilities.

## Architecture Guidelines

- Traits in `App\Models\Concerns\*` or alongside the model
- `boot{TraitName}` registers event listeners and scopes
- `initialize{TraitName}` sets default attribute values
- Traits should not depend on other package traits without clear documentation

## Performance Considerations

- Trait boot methods run once per model class, not per instance — negligible
- Initialize methods run once per new model instance — fast for simple assignments

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
| Prerequisite | Base Model Class |
| Closely Related | Boot Trait Convention |
| Closely Related | Initialize Trait Convention |
| Closely Related | Trait Boot Ordering |

## AI Agent Notes

- `boot{TraitName}` registers events/scopes; runs once per class
- `initialize{TraitName}` sets defaults; runs per new instance
- Traits compose cross-cutting concerns cleanly

## Verification

- [ ] `boot{TraitName}` used for event/scope registration
- [ ] `initialize{TraitName}` used for default attribute values
- [ ] Trait dependencies are documented
- [ ] Trait name follows `Has`/`InteractsWith`/`Is` convention
