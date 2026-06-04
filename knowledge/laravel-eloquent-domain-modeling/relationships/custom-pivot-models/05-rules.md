# Custom Pivot Models Rules

## Rule: CustomPivot-Using-Both-Sides
---
## Category
Reliability
---
## Rule
Register `->using()` on both sides of a `BelongsToMany` relationship when using a custom pivot model.
---
## Reason
Registering the custom pivot on only one side causes inconsistent pivot model hydration. Depending on which side accesses the relationship, the pivot may or may not use the custom class.
---
## Bad Example
```php
class User extends Model
{
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class)->using(Membership::class);
    }
}
class Team extends Model
{
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
        // No ->using() — Membership class not used from this side
    }
}
```
---
## Good Example
```php
class Team extends Model
{
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->using(Membership::class);
    }
}
```
---
## Exceptions
When the relationship is intentionally one-directional.
---
## Consequences Of Violation
Inconsistent pivot behavior, missing methods, subtle bugs depending on access direction.

## Rule: CustomPivot-Extend-MorphPivot-For-Polymorphic
---
## Category
Reliability
---
## Rule
Extend `MorphPivot` (not `Pivot`) when creating custom pivot models for polymorphic many-to-many relationships.
---
## Reason
`MorphPivot` handles the type constraint on write operations. Extending `Pivot` instead causes `delete()` and `save()` to ignore the morph type, potentially corrupting data.
---
## Bad Example
```php
class TaggablePivot extends Pivot // Wrong — should extend MorphPivot
{
    //
}
```
---
## Good Example
```php
use Illuminate\Database\Eloquent\Relations\MorphPivot;

class TaggablePivot extends MorphPivot
{
    protected $casts = [
        'created_at' => 'datetime',
    ];
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Data corruption on write operations, type constraint bypass.

## Rule: CustomPivot-Not-For-FK-Only
---
## Category
Design
---
## Rule
Do not create a custom pivot model for simple pivot tables that only have two foreign keys and no extra columns.
---
## Reason
Custom pivot models add unnecessary class overhead. The default `Pivot` class is sufficient for FK-only pivot tables.
---
## Bad Example
```php
// Pivot table has only user_id and role_id — no extra columns
class RoleUser extends Pivot {} // Unnecessary class
```
---
## Good Example
```php
// No custom pivot — default Pivot class is used
```
---
## Exceptions
When the pivot needs methods added for future extensibility, even without current extra columns.
---
## Consequences Of Violation
Unnecessary file count, maintenance overhead, no benefit.

## Rule: CustomPivot-Event-Awareness
---
## Category
Reliability
---
## Rule
Do not rely on custom pivot model observers or events to fire during `attach()`/`detach()` — they do not.
---
## Reason
`attach()` and `detach()` operate at the query builder level and do not call `save()` on pivot models. Pivot model events only fire when explicitly calling `$pivot->save()`.
---
## Bad Example
```php
// MembershipObserver::saved — never fires on attach()
$user->teams()->attach($teamId);
```
---
## Good Example
```php
// Use relationship pivot events instead
Event::listen(\Illuminate\Database\Events\Pivot\Attached::class, function ($event) {
    //
});

// Or use explicit save for model events
$pivot = $user->teams->first()->pivot;
$pivot->expires_at = now();
$pivot->save(); // This fires model events
```
---
## Exceptions
None.
---
## Consequences Of Violation
Missing side effects, audit log gaps, broken expectations.

## Rule: CustomPivot-Config-Incrementing
---
## Category
Reliability
---
## Rule
Explicitly configure `$incrementing` on the custom pivot model based on whether it has an auto-increment primary key.
---
## Reason
The default `Pivot` class has `$incrementing = false`, assuming a composite primary key. If the pivot has its own auto-increment `id`, `$incrementing` must be set to `true` or save operations fail.
---
## Bad Example
```php
class Membership extends Pivot
{
    // $incrementing defaults to false — save fails if pivot has auto-increment id
}
```
---
## Good Example
```php
class Membership extends Pivot
{
    public $incrementing = true;
}
```
---
## Exceptions
When the pivot uses a composite primary key (the default convention).
---
## Consequences Of Violation
Save operation failures, unexpected database errors.

## Rule: CustomPivot-Boot-Parent
---
## Category
Reliability
---
## Rule
Always call `parent::boot()` when overriding the `boot()` method in a custom pivot model.
---
## Reason
Traits on pivot models (like `HasTimestamps`, `SoftDeletes`) initialize in the `boot()` method. Skipping `parent::boot()` prevents trait initialization.
---
## Bad Example
```php
class Membership extends Pivot
{
    public static function boot(): void
    {
        // parent::boot() not called — traits don't initialize
        static::creating(fn ($pivot) => ...);
    }
}
```
---
## Good Example
```php
class Membership extends Pivot
{
    public static function boot(): void
    {
        parent::boot();
        static::creating(fn ($pivot) => ...);
    }
}
```
---
## Exceptions
When the pivot model uses no traits and has no inherited boot logic.
---
## Consequences Of Violation
Silent trait failures, missing timestamps, unexpected behavior.

## Rule: CustomPivot-Appends-Performance
---
## Category
Performance
---
## Rule
Monitor `$appends` on custom pivot models — each appended accessor runs during serialization and adds overhead.
---
## Reason
`$appends` properties are computed on every serialization. Expensive accessors on pivot models with large collections multiply serialization time significantly.
---
## Bad Example
```php
class Membership extends Pivot
{
    protected $appends = ['calculated_value'];

    public function getCalculatedValueAttribute(): string
    {
        // Expensive computation runs on every serialization
        return $this->computeExpensiveValue();
    }
}
```
---
## Good Example
```php
class Membership extends Pivot
{
    // Only append when needed — lazy computation
    public function getCalculatedValueAttribute(): string
    {
        return $this->computeExpensiveValue();
    }
}
```
---
## Exceptions
When appended accessors are cheap (simple attribute formatting).
---
## Consequences Of Violation
Slow API responses, increased CPU usage, serialization bottlenecks.

## Rule: CustomPivot-PHPDoc-Annotations
---
## Category
Maintainability
---
## Rule
Add PHPDoc `@property` annotations for pivot columns on the main model for IDE autocompletion.
---
## Reason
Pivot columns accessed as `$model->pivot->column` are dynamic and invisible to static analysis. PHPDoc annotations provide IDE support and catch typos early.
---
## Bad Example
```php
// No PHPDoc — IDE shows no autocomplete for pivot attributes
$model->pivot->expires_at;
```
---
## Good Example
```php
/**
 * @property-read Membership $pivot
 */
class User extends Model
{
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class)
            ->using(Membership::class)
            ->withPivot('expires_at');
    }
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Reduced developer productivity, potential typos in pivot access.
