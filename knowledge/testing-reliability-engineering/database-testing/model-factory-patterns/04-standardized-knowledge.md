# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Database Testing |
| Knowledge Unit | Model Factory Patterns |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Eloquent relationships, Database migrations, Seeder patterns |
| Related KUs | Database testing lifecycle, Database assertions, Test data management |
| Source | domain-analysis.md K006 |

# Overview

Model factories create Eloquent model instances with consistent defaults, enabling readable and maintainable test data setup. Laravel's factory system supports `definition()` methods, named states, sequences, relationships, and `afterCreating()`/`afterMaking()` callbacks. Well-designed factories are the foundation of all database tests — they determine test readability, setup time, and data consistency. Poorly designed factories lead to slow tests, flaky assertions, and unreadable test setup.

# Core Concepts

- **`Model::factory()`**: Entry point for creating factory instances. Returns a `Factory` builder.
- **`definition()` method**: Returns an array of default attribute values.
- **`state()` methods**: Named factory variants (e.g., `->admin()`). Typically defined as methods on the factory class.
- **`create()` vs `make()`**: `create()` persists to database. `make()` returns an unsaved instance.
- **Sequences**: `->sequence(['status' => 'pending'], ['status' => 'approved'])` cycles values for multiple records.
- **Relationships**: `has()` (hasMany), `for()` (belongsTo), `hasAttached()` (many-to-many).
- **`afterCreating()` / `afterMaking()`**: Callbacks for post-creation logic.

# When To Use

- When setting up any database-driven test
- When multiple tests need the same model configurations (use states)
- When testing relationships and complex data graphs
- When factory defaults provide "valid" data that passes model validation

# When NOT To Use

- For reference/seed data that is shared across all tests (use seeders instead)
- When tests need exact control over every attribute (use explicit arrays)
- When model has no validation or persistence logic (test with mocks instead)
- When factory overhead outweighs the value (very simple models with 2-3 fields)

# Best Practices (WHY)

- **Use fixed strings, not faker, in factory defaults**: Random data makes test failures non-reproducible and debugging hard. `'email' => 'admin@example.com'` is better than `'email' => fake()->email()`. Reserve faker for states where randomness is meaningful.
- **Create only the minimum data needed**: 1-2 records per entity is sufficient for most tests. `count(50)->create()` slows tests unnecessarily unless testing pagination or bulk operations.
- **Use named states for scenarios used in 2+ tests**: `User::factory()->admin()->create()` centralizes admin user definition. Without states, the same overrides are duplicated across tests.
- **Define required belongs-to relationships in the factory**: If a Post always needs a User, define it in `definition()` with `'user_id' => User::factory()`. This prevents foreign key constraint errors in tests that forget to create the parent.
- **Use `afterCreating()` for post-creation setup**: Attach roles, create profiles, or generate tokens after the model exists. Only use `afterCreating()` — it runs on persist. `afterMaking()` runs even on unsaved instances.

# Architecture Guidelines

- **Factory location**: `database/factories/` following model name convention (`UserFactory` → `User`).
- **States vs explicit overrides**: States for named scenarios used in 2+ tests. Explicit `->state(['key' => 'value'])` for one-off overrides.
- **Single factory per model**: One factory class per Eloquent model. For complex models, organize states using traits.
- **create() vs make()**: `create()` when the record must be persisted. `make()` when the test doesn't need database persistence.

# Performance Considerations

- `make()`: <1ms per model (no persistence).
- `create()`: 2-10ms per model (insert + callbacks).
- `count(N)->create()`: Individual inserts. For N > 100, consider chunked inserts.
- Relationship creation: `hasPosts(3)` adds ~6-30ms. Nested relationships multiply.
- `afterCreating` callbacks: Add linear time per created model. Avoid heavy callbacks in loops.

# Security Considerations

- Factory data should never contain real user credentials or secrets
- Factories that create users with password fields should use `Hash::make('password')` or `bcrypt('password')` for consistency
- Factory-created data should be clearly identifiable as test data

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Random data in factory defaults | `'email' => fake()->email()` in definition | Test failures show different data each run; debugging is hard | Use fixed strings for defaults. Use fake() only in states where randomness is meaningful |
| Creating more data than needed | `User::factory()->count(50)->create()` for a test needing 2 users | Slower tests, more database contention | Create only the minimum data for the test scenario |
| Missing factories for related models | Test creates model but forgets required belongs-to | Foreign key constraint violation or null reference error | Use for() relationship in factory definition for required belongs-to |
| Overriding definitions instead of using states | `User::factory()->create(['role' => 'admin'])` in many tests | Duplicated 'admin' role setup across tests; changes need many updates | Define admin() state on factory; tests use User::factory()->admin()->create() |
| Using faker in assertions | Asserting against factory defaults that use faker | Assertion values never match because data is random | Use fixed strings in factory defaults or capture factory output for assertions |

# Anti-Patterns

- **Faker in every factory field**: Using `fake()->name()`, `fake()->email()`, etc. for all fields. Makes tests non-deterministic. Instead, use fixed defaults and use faker only in specific states.
- **Fat factories with 100+ attributes**: Including every possible model attribute in the factory definition. Instead, define only essential fields in `definition()` and add state methods for edge cases.
- **Heavy afterCreating callbacks**: Using `afterCreating` for complex operations like dispatching jobs or calling external APIs. Instead, test those operations separately.
- **No factory for critical models**: Not defining factories for core business entities. Every Eloquent model that user-facing logic depends on should have a factory.

# Examples

```php
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Test User',
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
            'role' => 'user',
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attrs) => [
            'role' => 'admin',
            'email' => 'admin@example.com',
        ]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attrs) => [
            'email_verified_at' => null,
        ]);
    }
}

// Using factories in tests
$user = User::factory()->create();
$admin = User::factory()->admin()->create();
$unverifiedUser = User::factory()->unverified()->create();
$usersWithPosts = User::factory()->has(Post::factory()->count(3))->create();
```

# Related Topics

- **Prerequisites**: Eloquent relationships, Database migrations, Seeder patterns
- **Related**: Database testing lifecycle, Database assertions, Test data management
- **Advanced**: DTO test factories, Factory trait organization, Declarative factory patterns

# AI Agent Notes

- When reviewing a project, check if factory defaults use fixed strings or faker. Fixed strings are strongly preferred for test determinism.
- Look for factory states that could be extracted from duplicated override patterns. If `->create(['role' => 'admin'])` appears in 3+ tests, extract it into an `admin()` state.
- Check that required belongs-to relationships are defined in the factory's `definition()` or via `for()`. Missing parent relationships cause foreign key constraint failures that are confusing to debug.
- For tests that only need a model instance without database persistence, use `make()` instead of `create()`. This avoids unnecessary database writes and speeds up tests.

# Verification

- [ ] Factory defaults use fixed strings, not faker
- [ ] Named states exist for scenarios used in 2+ tests
- [ ] Required belongs-to relationships are defined in factory definitions
- [ ] Tests create only minimum data needed (1-2 records per entity)
- [ ] afterCreating callbacks are lightweight and fast
- [ ] make() is used when database persistence isn't required
- [ ] Factory locations follow Laravel conventions in database/factories/
- [ ] No circular factory dependencies exist
