# Trait Decomposition

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Design
- **Knowledge Unit:** Trait Decomposition
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
PHP traits are the primary mechanism for decomposing cross-cutting concerns across Eloquent models. Eloquent's trait initialisation convention — the `boot{TraitName}` and `initialize{TraitName}` methods — allows traits to hook into model lifecycle events and constructor initialisation without overriding core Model methods. This pattern enables clean separation of concerns (soft deletes, multi-tenancy, audit logging, media handling) by composing model behaviour from reusable trait units.

---

## Core Concepts

1. **Boot Trait Convention** — When a model uses a trait, Eloquent checks if that trait defines a `static::boot{TraitName}()` method. If so, it calls it during the model's boot process. This is where traits register event listeners, global scopes, or override default model behaviour.

2. **Initialize Trait Convention** — Similarly, Eloquent checks for `static::initialize{TraitName}()` and calls it during model instantiation (after the constructor). This is where traits set default attribute values or configure per-instance state.

3. **Execution Order** — Boot methods are called in the order traits are listed in the `use` statement. Initialize methods follow the same order. Both are called after the parent `Model::boot()` and `Model::initialize()` complete.

4. **Conflicts and Resolution** — If two traits define the same boot or initialize method, PHP's trait conflict resolution takes precedence: `insteadof` selects one, `as` aliases a method.

5. **Spatie Package Trait Conventions** — Spatie packages follow a consistent pattern: trait names are prefixed with `Has` (e.g., `HasMedia`, `HasRoles`, `HasPermissions`, `HasTags`), with optional `InteractsWith` prefix for traits that require active usage (e.g., `InteractsWithMedia`). Boot/initialize hooks configure the package's internal state.

---

## Mental Models

### Trait as Plugin Slot
Think of each trait as a plugin that hooks into three lifecycles: class boot (once per process), instance initialisation (once per new instance), and runtime (any method the trait adds). The boot and initialize methods are the trait's "setup" hooks.

### The Boot/Initialize Convention as Protocol
Unlike traits that provide only methods, Eloquent-aware traits follow a protocol: if you name a static method `boot{TraitName}`, Eloquent will call it automatically. This is a convention-based protocol, not an interface — no PHP interface enforces it. The consequence is that misspelling `bootYourTrait` (capitalisation matters) silently skips the hook.

---

## Internal Mechanics

### Boot Process
`Model::boot()` is called once per class per request. It calls `bootTraits()`, which uses `class_uses_recursive()` to find all traits on the model and its parents. For each trait, it constructs the method name `boot{$trait}` and calls it if it exists.

```php
// Simplified from Model::bootTraits()
protected static function bootTraits()
{
    foreach (class_uses_recursive(static::class) as $trait) {
        $method = 'boot' . class_basename($trait);
        if (method_exists(static::class, $method)) {
            static::{$method}();
        }
    }
}
```

### Initialize Process
`Model::initializeTraits()` is called in the constructor. It uses the same `class_uses_recursive()` approach but constructs `initialize{$trait}` method names. Each initialize method receives the model instance as `$this` (unlike boot methods which are static).

```php
// Simplified from Model::initializeTraits()
protected function initializeTraits()
{
    foreach (class_uses_recursive(static::class) as $trait) {
        $method = 'initialize' . class_basename($trait);
        if (method_exists(static::class, $method)) {
            $this->{$method}();
        }
    }
}
```

### Caching
The resolved trait list is not cached per-request in Laravel. Each model instantiation calls `class_uses_recursive()`, which reads the inheritance chain. For hot code paths (queues, batch processing), consider caching the resolved trait list.

---

## Patterns

### Standard Trait Hooks
```php
trait HasAuditLog
{
    public static function bootHasAuditLog()
    {
        static::created(function ($model) {
            AuditLog::log('created', $model);
        });
    }

    public function initializeHasAuditLog()
    {
        $this->mergeCasts(['audit_metadata' => 'array']);
    }

    public function auditEntries()
    {
        return $this->morphMany(AuditEntry::class, 'auditable');
    }
}
```

### Trait with Configurable Behaviour
Use static properties configured via `initialize`:
```php
trait HasTenantScope
{
    protected static $tenantColumn = 'tenant_id';

    public static function bootHasTenantScope()
    {
        static::addGlobalScope(new TenantScope(static::$tenantColumn));
        
        static::creating(function ($model) {
            if (empty($model->{static::$tenantColumn})) {
                $model->{static::$tenantColumn} = auth()->user()->tenant_id;
            }
        });
    }
}
```

### Spatie Package Trait Pattern
Spatie packages typically combine a boot hook with runtime methods:
```php
trait HasRoles
{
    // Boot hook registers the relationship
    public static function bootHasRoles()
    {
        static::deleting(function ($model) {
            $model->roles()->detach();
        });
    }

    // Runtime methods
    public function roles()
    {
        return $this->morphToMany(Role::class, 'model', 'model_has_roles');
    }

    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }
}
```

---

## Architectural Decisions

### Decision: Trait vs. Base Class Inheritance
- **Traits** are composed per-model; a model can use multiple traits without diamond-problem complications. Best for cross-cutting concerns (audit, media, permissions).
- **Base class inheritance** bundles multiple behaviours together. Best for shared infrastructure (connection config, default casts, serialisation format).
- **Tradeoff:** Traits are harder to debug (linearisation order matters) but more flexible. Prefer traits for features, base classes for infrastructure.

### Decision: Boot Hooks vs. Explicit Registration
- Boot hooks are automatic — any model that `use`s the trait gets the behaviour. This is the Spatie approach.
- Explicit registration (e.g., calling `Model::observe()` in a service provider) is more visible but requires manual setup per model.
- **Tradeoff:** Boot hooks are "magic" (less discoverable) but reduce boilerplate. Use boot hooks for package traits; prefer explicit registration for application-specific observers.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Traits enable horizontal behaviour reuse | Trait linearisation order can cause subtle conflicts | Document trait order requirements in team style guide |
| Boot/initialize hooks are automatic | Method name misspellings silently skip hooks | Use trait unit tests that verify boot/initialize execution |
| Spatie conventions are widely recognised | Third-party traits may conflict with each other | Test trait combinations in isolation |
| Composable: add behaviour per-model | Too many traits obscure model's core responsibility | Limit to 3-4 traits per model; consider refactoring |

---

## Performance Considerations

- **`class_uses_recursive()`** is called on every model instantiation via `initializeTraits()`. It uses reflection to walk the inheritance chain. This is ~0.01ms per call for simple hierarchies, but can add up in batch processing (10,000 model instances = ~100ms overhead).
- **Boot methods** are called once per class per request (via `bootTraits()`). The performance cost is negligible.
- **Cache the trait list** in hot code paths by storing `class_uses_recursive(static::class)` in a static variable.
- **Third-party trait boot methods** may register event listeners (e.g., `created`, `deleting`). Each listener adds closure overhead to the event dispatcher. Profile trait-heavy models if they are created/updated frequently.

---

## Production Considerations

- **Trait order matters** — If two traits both define a `created` event listener, the boot method execution order determines which registers first. Event listeners are called in FIFO order, so the first trait's listener runs first.
- **Trait properties may conflict** — If two traits define a property with the same name, PHP emits a fatal error. Prefix trait properties with the trait name or a unique abbreviation (e.g., `$auditLogEntries` instead of `$entries`).
- **Serialize/Unserialize compatibility** — Traits that add non-serializable properties (Closures, resources, circular references) break queue jobs. Ensure trait properties are serializable or implement `__serialize()` / `__unserialize()`.
- **Version pinning for package traits** — Spatie and other package authors occasionally rename boot methods or change trait initialisation. Pin versions in `composer.json` and test trait upgrades in isolation.

---

## Common Mistakes

**Mistake: Misspelling `boot{TraitName}` — silent failure.**
Why it happens: PHP does not enforce that a trait-named method exists. A typo (`bootHasAuditLogs` instead of `bootHasAuditLog`) simply doesn't get called.
Why it's harmful: The trait's intended behaviour (observer registration, scope application) never activates. The trait silently does nothing.
Better approach: Write a test that verifies the trait's boot method was called (e.g., assert that an event listener was registered).

**Mistake: Assuming boot methods are called in `use` statement order for inherited traits.**
Why it happens: Developers add a trait to a child model and expect it to run before or after a parent trait.
Why it's harmful: `class_uses_recursive()` includes parent traits, and the order is not guaranteed across PHP versions.
Better approach: Use `insteadof` for explicit ordering, or refactor to avoid order-dependent trait behaviour.

**Mistake: Defining the same event listener in two traits and expecting both to run.**
Why it happens: Two independent traits both register a `created` listener.
Why it's harmful: Both listeners run (FIFO order), but the second listener may operate on state modified by the first. Execution order depends on trait declaration order.
Better approach: If listeners are order-dependent, centralise them in a model's `boot()` method instead of distributing across traits.

**Mistake: Using trait properties without unique namespacing.**
Why it happens: Two traits define `private $cache` independently.
Why it's harmful: PHP raises a fatal error for property name collisions between traits.
Better approach: Prefix all trait properties (e.g., `$mediaCache`, `$rolesCache`) or use a single `$traitState = []` associative array keyed by trait name.

**Mistake: Overriding a trait's method without `insteadof` or `as`.**
Why it happens: A model uses two traits that both define `registerScopes()`. The model overrides the method itself.
Why it's harmful: Only the model's method is called; both trait methods are silently ignored.
Better approach: Use `use TraitA::registerScopes insteadof TraitB;` or call parent trait methods explicitly.

---

## Failure Modes

1. **Silent Boot Failure** — A misspelled `boot{TraitName}` method causes the trait to never initialise. All trait behaviour (scopes, observers) is absent. Mitigation: unit-test trait boot execution with a spy assertion.
2. **Trait Linearisation Conflict** — Two traits from different packages both define `bootHasRoles()`. The model includes both. One trait's boot method overwrites the other. Mitigation: use `insteadof` or alias to resolve; audit all third-party trait method names before combining.
3. **Initialize Exception Cascade** — A trait's `initialize{TraitName}` method throws an exception. Because this runs in the constructor, model instantiation fails. Mitigation: keep initialize methods simple; defer complex setup to lazy initialisation.
4. **Serialization Breakage** — A trait adds a non-serializable property (e.g., a Closure caching layer). Queue jobs that serialise the model fail. Mitigation: implement `__serialize()` / `__unserialize()` on the model or trait.

---

## Ecosystem Usage

- **Spatie Laravel Media Library** — The `HasMedia` trait uses `bootHasMedia()` to register `deleting` and `saving` event listeners. The `initializeHasMedia()` method sets default collection names.
- **Spatie Laravel Permission** — The `HasRoles` trait uses `bootHasRoles()` to cascade-delete pivot records on model deletion. The `HasPermissions` trait follows the same pattern.
- **Laravel Scout (TNTSearch / Meilisearch drivers)** — The `Searchable` trait uses `bootSearchable()` to register `created`, `updated`, and `deleted` event listeners that sync the search index.
- **Laravel's built-in `SoftDeletes` trait** — Uses `bootSoftDeletes()` to add a global scope and register `deleting` / `restoring` observers. The `initializeSoftDeletes()` method sets the default `deleted_at` value to `null`.

---

## Related Knowledge Units
### Prerequisites
- **Base Model Class** — Understanding the boot/initialize lifecycle
- **PHP Traits** — Trait syntax, `use`, `insteadof`, `as`, property conflict rules

### Related Topics
- **Attribute Registration** — Alternative to trait boot methods for observer/scope registration
- **Event Lifecycle** — What happens in `creating`, `created`, `saving`, `saved` hooks
- **Global Scopes** — How traits register scopes via boot methods

### Advanced Follow-up Topics
- **Trait-Oriented Programming** — Design patterns for large-scale trait decomposition (trait interfaces, trait contracts, trait factories)
- **Third-Party Trait Audit** — Evaluating package traits for conflict risk, serialisation safety, and performance impact

---

## Research Notes
### Source Analysis
The boot/initialize trait convention is implemented in `Illuminate\Database\Eloquent\Concerns\HasAttributes` (for `initializeTraits()`) and directly in `Model::boot()` (for `bootTraits()`). The `class_uses_recursive()` helper is defined in `Illuminate\Support\helpers.php` and walks the class inheritance tree using `class_parents()` and `class_uses()`.

### Key Insight
The boot/initialize convention is elegant because it doesn't require any interface or abstract method — it's purely convention-based. However, this also means there is no PHP-level enforcement. A misspelled method name silently fails. This design choice prioritises developer convenience (no interfaces to implement) over compile-time safety.

### Version-Specific Notes
- Laravel 8.x: `initializeTraits()` moved from `Model` to `HasAttributes` concern for better separation.
- Laravel 9.x: No changes to the trait initialisation mechanism.
- Laravel 10.x: No changes to the trait initialisation mechanism.
- Laravel 11.x: The boot/initialize convention remains unchanged across all modern Laravel versions. No deprecation timeline.
