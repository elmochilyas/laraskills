# Trait Init Convention

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
The trait init convention is a per-instance complement to the boot convention. While `boot{TraitName}` methods execute once per class per request for static initialization, `initialize{TraitName}` methods execute once per model instance during construction, after the parent constructor completes. This convention allows traits to set up instance-specific state, default attributes, and property initializations without requiring the model class to explicitly call any setup method.

## Core Concepts
- **Naming convention:** For a trait named `Filterable`, the init method must be `protected function initializeFilterable(): void`.
- **Instance method:** Unlike boot methods (static), init methods are instance methods. They have access to `$this` and can set instance properties.
- **Execution timing:** Init methods run after the parent constructor but before `boot()` methods. Specifically, they are called from `Model::__construct()` after `parent::__construct()`.
- **Per-instance execution:** Every new model instance triggers init methods. Factory-created, freshly hydrated, and manually instantiated models all trigger init.
- **No explicit registration required:** Like boot methods, init methods are discovered via reflection. The model class does not need to call them explicitly.

## Mental Models
- **Constructor extension:** Think of `initializeTraitName()` as a per-trait extension of the model constructor. Each trait gets a hook to initialize its own instance state.
- **Instance setup vs. class setup:** Boot is for class-level setup (listeners, scopes). Init is for instance-level setup (default attributes, property initialization, instance configuration).
- **Reflection-driven discovery:** Same mechanism as boot â€” Eloquent uses `class_uses_recursive()` and name matching to discover `initialize{TraitName}` methods.

## Internal Mechanics

> **Reference:** 
- `Model::__construct()` calls `$this->initializeTraits()` after setting default attributes and calling `parent::__construct()`.
- `initializeTraits()` iterates through all traits used by the class and calls any method matching `initialize{TraitName}`:

```php
protected function initializeTraits(): void
{
    foreach (static::classUsesRecursive(static::class) as $trait) {
        $method = 'initialize'.class_basename($trait);
        
        if (method_exists($this, $method)) {
            $this->{$method}();
        }
    }
}
```

- The execution order matches the order returned by `classUsesRecursive()`, which follows PHP's trait composition order.
- Init methods are called after the model's `$attributes` array is initialized but before any `boot()` process (boot is called during first instantiation, but init methods run every time).

```php
// Simplified constructor flow:
public function __construct(array $attributes = [])
{
    $this->bootIfNotBooted();
    $this->initializeTraits();
    $this->syncOriginal();
    $this->fill($attributes);
    $this->fireModelEvent('booting', false);
    // ... boot traits, booted event ...
}
```

## Patterns
- **Default attribute initialization:** Set trait-specific default values that are not covered by the `$attributes` property:

```php
trait HasMeta
{
    protected function initializeHasMeta(): void
    {
        if (! isset($this->meta)) {
            $this->meta = [];
        }
    }
}
```

- **Property type initialization:** Ensure trait-specific properties are initialized to the correct type:

```php
trait Publishable
{
    protected function initializePublishable(): void
    {
        $this->published_at = $this->published_at ?? null;
        $this->is_published = $this->is_published ?? false;
    }
}
```

- **Cache or memoization setup:** Initialize trait-specific caches or memoization arrays:

```php
trait CachedRelationships
{
    protected array $relationshipCache = [];
    
    protected function initializeCachedRelationships(): void
    {
        $this->relationshipCache = [];
    }
}
```

- **Configuration loading:** Load trait-specific configuration from the application config:

```php
trait Translatable
{
    protected function initializeTranslatable(): void
    {
        $this->locale = $this->locale ?? app()->getLocale();
    }
}
```

## Architectural Decisions
- **Why instance method instead of static?** â€” Instance initialization needs access to `$this` to set properties, call instance methods, and access per-instance state. Static methods cannot do this.
- **Why separate from boot?** â€” Boot runs once per class. Init runs once per instance. Combining them would make class-level setup (listeners) repeat on every instance, and instance-level setup (properties) inconsistent across instances.
- **Why after parent constructor?** â€” The parent `__construct()` may set up the model's base state (connection, table, etc.). Init methods run after this base state is available, ensuring traits can rely on it.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automatic per-instance initialization | Creates implicit constructor behavior | Document init method side effects in trait docblocks |
| No model class modification required | Init methods add overhead to every model instantiation | Keep init methods lightweight |
| Works with factory and hydration | Hydration calls `fill()` after init, which may override init defaults | Set defaults that `fill()` can override intentionally |

## Performance Considerations
- **Reflection overhead:** Same as boot â€” `classUsesRecursive()` uses PHP's cached reflection. Impact is negligible.
- **Per-instance overhead:** Init methods run on every `new Model()` call, every `Model::find()` hydration, and every factory creation. For bulk operations (1000+ models), init method overhead compounds.
- **Heavy init methods:** Complex computation in init methods multiplies instantiation time. Keep logic minimal â€” defer heavy setup to lazy initialization.

## Production Considerations
- **Init method order:** If init methods from different traits set the same attribute, the last one to execute wins. The order follows trait composition order (left-to-right in the `use` statement).
- **Hydration interaction:** When a model is hydrated from the database, `fill()` is called after `initializeTraits()`. Hydrated attributes override init defaults. This is correct behavior â€” database state takes precedence.
- **Factory interaction:** Factory `make()` creates a model instance (triggering init) and then sets factory attributes (triggering fill). Init defaults are overwritten by factory definitions.

## Common Mistakes
- **Using init for listener registration:** Listeners are class-level and should be registered in `bootTraitName()`, not init. Registering in init duplicates listeners across instances.
- **Assuming init runs before fill:** `fill()` is called after `initializeTraits()`. Attributes set by init may be overwritten by `fill()`. If init must set attributes that cannot be overwritten, use `$attributes` property or `creating` event.
- **Naming mismatch:** `initializeSlug()` will not be called if the trait is named `Sluggable`. The method name must match `initialize{TraitName}` exactly.
- **Forgetting `parent::__construct()` call:** If a model overrides `__construct()` and does not call `parent::__construct()`, init methods never execute. Always call `parent::__construct($attributes)`.

## Failure Modes
- **Init method not found:** If the naming convention is not followed, the init method silently never executes. The trait appears broken with no error.
- **Property not initialized:** An init method that relies on a trait property that was not declared in the trait itself (relying on the model to declare it) will trigger PHP property notice.
- **Init method throws exception:** An exception in an init method prevents the model from being constructed entirely. This can break find operations, factory creation, and relationship resolution.

## Ecosystem Usage
- **Laravel SoftDeletes:** Uses `initializeSoftDeletes()` to set `$this->deleted_at = null` on new instances.
- **Laravel HasFactory:** Uses `initializeHasFactory()` to set the factory instance for the model.
- **Laravel BroadcastsEvents:** Uses `initializeBroadcastsEvents()` to set the broadcast configuration per instance.

## Related Knowledge Units

### Prerequisites
- PHP Traits
- Trait Boot Convention

### Related Topics
- Trait Boot Ordering
- Constructor Lifecycle

### Advanced Follow-up Topics
- Model Attribute Initialization
- Factory State Management

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Model::initializeTraits()` â€” iterates traits and calls matching `initialize{TraitName}` methods. Called from the model constructor after the parent constructor.
- **Key Insight:** The init convention solves a fundamental PHP trait limitation: traits cannot override constructors. Without `initializeTraitName()`, traits would have no way to perform per-instance setup without the model class explicitly calling a trait method.
- **Version-Specific Notes:** The `initializeTraits()` method was added in Laravel 5.4. Prior to that, traits could only use the `boot{TraitName}` static convention for setup. The instance init convention was introduced per community request.
