# Circular Dependency Resolution Rules

## Rule 1: Break Every Circular Factory Dependency Before Seeding
---
## Category
Reliability
---
## Rule
Always identify and break circular factory dependencies before any seeding or test run executes.
---
## Reason
Unresolved circular dependencies cause infinite recursion, stack overflow, and PHP process death. The crash occurs silently during deep factory chains, making the root cause difficult to diagnose.
---
## Bad Example
```php
// UserFactory afterCreating creates Posts; PostFactory afterCreating creates Users
// → infinite recursion, stack overflow
```
---
## Good Example
```php
$users = User::factory()->count(10)->create();
Post::factory()->count(50)->recycle($users)->create();
```
---
## Exceptions
No common exceptions. Every circular dependency must be resolved before execution.
---
## Consequences Of Violation
Reliability: PHP crashes with maximum function nesting level error. Data loss: partially-created seed state with no transaction rollback.
---

## Rule 2: Use recycle() to Break Circular Dependencies
---
## Category
Architecture
---
## Rule
Prefer `recycle()` over other strategies when breaking circular factory dependencies.
---
## Reason
`recycle()` pre-creates one side of the cycle and reuses those instances across all dependent models. It is declarative, graph-aware (applies to nested factories), and eliminates recursion without requiring callback restructuring.
---
## Bad Example
```php
// Both factories try to create each other — implicit cycle
$post = Post::factory()->create(); // creates User internally
$user = User::factory()->create(); // creates Post internally
```
---
## Good Example
```php
$users = User::factory()->count(10)->create();
$posts = Post::factory()->count(50)->recycle($users)->create();
```
---
## Exceptions
When the cycle involves three or more models where no single model can be pre-created independently. Use `afterCreating` callbacks in that case.
---
## Consequences Of Violation
Reliability: runtime crash. Performance: redundant model creation even if it doesn't crash.
---

## Rule 3: Defer the Dependent Side of a Cycle to afterCreating
---
## Category
Architecture
---
## Rule
Use `afterCreating()` callbacks to establish the circular relationship on the dependent model after it has been persisted.
---
## Reason
The dependent model must exist (have an ID) before the reciprocal relationship can be created. `afterCreating()` runs after persistence, giving the model a primary key that other factories can reference.
---
## Bad Example
```php
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(), // creates User, whose factory creates more Posts → cycle
        ];
    }
}
```
---
## Good Example
```php
class PostFactory extends Factory
{
    public function configure(): static
    {
        return $this->afterCreating(function (Post $post) {
            $post->user()->associate(User::factory()->create());
            $post->save();
        });
    }
}
```
---
## Exceptions
When the relationship is genuinely optional (nullable FK). In that case, no `afterCreating` is needed — set up the relationship at the call site.
---
## Consequences Of Violation
Reliability: stack overflow during factory execution. Testing: test suite becomes non-deterministic (sometimes crashes, sometimes doesn't).
---

## Rule 4: Make One Side of the Cycle Nullable at the Database Level
---
## Category
Architecture
---
## Rule
Design at least one foreign key in a circular relationship as nullable, allowing creation of the model without the reciprocal reference.
---
## Reason
A nullable FK means the model can exist independently, which breaks the creation deadlock. The relationship is established in a second step after both models exist. This is the cleanest architectural fix because it reflects real domain semantics where the relationship is optional.
---
## Bad Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained()->nullable(false); // Must always have a user
    // But UserFactory creates Posts → deadlock
});
```
---
## Good Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->nullable()->constrained(); // Can exist without a user
});
```
---
## Exceptions
When the domain strictly requires the relationship to be mandatory (e.g., an invoice must always belong to a customer). Use `recycle()` instead.
---
## Consequences Of Violation
Reliability: circular dependency is impossible to satisfy during factory creation. Schema rigidity forces complicated workarounds.
---

## Rule 5: Do Not Call Model::factory() Inside Another Model's definition()
---
## Category
Architecture
---
## Rule
Never invoke a factory inside another factory's `definition()` method if the invoked factory also references the first model.
---
## Reason
Calling `ModelB::factory()` inside `ModelA::definition()` creates an implicit dependency. If `ModelB`'s factory creates `ModelA` anywhere in its chain, the result is a circular recursion that crashes at runtime.
---
## Bad Example
```php
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(), // UserFactory may create Post via callback
        ];
    }
}
```
---
## Good Example
```php
class PostFactory extends Factory
{
    public function definition(): array
    {
        return ['title' => fake()->sentence()]; // Pure, no relationships
    }
}

// Relationship established at call site
Post::factory()->for(User::factory())->create();
```
---
## Exceptions
When the relationship is strictly one-directional and you have verified the target factory never references the source model. Document the audit.
---
## Consequences Of Violation
Reliability: stack overflow crash. Debugging difficulty: the recursion is invisible in the call chain.
---

## Rule 6: Document Circular Dependency Resolutions in Factory DocBlocks
---
## Category
Maintainability
---
## Rule
Document all resolved circular dependencies directly on the factory class using a PHPDoc annotation that explains which side was pre-created and why.
---
## Reason
Circular dependency resolution is non-obvious. Without documentation, future maintainers may reintroduce the cycle by refactoring factories or adding new relationships. The annotation serves as a warning and guides correct factory usage.
---
## Bad Example
```php
class PostFactory extends Factory
{
    // No documentation — next developer sees recycle() and doesn't understand why
    public function configure(): static { ... }
}
```
---
## Good Example
```php
/**
 * Resolves User ↔ Post circular dependency.
 * Users are pre-created via recycle() at the call site.
 * Posts reference recycled users; no afterCreating cycle.
 */
class PostFactory extends Factory
{
    public function configure(): static { ... }
}
```
---
## Exceptions
Simple two-model cycles resolved by `recycle()` are self-documenting in the call site. Reserve doc blocks for three-or-more-model cycles or complex `afterCreating` strategies.
---
## Consequences Of Violation
Maintainability: future refactors break seeding silently. Knowledge loss: the resolution strategy is lost when the original author leaves.
---
