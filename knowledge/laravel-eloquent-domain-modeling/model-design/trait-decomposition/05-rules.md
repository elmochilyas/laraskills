# Phase 5: Rules — Trait Decomposition

## Rule: Use `boot{TraitName}` for Event and Scope Registration
---
## Category
Code Organization
---
## Rule
Register model event listeners and global scopes inside a `boot{TraitName}` static method on the trait, following Eloquent's boot trait convention.
---
## Reason
Eloquent automatically calls `boot{TraitName}` once per class during model boot. This isolates lifecycle registration logic in the trait, keeps the model class body clean, and follows the same pattern used by Laravel's own traits (`SoftDeletes`, `HasTimestamps`).
---
## Bad Example
```php
trait Auditable
{
    public static function boot(): void
    {
        parent::boot();
        static::creating(fn ($model) => Log::info('Creating', ['model' => $model]));
        // Overrides parent boot — fragile and non-standard
    }
}
```
---
## Good Example
```php
trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::creating(fn ($model) => Log::info('Creating', ['model' => $model]));
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Fragile `boot()` overrides require manual `parent::boot()` calls and break when multiple traits define `boot()`; conflicts cascade into difficult-to-debug lifecycle issues.
---

## Rule: Use `initialize{TraitName}` for Default Attribute Values
---
## Category
Design
---
## Rule
Set default attribute values for trait-managed columns inside an `initialize{TraitName}` method instead of in the model constructor or in `boot{TraitName}`.
---
## Reason
Eloquent calls `initialize{TraitName}` once per new model instance. This is the correct hook for per-instance defaults. Using `boot{TraitName}` for defaults causes them to be set only once per class load, not per instance.
---
## Bad Example
```php
trait HasStatus
{
    protected static function bootHasStatus(): void
    {
        // Wrong hook — runs once per class load, not per instance:
        static::creating(fn ($model) => $model->status ??= 'pending');
    }
}
```
---
## Good Example
```php
trait HasStatus
{
    public function initializeHasStatus(): void
    {
        if (! isset($this->status)) {
            $this->status = 'pending';
        }
    }
}
```
---
## Exceptions
Defaults that depend on a database query or external service should use the `creating` event instead, since `initialize` runs before the model is saved.
---
## Consequences Of Violation
Defaults set in `boot{TraitName}` apply incorrectly across instances; default values may not be present on new unsaved models.
---

## Rule: Name Traits with `Has`, `InteractsWith`, or `Is` Prefixes
---
## Category
Maintainability
---
## Rule
Prefix every Eloquent model trait name with `Has`, `InteractsWith`, or `Is` to signal that the trait adds capabilities rather than defining a base type.
---
## Reason
Prefix conventions make trait purpose immediately recognizable. `HasRoles`, `InteractsWithMedia`, `IsOwnedByTeam` communicate capability addition without reading the trait body. This mirrors Laravel's own naming and third-party package conventions.
---
## Bad Example
```php
trait Roles {}            // Unclear — is it a base class replacement?
trait MediaAttachment {}  // No prefix — purpose ambiguous
trait TeamScope {}        // Reads like a scope class, not a trait
```
---
## Good Example
```php
trait HasRoles {}
trait InteractsWithMedia {}
trait BelongsToTeam {}
```
---
## Exceptions
Traits extracted for internal code reuse within a single class that do not represent a domain capability may use descriptive names without prefixes.
---
## Consequences Of Violation
Ambiguous naming reduces discoverability; developers must inspect the trait body to understand its purpose; naming inconsistency with Laravel conventions increases cognitive load.
---

## Rule: Keep Traits in `App\Models\Concerns`
---
## Category
Code Organization
---
## Rule
Place all Eloquent model traits in the `App\Models\Concerns` directory with the `App\Models\Concerns` namespace.
---
## Reason
A dedicated directory creates a predictable location for traits. New developers immediately know where to look for shared model behavior, and the namespace matches the domain directory structure.
---
## Bad Example
```php
// Traits scattered across directories:
app/Models/Traits/HasRoles.php
app/Models/HasAudit.php
app/Support/HasSlug.php
```
---
## Good Example
```php
app/Models/Concerns/HasRoles.php
app/Models/Concerns/HasAudit.php
app/Models/Concerns/HasSlug.php
```
---
## Exceptions
Traits that are tightly coupled to a single domain entity may remain in the domain subdirectory alongside the model.
---
## Consequences Of Violation
Traits are scattered across the codebase; developers cannot find existing traits and may reinvent them, increasing duplication.
---

## Rule: Never Use Traits for Single-Model Behavior
---
## Category
Design
---
## Rule
Inline behavior directly into the model class when it is only used by a single model; do not extract it into a trait.
---
## Reason
Traits exist for cross-cutting reuse. Extracting a trait for single-use behavior adds unnecessary indirection — developers must open a separate file to read code that is only ever called from one place.
---
## Bad Example
```php
// trait used by ONE model:
trait HasSpecialDiscount
{
    public function calculateDiscount(): float
    {
        return $this->total * 0.1;
    }
}

class Order extends Model
{
    use HasSpecialDiscount;
    // Could have been a method on Order directly
}
```
---
## Good Example
```php
class Order extends Model
{
    public function calculateDiscount(): float
    {
        return $this->total * 0.1;
    }
}
```
---
## Exceptions
Extract a trait preemptively when the behavior is part of a planned domain abstraction that will be shared by future models.
---
## Consequences Of Violation
Unnecessary indirection increases file count and navigation cost without reuse benefit.
---

## Rule: Document Trait-to-Trait Dependencies Explicitly
---
## Category
Maintainability
---
## Rule
Add a docblock on each trait that lists any other traits it depends on, including whether the dependency is required or optional.
---
## Reason
Traits with implicit dependencies on other traits (e.g., `HasAudit` requires `SoftDeletes`) cause runtime errors when used in isolation. Explicit documentation prevents developers from combining traits in unsupported configurations.
---
## Bad Example
```php
trait HasAudit
{
    protected static function bootHasAudit(): void
    {
        static::deleting(fn ($model) => Log::info('Deleting'));
        // Error if the model does not use SoftDeletes — deleting event may not fire
    }
}
```
---
## Good Example
```php
/**
 * Requires: SoftDeletes
 * Optional: HasBlameable (adds user_id to audit log)
 */
trait HasAudit
{
    protected static function bootHasAudit(): void
    {
        static::deleting(fn ($model) => Log::info('Deleting'));
    }
}
```
---
## Exceptions
Traits with zero dependencies may omit the docblock.
---
## Consequences Of Violation
Runtime errors when traits are combined in unsupported ways; debugging requires stepping through boot order and trait resolution, consuming developer time.
---

## Rule: Resolve Trait Method Conflicts Explicitly
---
## Category
Reliability
---
## Rule
Use `insteadof` and `as` operators explicitly in the model class whenever two traits define methods with the same name, and never rely on declaration order alone to determine which method wins.
---
## Reason
Without explicit conflict resolution, the winning method depends on PHP's class precedence resolution, which is not obvious from reading the model. Explicit `insteadof` makes the resolution decision visible and reviewable.
---
## Bad Example
```php
class Order extends Model
{
    use HasDiscount, HasPromotion;
    // Both define calculateTotal() — winner depends on use order
}
```
---
## Good Example
```php
class Order extends Model
{
    use HasDiscount, HasPromotion {
        HasDiscount::calculateTotal insteadof HasPromotion;
        HasPromotion::calculateTotal as calculatePromotionTotal;
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent method resolution based on `use` ordering; reordering trait usage changes behavior without any visible diff in the use statement.
---

## Rule: Keep Traits Focused on a Single Concern
---
## Category
Design
---
## Rule
Design each trait to encapsulate exactly one cross-cutting concern; do not create monolithic traits that handle multiple unrelated responsibilities.
---
## Reason
Single-concern traits are independently testable, reusable, and removable. A trait that mixes audit logging with slug generation cannot be reused for a model that only needs logging, violating the Single Responsibility Principle.
---
## Bad Example
```php
trait HasAuditAndSlugs
{
    public function initializeHasAuditAndSlugs(): void
    {
        $this->slug ??= Str::slug($this->title);
    }

    protected static function bootHasAuditAndSlugs(): void
    {
        static::created(fn ($m) => Log::info('Created', ['id' => $m->id]));
    }
}
```
---
## Good Example
```php
trait HasSlug
{
    public function initializeHasSlug(): void
    {
        $this->slug ??= Str::slug($this->title);
    }
}

trait HasAudit
{
    protected static function bootHasAudit(): void
    {
        static::created(fn ($m) => Log::info('Created', ['id' => $m->id]));
    }
}
```
---
## Exceptions
Two concerns that are always used together and never independently may be combined, but this should be reviewed when a third use case appears.
---
## Consequences Of Violation
Low trait reuse; monolithic traits force models to accept unwanted behavior; testing requires stubbing unrelated concerns.
---

## Rule: Prefer Observers Over Traits for Complex Event Logic
---
## Category
Design
---
## Rule
Move complex model event logic (multi-step workflows, external service calls, conditional branching) into dedicated observer classes instead of trait `boot` methods.
---
## Reason
Traits are best for small, focused lifecycle hooks. Complex event logic in a trait boot method makes the trait difficult to test in isolation and violates the Single Responsibility Principle. Observers keep event logic in testable, dedicated classes.
---
## Bad Example
```php
trait SynchronizesWithCRM
{
    protected static function bootSynchronizesWithCRM(): void
    {
        static::saved(function ($model) {
            $crm = app(CrmService::class);
            $crm->syncCustomer($model);
            $crm->syncSubscription($model);
            if ($model->status === 'cancelled') {
                $crm->notifyCancellation($model);
            }
        });
    }
}
```
---
## Good Example
```php
class CrmSyncObserver
{
    public function saved(Model $model): void
    {
        app(CrmService::class)->syncCustomer($model);
    }
}

// Used on model:
#[ObservedBy(CrmSyncObserver::class)]
class Order extends Model
{
    //
}
```
---
## Exceptions
Small event hooks (setting a default, logging a single line) may remain in traits for brevity.
---
## Consequences Of Violation
Traits become untestable due to injected service dependencies; complex event logic in traits is harder to debug, configure, and reuse than observer classes.
---

## Rule: Prefer Custom Casts Over Traits for Attribute Transformation
---
## Category
Design
---
## Rule
Implement attribute transformation (serialization, formatting, type coercion) using custom cast classes instead of trait accessors and mutators.
---
## Reason
Custom casts encapsulate transformation logic in a single, testable, and reusable class. Trait-based accessors and mutators scatter transformation logic across multiple traits and cannot be applied dynamically or inherited cleanly.
---
## Bad Example
```php
trait HasMoneyAttributes
{
    public function getTotalCentsAttribute($value): int
    {
        return (int) $value;
    }

    public function setTotalCentsAttribute($value): void
    {
        $this->attributes['total_cents'] = (int) round($value * 100);
    }
}
```
---
## Good Example
```php
class MoneyCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes): int
    {
        return (int) $value;
    }

    public function set($model, string $key, $value, array $attributes): int
    {
        return (int) round($value * 100);
    }
}

// On model:
protected function casts(): array
{
    return ['total_cents' => MoneyCast::class];
}
```
---
## Exceptions
Accessors that depend on multiple attributes (computed properties) must remain as model methods or accessors; casts operate on a single attribute.
---
## Consequences Of Violation
Attribute transformation logic is scattered across traits, harder to test, and cannot be reused across models that do not share the trait.
