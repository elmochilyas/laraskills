# Initialize Trait Convention Rules

## Rule 1: Use `initialize{TraitName}()` for Per-Instance Defaults — Not `boot{TraitName}()`
---
## Category
Design
---
## Rule
Set default attribute values, cast definitions, and instance state in `initialize{TraitName}()`, not in `boot{TraitName}()`.
---
## Reason
`boot{TraitName}()` executes once per class per request (static). `initialize{TraitName}()` executes once per new model instance during construction. Per-instance state (default values, casts) must be set in the initialize method to apply to every new model.
---
## Bad Example
```php
trait HasUuid
{
    protected static function bootHasUuid(): void
    {
        // Runs once per class — not per instance
        static::creating(function ($model) {
            $model->uuid ??= (string) Str::uuid();
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
The default depends on data only available at persistence time (e.g., timestamps that must match the database clock).
---
## Consequences Of Violation
Unnecessary event listener registration; instance defaults not set until persistence; harder to test model state before save.

---

## Rule 2: Check `isset()` Before Modifying Casts in `initialize{TraitName}()`
---
## Category
Maintainability
---
## Rule
Use `isset($this->casts['column'])` before setting a cast inside `initialize{TraitName}()` to avoid overwriting explicit model-level cast definitions.
---
## Reason
The model may define a more specific cast for the same column. `initialize{TraitName}()` should provide a sensible default, but should not silently override what the model explicitly declared. Checking `isset()` respects the model's choices.
---
## Bad Example
```php
trait HasUuid
{
    public function initializeHasUuid(): void
    {
        $this->casts['uuid'] = 'string'; // Overrides model's explicit cast
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
        if (! isset($this->casts['uuid'])) {
            $this->casts['uuid'] = 'string'; // Only sets if model hasn't defined it
        }
    }
}
```
---
## Exceptions
The trait's cast is the authoritative definition and must always apply (e.g., a trait that manages its own column types).
---
## Consequences Of Violation
Model-defined casts silently overwritten by trait; unexpected type coercion; bugs that appear only when the model and trait disagree on cast type.

---

## Rule 3: Keep `initialize{TraitName}()` Methods Fast — No Database Queries
---
## Category
Performance
---
## Rule
Never perform database queries, API calls, or file I/O inside `initialize{TraitName}()` methods.
---
## Reason
`initialize{TraitName}()` runs on every new model instance construction. If 1,000 models are created via a factory, the initialize method executes 1,000 times. Any I/O multiplies proportionally, causing massive performance degradation.
---
## Bad Example
```php
trait HasDefaultTeam
{
    public function initializeHasDefaultTeam(): void
    {
        $this->team_id = Team::first()->id; // Query runs on every new model
    }
}
```
---
## Good Example
```php
trait HasDefaultTeam
{
    public function initializeHasDefaultTeam(): void
    {
        $this->team_id ??= config('app.default_team_id'); // Config access — fast
    }
}
```
---
## Exceptions
No common exceptions — initialize methods must be I/O-free.
---
## Consequences Of Violation
Massive performance overhead when creating models in batches; N+1-style query explosion in factories and seeders; request timeouts.

---

## Rule 4: Do Not Access Relationships in `initialize{TraitName}()`
---
## Category
Design
---
## Rule
Do not call relationship methods or access related models inside `initialize{TraitName}()`.
---
## Reason
At instance construction time, the model has not been persisted and has no ID. Relationship methods either return empty collections (for un-persisted models) or trigger unexpected lazy loads. Relationship setup belongs in event listeners or lazy initializers.
---
## Bad Example
```php
trait HasPrimaryTeam
{
    public function initializeHasPrimaryTeam(): void
    {
        $this->teams()->attach(config('app.default_team_id')); // No ID yet — attaches to null
    }
}
```
---
## Good Example
```php
trait HasPrimaryTeam
{
    protected static function bootHasPrimaryTeam(): void
    {
        static::created(function ($model) {
            $model->teams()->attach(config('app.default_team_id')); // After persistence
        });
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Attaching to a non-existent model ID; silent failures; orphaned pivot records; confusing runtime behavior.

---

## Rule 5: Match `initialize{TraitName}()` Method Name Exactly to the Trait Name
---
## Category
Framework Usage
---
## Rule
Name the initialize method `initialize{TraitName}` where `{TraitName}` matches the trait's unqualified class name exactly (including casing).
---
## Reason
Eloquent discovers initialize methods via string matching on the trait name. Any mismatch silently prevents the method from executing. The naming convention is strict and case-sensitive.
---
## Bad Example
```php
trait HasUuid
{
    public function initializeHasUuid(): void {} // Correct
    public function initializeUuid(): void {}     // WRONG — not discovered
    public function initHasUuid(): void {}         // WRONG — not discovered
}
```
---
## Good Example
```php
trait HasUuid
{
    public function initializeHasUuid(): void {} // Exact match
}
```
---
## Exceptions
No common exceptions — the naming convention is strict.
---
## Consequences Of Violation
Initialize method silently never runs; default values not set; casts not registered; trait appears broken with no error message.

---

## Rule 6: Declare `initialize{TraitName}()` as `public` to Match Eloquent's Convention
---
## Category
Framework Usage
---
## Rule
Always declare initialize methods as `public` (not `protected` or `private`).
---
## Reason
Eloquent's trait initialization mechanism calls these methods from outside the class. While PHP allows calling `protected` methods via reflection, making them `public` explicitly signals that this method is part of the trait's lifecycle contract.
---
## Bad Example
```php
trait HasUuid
{
    protected function initializeHasUuid(): void // Works via reflection — but unconventional
    {
        // ...
    }
}
```
---
## Good Example
```php
trait HasUuid
{
    public function initializeHasUuid(): void // Explicitly part of the lifecycle
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
Reflection-based invocation works but violates framework convention; IDEs may flag as unused private/protected method; inconsistent with Laravel's own trait convention.

---

## Rule 7: Do Not Throw Exceptions in `initialize{TraitName}()` for Configuration Errors
---
## Category
Reliability
---
## Rule
Do not throw exceptions in `initialize{TraitName}()` for missing configuration or invalid state — set a safe default or log a warning instead.
---
## Reason
`initialize{TraitName}()` runs during `__construct()`. An exception here prevents the model from being instantiated at all, breaking factories, tests, and any code that creates model instances. Defer validation to persistence time where failure can be handled.
---
## Bad Example
```php
trait HasDefaultTeam
{
    public function initializeHasDefaultTeam(): void
    {
        if (! config('app.default_team_id')) {
            throw new \RuntimeException('Default team not configured'); // Breaks instantiation
        }
        $this->team_id = config('app.default_team_id');
    }
}
```
---
## Good Example
```php
trait HasDefaultTeam
{
    public function initializeHasDefaultTeam(): void
    {
        $this->team_id ??= config('app.default_team_id');
    }

    protected static function bootHasDefaultTeam(): void
    {
        static::saving(function ($model) {
            if (! $model->team_id) {
                throw new \RuntimeException('Team ID is required');
            }
        });
    }
}
```
---
## Exceptions
The missing configuration is a fatal system error and the application must not proceed (e.g., missing encryption key on a trait that encrypts data).
---
## Consequences Of Violation
Model cannot be instantiated; factory breaks; test suite fails; seeder crashes; all for a configuration error that could be deferred.

---

## Rule 8: Do Not Use `initialize{TraitName}()` for Logic That Should Run on Every Access
---
## Category
Design
---
## Rule
Use accessors (getters) instead of `initialize{TraitName}()` for computed or derived values that rely on other model attributes.
---
## Reason
`initialize{TraitName}()` runs once during construction. If the computed value depends on attributes that change after construction, the initialize method produces stale data. Accessors compute on every access and always reflect current state.
---
## Bad Example
```php
trait HasFullName
{
    public function initializeHasFullName(): void
    {
        $this->full_name = $this->first_name.' '.$this->last_name; // Stale if names change
    }
}
```
---
## Good Example
```php
trait HasFullName
{
    public function getFullNameAttribute(): string
    {
        return $this->first_name.' '.$this->last_name; // Computed on every access
    }
}
```
---
## Exceptions
The value is truly static after construction (e.g., a UUID that must not change).
---
## Consequences Of Violation
Stale computed values; inconsistencies when model attributes change after construction; subtle bugs that only appear after attribute updates.
