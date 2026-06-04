# Initialize Trait Convention

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Initialize Trait Convention |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

The `initialize{TraitName}` convention is the per-instance counterpart to the boot convention. While `boot{TraitName}` runs once per class, `initialize{TraitName}` runs during every new model instance construction. This allows traits to set default attribute values, configure casts, and prepare instance-specific state.

## Core Concepts

- **Per-instance execution**: `initialize{TraitName}` runs during `__construct()`, after trait boot and before model attributes are set
- **Default value setup**: Typically used to set default attribute values for the trait's columns
- **Cast registration**: Can add entries to `$this->casts` for trait-managed columns
- **Initialization order**: Runs after all `boot{TraitName}` methods and after `booted()` event

## When To Use

- Setting default values for trait-related columns (e.g., `deleted_at = null` for soft deletes)
- Adding cast definitions for trait columns
- Preparing instance state that depends on the model class

## When NOT To Use

- Static initialization (use `boot{TraitName}`)
- Logic that should run on every access (use an accessor)
- Logic that depends on the model being persisted (use `creating` event)

## Best Practices

- **Use `initialize{TraitName}` for attribute defaults**: Set trait-managed columns to sensible defaults. This ensures the model is in a valid state immediately after construction.
- **Don't perform heavy operations**: Initialize methods run on every model instantiation. Keep them lightweight.
- **Check `isset()` before modifying casts**: Avoid overwriting explicit casts already defined on the model.

## Architecture Guidelines

- `initialize{TraitName}` for per-instance setup
- Keep initialize methods fast — no database queries
- Check for existing values before overriding

## Examples

```php
trait HasUuid
{
    public function initializeHasUuid(): void
    {
        $this->casts['uuid'] = 'string';

        if (! $this->uuid) {
            $this->uuid = (string) Str::uuid();
        }
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Trait Boot Convention |
| Closely Related | Trait Decomposition |
| Closely Related | Trait Boot Ordering |

## AI Agent Notes

- `initialize{TraitName}` runs per new model instance
- Used for default values and cast registration
- Keep lightweight — no DB queries

## Verification

- [ ] Instance-level defaults set in `initialize{TraitName}`
- [ ] Casts for trait columns registered in initialize method
- [ ] Existing values are not overwritten
