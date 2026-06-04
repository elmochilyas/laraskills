# Skill: Set Up boot{TraitName}() for Automatic Event Registration

## Purpose

Implement a `boot{TraitName}()` method in a PHP trait that automatically registers event listeners and global scopes during Eloquent model boot, keeping the trait self-contained and the model class clean.

## When To Use

- Creating a trait that needs to register event listeners or global scopes
- Moving shared boot logic from multiple models into a reusable trait
- Building self-configuring traits that work without model class modifications

## When NOT To Use

- The behavior is only needed for one model (add it directly to the model)
- The registration is conditional on runtime state (use observer instead)
- The logic should execute once per instance, not once per class (use `initialize{TraitName}`)

## Prerequisites

- Trait file exists in `app/Models/Concerns/`
- Trait is used by at least one Eloquent model

## Inputs

- Trait name (e.g., `Filterable`, `HasRoles`)
- Event listeners or global scopes to register
- Model class reference via `static::` context

## Workflow

1. Identify the trait name and derive the boot method name:
   - Trait `Filterable` → method `bootFilterable`
2. Implement the boot method as `protected static`:
   ```
   trait Filterable
   {
       protected static function bootFilterable(): void
       {
           static::addGlobalScope(new FilterScope)
       }
   }
   ```
3. Use `static::` for late static binding to the actual model class:
   ```
   static::addGlobalScope(...)        // Correct — resolves to model class
   static::creating(fn ($m) => ...)   // Correct — registers on model
   ```
4. Keep boot methods lightweight — no database queries or I/O:
   ```
   // AVOID:
   $roles = Role::all()  // Query in boot — multiplies with model count
   static::addGlobalScope(...)
   
   // PREFER: deferred query inside closure
   static::addGlobalScope('roles', fn ($query) =>
       $query->whereIn('role_id', function ($q) {
           $q->select('id')->from('roles')
       })
   )
   ```
5. Do not call `parent::bootTraitName()` (Eloquent discovers all boot methods automatically)

## Validation Checklist

- [ ] `boot{TraitName}()` name matches the trait name exactly (case-sensitive)
- [ ] Method is declared as `protected static`
- [ ] Uses `static::` context for late static binding (not `self::` or `$this`)
- [ ] Contains no database queries or I/O operations
- [ ] No call to `parent::bootTraitName()`
- [ ] `initialize{TraitName}()` used for per-instance defaults (not `boot{TraitName}`)
- [ ] Trait is self-contained — no hidden dependencies on model code

## Common Failures

- **Name mismatch**: `bootUUID()` when the trait is `HasUuid`. Eloquent silently never discovers the method. Match exactly: `bootHasUuid()`.
- **self:: instead of static::**: `self::addGlobalScope()` refers to the trait class, not the model. Use `static::` for late static binding.
- **Database queries in boot**: `Role::all()` in `bootHasRoles()` runs the query once per model class per request. 20 models = 20 queries. Use deferred closures.
- **Calling parent::bootTraitName()**: `parent::bootHasRoles()` calls `Model::bootHasRoles()` which doesn't exist. Eloquent discovers all boot methods automatically.

## Decision Points

- **boot{TraitName} vs model boot()**: Use `boot{TraitName}` in the trait to auto-register. Use model `boot()` only for setup that cannot be extracted into a trait.
- **boot{TraitName} vs initialize{TraitName}**: Use `boot{TraitName}` for static, once-per-class setup. Use `initialize{TraitName}` for per-instance defaults.

## Performance Considerations

- `boot{TraitName}()` runs once per class per request — keep it fast (no I/O)
- Defer database queries inside closures to run only when the query executes

## Security Considerations

- Trait boot methods execute automatically — ensure they don't expose sensitive functionality

## Related Rules

- Rule 1: Always Use `boot{TraitName}()` for Static Lifecycle Setup
- Rule 2: Match `boot{TraitName}()` Method Name Exactly to the Trait Name
- Rule 3: Keep `boot{TraitName}()` Methods Lightweight
- Rule 5: Declare `boot{TraitName}()` as `protected static`
- Rule 6: Do Not Call `parent::bootTraitName()` Inside `boot{TraitName}()`
- Rule 7: Register Event Listeners Inside `boot{TraitName}()` Using the `static::` Context

## Related Skills

- Trait Init Convention for Instance Defaults
- Trait Decomposition for Cross-Cutting Concerns
- Trait Boot Ordering for Composition

## Success Criteria

- Trait automatically registers its event listeners and scopes when used on any model
- Boot method name matches the trait name exactly
- No database queries execute during boot
- Model class remains clean with no manual setup calls
- `initialize{TraitName}` correctly handles per-instance defaults separately
