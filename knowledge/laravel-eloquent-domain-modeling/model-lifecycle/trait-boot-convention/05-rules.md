# Trait Boot Convention Rules

## Rule 1: Always Use `boot{TraitName}()` for Static Lifecycle Setup, Not the Model's `boot()` Method
---
## Category
Code Organization
---
## Rule
Place one-time static initialization (event listeners, global scopes, macro registrations) in a static `boot{TraitName}()` method within the trait, not in the model's `boot()` method.
---
## Reason
`boot{TraitName}()` is automatically discovered and invoked by Eloquent during model boot. This keeps the trait self-contained — the model does not need to call any setup code. Placing setup in the model's `boot()` duplicates effort when the trait is used on multiple models.
---
## Bad Example
```php
trait Filterable
{
    // No boot method — setup must be done manually in each model
}

class Product extends Model
{
    protected static function boot(): void
    {
        parent::boot();
        static::addGlobalScope(new FilterScope); // Duplicated for every model using Filterable
    }
}
```
---
## Good Example
```php
trait Filterable
{
    protected static function bootFilterable(): void
    {
        static::addGlobalScope(new FilterScope); // Auto-discovered on every model
    }
}
```
---
## Exceptions
The initialization logic requires access to model-specific state that cannot be determined statically.
---
## Consequences Of Violation
Duplicated setup code across all models using the trait; missed setup on new models; trait is not self-contained.

---

## Rule 2: Match `boot{TraitName}()` Method Name Exactly to the Trait Name
---
## Category
Framework Usage
---
## Rule
Name the boot method `boot{TraitName}` where `{TraitName}` matches the trait's unqualified class name exactly (including casing).
---
## Reason
Eloquent uses `get_class($this)` and string matching to discover boot methods. A mismatch in naming or casing silently prevents the method from being discovered — it simply never executes.
---
## Bad Example
```php
trait HasUuid
{
    protected static function bootHasUuid(): void {} // Correct

    protected static function bootUUID(): void {} // WRONG — not discovered
}
```
---
## Good Example
```php
trait HasUuid
{
    protected static function bootHasUuid(): void {} // Exact match
}
```
---
## Exceptions
No common exceptions — the naming convention is strict.
---
## Consequences Of Violation
Boot method silently never runs; event listeners not registered; global scopes not applied; trait appears broken with no error message.

---

## Rule 3: Keep `boot{TraitName}()` Methods Lightweight — No Database Queries
---
## Category
Performance
---
## Rule
Do not perform database queries, API calls, or other I/O operations inside `boot{TraitName}()` methods.
---
## Reason
`boot{TraitName}` executes once per model class per request. If the trait is used on 20 models, the boot method may execute 20 times. I/O operations in boot methods multiply request latency linearly with model count.
---
## Bad Example
```php
trait HasRoles
{
    protected static function bootHasRoles(): void
    {
        $roles = Role::all(); // Database query in boot — every request
        static::addGlobalScope('roles', fn ($query) => $query->whereIn('role_id', $roles->pluck('id')));
    }
}
```
---
## Good Example
```php
trait HasRoles
{
    protected static function bootHasRoles(): void
    {
        static::addGlobalScope('roles', fn ($query) =>
            $query->whereIn('role_id', function ($q) {
                $q->select('id')->from('roles'); // Deferred — runs with query
            })
        );
    }
}
```
---
## Exceptions
Caching the result of an expensive boot-time operation (e.g., loading config once and caching it for the request).
---
## Consequences Of Violation
Increased request latency; N+1-style boot overhead as model count grows; hidden performance bottlenecks.

---

## Rule 4: Use `initialize{TraitName}()` for Instance-Level Defaults, Not `boot{TraitName}()`
---
## Category
Design
---
## Rule
Set default attribute values, cast definitions, and instance state in `initialize{TraitName}()`, not in `boot{TraitName}()`.
---
## Reason
`boot{TraitName}()` runs once per class (static). `initialize{TraitName}()` runs per new instance during construction. Instance state must be set in the initialize method to ensure each new model gets the defaults.
---
## Bad Example
```php
trait HasUuid
{
    protected static function bootHasUuid(): void
    {
        static::creating(function ($model) {
            $model->uuid = (string) Str::uuid(); // Works, but instance method is cleaner
        });
    }
}
```
---
## Good Example
```php
trait HasUuid
{
    public function initializeHasUuid(): void
    {
        $this->casts['uuid'] = 'string';
        if (! $this->uuid) {
            $this->uuid = (string) Str::uuid();
        }
    }
}
```
---
## Exceptions
The default depends on data that is only available at persistence time (use `creating` event in that case).
---
## Consequences Of Violation
Instance defaults set via static boot method require event listeners; less readable; harder to reason about per-instance vs per-class behavior.

---

## Rule 5: Declare `boot{TraitName}()` as `protected static` — Never `public`
---
## Category
Framework Usage
---
## Rule
Always declare boot methods as `protected static` to match Eloquent's expected method signature.
---
## Reason
Eloquent calls boot methods via `call_user_func` internally. While a `public` method works, `protected` correctly signals that this method is an internal lifecycle hook, not part of the trait's public API.
---
## Bad Example
```php
trait Filterable
{
    public static function bootFilterable(): void // Public — exposes as API
    {
        // ...
    }
}
```
---
## Good Example
```php
trait Filterable
{
    protected static function bootFilterable(): void // Protected — lifecycle hook
    {
        // ...
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Boot method appears in IDE autocompletion as a callable method; developer may call it manually, causing duplicate registration; violates framework convention.

---

## Rule 6: Do Not Call `parent::bootTraitName()` Inside `boot{TraitName}()`
---
## Category
Framework Usage
---
## Rule
Never call `parent::bootTraitName()` inside a trait's `boot{TraitName}()` method.
---
## Reason
Traits do not inherit from each other. `parent::bootTraitName()` would call a method on the parent class (the Model), not another trait. Eloquent handles discovering and calling all trait boot methods automatically. Manual calls duplicate execution.
---
## Bad Example
```php
trait HasRoles
{
    protected static function bootHasRoles(): void
    {
        parent::bootHasRoles(); // Calls Model::bootHasRoles() — wrong target
        static::addGlobalScope(new RolesScope);
    }
}
```
---
## Good Example
```php
trait HasRoles
{
    protected static function bootHasRoles(): void
    {
        static::addGlobalScope(new RolesScope); // Eloquent calls all boot methods
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Call to undefined method if `Model` does not define `bootHasRoles`; duplicate scope registration if it does; confusion about trait boot mechanics.

---

## Rule 7: Register Event Listeners Inside `boot{TraitName}()` Using the `static::` Context
---
## Category
Framework Usage
---
## Rule
Use `static::` (not `$this` or `self::`) when registering event listeners inside `boot{TraitName}()` methods.
---
## Reason
`boot{TraitName}` is a static method called during the model's boot process. `$this` is not available. `self::` refers to the trait's class (which cannot be instantiated). `static::` provides late static binding to the actual model class using the trait.
---
## Bad Example
```php
trait Filterable
{
    protected static function bootFilterable(): void
    {
        self::addGlobalScope(new FilterScope); // self:: applies to the trait — error
    }
}
```
---
## Good Example
```php
trait Filterable
{
    protected static function bootFilterable(): void
    {
        static::addGlobalScope(new FilterScope); // static:: resolves to the model class
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Runtime error when `self::` does not resolve to the expected class; global scope not registered; trait appears broken.
