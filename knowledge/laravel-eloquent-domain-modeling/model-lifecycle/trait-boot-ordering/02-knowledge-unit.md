# Trait Boot Ordering

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
When a model uses multiple traits that each define `boot{TraitName}()` methods, the execution order follows PHP's trait composition and resolution order. This ordering determines which listener is registered first, which global scope is applied first, and which trait's initialization takes precedence. Understanding and controlling boot ordering is essential for preventing subtle bugs when traits interact or conflict.

## Core Concepts
- **Composition order matters:** Traits listed earlier in the `use` statement boot first. `boot{TraitName}()` for `TraitA` executes before `TraitB` if `use TraitA, TraitB;`.
- **Method conflict resolution:** If two traits define the same boot method name (e.g., both define `bootSluggable()`), PHP's trait conflict resolution rules apply — the model must explicitly resolve the conflict with `insteadof` or `as`.
- **Inheritance and parent traits:** `classUsesRecursive()` returns traits used by the class and all its parents. Parent class traits boot before child class traits.
- **No explicit dependency management:** Laravel provides no built-in mechanism to declare trait boot ordering dependencies. Order is purely determined by composition and reflection.

## Mental Models
- **Left-to-right ordering:** Think of the `use` statement as left-to-right execution order. The first trait listed boots first. If trait boot methods register listeners, the first trait's listeners fire first.
- **Stack of traits:** Each model has a stack of trait boot methods. The stack is built recursively (parent traits first, then child traits) and left-to-right. Each method executes in order.
- **No dependency injection between traits:** Traits cannot declare that boot TraitA must complete before boot TraitB. If order matters, the model class must handle it explicitly.

## Internal Mechanics
- `Model::bootTraits()` calls `classUsesRecursive()` which returns traits in a specific order:
  1. Parent class traits (recursively, in composition order)
  2. Current class traits (in composition order from `use` statement)
- `classUsesRecursive()` is defined in `Illuminate\Support\Traits\ReflectsClosures` (or similar helper) and uses `class_parents()` combined with `class_uses()`.
- For each trait returned, `bootTraits()` checks for `boot{TraitName}` and calls it via `forward_static_call()`.
- The PHP function `class_uses()` returns traits in the order they are declared in the `use` statement. However, the exact order depends on PHP's internal trait resolution, which is deterministic but not guaranteed by the PHP documentation.

```php
// classUsesRecursive simplified:
function classUsesRecursive($class): array
{
    $traits = [];
    
    foreach (array_merge([$class => $class], class_parents($class)) as $cls) {
        $traits += class_uses($cls);
    }
    
    return $traits;
}
```

Note: `+` operator preserves the first occurrence — parent traits are listed before child traits.

- The `class_uses()` function does NOT return traits used by parent classes. That requires `class_parents()` recursion.

## Patterns
- **Order-independent trait design:** Design traits so that boot ordering does not matter. Avoid registering conflicting listeners or scopes in boot methods of traits that may be composed together.
- **Explicit ordering documentation:** Document the expected boot order for traits that have dependencies:

```php
/**
 * Uses:
 * 1. Sluggable (must boot first to generate slug)
 * 2. Translatable (uses slug from Sluggable)
 */
use Sluggable, Translatable;
```

- **Model-level boot method as coordinator:** When trait boot ordering creates conflicts, override `boot()` in the model to explicitly order setup:

```php
protected static function boot(): void
{
    // Manually boot traits in required order
    static::bootSluggable();
    static::bootTranslatable();
    
    // No parent::boot() — we handled it manually
}
```

- **Guard flag for order-dependent listeners:** If two traits register `creating` listeners, use a guard flag to ensure the second listener can detect that the first already ran:

```php
trait TraitA
{
    public static function bootTraitA(): void
    {
        static::creating(function ($model) {
            $model->a_processed = true;
        });
    }
}

trait TraitB
{
    public static function bootTraitB(): void
    {
        static::creating(function ($model) {
            if (! $model->a_processed) {
                // TraitA hasn't run yet — this ordering is wrong
            }
        });
    }
}
```

## Architectural Decisions
- **Why no dependency declaration?** — PHP traits have no built-in dependency mechanism. Laravel chose not to invent one, keeping the boot convention simple and predictable. Complex dependency management is a sign that traits are being overused.
- **Why `+` operator (first-wins) in trait merging?** — The `+` operator preserves the first occurrence of each trait. This means if a parent class and child class both use the same trait, only the parent's boot method runs (because it appears first in the recursive merge). This is usually correct — a trait should not register its listeners twice.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Deterministic order based on composition | Order is invisible in the trait code itself | Document ordering requirements at the model `use` statement |
| Simple left-to-right model-level control | No trait-level dependency declaration | Refactor into service classes if boot ordering becomes complex |
| Parent-child inheritance is predictable | Mixed with `HasEvents` trait, order affects event listener execution | Test event listener ordering explicitly |

## Performance Considerations
- **`classUsesRecursive()` overhead:** The function traverses the entire class hierarchy. For deep inheritance chains, this adds marginal boot-time overhead.
- **Listener registration order:** Boot order determines listener registration order. This affects event dispatch order and can impact performance if certain listeners should run early (validation before logging).

## Production Considerations
- **Debugging boot order:** Log the boot order of traits in development. This helps diagnose order-dependent bugs.
- **Trait composition audit:** Periodically review trait composition in complex models. Too many traits with boot methods is a design smell — consider extracting into separate classes.
- **Testing boot order:** Write tests that verify trait boot methods execute in the expected order, especially when listeners interact.

## Common Mistakes
- **Assuming alphabetical order:** Trait boot methods do NOT execute alphabetically. They execute in `use` statement order, left-to-right.
- **Assuming child traits boot after parent traits:** `classUsesRecursive()` returns parent traits first. Child traits boot after parent traits.
- **Not considering trait reuse:** If a trait uses another trait (via `use` inside the trait), the inner trait's boot method is also discovered. This can lead to unexpected boot method execution.
- **Confusing boot order with event listener order:** Boot order determines when listeners are REGISTERED, not when they EXECUTE. Multiple listeners on the same event execute in registration order, which follows boot order.

## Failure Modes
- **Silent listener overwrite:** Trait A registers a `creating` listener. Trait B also registers a `creating` listener that checks `$model` state that Trait A's listener was supposed to set. If Trait B boots first, Trait A's listener runs second, but Trait B's listener already executed and found uninitialized state.
- **Duplicate global scope registration:** If a trait's boot method registers a global scope, and the trait is used via both parent and child class, the scope is registered twice. The `+` operator prevents duplicate boot method calls, but the scope itself is added twice.
- **Boot method throws before other traits run:** If boot TraitA throws an exception, boot TraitB never executes. Some listeners are registered, some are not. The model is in a partially-initialized state.

## Ecosystem Usage
- **Laravel SoftDeletes + HasFactory:** These two traits are commonly used together. `bootSoftDeletes()` runs before `bootHasFactory()` because `SoftDeletes` is typically listed first. This is usually fine since they register unrelated listeners.
- **Spatie packages:** Packages like `spatie/laravel-translatable` and `spatie/laravel-sluggable` each define boot methods. When used together, the slug is typically generated first (Sluggable), then the translation is set (Translatable). The model must order the `use` statement accordingly.

## Related Knowledge Units

### Prerequisites
- Trait Boot Convention
- PHP Traits

### Related Topics
- Trait Init Convention
- Event Dispatch Order

### Advanced Follow-up Topics
- Trait Composition Design
- Global Scope Registration Order

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Model::bootTraits()` — uses `classUsesRecursive()` which is defined in the `Illuminate\Support` helpers. The order is determined by PHP's `class_uses()` and `class_parents()` functions.
- **Key Insight:** The `+` operator in `classUsesRecursive()` means parent traits take precedence over child traits in the merged array. However, `class_uses()` returns only the traits directly used by the given class — parent class traits are added on top. This ensures parent trait boot methods run first, but only the FIRST occurrence of each trait is used (the `+` operator).
- **Version-Specific Notes:** The boot ordering behavior has been consistent since Laravel 4.x. There have been no significant changes to how `bootTraits()` resolves method order across major Laravel versions.
