# Attribute Registration

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Design
- **Knowledge Unit:** Attribute Registration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Since Laravel 8, Eloquent models support PHP 8 attributes to register observers, scopes, custom collection classes, and custom builder classes directly on the model class definition. This declarative approach replaces manual registration in `boot()` methods, making model configuration more discoverable and reducing boilerplate. The attributes are resolved via the `Model` class's internal `initializeTraits` and `bootTraits` mechanism and do not require separate service provider registration.

---

## Core Concepts

1. **`#[ObservedBy]`** — Registers one or more observer classes on the model. Equivalent to `Model::observe()` in `boot()`. Observers listen for Eloquent lifecycle events (creating, created, updating, updated, etc.).

2. **`#[ScopedBy]`** — Applies one or more global scopes to the model. Equivalent to `static::addGlobalScope()` in `boot()`. Scopes are applied to every query on that model.

3. **`#[CollectedBy]`** — Specifies a custom `Collection` subclass that will be returned when fetching multiple models. The collection class must extend `Illuminate\Database\Eloquent\Collection`. Equivalent to overriding `newCollection()`.

4. **`#[UseFactory]`** — Registers a specific factory class for the model. Equivalent to `HasFactory::newFactory()` method override. The factory class must extend `Illuminate\Database\Eloquent\Factories\Factory`.

5. **`#[UseEloquentBuilder]`** — Registers a custom query builder class for the model. Equivalent to overriding `newEloquentBuilder()`. The builder class must extend `Illuminate\Database\Eloquent\Builder`.

---

## Mental Models

### Attribute as Declaration
Think of attributes as compile-time declarations that configure the model's runtime behaviour. Unlike `boot()` method calls (imperative, executed at runtime), attributes are declarative and resolved via reflection. They make the model's configuration self-documenting in the class signature.

### The Four Registration Slots
Models have four extension points that can be registered via attributes: behaviour observers (`#[ObservedBy]`), query constraints (`#[ScopedBy]`), result collections (`#[CollectedBy]`), and query building (`#[UseEloquentBuilder]`). Each maps to an internal method that Eloquent calls during query execution.

---

## Internal Mechanics

### Attribute Resolution
The `Model` class does not resolve these attributes directly. Instead, `Illuminate\Database\Eloquent\Concerns\HasAttributes` contains `resolveAttributes()` and `resolveCallback()`, which are called during model initialisation (see `initializeTraits`). The resolution loop:

1. Uses PHP's `ReflectionClass` to read `#[ObservedBy]`, `#[ScopedBy]`, `#[CollectedBy]`, `#[UseFactory]`, `#[UseEloquentBuilder]` from the class.
2. Calls the appropriate registration method internally: `observe()`, `addGlobalScope()`, or sets internal properties for collection/builder overrides.
3. Caches the resolved attributes so reflection is only performed once per class.

### Custom Collection Resolution
When Eloquent returns multiple results (e.g., `get()`, `all()`, `paginate()`), it calls `Model::newCollection()`. If `#[CollectedBy]` is present, `newCollection()` returns an instance of the specified collection class instead of the default `Collection`.

### Custom Builder Resolution
When building a query, Eloquent calls `Model::newEloquentBuilder()`. If `#[UseEloquentBuilder]` is present, that method returns an instance of the specified builder class. The custom builder receives the query connection and grammar.

---

## Patterns

### Observer Registration with Attributes
```php
use App\Observers\AuditObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy(AuditObserver::class)]
class User extends Model
{
    // ...
}
```

### Custom Collection with `#[CollectedBy]`
```php
use App\Collections\UserCollection;
use Illuminate\Database\Eloquent\Attributes\CollectedBy;

#[CollectedBy(UserCollection::class)]
class User extends Model
{
    // ...
}
```

### Using Both `HasCollection` Trait and `#[CollectedBy]`
The legacy approach defined `HasCollection` trait and overrode `newCollection()`. The attribute approach replaces both:
```php
// Legacy approach — trait + override
use App\Collections\UserCollection;
class User extends Model
{
    public function newCollection(array $models = [])
    {
        return new UserCollection($models);
    }
}

// Attribute approach — declarative
#[CollectedBy(UserCollection::class)]
class User extends Model
{
    // No override needed
}
```

---

## Architectural Decisions

### Decision: Attributes vs. `boot()` Method Registration
- **Attributes** are declarative, self-documenting, and make the configuration visible in the class signature. They work best for one-to-one mappings (one observer to one model).
- **`boot()` methods** are imperative and conditional. They support dynamic registration ("register this observer only in production"), which attributes cannot express.
- **Tradeoff:** Attributes cannot express conditions or loops. For dynamic registration, fall back to `boot()`.

### Decision: `#[CollectedBy]` vs. Manual `newCollection()` Override
- `#[CollectedBy]` reduces boilerplate and keeps the model signature clean.
- Manual override remains necessary when the collection class resolution has logic (e.g., returning different collection classes based on the query context).
- **Tradeoff:** Attributes lose the ability to pass dynamic arguments to the collection constructor.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Declarative: visible at class signature | Not supported in PHP 7.x | Requires PHP 8.0+ (Laravel 8+) |
| Reduces `boot()` boilerplate | Cannot express conditional registration | Use `boot()` for dynamic logic |
| Attribute caching avoids repeated reflection | Reflection overhead on first request | Negligible — cached after warmup |
| `#[CollectedBy]` is cleaner than `newCollection()` override | Tight coupling to attribute class name | Standard Eloquent — low migration risk |

---

## Performance Considerations

- **Reflection overhead** — Attributes are resolved via `ReflectionClass::getAttributes()` on model initialisation. This is performed once per class per request and cached. The overhead is negligible (< 0.1ms per class).
- **OpCache compatibility** — PHP attributes work with OpCache; they are resolved at runtime, not compile time. No special configuration needed.
- **Custom builder overhead** — `#[UseEloquentBuilder]` resolves the custom builder class via reflection. If the builder class is heavy (many dependencies), consider lazy instantiation.

---

## Production Considerations

- **Attribute caching** — Laravel does not cache resolved attributes natively. If a model has many attributes and is instantiated frequently (e.g., in queues), consider caching the resolved attribute list manually via a static array.
- **Observers registered via `#[ObservedBy]` are eager** — They are registered immediately on model initialisation. There is no way to defer observer registration with attributes alone; use the service provider for dynamic observer registration.
- **Dependency injection in attributes** — Attributes cannot receive container-injected dependencies. Observer classes must resolve their own dependencies via the container (as they normally would).

---

## Common Mistakes

**Mistake: Importing the wrong attribute class.**
Why it happens: Multiple Laravel attribute namespaces exist (e.g., `Illuminate\Database\Eloquent\Attributes\ObservedBy` vs. a custom attribute with the same name).
Why it's harmful: The attribute is silently ignored because it doesn't implement the expected interface. Observers or scopes never register.
Better approach: Always use the fully qualified namespace import: `use Illuminate\Database\Eloquent\Attributes\ObservedBy;`.

**Mistake: Using `#[CollectedBy]` without extending `Illuminate\Database\Eloquent\Collection`.**
Why it happens: Developer creates a custom collection that extends `Collection` (from `Illuminate\Support`) instead of `EloquentCollection`.
Why it's harmful: The collection class lacks Eloquent-specific methods (`find()`, `loadCount()`, etc.), causing runtime errors.
Better approach: Always extend `Illuminate\Database\Eloquent\Collection` for custom model collections.

**Mistake: Combining `#[ScopedBy]` with manual `boot()` that also adds scopes.**
Why it happens: Migrating from boot-based scopes to attribute-based scopes without removing the old code.
Why it's harmful: Scopes are registered twice, causing duplicate constraints in every query.
Better approach: Choose one registration method per scope. Prefer attributes for static registrations.

**Mistake: Using `#[ObservedBy]` on a parent class and expecting child classes not to inherit it.**
Why it happens: PHP attributes are inherited by default unless the attribute is marked with `#[Attribute(Attribute::TARGET_CLASS)]` without `Attribute::IS_REPEATABLE` and with inherited set.
Why it's harmful: Child models unexpectedly run observers intended only for the parent.
Better approach: Be aware that `#[ObservedBy]` is inherited. If child models should not inherit, register observers in `boot()` with an `if (static::class === ParentClass::class)` guard.

---

## Failure Modes

1. **Silent Attribute Ignorance** — If the PHP version is < 8.0 (uncommon since Laravel 9 requires 8.0+), attributes are silently ignored. Since Laravel 9 requires PHP 8.0+, this is only a concern for packages that support older PHP versions.
2. **Duplicate Scope Registration** — Combining `#[ScopedBy]` with `boot()` calls to `addGlobalScope()` for the same scope. Mitigation: audit the model's `boot()` method when adding attribute-based scopes.
3. **Attribute Class Autoload Failure** — If the attribute class specified in `#[CollectedBy(UserCollection::class)]` does not exist, PHP throws a fatal error at class load time. Mitigation: ensure custom collection/builder classes are created before adding the attribute.

---

## Ecosystem Usage

- **Laravel Nova** — Nova uses `#[UseFactory]` internally for its resource test factories, though most Nova resources don't use attributes for observer registration (they prefer the `Resource::observe()` pattern).
- **Spatie Laravel Media Library** — The `HasMedia` trait observer is registered via a trait boot method rather than `#[ObservedBy]`, for backward compatibility (PHP 7.x support was only dropped recently).
- **Laravel Pulse** — Uses attributes internally for registering custom builders on its models. Pulse models use `#[UseEloquentBuilder]` to return scoped query builders that enforce tenant isolation.

---

## Related Knowledge Units
### Prerequisites
- **Base Model Class** — Understanding the initialisation flow where attributes are resolved
- **PHP 8 Attributes** — Understanding the `#[Attribute]` syntax and reflection-based resolution

### Related Topics
- **Observer Pattern in Eloquent** — How observers are triggered and how they differ from events
- **Global Scopes** — Writing and registering anonymous vs. class-based global scopes
- **Custom Collections** — Building custom Eloquent Collection subclasses with domain-specific methods
- **Custom Builders** — Extending `EloquentBuilder` for reusable query logic

### Advanced Follow-up Topics
- **Creating Custom Model Attributes** — Writing your own PHP 8 attributes that the `Model` class resolves during initialisation
- **Attribute Inheritance and Polymorphism** — How PHP 8 attribute inheritance affects model hierarchies

---

## Research Notes
### Source Analysis
The attribute registration system was introduced in Laravel 8.x and is implemented in `Illuminate\Database\Eloquent\Concerns\HasAttributes`. The `resolveAttributes()` method (Laravel 11, ~line 1560) uses `ReflectionClass::getAttributes()` to find `#[ObservedBy]` and `#[ScopedBy]` attributes. The `#[CollectedBy]` and `#[UseEloquentBuilder]` and `#[UseFactory]` attributes are resolved similarly in `resolveCallback()` and `resolveFactory()` methods.

### Key Insight
The attribute system replaces four previously-trait-specific patterns — observer registration (was in `boot()`), scope registration (was in `boot()`), collection override (was `HasCollection` trait), and builder override (was `HasBuilder` trait). The attribute-based approach is purely additive; all four trait/override patterns continue to work. Laravel will not deprecate the old patterns because attributes require PHP 8.0+.

### Version-Specific Notes
- Laravel 8.x: `#[ObservedBy]` and `#[ScopedBy]` introduced.
- Laravel 9.x: `#[CollectedBy]` and `#[UseEloquentBuilder]` and `#[UseFactory]` introduced.
- Laravel 10.x: No attribute changes; `resolveAttributes()` caching improved.
- Laravel 11.x: No attribute changes; the attribute API remains stable.
