# Skill: Add A Feature-Specific Model

## Purpose

Create a new Eloquent model within a feature directory, correctly namespaced, with explicit table name, migrations, and factory — ensuring clear ownership and preventing naming collisions.

## When To Use

- Creating a model that belongs exclusively to one feature
- Adding persistence for a new business concept within an existing feature
- Extracting a model from `App\Models\` into a feature when ownership is clear

## When NOT To Use

- Models shared by 3+ features (belong in `App\Models\`)
- Simple CRUD apps where namespace depth adds unnecessary complexity
- When the model would create a circular dependency between features

## Prerequisites

- Feature directory exists with `Models/` subdirectory
- Feature's service provider is registered
- Model placement policy is documented

## Inputs

- Feature name (e.g., `Billing`)
- Model name (e.g., `Invoice`)
- Table name (e.g., `billing_invoices`)
- Attributes and relationships

## Workflow

1. Create `app/Features/{Feature}/Models/{Model}.php` with `namespace App\Features\{Feature}\Models;`
2. Set an explicit `$table` property with a feature-specific prefix to prevent naming collisions
3. Define `$fillable` or `$guarded`, `$casts`, and relationships
4. Create the migration in `app/Features/{Feature}/Database/Migrations/`
5. Load migration in the feature's service provider: `$this->loadMigrationsFrom(__DIR__.'/../Database/Migrations')`
6. Create the factory in `app/Features/{Feature}/Database/Factories/` with explicit `$model` reference
7. Set up route model binding in the service provider if needed: `Route::model('invoice', Invoice::class)`
8. Run `php artisan make:model "Features/Billing/Models/Invoice" -m` or create manually

## Validation Checklist

- [ ] Model namespace is `App\Features\{Feature}\Models\{Model}`
- [ ] `$table` property explicitly defined with feature prefix (e.g., `billing_invoices`)
- [ ] Migration co-located in feature's `Database/Migrations/` and loaded via provider
- [ ] Factory co-located with correct `$model` reference
- [ ] No direct cross-feature model imports (enforced by static analysis)
- [ ] Route model binding registered for the model
- [ ] Factory `$model` points to fully qualified feature model class

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Cross-feature model access | Convenience in another feature | Enforce via static analysis CI |
| Table naming collision | Two features both default to `invoices` | Always set explicit `$table` with prefix |
| Migration not registered | Provider doesn't load feature migrations | Verify with `php artisan migrate:status` |
| Wrong factory model reference | Factory resolves to `App\Models\` | Set explicit `$model` in factory |
| Route model binding fails | No explicit binding registered | Register in service provider boot |

## Decision Points

- **Feature model vs Shared model**: Owned by single feature → feature model. Needed by 3+ features → `App\Models\`. Needed by 2 features → shared kernel service interface.
- **Explicit table name**: Always set `$table` with feature prefix (e.g., `billing_invoices`) unless the model name is globally unique.
- **Route model binding**: Register explicitly in service provider or use implicit binding with FQCN type-hint in controller.

## Performance Considerations

Zero performance impact. Eloquent resolves models by FQCN regardless of namespace depth. Composer's optimized autoloader eliminates filesystem overhead in production.

## Security Considerations

Same security as any Eloquent model. Mass assignment protection, authorization policies, and attribute casting work identically regardless of namespace. Use standard Laravel security practices.

## Related Rules

- Namespace Tells Ownership (05-rules.md)
- Keep Shared Models Slim (05-rules.md)
- Use Service-Level Queries For Complex Aggregations (05-rules.md)
- Register Feature Model Migrations (05-rules.md)
- Co-locate Factories With Feature Models (05-rules.md)
- Use Custom Table Names For Feature Models (05-rules.md)
- Define Clear Policy For Model Placement (05-rules.md)

## Related Skills

- Create A New Feature Scaffold
- Extend Shared Models With Feature-Specific Relationships Via Traits
- Create And Register Feature Configuration

## Success Criteria

- Feature model is accessible in its feature's namespace
- Migration creates the correct table with feature-specific prefix
- Factory creates valid model instances for testing
- Route model binding resolves correctly for feature model
- No cross-feature model imports in static analysis

---

# Skill: Extend Shared Models With Feature-Specific Relationships Via Traits

## Purpose

Add feature-specific relationships to shared models (like `User`) without bloating the shared model class, using traits that live in the owning feature.

## When To Use

- A shared model (e.g., `User`) needs relationships to feature-specific models (e.g., `User` has many `Invoice`s)
- Multiple features need to extend the same shared model
- Keeping shared models slim while enabling feature-specific functionality

## When NOT To Use

- When the relationship is truly universal and belongs on the shared model itself
- For models that are already feature-specific (use direct relationship definitions)
- When simple eager loading would suffice without formal relationships

## Prerequisites

- Feature model exists (e.g., `App\Features\Billing\Models\Invoice`)
- Shared model exists in `App\Models\User`
- Feature has a `Models/Relations/` directory (create if not present)

## Inputs

- Shared model class (e.g., `App\Models\User`)
- Feature model class (e.g., `App\Features\Billing\Models\Invoice`)
- Relationship type (hasMany, belongsTo, morphMany, etc.)

## Workflow

1. Create `app/Features/{Feature}/Models/Relations/User{Feature}Relations.php` trait
2. Define the feature's relationships in the trait using fully qualified feature model names
3. Open `app/Models/User.php` and add `use App\Features\{Feature}\Models\Relations\User{Feature}Relations;`
4. Verify the relationship works: `$user->invoices()` returns the correct collection
5. Keep the trait focused — one trait per feature, not one trait per relationship
6. Document the trait usage in the feature's README under "Shared Model Extensions"

## Validation Checklist

- [ ] Trait lives in the feature's `Models/Relations/` directory
- [ ] Trait uses fully qualified class names for feature models
- [ ] Shared model `use` statement imports the trait
- [ ] Relationship works via `$user->invoices()->get()`
- [ ] No merge conflicts when two features add traits (each is a separate file)
- [ ] Trait is focused — does not contain logic unrelated to the feature's relationships

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| God trait | One trait with all feature relationships | One trait per feature |
| Direct model bloat | Adding relationships directly to User | Always use traits |
| Trait method collision | Two features define `invoices()` on User | Name methods specificaly or use different features |
| Circular trait dependency | Feature A trait depends on Feature B's trait | Keep traits independent |

## Decision Points

- **Trait vs Direct method**: Use trait when the relationship is feature-specific. Use direct method when the relationship is foundational (e.g., `User::posts()` for a CMS used by 3+ features).
- **One trait vs many small traits**: One trait per feature with all that feature's relationships is cleaner than one trait per relationship. Keeps trait count manageable.

## Performance Considerations

Traits are compile-time, zero runtime cost. PHP compiles them into the class definition. No difference from defining methods directly on the class.

## Security Considerations

Relationships defined via traits are subject to the same authorization as direct model relationships. Apply policies and gates at the controller/service level, not in the relationship trait.

## Related Rules

- Keep Shared Models Slim (05-rules.md)
- Use Traits For Feature Relationships On Shared Models (05-rules.md)
- Namespace Tells Ownership (05-rules.md)
- Use Service-Level Queries For Complex Aggregations (05-rules.md)

## Related Skills

- Add A Feature-Specific Model
- Define Cross-Feature Communication Contracts

## Success Criteria

- Shared model can access feature-specific relationships without bloat
- Adding a new feature's relationships does not require editing the shared model (only adding a trait)
- Feature can be removed by removing the trait use statement
- No merge conflicts when multiple features add traits simultaneously
