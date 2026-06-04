# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Mocking, Fakes & Test Doubles
Knowledge Unit: Mockery Integration
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Mockery is the de facto mocking framework in the Laravel ecosystem, providing `mock()`, `partialMock()`, and `spy()` helpers integrated into Laravel's base TestCase. While Laravel's native fakes are preferred for framework services, Mockery is used for custom interfaces, third-party SDKs, and scenarios requiring precise call verification. Understanding Mockery patterns is essential for testing service boundaries where fakes don't exist.

# Core Concepts
- **`$this->mock(Class::class)`**: Creates a full mock where all methods have default return values. Expectations set with `shouldReceive()`.
- **`$this->partialMock(Class::class)`**: Creates a partial mock where unmocked methods call the real implementation. Useful for overriding specific methods.
- **`$this->spy(Class::class)`**: Creates a spy that records all calls. Verify afterward with `shouldHaveReceived()`.
- **`shouldReceive('method')`**: Defines expectation that a method will be called. Can specify arguments (`with()`), return value (`andReturn()`), and call count.
- **`shouldHaveReceived('method')`**: Spy method to verify a call was made. Post-hoc verification, not pre-configured.
- **Mocking facades**: `Facade::shouldReceive('method')` directly. Less common in modern Laravel (prefer fakes).
- **Container binding**: `$this->instance(Contract::class, $mock)` binds mock into container for auto-injection.

# Mental Models
- **Mock as contract enforcer**: A mock enforces that specific methods are called with specific arguments. It's a test that verifies interaction contracts.
- **Spy as call recorder**: A spy silently records all calls. The test verifies the recording after the action. Less brittle than mocks.
- **Partial mock as surgical override**: Use when testing a class but needing to mock one of its internal dependencies. An alternative to extracting the dependency.
- **Default return values**: Full mocks return `null` for unexpected methods. This can cause "method called on null" errors. Use `shouldReceive()` for all called methods or use `partialMock()`.

# Internal Mechanics
- **Mock object generation**: Mockery uses `Mockery\Generator\Generator` to create a new class at runtime implementing the mocked interface/extending the class. Methods are overwritten with mock behavior.
- **Expectation stack**: `shouldReceive()` creates an expectation object. Expectations are checked in order. `with()` sets argument matchers. `andReturn()` sets return values.
- **Expectation verification**: At test end (`Mockery::close()`), Mockery verifies all expectations were met. Failed expectations throw `\Mockery\Exception\InvalidCountException`.
- **Container mocking**: `$this->mock(Class::class)` calls `Mockery::mock()` then binds via `$this->app->instance()`. The mock replaces the real binding in the container.
- **Spy mechanism**: `Mockery::spy()` creates a mock with all methods returning the spy itself (for chaining). Calls are recorded in an internal array for later verification.
- **`shouldHaveReceived()`**: Searches the spy's call records for matching method + arguments. Throws if not found.

# Patterns
- **Pattern: Contract boundary mocking**
  - Purpose: Mock custom repository/interface boundaries
  - Benefits: Isolates business logic from data access
  - Tradeoffs: Tests are coupled to interface methods
  - Implementation: `$repo = $this->mock(UserRepository::class); $repo->shouldReceive('find')->with(1)->andReturn($user);`

- **Pattern: Partial mock for method isolation**
  - Purpose: Test a method while overriding a dependent method
  - Benefits: Avoids refactoring to extract dependency
  - Tradeoffs: Tests are coupled to internal method calls
  - Implementation: `$service = $this->partialMock(OrderService::class); $service->shouldReceive('calculateTax')->andReturn(10.0);`

- **Pattern: Spy for notification/event verification**
  - Purpose: Verify a notification was triggered without pre-configuring expectations
  - Benefits: Less brittle than mocks; verifies interaction happened
  - Tradeoffs: Does not verify that nothing else was called
  - Implementation: `$logger = $this->spy(Logger::class); $service->process($data); $logger->shouldHaveReceived('error')->with($errorMessage);`

- **Pattern: Mocking Eloquent query builders**
  - Purpose: Test code that uses Eloquent without database (rare)
  - Benefits: Fast unit tests for query-heavy code
  - Tradeoffs: Extremely brittle; query changes break tests
  - Implementation: (Not recommended) Prefer feature tests with real database.

# Architectural Decisions
- **Mock vs Fake**: Use fakes for Laravel services. Use mocks for custom interfaces. Use spies for post-hoc verification.
- **Mock vs Spy**: Use mocks when call count matters. Use spies when only call existence matters.
- **Partial mock vs dependency extraction**: Prefer extracting a dependency and mocking it over partial mocking. Partial mocking tests internal structure.
- **`mock()` vs `instance()` + `Mockery::mock()`**: Use `$this->mock()` for container-managed classes. Use `Mockery::mock()` directly for classes not resolved from the container.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Precise interaction verification | Tests break on implementation refactors | Over-mocking is a code smell |
| Partial mocks isolate specific methods | Tests coupled to method internals | Prefer dependency extraction |
| Spies are less brittle than mocks | Cannot control return values | Use mocks when you need stubs + verification |
| Fluent `shouldReceive` API is readable | Can get verbose for complex scenarios | Extract mock setup to helper methods |

# Performance Considerations
- Mock creation: 1-5ms per mock (class generation + reflection).
- Expectation setup: <0.1ms per expectation.
- Mock reset (`Mockery::close()`): <0.5ms per mock.
- Spy call recording: <0.01ms per recorded call.
- 1000 mocks in a suite: ~1-5 seconds total mock creation time.

# Production Considerations
- **Mockery vs PHPUnit mocks**: Mockery provides more features (partial mocks, spies, flexible argument matching). PHPUnit mocks are sufficient for simple cases.
- **`Mockery::close()`**: Must be called after each test. Laravel's TestCase handles this automatically. Pest handles it via the `beforeEach` lifecycle.
- **Mock cleanliness**: Stale expectation state from previous tests can leak. Mockery's `close()` resets all state.
- **Container mock rebinding**: If a mock is bound to the container and a subsequent test re-binds, the old mock's expectations may still be pending. Call `Mockery::close()` between tests.

# Common Mistakes
- **Mistake: Over-mocking (mocking everything)**
  - Why: Testing in isolation
  - Why harmful: Tests become brittle; refactoring breaks many tests
  - Better: Mock only service boundaries; use real implementations for value objects and collections.

- **Mistake: Using partial mocks for internal method testing**
  - Why: Partial mock to "test just this method"
  - Why harmful: Tests the method's interaction with itself, not its behavior
  - Better: Test through the public API. If a method needs isolation, it should be a separate collaborator.

- **Mistake: Not setting expected call count**
  - Why: `shouldReceive('send')->andReturn(true)` without `times()`
  - Why harmful: Method can be called 0, 1, or 10 times; test passes regardless
  - Better: Use `once()`, `twice()`, `times(N)`, or `zeroOrMoreTimes()` explicitly

- **Mistake: Mocking Eloquent models**
  - Why: Avoiding database setup
  - Why harmful: Eloquent's magic methods, relationships, and query builder make mocks extremely brittle
  - Better: Use factory-created models in feature tests

# Failure Modes
- **`BadMethodCallException: Method ... does not exist`**: Mocking a class that doesn't have the method. Verify the class interface.
- **`InvalidCountException`**: Call count doesn't match expectation. Use `debugBacktrace()` on mock to find the caller.
- **Mock return value mismatch**: `andReturn()` returns the same instance every call. For multiple calls returning different values, use `andReturnValues()` or `andReturnUsing()`.
- **Spy `shouldHaveReceived` with no matching call**: Verify method name and arguments. Use `shouldHaveReceived()->withSomeOfArgs()` for partial argument matching.
- **Partial mock calls real implementation unexpectedly**: Not all methods were configured with `shouldReceive()`. Real implementation executes with potentially side effects.

# Ecosystem Usage
- **Laravel core**: Laravel's test suite uses Mockery for services without built-in fakes (e.g., `Cache\Store`, `Filesystem`, custom contracts).
- **Laravel Horizon**: Mockery mocks are used for Redis interaction testing where `Queue::fake()` doesn't apply.
- **Spatie packages**: Spatie uses Mockery for service boundaries in unit tests, fakes for framework features.
- **Community packages**: Most Laravel packages use Mockery for custom interface mocking. The `mock()` helper is universally available via the base TestCase.

# Related Knowledge Units
- **Prerequisites**: Test double taxonomy, Service container, Dependency injection
- **Related Topics**: Laravel fakes, HTTP Client faking, Partial mock patterns, Spy patterns
- **Advanced Follow-up**: Custom Mockery matchers, Mockery configuration, Partial mock vs extraction refactoring

# Research Notes
- Laravel's fakes (Bus, Event, Mail, Notification, Queue, Storage) provide in-memory implementations that capture dispatched jobs/events/mails for assertion without side effects
- The Http facade faking intercepts outgoing HTTP requests and returns predefined responses — critical for testing external API integrations without network calls
- Time manipulation via Carbon::setTestNow() and Pest's 	ravel() helper enables testing time-sensitive features (rate limits, subscription expirations, scheduled tasks)
- Mockery is the underlying mocking framework integrated with Laravel; $this->mock() and $this->partialMock() are the primary test helpers
- Storage fake testing confirms files are written with correct content, naming, and disk location — use Storage::fake('s3') to test S3 uploads without cloud costs
