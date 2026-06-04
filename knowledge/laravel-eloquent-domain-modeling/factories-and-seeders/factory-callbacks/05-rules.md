# Factory Callbacks Rules

## Rule 1: Keep definition() Pure — No Side Effects
---
## Category
Architecture
---
## Rule
Never include side effects (relationship creation, event dispatching, file system operations, API calls) in factory `definition()` methods.
---
## Reason
`definition()` is called during both `make()` and `create()`. Side effects in `definition()` execute even when the model is not persisted, leading to phantom relationships, leaked files, or API calls that should only happen on persist. Side effects also break the factory's ability to return a simple attribute array via `raw()`.
---
## Bad Example
```php
public function definition(): array
{
    $media = Media::factory()->create(); // Side effect — creates DB record
    return ['avatar' => $media->url];
}
```
---
## Good Example
```php
public function definition(): array
{
    return ['title' => fake()->sentence()];
}

public function configure(): static
{
    return $this->afterCreating(fn (Post $post) => $post->addMedia(...));
}
```
---
## Exceptions
No common exceptions. All side effects belong in `afterMaking` or `afterCreating` callbacks.
---
## Consequences Of Violation
Reliability: `make()` produces phantom database records. Testing: tests pollute the database even when they only call `make()`.
---

## Rule 2: Use afterCreating for Persistence-Dependent Logic
---
## Category
Framework Usage
---
## Rule
Use `afterCreating()` callbacks for any logic that requires the model to have a primary key ID after database persistence.
---
## Reason
During `definition()` and `afterMaking()`, the model has no ID and cannot create related child records that need the foreign key. `afterCreating()` runs after `save()`, guaranteeing the model has an ID that child relationships can reference.
---
## Bad Example
```php
// Trying to associate children before the parent has an ID
$post->comments()->saveMany(Comment::factory()->count(3)->make());
```
---
## Good Example
```php
public function configure(): static
{
    return $this->afterCreating(function (Post $post) {
        $post->comments()->saveMany(Comment::factory()->count(3)->make());
    });
}
```
---
## Exceptions
No common exceptions. If the logic does not need the model's ID, use `afterMaking()`.
---
## Consequences Of Violation
Reliability: child models are created with null foreign keys or fail foreign key constraints.
---

## Rule 3: Use afterMaking for Non-Persisted Setup
---
## Category
Framework Usage
---
## Rule
Use `afterMaking()` callbacks for setup logic that should execute even when the model is created in-memory via `make()`.
---
## Reason
`afterCreating()` only runs on `create()`. Setup that is independent of persistence (attaching transient data, initializing non-persisted values, setting up mocks) should use `afterMaking()` so it works for both `make()` and `create()`.
---
## Bad Example
```php
public function configure(): static
{
    return $this->afterCreating(function (User $user) {
        $user->token = Str::random(40); // Only set on create, not make
    });
}
```
---
## Good Example
```php
public function configure(): static
{
    return $this->afterMaking(function (User $user) {
        $user->token = Str::random(40); // Set regardless of make/create
    });
}
```
---
## Exceptions
When the setup logic requires the model's database ID. That is inherently persistence-dependent and must use `afterCreating()`.
---
## Consequences Of Violation
Testing: tests using `make()` miss critical setup logic, producing incomplete or invalid model instances.
---

## Rule 4: Do Not Perform Expensive Operations in Factory Callbacks
---
## Category
Performance
---
## Rule
Avoid expensive operations (API calls, file uploads, bulk database inserts, external service calls) inside factory callbacks.
---
## Reason
Factory callbacks execute once per created model. Creating 1,000 models with an API call in the callback results in 1,000 external requests, turning a fast test into a minutes-long wait. Expensive operations should be extracted to the test or seeder where they can be batched or mocked.
---
## Bad Example
```php
public function configure(): static
{
    return $this->afterCreating(function (User $user) {
        Http::post('https://api.example.com/users', $user->toArray()); // API call per user
    });
}
```
---
## Good Example
```php
// In test or seeder:
$users = User::factory()->count(100)->create();
Http::pool(fn (Pool $pool) => $users->map(
    fn ($user) => $pool->post('https://api.example.com/users', $user->toArray())
));
```
---
## Exceptions
When the callback operation is fast and essential (attach a few tags, set a relationship). The rule targets genuinely expensive operations like network calls and large file I/O.
---
## Consequences Of Violation
Performance: factory creation time grows linearly with count. Testing: test suites become too slow to run frequently.
---

## Rule 5: Register Callbacks in configure() — Not in definition()
---
## Category
Code Organization
---
## Rule
Always define factory callbacks inside a `configure()` method that returns `$this`, never inline in the `definition()` method.
---
## Reason
`configure()` is the designated hook for factory lifecycle setup. Mixing callback registration with attribute definition violates separation of concerns, makes the factory harder to read, and prevents subclasses from cleanly extending either behavior.
---
## Bad Example
```php
public function definition(): array
{
    $this->afterCreating(fn (Post $post) => ...); // Hidden callback registration
    return ['title' => fake()->sentence()];
}
```
---
## Good Example
```php
public function definition(): array
{
    return ['title' => fake()->sentence()];
}

public function configure(): static
{
    return $this->afterCreating(fn (Post $post) => ...);
}
```
---
## Exceptions
No common exceptions. `configure()` is the canonical location for all callbacks.
---
## Consequences Of Violation
Maintainability: callbacks are hidden inside attribute arrays, making them easy to miss during refactoring.
---

## Rule 6: Use Factory Relationship Methods Instead of Callbacks When Possible
---
## Category
Maintainability
---
## Rule
Prefer `has()`, `for()`, and `hasAttached()` over `afterCreating()` callbacks for standard relationship setup.
---
## Reason
Relationship methods are declarative, self-documenting, and automatically handle foreign key resolution. An `afterCreating()` callback that manually attaches children is more code, harder to read, and must re-implement FK resolution that the relationship methods already handle.
---
## Bad Example
```php
public function configure(): static
{
    return $this->afterCreating(function (User $user) {
        Post::factory()->count(3)->create(['user_id' => $user->id]);
    });
}
```
---
## Good Example
```php
// At call site:
User::factory()->has(Post::factory()->count(3))->create();
```
---
## Exceptions
When the relationship logic is conditional on the model's runtime state (e.g., attach different children based on the parent's attribute values).
---
## Consequences Of Violation
Maintainability: verbose relationship setup throughout factories. Reliability: manual FK assignment is error-prone.
---

## Rule 7: Keep Callback Logic Short and Single-Purpose
---
## Category
Maintainability
---
## Rule
Limit each `afterCreating` or `afterMaking` callback to one focused responsibility.
---
## Reason
Callbacks execute sequentially but are difficult to debug when a single closure does many things (creates relationships, dispatches events, writes files). Multiple focused callbacks can be independently understood, tested, and overridden by factory states.
---
## Bad Example
```php
public function configure(): static
{
    return $this->afterCreating(function (Post $post) {
        $post->comments()->saveMany(Comment::factory()->count(3)->make());
        $post->addMedia($this->fake()->image())->toMediaCollection('featured');
        event(new PostCreated($post));
        Log::info('Post created', ['id' => $post->id]);
    });
}
```
---
## Good Example
```php
public function configure(): static
{
    return $this
        ->afterCreating(fn (Post $post) => $post->comments()->saveMany(...))
        ->afterCreating(fn (Post $post) => $post->addMedia(...)->toMediaCollection('featured'))
        ->afterCreating(fn (Post $post) => event(new PostCreated($post)));
}
```
---
## Exceptions
When operations are trivially related and separating them would create meaningless single-line callbacks.
---
## Consequences Of Violation
Maintainability: callback logic is impossible to override partially. Testing: state methods that need only part of the callback behavior cannot cleanly compose.
---
