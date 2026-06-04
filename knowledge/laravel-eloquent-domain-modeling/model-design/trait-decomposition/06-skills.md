# Skill: Decompose Cross-Cutting Model Behavior into Traits

## Purpose

Extract reusable cross-cutting concerns (soft deletes, audit logging, UUID generation) from model classes into self-contained PHP traits with `boot{TraitName}` and `initialize{TraitName}` lifecycle hooks.

## When To Use

- The same behavior is needed across multiple models (cross-cutting concern)
- Package features that apply to multiple models (e.g., Spatie's `HasRoles`)
- Encapsulating model lifecycle registration logic

## When NOT To Use

- The behavior is only needed in one model (inline it directly)
- The behavior involves complex event logic (use an observer instead)
- The behavior is attribute transformation (use a custom cast instead)

## Prerequisites

- At least two models share the same behavior
- The behavior does not require complex inter-trait dependencies

## Inputs

- Behavior name (e.g., `HasUuid`, `InteractsWithMedia`)
- Lifecycle hooks needed (static setup, instance defaults, or both)
- Shared method implementations

## Workflow

1. Identify the reusable behavior and name it with `Has`, `InteractsWith`, or `Is` prefix:
   - `HasUuid`, `HasAudit`, `InteractsWithMedia`
2. Create the trait file in `app/Models/Concerns/`:
   ```
   namespace App\Models\Concerns
   
   trait HasUuid {}
   ```
3. Add a `boot{TraitName}()` method for static lifecycle setup:
   ```
   protected static function bootHasUuid(): void
   {
       static::creating(function ($model) {
           $model->uuid ??= (string) Str::uuid()
       })
   }
   ```
4. Add an `initialize{TraitName}()` method for per-instance defaults:
   ```
   public function initializeHasUuid(): void
   {
       $this->casts['uuid'] = 'string'
   }
   ```
5. Use the trait in each model that needs the behavior:
   ```
   class Order extends Model
   {
       use HasUuid
   }
   ```
6. Document any inter-trait dependencies in the trait's docblock:
   ```
   /**
    * @requires SoftDeletes — must be listed before HasAudit in the use statement
    */
   ```

## Validation Checklist

- [ ] Trait name follows `Has`/`InteractsWith`/`Is` prefix convention
- [ ] Trait is in `app/Models/Concerns/` directory
- [ ] `boot{TraitName}()` used for event registration / scope setup
- [ ] `initialize{TraitName}()` used for default attribute values and casts
- [ ] Trait is self-contained with documented dependencies
- [ ] Trait does not override the model's `boot()` method
- [ ] Complex event logic uses observers instead of trait boot methods
- [ ] Attribute transformation uses custom casts instead of trait accessors/mutators

## Common Failures

- **boot() override in trait**: Defining `boot()` inside the trait instead of `boot{TraitName}()`. This overrides the model's `boot()` and breaks other traits.
- **Single-use trait**: Extracting a trait for behavior used by only one model. Keep it inline unless a second use case emerges.
- **Missing trait dependency docs**: Trait A calls a method from Trait B without documenting the dependency. Add `@requires` in the docblock.

## Decision Points

- **Trait vs observer**: Use traits for small, focused lifecycle hooks (setting defaults, registering scopes). Use observers for complex multi-step event logic.
- **Trait vs custom cast**: Use custom casts for attribute transformation (serialization, type coercion). Use traits for lifecycle hooks and cross-cutting methods.

## Performance Considerations

- `boot{TraitName}()` runs once per class per request — negligible
- `initialize{TraitName}()` runs per new instance — keep lightweight, no I/O

## Security Considerations

- Traits have the same security context as the model — ensure they don't bypass mass-assignment protection

## Related Rules

- Use `boot{TraitName}` for Event and Scope Registration
- Use `initialize{TraitName}` for Default Attribute Values
- Name Traits with `Has`, `InteractsWith`, or `Is` Prefixes
- Keep Traits in `App\Models\Concerns`
- Prefer Observers Over Traits for Complex Event Logic
- Prefer Custom Casts Over Traits for Attribute Transformation

## Related Skills

- Trait Boot Convention for Lifecycle Hooks
- Trait Init Convention for Instance Defaults
- Trait Boot Ordering for Composition

## Success Criteria

- Cross-cutting behavior is encapsulated in reusable traits
- Models using the trait have the expected behavior without manual setup
- Trait dependencies are documented and boot order is correct
- Complex event and transformation logic uses observers/casts, not traits
