# Test Data Factory Design — Rules

## Use Explicit States Over Inline Overrides
---
## Category
Maintainability
---
## Rule
Define factory states for each significant model scenario instead of using inline `create(['field' => 'value'])` overrides.
---
## Reason
Inline overrides are invisible to code review — a reviewer sees `Post::factory()->create()` with overrides only by reading the create arguments. Factory states (`Post::factory()->published()->create()`) are self-documenting and maintainable. When the "published" definition changes, update the state method, not every test.
---
## Bad Example
```php
it('lists published posts', function () {
    Post::factory()->create(['status' => 'published', 'published_at' => now()]);
    // Inline override — duplicate logic in every test
});
```
---
## Good Example
```php
class PostFactory extends Factory
{
    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }
}

it('lists published posts', function () {
    Post::factory()->published()->create();
});
```
---
## Exceptions
When a state is only used once and has no logical grouping (e.g., a unique value for a specific test), an inline override may be acceptable.
---
## Consequences Of Violation
Duplicated state logic across tests; consistency errors (some tests use 'publish' instead of 'published'); high maintenance cost when defaults change.
---

## Use Raw For Request Bodies
---
## Category
Testing
---
## Rule
Use `Post::factory()->raw()` to generate feature test request bodies instead of constructing arrays manually.
---
## Reason
A manually constructed array may violate the factory's default schema — missing a required field, using a wrong type, or failing a unique constraint. `raw()` returns the factory's definition array, guaranteed to match the model's expected structure.
---
## Bad Example
```php
it('creates a post', function () {
    $data = [
        'title' => 'Manual Title',
        'body'  => 'Manually written body',
        // May miss required fields or include invalid ones
    ];

    $this->postJson('/api/posts', $data)->assertCreated();
});
```
---
## Good Example
```php
it('creates a post', function () {
    $data = Post::factory()->raw();

    $this->postJson('/api/posts', $data)->assertCreated();
});
```
---
## Exceptions
When testing specific field values (e.g., "title is trimmed"), manually construct the request body with the edge case value.
---
## Consequences Of Violation
Manual arrays diverge from model schema; tests fail due to schema changes unrelated to the test scenario; maintainability burden.
---

## Use Sequences For Distinct Records
---
## Category
Testing
---
## Rule
Use `sequence()` to create distinct records in batch when they need different values for the same attribute.
---
## Reason
Creating records with inline overrides in a loop is verbose and error-prone. `sequence()` cycles through provided values, assigning each record a distinct value. It's declarative and handles any number of records.
---
## Bad Example
```php
it('lists posts with different statuses', function () {
    Post::factory()->create(['status' => 'draft']);
    Post::factory()->create(['status' => 'published']);
    Post::factory()->create(['status' => 'archived']);
    // Repetitive — each record created individually
});
```
---
## Good Example
```php
it('lists posts with different statuses', function () {
    Post::factory()
        ->count(3)
        ->sequence(
            ['status' => 'draft'],
            ['status' => 'published'],
            ['status' => 'archived'],
        )
        ->create();
});
```
---
## Exceptions
When only one record is needed, `sequence()` is unnecessary overhead.
---
## Consequences Of Violation
Repetitive record creation code; easy to miss one variant; inconsistent or incomplete coverage of model states.
---

## Define All Relationship Factories
---
## Category
Maintainability
---
## Rule
Always define and use relationship factory methods (`has()`, `for()`, `belongsTo()`) rather than manual foreign key assignment.
---
## Reason
Manual foreign key assignment (`'user_id' => User::factory()`) is the "Accidentally Quadratic" problem: creating 10 posts with 10 users creates 11 database records, but the relationship method `->hasPosts(10)` creates 1 user + 10 posts in one batch insert.
---
## Bad Example
```php
it('has many posts', function () {
    $user = User::factory()->create();
    Post::factory()->count(10)->create(['user_id' => $user->id]);
    // 11 separate insert queries
});
```
---
## Good Example
```php
it('has many posts', function () {
    $user = User::factory()
        ->hasPosts(10)
        ->create();
    // Batch-inserts posts in fewer queries
});
```
---
## Exceptions
When the foreign key value must be explicitly predictable for assertion purposes, manual assignment may be clearer.
---
## Consequences Of Violation
Slow test data creation; unnecessary database writes; N+1 query problem in tests; CI slowdown.
---

## Use Make Over Create When Persistence Is Unnecessary
---
## Category
Performance
---
## Rule
Prefer `make()` over `create()` when the test only needs the model instance attributes without database persistence.
---
## Reason
`create()` inserts a record into the database — a write operation that requires migration state, transaction handling, and auto-increment management. `make()` instantiates the model in memory only, making tests faster and eliminating database contention.
---
## Bad Example
```php
it('generates slug from title', function () {
    $post = Post::factory()->create(['title' => 'Hello World']);
    // Database write for a test that only needs in-memory attribute access
});
```
---
## Good Example
```php
it('generates slug from title', function () {
    $post = Post::factory()->make(['title' => 'Hello World']);

    expect($post->slug)->toBe('hello-world');
});
```
---
## Exceptions
When the test needs the record to exist for relationship queries or route model binding, `create()` is required.
---
## Consequences Of Violation
Unnecessary database writes in tests; slower test execution; database contention in parallel test runs.
---

## Define Edge-Case States
---
## Category
Testing
---
## Rule
Define factory states for boundary and edge-case model states (null, empty, max-length, soft-deleted, archived).
---
## Reason
Edge-case model states (null `published_at`, empty `body`, soft-deleted) are essential for comprehensive testing. Without dedicated factory states, tests resort to inline overrides, which are inconsistent and error-prone. A `deleted()` state on PostFactory ensures every soft-delete test uses the same definition.
---
## Bad Example
```php
// Edge-case states missing — each test defines its own
it('returns null body for empty posts', function () {
    $post = Post::factory()->create(['body' => null]);
    // vs another test uses ['body' => '']
    // Inconsistent definition across tests
});
```
---
## Good Example
```php
class PostFactory extends Factory
{
    public function withEmptyBody(): static
    {
        return $this->state(fn () => ['body' => null]);
    }

    public function deleted(): static
    {
        return $this->state(fn () => ['deleted_at' => now()]);
    }
}

it('returns null body for empty posts', function () {
    $post = Post::factory()->withEmptyBody()->create();
    expect($post->body)->toBeNull();
});
```
---
## Exceptions
When a model has no edge-case scenarios (all fields always populated), edge-case states are unnecessary.
---
## Consequences Of Violation
Inconsistent edge-case definitions across tests; edge case bugs undetected; fragile tests that break when edge-case definition changes.
---
