# Factory Sequences Rules

## Rule 1: Use Sequences for Deterministic Test Data
---
## Category
Testing
---
## Rule
Use `sequence()` instead of Faker when test assertions depend on specific attribute distributions across a batch of models.
---
## Reason
Faker produces random values that vary between test runs. A sequence guarantees the exact same values in the exact same order on every execution, making tests deterministic and eliminating flakiness from random data.
---
## Bad Example
```php
// Role distribution is random — test may get 3 admins or 0
User::factory()->count(6)->create([
    'role' => fake()->randomElement(['admin', 'editor', 'viewer']),
]);
```
---
## Good Example
```php
// Deterministic: exactly 2 admins, 2 editors, 2 viewers
User::factory()
    ->count(6)
    ->sequence(
        ['role' => 'admin'],
        ['role' => 'admin'],
        ['role' => 'editor'],
        ['role' => 'editor'],
        ['role' => 'viewer'],
        ['role' => 'viewer'],
    )
    ->create();
```
---
## Exceptions
When the test intentionally validates behavior with random data (e.g., fuzz testing). Use Faker and set a seed for reproducibility.
---
## Consequences Of Violation
Testing: flaky tests that pass or fail non-deterministically. Debugging: failures cannot be reproduced locally.
---

## Rule 2: Use CrossJoinSequence for Exhaustive Combinatorial Coverage
---
## Category
Testing
---
## Rule
Use `CrossJoinSequence` to generate all combinations of values when testing behavior across every possible attribute combination.
---
## Reason
Manually enumerating all combinations via nested `sequence()` calls is error-prone and does not scale. `CrossJoinSequence` computes the Cartesian product automatically, ensuring no combination is missed.
---
## Bad Example
```php
// Manual — misses some combinations, hard to maintain
User::factory()
    ->count(4)
    ->sequence(
        ['status' => 'active', 'plan' => 'free'],
        ['status' => 'active', 'plan' => 'premium'],
        ['status' => 'inactive', 'plan' => 'free'],
    )
    ->create();
```
---
## Good Example
```php
use Illuminate\Database\Eloquent\Factories\CrossJoinSequence;

User::factory()
    ->count(4)
    ->sequence(new CrossJoinSequence(
        ['status' => 'active', 'status' => 'inactive'],
        ['plan' => 'free', 'plan' => 'premium'],
    ))
    ->create();
// Produces: (active,free), (active,premium), (inactive,free), (inactive,premium)
```
---
## Exceptions
When the input arrays are large enough that the Cartesian product would create prohibitively many records (more than 1000). Use sampling instead.
---
## Consequences Of Violation
Testing: untested edge case combinations reach production. Maintainability: manual combination lists grow out of sync with the domain.
---

## Rule 3: Use the Sequence Index for Position-Dependent Logic
---
## Category
Framework Usage
---
## Rule
Use the `$index` parameter in sequence callables when attributes depend on the model's position in the batch.
---
## Reason
The zero-based index enables position-dependent logic (first model gets special treatment, sequential numbers, alternating patterns) without maintaining external counters.
---
## Bad Example
```php
// External counter — brittle, easy to misplace
$i = 0;
User::factory()->count(5)->create()->each(function ($user) use (&$i) {
    $user->update(['priority' => $i++]);
});
```
---
## Good Example
```php
User::factory()
    ->count(5)
    ->sequence(fn ($sequence) => ['priority' => $sequence->index])
    ->create();
```
---
## Exceptions
No common exceptions. The `$sequence->index` parameter captures all position-dependent use cases.
---
## Consequences Of Violation
Maintainability: external counter patterns are error-prone and require manual state management.
---

## Rule 4: Keep Sequence Definitions Inline for One-Off Distributions
---
## Category
Code Organization
---
## Rule
Define sequences inline at the factory call site when the distribution is specific to a single test or seeder.
---
## Reason
Extracting one-off sequences into named methods or separate classes adds indirection without reuse benefit. Inline definitions keep the data distribution visible next to the creation logic.
---
## Bad Example
```php
class UserFactory extends Factory
{
    public function roleDistribution(): static
    {
        return $this->sequence(
            ['role' => 'admin'],
            ['role' => 'editor'],
        );
    }
}

// Used only once
User::factory()->count(2)->roleDistribution()->create();
```
---
## Good Example
```php
User::factory()
    ->count(2)
    ->sequence(
        ['role' => 'admin'],
        ['role' => 'editor'],
    )
    ->create();
```
---
## Exceptions
When the same sequence is used across three or more tests or seeders. Extract to a static method on the factory and document the reuse.
---
## Consequences Of Violation
Maintainability: factory classes accumulate one-off methods that obscure the core definition.
---

## Rule 5: Do Not Use Sequences for Random or Realistic Data
---
## Category
Framework Usage
---
## Rule
Use Faker, not `sequence()`, when data should be realistic and variable rather than deterministic.
---
## Reason
Sequences produce predictable, repeating values that look artificial. Faker generates realistic names, emails, addresses, and sentences that surface UI and validation issues that deterministic data would miss.
---
## Bad Example
```php
// All names are "Alice", "Bob", "Charlie" — unrealistic
User::factory()
    ->count(3)
    ->sequence(['name' => 'Alice'], ['name' => 'Bob'], ['name' => 'Charlie'])
    ->create();
```
---
## Good Example
```php
// Realistic, varied names in definition
User::factory()->count(3)->create();
```
---
## Exceptions
When the test must reproduce a specific name for an assertion (e.g., searching for "Alice").
---
## Consequences Of Violation
Testing: UI layout bugs with long or unusual names go undetected.
---

## Rule 6: Ensure Sequence Value Count Aligns with Batch Size
---
## Category
Testing
---
## Rule
Design sequence item counts that align with or cleanly divide the total batch size.
---
## Reason
A sequence wraps around when exhausted. A mismatch between sequence items and batch size creates an uneven or surprising distribution (e.g., 4-item sequence on 5 models wraps to the first item, creating an extra admin unexpectedly).
---
## Bad Example
```php
// 4 models, 3-item sequence → distribution is uneven: admin, editor, viewer, admin
User::factory()
    ->count(4)
    ->sequence(['role' => 'admin'], ['role' => 'editor'], ['role' => 'viewer'])
    ->create();
```
---
## Good Example
```php
// 6 models, 3-item sequence → exactly 2 of each
User::factory()
    ->count(6)
    ->sequence(['role' => 'admin'], ['role' => 'editor'], ['role' => 'viewer'])
    ->create();
```
---
## Exceptions
When the wrap-around behavior is intentional and documented (e.g., testing round-robin assignment).
---
## Consequences Of Violation
Testing: unexpected distribution causes test assertions to fail unpredictably.
---
