# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Unit Testing
Knowledge Unit: Unit Test Structure
 KU Code: ku-01-unit-test-structure
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Unit tests validate isolated business logic — services, actions, value objects, policies, and custom rules — without booting the full Laravel framework. In a typical Laravel project (~70% feature tests), unit tests cover the remaining 20%: pure domain logic, algorithmic correctness, and calculation-heavy code. The `#[UnitTest]` attribute (Pest) or avoiding `RefreshDatabase` signals a true unit test. Unit tests are the fastest tests (sub-millisecond) and provide the tightest feedback loop for business logic changes.

# Core Concepts
- **No framework booting**: True unit tests do not boot Laravel's service container, register routes, or connect to a database.
- **`#[UnitTest]` attribute**: Pest attribute that skips Laravel's application boot. Reduces execution from ~50ms to <1ms.
- **Class-under-test isolation**: Tests a single class in isolation. Dependencies injected as mocks/stubs.
- **Arrange-Act-Assert (AAA)**: Universal structure. Arrange: create objects/mocks. Act: call method. Assert: verify result.
- **Coverage focus**: Business logic, calculations, conditional branches, edge cases. Not database queries, HTTP responses, or views.
- **Service/action pattern**: Single-action controllers and service classes are primary unit test targets.

# When To Use
- Pure business logic (calculations, transformations, validations)
- Service and action classes (orchestration with injected dependencies)
- Policy and authorization logic
- Value object invariants and immutability
- Custom validation rules
- Algorithmic correctness (sorting, filtering, pricing)
- Stateless helper functions and formatters

# When NOT To Use
- Code that touches database, HTTP, cache, queue, or filesystem
- Blade view rendering or component output
- Authentication flows (use feature tests for `actingAs`)
- Full request/response cycles (use feature tests)
- Integration between multiple services (use feature tests)
- Browser interactions (use Dusk or Pest Playwright)

# Best Practices (WHY)
- **Always use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly**: Reason: without it, tests boot the framework unnecessarily, taking 30-50ms instead of <1ms. Framework boot is not needed for pure logic.
- **Prefer state verification over interaction verification**: Reason: asserting the result (`assertEquals(4, $calculator->add(2, 2))`) is more stable than asserting that a method was called. State tests don't break on refactoring.
- **Use real implementations for value objects and collections**: Reason: `new Email('test@example.com')` is simpler and more reliable than mocking `Email`. Mocking value objects adds zero value.
- **Test one scenario per test method**: Reason: a test named `it_calculates_tax_for_domestic_order` is self-documenting. Multiple scenarios in one test make failures harder to diagnose.
- **Name tests as behavior specifications**: Reason: `it_prevents_publishing_without_content` reads as a specification. `test_post_1` tells you nothing.
- **Cover all conditional branches**: Reason: `if/else`, `switch`, `match`, and ternary operators are where bugs hide. Each branch needs a test case.
- **Use datasets for boundary/edge case testing**: Reason: `->with(['negative' => [-1, 0], 'zero' => [0, 0], 'positive' => [5, 5]])` concisely covers multiple inputs.

# Architecture Guidelines
- **File location**: `tests/Unit/` directory, mirroring `app/` namespace structure.
- **Class naming**: `{ClassName}Test` for PHPUnit. `{ClassName}Test.php` file for Pest with class-free syntax.
- **Dependency injection**: Constructor-inject dependencies into the class under test. Use `$this->createMock()` or `$this->createStub()` for unit tests.
- **Attribute usage**: `#[UnitTest]` on the test class (Pest). For PHPUnit, extend `PHPUnit\Framework\TestCase`.
- **Helper function usage**: Laravel helpers (`str()->slug()`, `collect()`, `retry()`) work without framework boot.
- **Facade avoidance**: Facades require the container. Use dependency injection instead in unit-tested classes.

# Performance
- **Execution speed**: With `#[UnitTest]`, <1ms per test. Without it, ~30-50ms per test.
- **Memory**: ~2MB per test process without framework vs ~30MB with framework.
- **Paratest efficiency**: Unit tests benefit most from parallel execution (CPU-bound, no I/O contention).
- **OpCache impact**: Unit tests benefit from OpCache. Same classes loaded repeatedly.

# Security
- **Test isolation**: Unit tests should not write to databases, send network requests, or modify filesystem.
- **Static state**: Classes with static properties may leak state between tests. Reset in `setUp()`.
- **DateTime dependency**: `Carbon::now()` or `new DateTime()` produce different results each run. Freeze time in `setUp()`.
- **No side effects**: Unit tests should be pure — same input always produces same output.

# Common Mistakes

**Mistake: Framework boot in unit tests**
- Description: Using `Tests\TestCase` base class without `#[UnitTest]`
- Cause: Not knowing about `#[UnitTest]` attribute or its PHPUnit equivalent
- Consequence: Test takes 30ms+ instead of <1ms; creates false dependency on framework
- Better: Always use `#[UnitTest]` (Pest) or extend `PHPUnit\Framework\TestCase` directly.

**Mistake: Testing implementation details**
- Description: Asserting that a private method was called or internal state matches
- Cause: "I need to verify the internal logic is correct"
- Consequence: Tests break on refactoring without behavior change; high maintenance cost
- Better: Test public API behavior, not internal implementation. Use code coverage to verify paths.

**Mistake: Over-mocking**
- Description: Mocking every dependency even when real instances work
- Cause: "All dependencies must be mocked for true isolation"
- Consequence: Tests become brittle; mock setup is verbose; real behavior not tested
- Better: Use real instances for value objects, collections, and simple services. Mock only at service boundaries.

**Mistake: Database calls in unit tests**
- Description: Calling Eloquent methods that trigger SQL queries
- Cause: "I'll just use the model directly; it's easier"
- Consequence: Tests fail without a database connection; not true unit tests
- Better: Mock the repository/query builder at the class boundary. Use `new Model([...])` without saving.

# Anti-Patterns
- **Integration in disguise**: A unit test that boots the framework, connects to DB, and calls HTTP endpoints. That's a feature test.
- **Mocking Eloquent models**: Eloquent models are tightly coupled to the database. Don't mock them. Use factory-created records in feature tests instead.
- **Testing private methods directly**: Private methods are implementation details. Test them through public methods.
- **No edge case coverage**: Testing only the "happy path" misses bugs in boundary conditions.
- **Assertion-free tests**: Tests that don't assert anything. They pass vacuously and provide no value.

# Examples

**Pure function test with Pest**
```php
test('tax calculator applies correct rate', function () {
    $calculator = new TaxCalculator();

    $result = $calculator->calculate(100.00, 0.08);

    expect($result->subtotal)->toBe(100.00);
    expect($result->tax)->toBe(8.00);
    expect($result->total)->toBe(108.00);
});
```

**Service test with mocked dependency**
```php
test('register user action creates user and dispatches event', function () {
    $repository = $this->createMock(UserRepository::class);
    $dispatcher = $this->createMock(EventDispatcher::class);
    $action = new RegisterUserAction($repository, $dispatcher);

    $user = new User(['name' => 'Test', 'email' => 'test@example.com']);
    $repository->method('save')->willReturn($user);
    $dispatcher->expects($this->once())->method('dispatch');

    $result = $action->execute(['name' => 'Test', 'email' => 'test@example.com']);

    expect($result)->toBe($user);
});
```

**Policy test with datasets**
```php
test('user can edit post based on ownership and role', function (User $user, Post $post, bool $expected) {
    $policy = new PostPolicy();

    expect($policy->edit($user, $post))->toBe($expected);
})->with(function () {
    $owner = new User(['id' => 1, 'role' => 'member']);
    $admin = new User(['id' => 2, 'role' => 'admin']);
    $post = new Post(['user_id' => 1]);

    return [
        'owner can edit' => [$owner, $post, true],
        'admin can edit' => [$admin, $post, true],
        'other cannot edit' => [new User(['id' => 3, 'role' => 'member']), $post, false],
    ];
});
```

# Related Topics
- Test double taxonomy (dummies, stubs, spies, mocks, fakes)
- DTO test factories
- Dependency injection testing
- Service container resolution
- Mockery integration

# AI Agent Notes
- Always include `#[UnitTest]` attribute when generating Pest unit test classes.
- Use `$this->createMock()` for PHPUnit tests, `Mockery::mock()` only when advanced features are needed.
- Generate one test method per scenario. Use datasets for multiple input variations.
- Never generate tests that call Eloquent `save()`, `update()`, or query methods in unit tests.
- Use `Carbon::setTestNow()` in `setUp()` to freeze time for date-dependent logic.
- Prefer state assertions (`expect($result)->toBe(...)`) over interaction assertions (`$mock->expects()`).

# Verification
- [ ] Tests use `#[UnitTest]` (Pest) or extend `PHPUnit\Framework\TestCase` directly
- [ ] No framework booting (no `RefreshDatabase`, no `actingAs`, no HTTP calls)
- [ ] Dependencies are injected as constructor arguments, not facades
- [ ] Tests cover all conditional branches (if/else, switch, match)
- [ ] Time-sensitive tests use `Carbon::setTestNow()` in `setUp()`
- [ ] Each test has at least one assertion
- [ ] Edge cases (null, empty, negative, boundary values) are tested
- [ ] Test names describe the behavior being verified
