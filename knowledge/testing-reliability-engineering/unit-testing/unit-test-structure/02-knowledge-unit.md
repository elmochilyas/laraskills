# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Unit Testing
Knowledge Unit: Unit Test Structure
KU Code: ku-01-unit-test-structure
ECC Phase: 4
Last Updated: 2026-06-02

# Executive Summary
Unit tests validate isolated business logic without booting the full Laravel framework. The `#[UnitTest]` attribute (Pest) or extending `PHPUnit\Framework\TestCase` directly signals a true unit test. Unit tests are the fastest tests (sub-millisecond) and provide the tightest feedback loop for business logic changes. In a typical Laravel project, approximately 70% of tests are feature tests and 20% are unit tests covering pure domain logic.

# Core Concepts
- **No framework booting**: True unit tests do not boot Laravel's service container, register routes, or connect to a database.
- **`#[UnitTest]` attribute**: Pest attribute that skips Laravel's application boot. Reduces execution from ~50ms to <1ms.
- **Class-under-test isolation**: Tests a single class in isolation. Dependencies injected as mocks/stubs.
- **Arrange-Act-Assert (AAA)**: Universal structure. Arrange: create objects/mocks. Act: call method. Assert: verify result.
- **Coverage focus**: Business logic, calculations, conditional branches, edge cases.

# Mental Models
- **Unit test as specification**: Each unit test describes a specific behavior of the class. Test names should read as specifications.
- **Framework boot as cost**: Every millisecond of framework boot is waste for pure logic tests. `#[UnitTest]` eliminates this cost.
- **Test pyramid**: Unit tests form the base of the test pyramid — fast, numerous, and focused on isolated logic.

# Internal Mechanics
- `#[UnitTest]` attribute registers a PHPUnit extension that skips Laravel's `refreshApplication()` call.
- Without `#[UnitTest]`, Pest's default `Tests\TestCase` creates a full Laravel application instance per test.
- PHPUnit creates a new test class instance for each test method, ensuring isolation.
- `$this->createMock()` generates a proxy class via reflection on first use, cached for subsequent tests.

# Patterns
- **AAA pattern**: Arrange (create objects), Act (call method), Assert (verify result). Universal test structure.
- **One scenario per test pattern**: Each test method verifies exactly one behavior. Named as behavior specifications.
- **Dataset pattern**: Use `->with()` for testing multiple input variations with a single test definition.
- **State verification over interaction verification**: Assert results, not method calls. More stable across refactoring.

# Architectural Decisions
- **Decision: `#[UnitTest]` over base test case**: Explicitly marks tests that don't need framework boot. Prevents accidental framework dependency.
- **Decision: PHPUnit mocks over Mockery by default**: PHPUnit's built-in mocking is sufficient for most unit tests. Mockery is reserved for advanced scenarios.
- **Decision: Dependency injection over facades**: Constructor-injected dependencies are mockable. Facades require container setup.

# Tradeoffs
- **Isolation vs integration**: True unit tests with mocked dependencies are fast but may miss integration issues. Balance with feature tests.
- **Mock specificity**: Stubs (return values) are less brittle than mocks (call expectations). Prefer stubs for query methods, mocks for command methods.
- **Real instances vs mocks**: Value objects and collections should use real instances. External services should be mocked.

# Performance Considerations
- Execution speed: With `#[UnitTest]`, <1ms per test. Without it, ~30-50ms per test.
- Memory: ~2MB per test process without framework vs ~30MB with framework.
- Paratest efficiency: Unit tests benefit most from parallel execution (CPU-bound, no I/O contention).
- OpCache impact: Unit tests benefit from OpCache. Same classes loaded repeatedly.

# Production Considerations
- Test isolation: Unit tests should not write to databases, send network requests, or modify filesystem.
- Static state: Classes with static properties may leak state between tests. Reset in `setUp()`.
- DateTime dependency: `Carbon::now()` produces different results each run. Freeze time in `setUp()`.
- No side effects: Unit tests should be pure — same input always produces same output.

# Common Mistakes
- **Framework boot in unit tests**: Using `Tests\TestCase` without `#[UnitTest]`. Test takes 30ms+ instead of <1ms.
- **Testing implementation details**: Asserting private methods or internal state. Tests break on refactoring without behavior change.
- **Over-mocking**: Mocking every dependency even when real instances work. Tests become brittle.
- **Database calls in unit tests**: Calling Eloquent methods that trigger SQL queries. Tests fail without a database.

# Failure Modes
- Missing `#[UnitTest]`: Test inadvertently boots framework. Slower, and may mask missing dependency issues.
- Time-dependent failures: Tests using `now()` fail when run near midnight or during DST transitions.
- Static state pollution: One test modifying a static property affects subsequent tests.
- Mock expectation mismatch: Over-specified mocks fail on legitimate refactoring.

# Ecosystem Usage
- Pest's `#[UnitTest]` attribute is the standard way to mark Laravel unit tests.
- PHPUnit's `$this->createMock()` and `$this->createStub()` are the primary mocking tools.
- `Carbon::setTestNow()` is the standard approach for time manipulation in tests.
- Community conventions place unit tests in `tests/Unit/` mirroring `app/` namespace.

# Related Knowledge Units
- Test double taxonomy (dummies, stubs, spies, mocks, fakes)
- DTO test factories
- Dependency injection testing
- Service container resolution
- Mockery integration

# Research Notes
- The `#[UnitTest]` attribute was introduced in Pest 2. Prior versions required extending `PHPUnit\Framework\TestCase` directly.
- PHPUnit's mock generator uses reflection to create proxy classes. First call per class has a ~5ms overhead.
- The AAA pattern is universal across testing frameworks and languages, originating from the xUnit family.
