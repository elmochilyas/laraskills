# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Database Testing
Knowledge Unit: Model Factory Patterns
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Model factories create Eloquent model instances with consistent defaults, enabling readable and maintainable test data setup. Laravel's factory system supports `definition()` methods, named states, sequences, relationships, and `afterCreating()`/`afterMaking()` callbacks. Well-designed factories are the foundation of all database tests—they determine test readability, setup time, and data consistency. Poorly designed factories lead to slow tests, flaky assertions, and unreadable test setup.

# Core Concepts
- **`Factory::new()` or `Model::factory()`**: Entry point for creating factory instances. Returns a `Factory` builder instance.
- **`definition()` method**: Returns an array of default attribute values. Called when creating or making a model instance.
- **`state()` methods**: Named factory variants (e.g., `->state(['role' => 'admin'])`). Typically defined as methods on the factory class.
- **`create()` vs `make()`**: `create()` persists to database. `make()` returns an unsaved instance (doesn't run `afterCreating` callbacks).
- **Sequences**: `->sequence(['status' => 'pending'], ['status' => 'approved'])` cycles through values for multiple records.
- **Relationships**: `has()` (hasMany), `for()` (belongsTo), `hasAttached()` (many-to-many) for creating related models.
- **`afterCreating()` / `afterMaking()`**: Callbacks that run after persist/make. Used for attaching relationships or computing derived attributes.
- **Counts**: `->count(3)->create()` creates N records.

# Mental Models
- **Factory as test data builder**: A fluent builder that constructs Eloquent model instances with sensible defaults and per-test overrides.
- **Default values as "valid" values**: Factory defaults should always pass validation. Use `state()` for edge case values (invalid, boundary, special).
- **States as named scenarios**: `->admin()->unverified()` reads like a sentence: "create an admin, unverified user." States compose via chaining.
- **Relationships as data graph construction**: `User::factory()->hasPosts(3)->create()` creates a user with 3 posts in one expression.

# Internal Mechanics
- **`definition()` resolution**: Called once per model instantiation. Attributes are merged: `array_merge(definition(), overrides(), state_overrides())`. Last writer wins.
- **Lazy state resolution**: `state()` accepts closures: `state(fn (array $attrs) => ['email' => str($attrs['name'])->snake()->append('@test.com')])`. The closure receives currently resolved attributes.
- **Sequences cycle**: `sequence(...)` cycles through provided values. After the last value, it wraps to the first. `->count(5)->sequence(...)` distributes values across 5 records.
- **Relationship creation**: `has()` calls `saveMany()` after the parent model is created. `for()` creates the parent model and sets the foreign key before child creation.
- **`afterCreating` callbacks**: Registered in `configure()` method. Called after each `create()`. Not called on `make()`. Useful for attaching roles, creating profiles, generating tokens.
- **Factory resolution**: `User::factory()` resolves the factory class via `newUserFactory()` method or convention (`Database\Factories\UserFactory`).

# Patterns
- **Pattern: Named states for common scenarios**
  - Purpose: Define reusable factory variants as methods
  - Benefits: Readable test setup, centralized scenario definitions
  - Tradeoffs: Too many states clutter factory class
  - Implementation: `public function admin(): static { return $this->state(fn () => ['role' => 'admin']); }`

- **Pattern: Conditional relationship creation**
  - Purpose: Create related models only when needed
  - Benefits: Avoids unnecessary database writes
  - Tradeoffs: Must remember to attach relationships in tests
  - Implementation: `User::factory()->has(Post::factory()->count(3))->create()`

- **Pattern: Factory for pivot data**
  - Purpose: Set additional attributes on pivot tables (many-to-many)
  - Benefits: Complete many-to-many relationship testing
  - Tradeoffs: Pivot data assertions are more complex
  - Implementation: `User::factory()->hasAttached(Role::factory(), ['expires_at' => now()])`

- **Pattern: Minimal data principle**
  - Purpose: Create only the data needed for the test
  - Benefits: Faster tests, less database pressure
  - Tradeoffs: Missing relationship data may cause unexpected null errors
  - Implementation: Create 1-2 records per entity; avoid `count(10+)` unless testing pagination

# Architectural Decisions
- **`create()` vs `make()` for related models**: Use `create()` when the relationship must exist in the database. Use `make()` when the test doesn't need persisted related models.
- **Factory location**: Place factories in `database/facteries/`. Follow model name convention: `UserFactory` ? `User` model.
- **States vs explicit overrides**: Use states for named scenarios used in 2+ tests. Use explicit `->state(['key' => 'value'])` for one-off overrides.
- **Single vs multiple factory classes per model**: One factory per model. For very complex models (100+ attributes), consider splitting into trait-based state groups.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Readable test setup with states/flunt chaining | Factory states can proliferate without governance | Review and consolidate states periodically |
| `afterCreating` handles complex setup | Callback execution order can be surprising | Document callback dependencies |
| Sequences enable varied test data | Sequence wrapping may not be intentional | Test with specific assertions on sequence output |
| `make()` is fast (no DB) | `afterCreating` callbacks don't run | Use `create()` when after-creation logic matters |

# Performance Considerations
- `make()`: <1ms per model (no persistence).
- `create()`: 2-10ms per model (insert + callbacks).
- `count(N)->create()`: Individual inserts. For N > 100, use `insert()` or `chunk()` for performance.
- Relationship creation: `hasPosts(3)` adds ~6-30ms. Nested relationships multiply.
- `afterCreating` callbacks: Add linear time per created model. Avoid heavy callbacks in loops.

# Production Considerations
- **Factory data freshness**: Factory defaults should stay in sync with model changes (new required columns, modified casts). Run factory smoke tests in CI.
- **Factory state documentation**: Factory methods serve as documentation of possible model states. Keep them reviewed and updated.
- **Factory vs seeder for reference data**: Use seeders for global reference data (countries, roles). Use factories for per-test data.
- **Factory performance**: For feature tests with complex data setup, use `DatabaseTruncation` (faster than repeated `RefreshDatabase` rollbacks for very large data sets).

# Common Mistakes
- **Mistake: Random data in factory defaults**
  - Why: `'email' => fake()->email()` in definition
  - Why harmful: Test failures show different data each run; debugging is hard
  - Better: Use fixed strings for defaults. Use `fake()` only in states where randomness is meaningful.

- **Mistake: Creating more data than needed**
  - Why: `User::factory()->count(50)->create()` for a test that needs 2 users
  - Why harmful: Slower tests, more database contention
  - Better: Create only the minimum data for the test scenario

- **Mistake: Missing factories for related models**
  - Why: Test creates model but forgets to create required belongs-to relationship
  - Why harmful: Foreign key constraint violation or null reference error
  - Better: Use `for()` relationship in factory definition for required belongs-to

- **Mistake: Overriding definitions instead of using states**
  - Why: `User::factory()->create(['role' => 'admin'])` in many tests
  - Why harmful: Duplicated 'admin' role setup across tests; if admin role definition changes, many tests need updates
  - Better: Define `admin()` state on the factory; tests use `User::factory()->admin()->create()`

# Failure Modes
- **Factory resolution failure**: Factory class not found. Convention mismatch: `UserFactory` for `User` model. Laravel auto-discovers factories.
- **State conflict**: Two states modify the same attribute. `state(['role' => 'admin'])->state(['role' => 'editor'])` — last state wins.
- **Sequence exhaustion**: `sequence()` with N values but creating N+1 records. Sequence wraps to the first value, potentially causing unexpected data.
- **`afterCreating` order dependency**: `afterCreating` callbacks registered in different order may produce different results. Keep callbacks independent.
- **Circular factory dependency**: `UserFactory` requires `ProfileFactory` which requires `UserFactory`. Break the cycle with optional relationships or `make()`.

# Ecosystem Usage
- **Laravel core**: Laravel's default `UserFactory` demonstrates standard factory patterns.
- **Spatie Laravel Permission**: Permission factories create roles and permissions with `afterCreating` callbacks.
- **Laravel Media Library**: Media factory examples show relationship creation with `hasMedia()` states.
- **Laravel Spark**: Spark's subscription factories demonstrate complex state machines with multiple states (trialing, on grace period, canceled).

# Related Knowledge Units
- **Prerequisites**: Eloquent relationships, Database migrations, Seeder patterns
- **Related Topics**: Database testing lifecycle, Database assertions, Test data management
- **Advanced Follow-up**: DTO test factories, Factory trait organization, Declarative factory patterns

# Research Notes
- Laravel's RefreshDatabase trait uses database transactions for test isolation, rolling back changes after each test — this is the fastest approach for MySQL/PostgreSQL
- SQLite in-memory database is a common testing strategy but has limitations: lacks full-text search, JSON functions differ, and some MySQL-specific features are unavailable
- Model factories with relationships require careful fterCreating() callback management to avoid N+1 factory creation during test setup
- ssertDatabaseHas() and ssertDatabaseMissing() are the primary assertion helpers; they query the database directly — ensure test database is properly configured
- Database testing performance: RefreshDatabase with SQLite in-memory runs ~50-100 tests/second; PostgreSQL via transactions runs ~30-60 tests/second
