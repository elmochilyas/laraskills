# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Unit Testing
Knowledge Unit: Unit Testing Patterns
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Unit tests validate isolated business logic—services, actions, value objects, policies, and custom rules—without booting the full Laravel framework. In a typical Laravel project (~70% feature tests), unit tests cover the remaining 20%: pure domain logic, algorithmic correctness, and calculation-heavy code. The `#[UnitTest]` attribute (Pest) or avoiding `RefreshDatabase` signals that a test is a true unit test. Unit tests are the fastest tests (sub-millisecond) and provide the tightest feedback loop for business logic changes.

# Core Concepts
- **No framework booting**: True unit tests do not boot Laravel's service container, register routes, or connect to a database. They instantiate classes directly with `new` operator.
- **`#[UnitTest]` attribute**: Pest attribute that skips Laravel's application boot for that test class, reducing execution time from ~50ms to <1ms.
- **Class-under-test isolation**: Unit tests test a single class in isolation. Dependencies are injected as mocks/stubs, not real implementations.
- **Arrange-Act-Assert (AAA)**: Universal unit test structure. Arrange: create objects and mocks. Act: call the method under test. Assert: verify the result.
- **Coverage focus**: Business logic, calculations, conditional branches, edge cases. Not database queries, HTTP responses, or view rendering.
- **Service/action pattern**: Laravel's single-action controllers and service classes are primary unit test targets.

# Mental Models
- **Unit test as mathematical proof**: The test proves that given input X, the output is always Y, with no side effects. No database, no framework, no I/O.
- **Fast feedback loop**: A unit test should execute in <10ms. If it takes longer, it's probably not a unit test.
- **Fakes at boundaries**: Mock external dependencies (database, API, mail) at the class boundary. The test shouldn't know about implementation details beyond the interface.
- **Behavior verification, not implementation**: Test what the class does, not how it does it. Prefer state verification (assert result) over interaction verification (assert method called).

# Internal Mechanics
- **`#[UnitTest]` behavior**: Pest detects the attribute, skips `CreatesApplication` trait, and does not boot the Laravel application. The test class extends `PHPUnit\Framework\TestCase` directly, not `Tests\TestCase`.
- **Service container resolution**: Without the container, dependencies must be manually instantiated or mocked. `$this->createMock()` is the native PHPUnit approach.
- **Eloquent models in unit tests**: Eloquent models can be instantiated without a database connection if not performing queries. `$model = new User(['name' => 'test'])` works without DB. Saving/queries will fail.
- **Helper functions**: Laravel helper functions (e.g., `str()->slug()`, `collect()`) do NOT require the framework. They are stateless and can be called directly.
- **Facades in unit tests**: Facades require the Laravel container. Use dependency injection instead of facades in unit-tested classes, or mock the underlying class.

# Patterns
- **Pattern: Pure function testing**
  - Purpose: Test stateless service methods that transform input to output
  - Benefits: Fastest possible tests, no dependencies to manage
  - Tradeoffs: Only covers pure logic; many Laravel classes have side effects
  - Example: `new TaxCalculator()->calculate($subtotal, $rate)` with various inputs

- **Pattern: Value object creation/immutability**
  - Purpose: Verify value objects initialize correctly, enforce invariants, and remain immutable
  - Benefits: Catches edge cases in domain primitives early
  - Tradeoffs: Many value objects are simple getters; testing can feel redundant
  - Example: `new Email('test@example.com')` tests for valid/invalid formats, equality

- **Pattern: Policy/rule boundary testing**
  - Purpose: Test authorization logic and custom validation rules
  - Benefits: Security-critical logic is validated independently
  - Tradeoffs: Policies often depend on user/team relationships
  - Example: `$policy->view($user, $post)` with various user roles and post states

- **Pattern: Action/service orchestration with mocked dependencies**
  - Purpose: Test that an action class coordinates its dependencies correctly
  - Benefits: Isolates orchestration logic from implementation details
  - Tradeoffs: Tests are coupled to the action's dependency interfaces, which is acceptable
  - Example: `new RegisterUserAction($userRepo, $mailer)->execute($data)`

# Architectural Decisions
- **Unit test vs feature test**: Pure business logic → unit test. Code that touches database, HTTP, or framework → feature test. The ~70/20/10 ratio is a guideline, not a rule.
- **`#[UnitTest]` vs manual boot skipping**: Prefer `#[UnitTest]` for Pest. For PHPUnit, extend `PHPUnit\Framework\TestCase` directly instead of `Tests\TestCase`.
- **Mock vs real implementation**: Prefer real implementations for value objects, collections, and stateless helpers. Mock for repositories, API clients, and services with side effects.
- **Coverage measurement**: Unit tests on business logic should aim for >90% line coverage. Conditional branches (if/else, switch) need explicit coverage.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fast execution (<1ms per test) | Limited scope—cannot test HTTP, DB, or integration | Must combine with feature tests for full coverage |
| No framework boot, simple setup | Must manually manage dependencies | More boilerplate for complex dependency graphs |
| True isolation, no side effects | Cannot verify real database behavior | SQL correctness must be covered by feature tests |
| `#[UnitTest]` attribute is expressive | Only available in Pest; requires PHP 8.2+ | PHPUnit users must extend `TestCase` directly |

# Performance Considerations
- **Execution speed**: Unit tests with `#[UnitTest]` execute in <1ms. Comparable tests with full framework boot take ~30-50ms. For 100 unit tests, that's <100ms vs 3-5 seconds.
- **Memory**: No framework boot = minimal memory (~2MB per test process vs ~30MB with framework).
- **Paratest efficiency**: Unit tests benefit most from parallel execution because they're CPU-bound and have no I/O contention.
- **OpCache impact**: Unit tests benefit from OpCache because the same classes are loaded repeatedly. No framework boot means less code to cache.

# Production Considerations
- **CI speed**: Unit tests should complete in <10 seconds even for large suites. If unit tests take longer than feature tests, something is wrong (likely framework boot leakage).
- **Developer experience**: Run unit tests continuously during development (`php artisan test --unit` or `pest --unit`). Fast feedback for business logic changes.
- **Test count ratio**: A healthy project has 2-3x more unit tests than the number of business logic classes. Each service, action, rule, policy, and value object should have a dedicated test file.
- **Documentation via tests**: Unit tests document the behavior of business logic classes. Well-named test methods serve as living specification.

# Common Mistakes
- **Mistake: Framework boot in unit tests**
  - Why: Using `Tests\TestCase` base class without `#[UnitTest]`
  - Why harmful: Test takes 30ms+ instead of <1ms; creates false dependency on framework
  - Better: Always use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly

- **Mistake: Testing implementation details**
  - Why: Asserting that a private method was called or that internal state matches
  - Why harmful: Tests break on refactoring without behavior change
  - Better: Test the public API behavior, not internal implementation

- **Mistake: Over-mocking**
  - Why: Mocking every dependency even when real instances work
  - Why harmful: Tests become brittle; mock setup is verbose; real behavior not tested
  - Better: Use real instances for value objects, collections, and simple services

- **Mistake: Database calls in unit tests**
  - Why: Calling Eloquent methods that trigger SQL queries
  - Why harmful: Tests fail without a database connection
  - Better: Mock the repository/query builder at the class boundary

# Failure Modes
- **Static state leakage**: Classes with static properties (singletons, config holders) may leak state between unit tests. Reset in `setUp()`.
- **Facade call in unit tests**: Code using `Cache::get()`, `Log::info()`, etc. requires the container. Use dependency injection or mock the underlying driver.
- **Missing autoloader**: Unit tests that don't go through Laravel's autoloader may miss package autoloading. Ensure Composer autoloader is included.
- **DateTime dependency**: Tests using `Carbon::now()` or `new DateTime()` produce different results each run. Use `Carbon::setTestNow()` in `setUp()`.

# Ecosystem Usage
- **Laravel core**: Laravel's own unit tests cover helpers, collections, strings, and routing logic without framework boot.
- **Domain-driven design packages**: DDD-focused packages extensively use unit tests for domain entities, value objects, and domain services.
- **Spatie packages**: Many Spatie packages maintain separate unit and feature test directories with clear separation.

# Related Knowledge Units
- **Prerequisites**: PHPUnit/Pest basics, Test double taxonomy, Object-oriented design
- **Related Topics**: Service container resolution, Mockery integration, Value object design
- **Advanced Follow-up**: DTO test factories, Null driver pattern, Hexagonal architecture testing

# Research Notes
- `#[UnitTest]` attribute in Pest 4+ automatically detects and skips framework boot—no manual boot management needed
- The distinction between "unit test" and "feature test" is blurrier in Laravel than traditional frameworks; pragmatic teams err toward feature tests
- Benjamin Crozat's 2026 guide recommends unit testing only for: calculations, validation rules, authorization policies, and value object invariants
