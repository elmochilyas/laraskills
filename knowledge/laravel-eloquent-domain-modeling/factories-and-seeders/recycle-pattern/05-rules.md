# Recycle Pattern Rules

## Rule 1: Use recycle() When Many Children Share the Same Parent
---
## Category
Performance
---
## Rule
Use `recycle()` with a pre-created parent model instance when creating batch children that should all reference the same parent.
---
## Reason
Without `recycle()`, each child factory creates an independent parent. For 1,000 posts with `Post::factory()->for(User::factory())->create()`, this creates 1,000 users — almost always unnecessary. `recycle()` reduces this to a single user creation.
---
## Bad Example
```php
// Creates 1,000 users for 1,000 posts
Post::factory()->count(1000)->for(User::factory())->create();
```
---
## Good Example
```php
$user = User::factory()->create();
Post::factory()->count(1000)->recycle($user)->create();
```
---
## Exceptions
When each child must have an independent parent for domain accuracy (e.g., each order has a unique customer).
---
## Consequences Of Violation
Performance: database writes scale with child count instead of parent count. Seeding time grows linearly with unnecessary parent creation.
---

## Rule 2: Pass a Collection for Round-Robin Distribution
---
## Category
Performance
---
## Rule
Pass a collection of pre-created models to `recycle()` when children should be distributed across multiple parents in round-robin order.
---
## Reason
A single parent creates an unrealistic scenario where all children share one parent. A collection distributes children evenly, creating realistic data distribution while still limiting total parent writes to the collection size.
---
## Bad Example
```php
// Unrealistic: all 100 posts belong to one user
$user = User::factory()->create();
Post::factory()->count(100)->recycle($user)->create();
```
---
## Good Example
```php
// Realistic: 100 posts distributed across 10 users
$users = User::factory()->count(10)->create();
Post::factory()->count(100)->recycle($users)->create();
```
---
## Exceptions
When the test scenario explicitly demands a single shared parent (e.g., testing quota limits per user).
---
## Consequences Of Violation
Testing: distribution-based assertions (e.g., "all 10 users have posts") cannot be verified. Realism: test data does not reflect real-world patterns.
---

## Rule 3: Use recycle() to Resolve Circular Dependencies
---
## Category
Architecture
---
## Rule
Prefer `recycle()` as the primary resolution strategy for circular factory dependencies.
---
## Reason
`recycle()` breaks circular dependencies by pre-creating one side of the cycle, eliminating the mutual creation deadlock. It is simpler than `afterCreating()` callbacks and applies graph-wide to all nested factories.
---
## Bad Example
```php
// Both Post and User factories try to create each other
class PostFactory extends Factory
{
    public function definition(): array
    {
        return ['user_id' => User::factory()];
    }
}
```
---
## Good Example
```php
$users = User::factory()->count(10)->create();
Post::factory()->count(50)->recycle($users)->create();
```
---
## Exceptions
When the cycle involves three or more models where none can be pre-created independently. Combine `recycle()` with `afterCreating()` for complex cycles.
---
## Consequences Of Violation
Reliability: infinite recursion and stack overflow during factory execution.
---

## Rule 4: Apply recycle() at the Top of the Factory Chain
---
## Category
Code Organization
---
## Rule
Place `recycle()` at the top of the factory call chain, before `for()`, `has()`, or `hasAttached()`.
---
## Reason
`recycle()` applies globally to the entire factory graph. If placed after relationship methods, the recycled model may not propagate correctly to those nested factories. Top-level placement ensures all nested factories can resolve the recycled model.
---
## Bad Example
```php
Post::factory()
    ->has(Comment::factory()->count(3))
    ->recycle($users) // Too late — Comment factories may not get the recycle
    ->create();
```
---
## Good Example
```php
Post::factory()
    ->recycle($users) // Applies to Post and all nested Comment factories
    ->has(Comment::factory()->count(3))
    ->create();
```
---
## Exceptions
When `recycle()` targets a specific nested factory rather than the entire graph. Use multiple `recycle()` calls at the appropriate nesting level.
---
## Consequences Of Violation
Reliability: recycled models are not available to nested factories, causing FK constraint violations or unintended new model creation.
---

## Rule 5: Do Not Use recycle() When Every Child Needs a Unique Parent
---
## Category
Architecture
---
## Rule
Never use `recycle()` when the domain requires each child to have a unique parent.
---
## Reason
`recycle()` reuses the same parent across many children. If the relationship implies uniqueness (e.g., `User` `hasOne` `Profile`), recycling violates the domain invariant and creates duplicate records.
---
## Bad Example
```php
// Profile is hasOne — only one profile per user, but recycle shares the same user
$user = User::factory()->create();
Profile::factory()->count(5)->recycle($user)->create(); // 5 profiles for 1 user
```
---
## Good Example
```php
// Each profile needs a unique user
User::factory()
    ->count(5)
    ->has(Profile::factory())
    ->create();
```
---
## Exceptions
No common exceptions. Domain invariants must be preserved regardless of convenience.
---
## Consequences Of Violation
Data integrity: duplicate related records violate uniqueness constraints. Reliability: test assertions on relationship counts are wrong.
---

## Rule 6: Combine recycle() with Factory States for Realistic Shared Data
---
## Category
Testing
---
## Rule
Pre-create recycled models with specific states to ensure shared parents have meaningful variations.
---
## Reason
Recycled models created with default factory values are identical. Using states on the pre-created collection introduces meaningful variation (admins, editors, viewers) that tests can assert on.
---
## Bad Example
```php
// All 10 users are identical
$users = User::factory()->count(10)->create();
Post::factory()->count(100)->recycle($users)->create();
```
---
## Good Example
```php
// Users have meaningful variation
$users = collect([
    User::factory()->admin()->create(),
    User::factory()->editor()->create(),
    User::factory()->count(8)->create(),
]);
Post::factory()->count(100)->recycle($users)->create();
```
---
## Exceptions
When the parent's attributes are irrelevant to the test scenario. Default factories are sufficient.
---
## Consequences Of Violation
Testing: assertions on parent-attribute-dependent behavior (e.g., "admin posts are highlighted") cannot be verified.
---

## Rule 7: Use recycle() for Performance, Not as a Data Strategy Default
---
## Category
Code Organization
---
## Rule
Use `recycle()` intentionally only when sharing is the correct semantic — not as a default for every factory call.
---
## Reason
Indiscriminate `recycle()` in cases where each child should have an independent parent masks data distribution issues and makes tests less realistic. Default to independent parents; switch to `recycle()` only when sharing is part of the test scenario or when performance demands it.
---
## Bad Example
```php
// Default pattern — sharing even when not needed
public function setUp(): void
{
    parent::setUp();
    $this->user = User::factory()->create();
}

public function test_post_creation(): void
{
    Post::factory()->count(3)->recycle($this->user)->create(); // Maybe shouldn't share
}
```
---
## Good Example
```php
// Independent by default
public function test_post_creation(): void
{
    Post::factory()->count(3)->create(); // Independent users
}

// recycle() used intentionally when sharing is the test focus
public function test_user_post_limit(): void
{
    $user = User::factory()->create();
    Post::factory()->count(3)->recycle($user)->create();
}
```
---
## Exceptions
Performance-critical seeding where independent parent creation would be prohibitively slow. Document the trade-off.
---
## Consequences Of Violation
Testing: tests pass with unrealistic data distribution, missing bugs that only appear with independent parents.
---
