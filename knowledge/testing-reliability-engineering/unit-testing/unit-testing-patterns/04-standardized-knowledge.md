# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Unit Testing |
| Knowledge Unit | Unit Testing Patterns |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | PHPUnit/Pest basics, Test double taxonomy, OOP design |
| Related KUs | Service container, Mockery integration, Value object design |
| Source | domain-analysis.md K008 |

# Overview

Unit tests validate isolated business logic—services, actions, value objects, policies, and custom rules—without booting the full Laravel framework. In a typical Laravel project (~70% feature tests), unit tests cover the remaining 20%: pure domain logic, algorithmic correctness, and calculation-heavy code. The `#[UnitTest]` attribute (Pest) or avoiding `RefreshDatabase` signals that a test is a true unit test. Unit tests are the fastest tests (sub-millisecond) and provide the tightest feedback loop for business logic changes.

# Core Concepts

- **No framework booting**: True unit tests do not boot Laravel's service container, register routes, or connect to a database.
- **`#[UnitTest]` attribute**: Pest attribute that skips Laravel's application boot for that test class, reducing execution time from ~50ms to <1ms.
- **Class-under-test isolation**: Unit tests test a single class in isolation. Dependencies are injected as mocks/stubs.
- **Arrange-Act-Assert (AAA)**: Universal unit test structure. Arrange: create objects and mocks. Act: call the method under test. Assert: verify the result.
- **Coverage focus**: Business logic, calculations, conditional branches, edge cases. Not database queries, HTTP responses, or view rendering.

# When To Use

- Pure business logic validation (calculators, transformers, parsers)
- Service/action class orchestration testing
- Policy/gate logic testing
- Value object & DTO invariant testing
- Custom validation rule testing
- Algorithm correctness verification

# When NOT To Use

- HTTP request/response testing (use feature tests)
- Database interaction testing (use feature tests with database assertions)
- View rendering testing (use view tests)
- Browser behavior testing (use Dusk or Playwright)
- When the test requires framework boot (use feature tests)

# Best Practices (WHY)

- **Use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly**: Reason: ensures no framework boot overhead. Sub-millisecond execution.
- **Test behavior, not implementation**: Reason: tests that verify implementation details break on refactoring without behavior change.
- **Prefer real instances for value objects**: Reason: mocking value objects adds zero value. Real instances are simpler and more reliable.
- **Use mocks at class boundaries only**: Reason: mock external dependencies (database, API, mail) at the interface boundary, not internal collaborators.
- **Target >90% line coverage on business logic**: Reason: conditional branches (if/else, switch) need explicit coverage. Unit tests excel at this.

# Architecture Guidelines

- **File organization**: Mirror source structure in `tests/Unit/`. `tests/Unit/Services/TaxCalculatorTest.php` tests `app/Services/TaxCalculator.php`.
- **Framework-agnostic design**: Design business logic classes to accept dependencies via constructor injection. Avoid facades in unit-tested code.
- **Static state management**: Reset static properties in `setUp()` to prevent state leakage between tests.
- **DateTime determinism**: Use `Carbon::setTestNow()` in `setUp()` to freeze time for any time-dependent logic.

# Performance Considerations

- **Execution speed**: Unit tests with `#[UnitTest]` execute in <1ms. Comparable tests with boot take ~30-50ms.
- **Memory**: No framework boot = minimal memory (~2MB per test process vs ~30MB with framework).
- **Paratest efficiency**: Unit tests benefit most from parallel execution because they're CPU-bound with no I/O contention.
- **OpCache impact**: Unit tests benefit from OpCache because the same classes are loaded repeatedly.

# Security Considerations

- **Test isolation**: Ensure unit tests cannot leak data between test cases. Reset any static or singleton state in `setUp()`.
- **Sensitive logic**: Unit tests for security-critical code (policies, permissions) should cover both authorized and unauthorized scenarios.

# Common Mistakes

**Mistake: Framework boot in unit tests**
- Description: Using `Tests\TestCase` base class without `#[UnitTest]`
- Cause: Default Laravel test setup
- Consequence: Test takes 30ms+ instead of <1ms
- Better: Always use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly.

**Mistake: Testing implementation details**
- Description: Asserting that private methods were called or internal state matches
- Cause: Desire for thorough testing
- Consequence: Tests break on refactoring without behavior change
- Better: Test the public API behavior, not internal implementation.

**Mistake: Over-mocking**
- Description: Mocking every dependency even when real instances work
- Cause: "Mock all dependencies" approach
- Consequence: Tests become brittle; mock setup is verbose
- Better: Use real instances for value objects, collections, and simple services.

**Mistake: Database calls in unit tests**
- Description: Calling Eloquent methods that trigger SQL queries
- Cause: Not isolating at the repository boundary
- Consequence: Tests fail without a database connection
- Better: Mock the repository/query builder at the class boundary.

# Anti-Patterns

- **Partial mocks of the class under test**: Testing a class while mocking some of its own methods defeats the purpose of unit testing.
- **Facade calls in unit tests**: `Cache::get()`, `Log::info()` require the container. Use dependency injection instead.
- **DateTime-dependent tests without freezing**: Tests producing different results based on time of day.
- **Eloquent model queries in unit tests**: Using `User::where()` or `$model->save()` without a database connection.

# Examples

**Pure function testing**
```php
test('tax calculator computes correctly', function () {
    $calculator = new TaxCalculator();

    $result = $calculator->calculate(100.00, 0.08);

    expect($result->subtotal)->toBe(100.00);
    expect($result->tax)->toBe(8.00);
    expect($result->total)->toBe(108.00);
});
```

**Service with mocked dependency**
```php
test('register user action creates user and sends email', function () {
    $userRepo = Mockery::mock(UserRepositoryInterface::class);
    $mailer = Mockery::mock(MailerInterface::class);
    $action = new RegisterUserAction($userRepo, $mailer);

    $userRepo->shouldReceive('save')->once()->andReturn(new User(['email' => 'test@example.com']));
    $mailer->shouldReceive('send')->once();

    $result = $action->execute(['email' => 'test@example.com', 'name' => 'Test']);

    expect($result->email)->toBe('test@example.com');
});
```

**Policy testing**
```php
test('admin can view any post', function () {
    $policy = new PostPolicy();
    $admin = new User(['role' => 'admin']);
    $post = new Post();

    expect($policy->view($admin, $post))->toBeTrue();
});

test('regular user can only view own post', function () {
    $policy = new PostPolicy();
    $user = new User(['id' => 1]);
    $ownPost = new Post(['user_id' => 1]);
    $otherPost = new Post(['user_id' => 2]);

    expect($policy->view($user, $ownPost))->toBeTrue();
    expect($policy->view($user, $otherPost))->toBeFalse();
});
```

# Related Topics

- Service container resolution
- Mockery integration
- Value object design
- DTO test factories
- Null driver pattern
- Hexagonal architecture testing

# AI Agent Notes

- When generating unit test code, always include the `#[UnitTest]` attribute or extend `PHPUnit\Framework\TestCase` directly.
- Prefer constructor injection over facades in classes designed for unit testing.
- Always freeze time with `Carbon::setTestNow()` for time-dependent unit tests.
- Use `expect()` for simple value assertions and `Mockery` for dependency mocking.
- Generate tests for both happy path and error/edge cases for business logic classes.

# Verification

- [ ] Unit tests use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- [ ] No database queries are executed during unit test runs
- [ ] No framework boot occurs (test execution <5ms per test)
- [ ] Business logic classes use constructor injection, not facades
- [ ] Time-dependent tests use `Carbon::setTestNow()`
- [ ] Tests verify behavior, not implementation details
- [ ] All conditional branches in business logic have corresponding tests
- [ ] Unit test services mirror source structure in `tests/Unit/`
