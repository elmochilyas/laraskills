# ECC Standardized Knowledge — Test Data Factory Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Test Data Factory Design |
| Difficulty | Intermediate |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Test data factory design covers the creation and management of test data using Laravel's model factories and custom factory patterns. Well-designed factories produce reliable, readable, and maintainable test data. Topics cover factory definitions, factory states, factory sequences, factory relationships, custom factory methods (`afterCreating`, `configure`), and PestPHP's `beforeEach`/`beforeAll` for data setup. Factories are the foundation of all API tests that interact with the database — poor factory design leads to brittle, slow, and unreadable tests.

## Core Concepts

- **`definition()`**: Returns default attribute array for a model — uses `fake()` (Faker) for randomized data
- **Factory states**: `PostFactory::new()->published()->create()` — override defaults for specific scenarios
- **Factory sequences**: `factory()->count(3)->sequence(['status' => 'draft'], ['status' => 'published'])` — cycle through values
- **Factory relationships**: `UserFactory::new()->hasPosts(3)->create()` — parent-child relationships
- **`afterCreating()`**: Callbacks run after model persistence — attach related models or trigger side effects
- **`raw()`**: Returns attributes array without persisting — perfect for request bodies
- **`make()`**: Creates instance without saving to database — avoids unnecessary writes
- **`configure()`**: Sets up conditional default behavior based on other attributes

## When To Use

- Every Eloquent model that needs test data
- Feature tests that require persisted database records
- Form request tests using `raw()` for request body generation
- Seeding test databases for integration tests

## When NOT To Use

- DTO construction tests (use direct instantiation)
- Non-Eloquent data objects (use plain PHP builders)
- Unit tests that mock repositories (no database needed)

## Best Practices

- **Use explicit states, not inline overrides**: `PostFactory::new()->published()->create()` over `->create(['status' => 'published'])`.
- **Define all relationship factories**: `UserFactory::new()->hasPosts(3)->create()`.
- **Use `fake()` with locale**: `fake('en_US')` for consistent locale in tests.
- **Use `sequence()` for distinct records**: `factory()->count(3)->sequence(...)`.
- **Define `afterCreating` for side effects**: After creating Post, attach random tags.
- **Use `raw()` for request bodies**: `PostFactory::new()->raw()` generates array for `$this->post('/api/posts', ...)`.
- **Create reusable factory traits**: `HasPosts` trait on UserFactory provides `withPosts(int $count)` method.
- **Use `configure()` for conditional defaults**: A `thumbnail()` state changes both `has_thumbnail` and `thumbnail_url`.

## Architecture Guidelines

- Laravel's factory system couples test data to Eloquent models — each factory maps to one model.
- This is a deliberate tradeoff: easy data creation but coupling to model schema.
- For API tests, model-level factories are the standard because tests need persisted data for endpoint assertions.
- Keep factories in `database/factories/` and maintain them alongside migrations and models.

## Performance Considerations

- Factory `create()` calls are database writes — each call adds overhead.
- Use `make()` instead of `create()` when you only need the model instance attributes.
- Use `factory()->count(N)->create()` to batch-insert N records in a single chunk.
- Use `afterCreating()` sparingly — callbacks run for each created record, adding O(N) overhead.
- For test data that doesn't change between test methods, create in `beforeAll()` or `setUpBeforeClass()`.

## Security Considerations

- Factory definitions should match production model schema exactly — invalid data produces misleading test results.
- Never use factory data in production (`php artisan db:seed` in production is a real risk).
- Factory `fake()` data should be locale-aware for internationalized applications.
- Ensure factories don't generate data that violates security constraints (e.g., passwords that don't meet requirements).

## Common Mistakes

- Using `create()` when `make()` suffices — unnecessary database writes.
- Forgetting to refresh database between tests — factory-created records pollute subsequent tests.
- Defining factories with hardcoded values instead of `fake()` — tests become brittle to uniqueness constraints.
- Not defining states for edge cases — null values, empty strings, boundary values must be factory-producible.
- Defining circular factory relationships — `PostFactory` tries to create `User` that creates `Post` — infinite loop.
- Using `factory()->create()` inside a loop — O(N) round trips instead of `factory()->count(N)->create()`.

## Anti-Patterns

- **Inlined overrides everywhere**: `Post::factory()->create(['status' => 'published', 'published_at' => now()])` instead of defining a `published()` state — hard to maintain and inconsistent.
- **Factory-as-seeder**: Using factories in production seeders — factories use randomized data, seeders need deterministic data.
- **No edge case states**: Only defining the "happy path" factory state — missing states for null, empty, and boundary scenarios.
- **Circular relationship definitions**: Factory A creates Model B which creates Model A — infinite recursion.

## Examples

```php
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'body' => fake()->paragraphs(3, true),
            'status' => 'draft',
            'published_at' => null,
            'user_id' => User::factory(),
        ];
    }

    public function published(): static
    {
        return $this->state(fn() => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Post $post) {
            if ($post->status === 'published') {
                $post->tags()->attach(Tag::factory()->count(3)->create());
            }
        });
    }
}

// Usage in tests
it('lists published posts', function () {
    Post::factory()->count(3)->published()->create();
    Post::factory()->count(2)->create(); // drafts

    $response = $this->getJson('/api/posts');

    expect($response->json('data'))->toHaveCount(3);
});

it('uses factory raw for request body', function () {
    $data = Post::factory()->raw();

    $response = $this->postJson('/api/posts', $data);

    $response->assertStatus(201);
});
```

## Related Topics

- **Prerequisites**: Laravel Eloquent Models, Database Migrations
- **Siblings**: feature-test-structure, layer-isolation-in-tests, happy-path-testing
- **Advanced**: Factory collections and custom collection methods, Test data builders (Builder pattern), Fixture management for large test datasets

## AI Agent Notes

- Factory design is the single biggest determinant of test suite maintainability — well-factored factories make tests readable and fast.
- Laravel 11 uses the Factory pattern (classes, not helpers). The `fake()` helper was introduced in Laravel 8.
- PestPHP 2.x provides `factory()->create()` via `DatabaseFactories` trait.

## Verification

- [ ] Every Eloquent model has a corresponding factory
- [ ] Factory states are defined for all significant model states (published, draft, archived, etc.)
- [ ] Factory relationships are defined using `has()` / `for()` methods
- [ ] Edge case states (null, empty, boundary) are factory-producible
- [ ] No circular factory relationships exist
- [ ] Factories use `fake()` for unique fields (email, slug) with `->unique()`
- [ ] `raw()` is available for request body generation in feature tests
