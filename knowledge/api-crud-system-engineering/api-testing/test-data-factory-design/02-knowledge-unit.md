# Test Data Factory Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Test Data Factory Design
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Test data factory design covers the creation and management of test data using Laravel's model factories and custom factory patterns. Well-designed factories produce reliable, readable, and maintainable test data. Topics cover factory definitions, factory states, factory sequences, factory relationships, custom factory methods (afterCreating, configure), and PestPHP's `beforeEach`/`beforeAll` for data setup. Factories are the foundation of all API tests that interact with the database — poor factory design leads to brittle, slow, and unreadable tests.

---

## Core Concepts
Laravel's `Factory` class (`Illuminate\Database\Eloquent\Factories\Factory`) defines default attribute values for a model. `PostFactory::definition()` returns default attributes. `Factory::state()` methods override defaults for specific scenarios (e.g., `published()`, `draft()`). `Factory::sequence()` cycles through values for multiple record creation. `Factory::has()` defines relationships. `Factory::afterCreating()` runs callbacks after model persistence. `factory()->count(N)->create()` batch-creates records. Custom factory methods (`configure()`) set up conditional behavior. `Factory::raw()` returns the attributes array without persisting. `Factory::make()` creates instances without saving.

---

## Mental Models
Factory design is **template-based doll-making** — the factory definition is the master mold (default shape). Factory states are alternate molds (sitting doll, standing doll). Factory sequences are conveyor belts that alternate between molds. Relationships are accessories (hat, shoes) attached after the doll is formed. The test is the workshop that stamps out the exact dolls it needs.

---

## Internal Mechanics
A factory class extends `Illuminate\Database\Eloquent\Factories\Factory` and defines `model()` and `definition()`. The `definition()` returns an array of attribute values, using `fake()` (Faker) for randomized data. `Factory::create()` calls `make()` + `save()` on a new model instance. `Factory::state()` returns a new factory instance with merged states. `Factory::for()` creates parent-child relationships. `Factory::has()` creates child-parent relationships. `Factory::count(N)` sets the creation count — `create()` returns a Collection when count > 1. PestPHP's `factory()->create()` is syntactic sugar. `afterCreating()` callbacks receive the created model and can attach related models or trigger side effects.

---

## Patterns
- **Use explicit states, not inline overrides**: `PostFactory::new()->published()->create()` over `PostFactory::new()->create(['status' => 'published'])`.
- **Define all relationship factories**: `UserFactory::new()->hasPosts(3)->create()`.
- **Use `fake()` with locale**: `fake('en_US')` for consistent locale in tests.
- **Use `sequence()` for distinct records**: `factory()->count(3)->sequence(['status' => 'draft'], ['status' => 'published'], ['status' => 'archived'])`.
- **Define `afterCreating` for side effects**: After creating a `Post`, attach random tags via `afterCreating()`.
- **Use `raw()` for request bodies**: `PostFactory::new()->raw()` generates array for `$this->post('/api/posts', ...)`.
- **Create reusable factory traits**: `HasPosts` trait on UserFactory provides `withPosts(int $count)` method.
- **Use `configure()` for conditional defaults**: A `thumbnail()` state changes both `has_thumbnail` and `thumbnail_url`.

---

## Architectural Decisions
Laravel's factory system couples test data to Eloquent models — each factory maps to one model. This is a deliberate tradeoff: test data is easy to create (one `create()` call) but couples test setup to the model schema. If a model's schema changes, all factory-dependent tests may break. An alternative is "plain PHP object" factories that return arrays without touching Eloquent — more decoupled but more code. For API tests, model-level factories are the standard because tests need persisted data for endpoint assertions.

---

## Tradeoffs
| Tradeoff | Model Factory (Eloquent) | Array Factory (Plain PHP) |
|---|---|---|
| Coupling | Tight (model schema changes break factories) | Loose (independent of models) |
| Setup code | Minimal (one definition) | More (manual array builders) |
| Persistence | Built-in (create() saves to DB) | Manual (must call Model::create()) |
| Relationships | Automatic (has(), for()) | Manual (must create related records) |
| Random data | Built-in (fake()) | Manual (must use faker directly) |

---

## Performance Considerations
Factory `create()` calls are database writes — each call adds overhead. Use `make()` instead of `create()` when you only need the model instance attributes (e.g., for request body). Use `factory()->count(N)->create()` to batch-insert N records in a single chunk. Use `afterCreating()` sparingly — callbacks run for each created record, adding O(N) overhead. For test data that doesn't change between test methods, create it in `beforeAll()` or `setUpBeforeClass()` and share state.

---

## Production Considerations
Factory definitions should match the production model schema exactly — a factory that creates invalid data produces misleading test results. Keep factories in `database/facteries/` and maintain them alongside migrations and models. Seed specific data via dedicated seeders for integration tests. Never use factory data in production (obviously, but a `php artisan db:seed` in production is a real risk). Factory `fake()` data should be locale-aware for internationalized applications.

---

## Common Mistakes
- Using `create()` when `make()` suffices — unnecessary database writes.
- Forgetting to refresh database between tests — factory-created records pollute subsequent tests.
- Defining factories with hardcoded values instead of `fake()` — tests become brittle to uniqueness constraints.
- Not defining states for edge cases — null values, empty strings, boundary values must be factory-producible.
- Defining circular factory relationships — `PostFactory` tries to create a `User` that creates a `Post` — infinite loop.
- Using `factory()->create()` inside a loop — O(N) database round trips instead of `factory()->count(N)->create()`.

---

## Failure Modes
- **Unique constraint violation**: `fake()->unique()` not used for email/username — tests fail intermittently when Faker generates duplicates.
- **Missing required relationship**: Factory creates a `Post` without an associated `User` (nullable foreign key) — test passes but production requires author.
- **Factory state mismatch**: `published()` state creates a post with `published_at: null` — tests assume published posts have dates.
- **afterCreating recursion**: `afterCreating` triggers a side effect that calls create on the same factory — infinite loop.

---

## Ecosystem Usage
Laravel's first-party packages use factories extensively for test setup. Spatie's packages define factories for all their models. `laravel-eloquent-factories` is the core package. PestPHP provides `factory()` global helper and `beforeEach()` for factory setup. `FakerPHP/Faker` is the default fake data generator used by factories.

---

## Related Knowledge Units
### Prerequisites
- Laravel Eloquent Models (schema, relationships)
- Database Migrations (column types, constraints)

### Related Topics
- feature-test-structure (factories for test setup)
- layer-isolation-in-tests (factory vs mock tradeoffs)
- happy-path-testing (factory-created data for assertions)

### Advanced Follow-up Topics
- Factory collections and custom collection methods
- Test data builders (Builder pattern instead of factories)
- Fixture management for large test datasets

---

## Research Notes
### Source Analysis
`Illuminate\Database\Eloquent\Factories\Factory` is the base class. `FakerPHP/Faker` (v1.20+) provides fake data generation via `fake()` helper. Laravel's `Factory` class replaces the legacy `factory()` helper (deprecated in Laravel 8).
### Key Insight
Factory design is the single biggest determinant of test suite maintainability — well-factored factories make tests readable and fast; poorly designed factories make tests a maintenance burden.
### Version-Specific Terms
Laravel 11 uses the `Factory` pattern (classes, not helpers). The `fake()` helper was introduced in Laravel 8. `Sequence` class at `Illuminate\Database\Eloquent\Factories\Sequence`. PestPHP 2.x provides `factory()->create()` via `DatabaseFactories` trait.
