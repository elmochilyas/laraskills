# Factory Definition Rules

## Rule 1: Return Only an Attribute Array from definition()
---
## Category
Architecture
---
## Rule
Always return a plain associative array mapping column names to values from `definition()`. Do not create models, dispatch events, or perform I/O.
---
## Reason
`definition()` is called by `make()`, `create()`, and `raw()`. Side effects in `definition()` execute in all three contexts, causing phantom records during `make()` and attribute-only `raw()` calls. A pure `definition()` guarantees that `raw()` returns a predictable array without database side effects.
---
## Bad Example
```php
public function definition(): array
{
    $team = Team::factory()->create(); // DB write during definition
    return ['name' => fake()->name(), 'team_id' => $team->id];
}
```
---
## Good Example
```php
public function definition(): array
{
    return ['name' => fake()->name()];
}
```
---
## Exceptions
No common exceptions. All side effects belong in `configure()` callbacks.
---
## Consequences Of Violation
Reliability: `make()` writes to the database unexpectedly. Testing: `raw()` triggers unintended side effects.
---

## Rule 2: Use fake() for All Variable Attribute Values
---
## Category
Testing
---
## Rule
Use `fake()` (the Faker generator) to produce realistic, variable values for all non-deterministic model attributes in `definition()`.
---
## Reason
Fixed or hard-coded attribute values produce identical data for every model instance, which fails to surface validation issues, uniqueness constraints, and UI rendering edge cases. Faker-generated data validates that the application handles realistic input.
---
## Bad Example
```php
public function definition(): array
{
    return [
        'name' => 'John Doe',   // Same name for every user
        'email' => 'john@example.com', // Duplicate email for every user
    ];
}
```
---
## Good Example
```php
public function definition(): array
{
    return [
        'name' => fake()->name(),
        'email' => fake()->unique()->safeEmail(),
    ];
}
```
---
## Exceptions
When an attribute must always be a specific value for the model to be valid (e.g., `'type' => 'user'` for a single-type model). Use a factory state to override for variations.
---
## Consequences Of Violation
Testing: uniqueness constraint violations on repeated creation. Reliability: UI bugs with long names, special characters, or edge-case inputs go undetected.
---

## Rule 3: Use fake()->unique() for Unique Constraint Columns
---
## Category
Reliability
---
## Rule
Apply `fake()->unique()` on any factory attribute that has a unique database constraint.
---
## Reason
Without `unique()`, Faker can produce duplicate values that violate database uniqueness constraints when creating multiple models. `fake()->unique()` tracks generated values and resamples until a unique value is produced.
---
## Bad Example
```php
public function definition(): array
{
    return [
        'email' => fake()->safeEmail(), // May produce duplicates
        'slug' => fake()->slug(),
    ];
}
```
---
## Good Example
```php
public function definition(): array
{
    return [
        'email' => fake()->unique()->safeEmail(),
        'slug' => fake()->unique()->slug(),
    ];
}
```
---
## Exceptions
When creating models singly with explicit email/slug values at the call site. The `unique()` guard is harmless and remains as a safety net.
---
## Consequences Of Violation
Reliability: `Integrity constraint violation` exceptions during batch creation. Testing: flaky tests that fail only when Faker produces a collision.
---

## Rule 4: Always Add HasFactory Trait to the Model
---
## Category
Framework Usage
---
## Rule
Always add `use HasFactory` to any Eloquent model that needs a factory.
---
## Reason
Without the trait, `Model::factory()` does not exist, and the model cannot be instantiated via the factory system. The trait connects the model class to its factory class through convention (namespace and naming).
---
## Bad Example
```php
class User extends Authenticatable
{
    // Missing HasFactory trait
}
```
---
## Good Example
```php
class User extends Authenticatable
{
    use HasFactory;
}
```
---
## Exceptions
When the model is intentionally created without a factory (simple pivot models, read-only models). Document why.
---
## Consequences Of Violation
Reliability: `Call to undefined method Model::factory()` error at runtime.
---

## Rule 5: Set Sensible "Happy Path" Defaults in definition()
---
## Category
Testing
---
## Rule
Configure the default factory values to produce a valid, "happy path" model that passes all validation without overrides.
---
## Reason
Tests and seeders should not need to override attributes just to get a valid model. If the default factory produces an invalid model, every consumer of the factory must know which attributes to override, wasting time and spreading knowledge of valid state across the codebase.
---
## Bad Example
```php
public function definition(): array
{
    return [
        'name' => fake()->name(),
        'email' => '', // Empty email — every test must override
    ];
}
```
---
## Good Example
```php
public function definition(): array
{
    return [
        'name' => fake()->name(),
        'email' => fake()->unique()->safeEmail(),
    ];
}
```
---
## Exceptions
When no sensible default exists (e.g., a polymorphic `type` that varies per usage). Use a factory state set as the default.
---
## Consequences Of Violation
Testing: every test file duplicates the same attribute overrides. Maintainability: changing valid state requires updating dozens of test files.
---

## Rule 6: Override $model Only When Convention Fails
---
## Category
Code Organization
---
## Rule
Only set the `$model` property on the factory when the model class cannot be resolved by convention (different namespace or non-standard class name).
---
## Reason
Laravel resolves the model class from the factory's name and location by convention. Adding `$model` manually duplicates information and creates a maintenance point that can drift from the actual model class.
---
## Bad Example
```php
class UserFactory extends Factory
{
    protected $model = User::class; // Unnecessary — convention resolves it
}
```
---
## Good Example
```php
class UserFactory extends Factory
{
    // No $model needed — Convention resolves App\Models\User
}
```
---
## Exceptions
When the model is in a non-standard namespace (e.g., `Domain\User\Models\User`) that differs from the factory location convention.
---
## Consequences Of Violation
Maintainability: stale `$model` reference silently resolves to the wrong class after a refactor.
---

## Rule 7: Use make() When Persistence Is Not Required
---
## Category
Performance
---
## Rule
Prefer `Model::factory()->make()` over `create()` when the test does not need the record to exist in the database.
---
## Reason
`create()` fires model events, runs observers, and performs a database insert — all significant overhead for tests that only inspect attributes or validate in-memory state. `make()` instantiates the model without touching the database.
---
## Bad Example
```php
public function test_user_has_default_role()
{
    $user = User::factory()->create(); // DB write, events, observers — unnecessary
    $this->assertEquals('subscriber', $user->role);
}
```
---
## Good Example
```php
public function test_user_has_default_role()
{
    $user = User::factory()->make(); // In-memory only
    $this->assertEquals('subscriber', $user->role);
}
```
---
## Exceptions
When the test logic depends on a database operation (query scopes, relationships, `save()`). Always use `create()` when the model must be persisted.
---
## Consequences Of Violation
Performance: test suite runs slower due to unnecessary database operations. Testing: observers and events fire for tests that don't need them.
---

## Rule 8: Use raw() for Bulk Attribute Arrays Without Hydration
---
## Category
Performance
---
## Rule
Use `Model::factory()->raw()` when you need arrays of attributes for bulk inserts without Eloquent hydration overhead.
---
## Reason
`create()` hydrates full Eloquent models and fires events. For thousands of records, this is significantly slower than `raw()` + `DB::table()->insert()`, which bypasses Eloquent entirely.
---
## Bad Example
```php
$users = User::factory()->count(1000)->create(); // Hydrates 1000 models
```
---
## Good Example
```php
$data = User::factory()->count(1000)->raw(); // Returns arrays
DB::table('users')->insert($data);           // Single bulk insert
```
---
## Exceptions
When the models need events or observers to fire. Use `create()` and accept the performance trade-off.
---
## Consequences Of Violation
Performance: seeding takes 5-10x longer than necessary for bulk data.
---
