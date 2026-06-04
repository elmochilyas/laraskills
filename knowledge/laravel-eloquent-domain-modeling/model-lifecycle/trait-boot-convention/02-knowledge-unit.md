# Trait Boot Convention

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
The trait boot convention is a naming convention recognized by Eloquent's `Model` class: any trait used by a model that defines a static method named `boot{TraitName}` will have that method automatically called during model boot. This convention allows traits to register event listeners, set up global scopes, and perform one-time initialization without requiring the model class to explicitly call any setup method.

## Core Concepts
- **Naming convention:** For a trait named `Filterable`, the boot method must be `protected static function bootFilterable(): void`.
- **Automatic invocation:** Eloquent calls all boot trait methods during the model's `boot()` method, before the `booted()` event fires.
- **One-time execution:** Boot methods execute once per model class per request, not per instance. The boot is triggered by the first instantiation of the model class.
- **No explicit registration required:** The model class does not need to call `parent::boot()` or any trait-specific method. The convention is resolved via reflection in the `Model::boot()` method.
- **boot vs. booted:** `bootTraitName()` runs during `boot()` (static initialization). `booted()` fires after all boot methods complete. Trait boot methods execute before the model's `booted()` listener.

## Mental Models
- **Traits as plugins:** A trait with a `bootTraitName()` method is a self-initializing plugin. When applied to a model, the plugin automatically sets itself up â€” registering listeners, scopes, and configurations without the model's cooperation.
- **Boot as class initialization:** The boot phase is Eloquent's equivalent of a static constructor. Trait boot methods are the mechanism for traits to participate in this static initialization.
- **Reflection-driven discovery:** Eloquent uses `class_uses_recursive()` and method name matching to discover boot methods. No configuration, no annotations, no parent calls â€” just a method named by convention.

## Internal Mechanics

> **Reference:** 
- `Model::boot()` is called once per model class per request (tracked by `$traitInitialized` array).
- `boot()` calls `static::bootTraits()` which iterates through all traits used by the class (including parent traits) and invokes any method matching `boot{TraitName}`:

```php
protected static function bootTraits(): void
{
    $class = static::class;
    
    foreach (static::classUsesRecursive($class) as $trait) {
        $method = 'boot'.class_basename($trait);
        
        if (method_exists($class, $method)) {
            forward_static_call([$class, $method]);
        }
    }
}
```

- `boot()` is called from the model constructor on first instantiation. Once a class is booted, it is marked as initialized in the `$traitInitialized` static array, preventing re-execution.
- `classUsesRecursive()` returns all traits used by the class and its parents, ensuring trait boot methods from parent classes also execute.
- `forward_static_call()` invokes the boot method in the context of the calling model class, not the trait. This means `static::` inside `bootFilterable()` refers to the model class, not the trait.

## Patterns
- **Auto-registering event listeners:** Trait boot methods are the standard place to register event listeners that a trait needs:

```php
trait Sluggable
{
    public static function bootSluggable(): void
    {
        static::creating(function ($model) {
            $model->slug = $model->generateSlug();
        });
    }
}
```

- **Auto-registering global scopes:** Register global scopes from trait boot methods:

```php
trait Multitenant
{
    public static function bootMultitenant(): void
    {
        static::addGlobalScope(new TenantScope());
    }
}
```

- **Configuration initialization:** Set trait-specific configuration defaults:

```php
trait SoftDeletes
{
    public static function bootSoftDeletes(): void
    {
        static::addGlobalScope(new SoftDeletingScope());
    }
}
```

- **Relationship boot setup:** Initialize relationships or caching mechanisms that the trait requires.

## Architectural Decisions
- **Why `boot{TraitName}` instead of a parent method?** â€” PHP traits cannot override parent class methods directly. The naming convention provides a unique method name per trait that the parent class can discover and call.
- **Why is boot static?** â€” Boot is a class-level operation (registering listeners, scopes) that should happen once per class, not per instance. Static boot methods execute in the class context.
- **Why `forward_static_call` instead of direct `$class::$method()`?** â€” `forward_static_call()` handles late static binding correctly, ensuring that `static::` within the boot method resolves to the calling model class, not the trait.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero-configuration trait setup | Magic naming convention is invisible to new developers | Document trait boot methods in trait docblocks |
| Automatic invocation prevents missed setup | Method name collisions across traits cause silent overwrites | Use unique trait names; PHP raises error on duplicate methods |
| Reflection-based discovery works without annotations | Reflection on every boot adds minor overhead | Negligible â€” boot happens once per class per request |
| Boot methods receive late static binding | Boot methods cannot be instance methods | Use `initializeTraitName()` for per-instance setup |

## Performance Considerations
- **Reflection overhead:** `classUsesRecursive()` calls `ReflectionClass::getTraits()` which is cached by PHP's reflection API. The cost is minimal and incurred once per class per request.
- **Listener registration overhead:** Registering listeners in boot methods adds to the dispatcher's listener array. The cost is proportional to the number of traits and listeners.
- **Boot method execution time:** Boot methods should be fast. Heavy computation in boot methods delays the first model instantiation.

## Production Considerations
- **Boot method idempotency:** Boot methods run once per class per request. Ensure they are idempotent â€” running them multiple times (e.g., in testing) should not produce different results.
- **Boot method visibility:** Boot methods should be `protected static`. Making them public exposes implementation details and allows external code to call them, which could cause double-initialization.
- **Boot method documentation:** Document the side effects of each boot method (listeners registered, scopes added, caches primed). This helps developers understand what a trait does.

## Common Mistakes
- **Naming mismatch:** The boot method must exactly match `boot{TraitName}` where `{TraitName}` is the class basename of the trait. `bootSlug()` will not be called if the trait is named `Sluggable`.
- **Non-static boot method:** If `bootTraitName()` is not declared `static`, Eloquent's `forward_static_call()` will trigger a PHP warning or error.
- **Forgetting boot methods on parent traits:** If a child class uses a trait, the boot methods from the trait's parent traits (via `use` in the trait) are also discovered. This may cause unintended listener registration.
- **Assuming boot methods execute for every instance:** Boot runs once per class per request. Per-instance setup must go in `initializeTraitName()`.

## Failure Modes
- **Silent method collision:** Two traits named `Sluggable` and `SluggableCache` â€” if `bootSluggable()` is defined in both, PHP's trait conflict resolution applies, and one silently overwrites the other. No error is raised unless explicit conflict resolution is defined in the model.
- **Boot method not found:** If the trait name and boot method name do not match exactly, the boot method silently never executes. The trait appears to not work with no error message.
- **Boot method order dependency:** If multiple traits register listeners on the same model event, the execution order of those listeners depends on the order traits are booted, which follows trait composition order.

## Ecosystem Usage
- **Laravel SoftDeletes:** `bootSoftDeletes()` registers the `SoftDeletingScope` global scope. This is the canonical example of the boot convention.
- **Laravel HasFactory:** `bootHasFactory()` does not exist â€” factory registration uses `initializeHasFactory()` instead, showing the distinction between boot (static) and initialize (instance) conventions.
- **Spatie Sluggable:** The `HasSlug` trait uses `bootHasSlug()` to register a `creating` event listener that auto-generates slugs.

## Related Knowledge Units

### Prerequisites
- PHP Traits
- Model Boot Lifecycle

### Related Topics
- Trait Init Convention (per-instance)
- Trait Boot Ordering (execution order)

### Advanced Follow-up Topics
- Trait Design Patterns
- Global Scopes
- Event Listener Registration

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Model::bootTraits()` â€” iterates `classUsesRecursive()` and calls `boot{TraitName}` methods. This is in `Illuminate\Database\Eloquent\Model.php`.
- **Key Insight:** The boot convention leverages PHP's `class_basename()` to strip the namespace from the trait's fully qualified class name. This means the boot method name only needs to match the trait's short name, not the full namespace. A trait `App\Traits\Filterable` requires `bootFilterable()`, not `bootAppTraitsFilterable()`.
- **Version-Specific Notes:** This convention has been present since Laravel 4.x. The `bootTraits()` method implementation has remained largely unchanged. `classUsesRecursive()` was added to handle deeply nested trait hierarchies.
