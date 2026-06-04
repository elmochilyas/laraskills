# Skill: Set Up initialize{TraitName}() for Per-Instance Defaults

## Purpose

Implement an `initialize{TraitName}()` method in a PHP trait to set default attribute values and register casts for trait-managed columns on every new model instance.

## When To Use

- Trait manages columns that need default attribute values
- Trait columns need cast definitions
- Setting instance-level configuration that applies per new model

## When NOT To Use

- The logic is static initialization (use `boot{TraitName}`)
- The default depends on data only available at persistence time (use `creating` event)
- The value should be computed on every access (use an accessor)

## Prerequisites

- Trait exists and is used by at least one Eloquent model
- Understanding of which trait columns need defaults or casts

## Inputs

- Trait name (e.g., `HasUuid`, `HasStatus`)
- Column names and default values
- Cast types for trait-managed columns

## Workflow

1. Identify the trait name and derive the initialize method name:
   - Trait `HasUuid` → method `initializeHasUuid`
2. Implement the initialize method as `public`:
   ```
   trait HasUuid
   {
       public function initializeHasUuid(): void
       {
           if (! isset($this->casts['uuid'])) {
               $this->casts['uuid'] = 'string'
           }
           if (! $this->uuid) {
               $this->uuid = (string) Str::uuid()
           }
       }
   }
   ```
3. Check `isset()` before modifying casts to respect model-level definitions:
   ```
   if (! isset($this->casts['uuid'])) {
       $this->casts['uuid'] = 'string'
   }
   ```
4. Keep the method fast — no database queries, API calls, or I/O:
   ```
   // AVOID:
   $this->team_id = Team::first()->id  // Query per instance
   
   // PREFER:
   $this->team_id ??= config('app.default_team_id')  // Config access — fast
   ```
5. Do not access relationships (model has no ID at construction time)
6. Do not throw exceptions for configuration errors — set safe defaults or defer validation

## Validation Checklist

- [ ] `initialize{TraitName}()` name matches the trait name exactly (case-sensitive)
- [ ] Method is declared as `public`
- [ ] Casts are set with `isset()` guard to avoid overwriting model-level definitions
- [ ] No database queries or I/O in the initialize method
- [ ] No relationship access in the initialize method
- [ ] No exceptions thrown for missing configuration
- [ ] Initialized values would not be better served by an accessor (computed on every access)
- [ ] Initialization logic is separated from boot logic (boot for static, initialize for per-instance)

## Common Failures

- **Name mismatch**: `initializeUuid()` when the trait is `HasUuid`. Eloquent silently never calls the method. Match exactly: `initializeHasUuid()`.
- **Overwriting model casts**: `$this->casts['uuid'] = 'string'` without `isset()` guard silently overrides a more specific cast the model defined. Use `isset()` check.
- **Database queries**: `Team::first()->id` in initialize runs the query on every model instantiation. For 1000 factory creations, that's 1000 queries. Use config or cached values.
- **Exceptions in initialize**: Throwing in `initializeHasUuid()` prevents model construction entirely, breaking factories and tests. Defer validation to `saving` event.

## Decision Points

- **initialize vs boot**: Use `initialize{TraitName}` for per-instance defaults. Use `boot{TraitName}` for static, once-per-class setup (event listeners, global scopes).
- **initialize vs accessor**: Use `initialize` for values set once at construction (UUIDs, default status). Use accessors for computed/derived values that depend on current attribute state.

## Performance Considerations

- `initialize{TraitName}()` runs on every new model instance — keep it sub-millisecond
- No I/O, no DB queries, no API calls
- Set defaults with simple property assignments

## Security Considerations

- Initialize methods set default values but don't validate them — validation belongs in `saving` events
- Ensure default values don't inadvertently expose sensitive defaults

## Related Rules

- Rule 1: Use `initialize{TraitName}()` for Per-Instance Defaults
- Rule 2: Check `isset()` Before Modifying Casts in `initialize{TraitName}()`
- Rule 3: Keep `initialize{TraitName}()` Methods Fast
- Rule 4: Do Not Access Relationships in `initialize{TraitName}()`
- Rule 5: Match `initialize{TraitName}()` Method Name Exactly to the Trait Name
- Rule 7: Do Not Throw Exceptions in `initialize{TraitName}()` for Configuration Errors

## Related Skills

- Trait Boot Convention for Static Lifecycle Hooks
- Trait Decomposition for Cross-Cutting Concerns
- Trait Boot Ordering for Composition

## Success Criteria

- Every new model instance has correct default values for trait-managed columns
- Cast definitions are registered without overwriting model-level casts
- Initialize methods are fast and I/O-free
- Model construction never fails due to initialize method exceptions
- Per-instance logic is in initialize, not in the boot method
