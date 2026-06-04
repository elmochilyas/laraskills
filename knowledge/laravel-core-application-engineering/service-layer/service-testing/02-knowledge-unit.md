# Service Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

Service testing verifies that a service class correctly implements business logic, orchestrates sub-operations, manages transactions, and handles error conditions. The primary distinction in service testing is between unit tests (instantiate the service with mocked dependencies, test isolated logic) and integration tests (resolve the service from the container, test against a real database).

The engineering significance of service testing is that it is the layer where most business logic bugs should be caught. Controllers primarily delegate; actions primarily execute single operations; services contain orchestrations, business rules, and conditional workflows — the most error-prone code in the application. Testing services directly (not through HTTP) provides faster feedback, more precise failure signals, and better isolation than feature tests.

The testing strategy depends on the service's dependency profile. A service that injects repositories should use integration tests with a real database for those repositories. A service that injects external gateways (payment, email) should mock those gateways. A service that composes actions can use spies to verify orchestration without re-testing the composed actions. The principle is: mock at the system boundary, use real implementations for internal collaborators.

---

## Core Concepts

### Unit vs Integration Tests for Services

**Unit test:** Instantiate the service directly (via `new` or `$this->app->make()`), mock all constructor dependencies, call the method, assert the result. Fast (~1–5ms), no database, no framework bootstrapping. Best for: services with external dependencies (gates, APIs, SDKs) or complex business logic.

**Integration test:** Resolve the service from the container with real implementations for most dependencies, use a real database (SQLite in-memory or test database). Slower (~10–100ms), but catches wiring issues, query errors, and real behavior. Best for: services that use repositories or Eloquent directly, services with transaction management.

The community consensus is to prefer integration tests for service layers — the confidence gain from testing real behavior outweighs the speed cost for most service operations.

### Mock vs Spy vs Fake

**Mock:** Expectation-first. Assert that method X is called with args Y, return value Z. Use for dependencies that provide data needed by the service.

**Spy:** Assert-after. Record all calls, assert they happened afterward. Use for side-effect dependencies (loggers, event dispatchers, notification services).

**Fake:** Laravel's built-in fakes (`Event::fake()`, `Mail::fake()`, `Queue::fake()`, `Http::fake()`). Provide the best balance — they behave like real implementations but don't execute real side effects. Prefer over mocking for framework services.

### Transaction Testing Challenge

Testing transaction behavior requires verifying both paths:
- **Success path:** Assert that the expected data is committed to the database
- **Failure path:** Assert that NO data is committed after an exception

The failure path test is frequently overlooked. Without it, a silent partial-commit bug (exception caught inside `DB::transaction()` without re-throw) passes all tests but corrupts data in production.

### Orchestration Verification

When testing a service that composes actions, the goal is to verify orchestration — did the right actions execute in the right order — without re-testing the actions' internal logic. Use spies for side-effect actions, mocks for data-providing actions.

---

## Mental Models

### Service Test as Integration Test
A service is the integration point between HTTP (controllers) and infrastructure (repositories, gateways). Testing a service in isolation (all collaborators mocked) tests wiring, not behavior. The most valuable service test uses real internal collaborators (repositories with a real database) and mocks only external boundaries (payment gateways, email APIs).

### Constructor as Test Blueprint
The service constructor tells you what to mock or provide in tests. Each constructor parameter is a test seam. A service with 2–3 dependencies is easy to test. A service with 8+ dependencies is a testing burden — each test must instantiate all 8, even if the tested method uses only 2.

### Spy for Orchestration, Mock for Data
When testing a service that composes actions, use spies to assert that actions were called in the correct order. Spies record calls without expecting them upfront — you assert after the fact. Use mocks for actions or repositories that return data — you need to control their return values to test the service's handling of different data scenarios.

---

## Internal Mechanics

### Container Resolution in Tests

```php
// Unit test: instantiate directly
$service = new OrderService(
    $this->mock(OrderRepository::class),
    $this->mock(PaymentGateway::class),
);

// Integration test: resolve from container (real dependencies)
$service = $this->app->make(OrderService::class);
// Container auto-resolves concrete classes, binds mocked/fake dependencies
```

`$this->mock()` registers a Mockery mock in the container via `$this->app->instance()`. Any subsequent resolution returns the mock.

### Mocking Method-Injected Dependencies

```php
class ReportService
{
    public function generate(ReportGenerator $generator): Report
    {
        return $generator->generate();
    }
}

// Test
$this->mock(ReportGenerator::class, function (MockInterface $mock) {
    $mock->shouldReceive('generate')->once()->andReturn(new Report([...]));
});

$service = $this->app->make(ReportService::class);
$service->generate(); // $generator is resolved from container = mock
```

Method injection dependencies are resolved from the container at call time. Mocking works identically to constructor injection.

### DatabaseTransactions Trait and Service Tests

```php
use Illuminate\Foundation\Testing\DatabaseTransactions;

class TransferServiceTest extends TestCase
{
    use DatabaseTransactions;

    public function test_transfer_succeeds()
    {
        // DatabaseTransactions wraps this test in a transaction
        // After the test completes, the transaction rolls back
        // No data persists between tests
    }
}
```

`DatabaseTransactions` is ~50x faster than `RefreshDatabase` because it doesn't run migrations. Each test is wrapped in a transaction that rolls back after the test. This is the recommended trait for service integration tests.

---

## Patterns

### Unit Test with Mocked Dependencies

```php
class OrderServiceTest extends TestCase
{
    public function test_purchase_creates_order()
    {
        $products = Mockery::mock(ProductRepository::class);
        $gateway = Mockery::mock(PaymentGateway::class);
        $orders = Mockery::spy(OrderRepository::class);

        $products->shouldReceive('findOrFail')
            ->with(1)
            ->once()
            ->andReturn(new Product(['price' => 1000]));

        $gateway->shouldReceive('charge')
            ->with(1000, Mockery::any())
            ->once()
            ->andReturn(new Charge('ch_123'));

        $service = new OrderService($products, $orders, $gateway);
        $result = $service->purchase(1, ['token' => 'tok_xxx']);

        $orders->shouldHaveReceived('create')->once();
        $this->assertInstanceOf(Order::class, $result);
    }
}
```

Mocks control return values. Spies verify side effects. The service is tested in isolation from the database.

### Integration Test with Real Database

```php
class TransferServiceTest extends TestCase
{
    use DatabaseTransactions;

    public function test_transfer_moves_balance()
    {
        $from = Account::factory()->create(['balance' => 1000]);
        $to = Account::factory()->create(['balance' => 0]);

        $service = $this->app->make(TransferService::class);
        $service->transfer($from, $to, 500);

        $this->assertDatabaseHas('accounts', [
            'id' => $from->id,
            'balance' => 500,
        ]);
        $this->assertDatabaseHas('accounts', [
            'id' => $to->id,
            'balance' => 500,
        ]);
    }
}
```

Uses real repositories with a real database (SQLite in-memory). Catches query errors, missing columns, and type mismatches that unit tests miss.

### Testing Transaction Rollback

```php
public function test_transfer_rolls_back_on_insufficient_funds()
{
    $from = Account::factory()->create(['balance' => 10]);
    $to = Account::factory()->create(['balance' => 0]);

    $this->expectException(InsufficientFundsException::class);

    $service = $this->app->make(TransferService::class);
    $service->transfer($from, $to, 500);

    // Assert NO changes were committed
    $this->assertEquals(10, $from->fresh()->balance);
    $this->assertEquals(0, $to->fresh()->balance);
}
```

Tests the failure path. Verifies that the transaction rolls back correctly when business logic throws an exception.

### Testing Orchestration with Spies

```php
public function test_checkout_orchestrates_correctly()
{
    $cart = Cart::factory()->create();
    $user = User::factory()->create();

    // Mock the data-providing action
    $payment = $this->mock(PaymentService::class);
    $payment->shouldReceive('charge')->once()->andReturn(new Charge('ch_1'));

    // Spy the side-effect action
    $notifier = $this->spy(NotificationService::class);

    $service = $this->app->make(CheckoutService::class);
    $result = $service->checkout($cart, $user);

    // Verify orchestration happened
    $notifier->shouldHaveReceived('sendConfirmation')->once();
    $this->assertInstanceOf(Order::class, $result);
}
```

Spies verify that side effects occurred. Mocks provide controlled data. The test verifies orchestration, not internal implementation.

### Testing afterCommit Callbacks

```php
public function test_registration_dispatches_event_after_commit()
{
    Event::fake();

    $data = ['name' => 'Jane', 'email' => 'jane@example.com'];
    $service = $this->app->make(RegistrationService::class);
    $service->register($data);

    // The event should be dispatched (afterCommit runs in test if committed)
    Event::assertDispatched(UserRegistered::class);
}
```

`Event::fake()` intercepts event dispatch. If the service uses `ShouldDispatchAfterCommit`, the event dispatches after the transaction commits. In tests, `DatabaseTransactions` wraps the test in a transaction — afterCommit callbacks may not fire until the test's transaction commits (end of test). Verify the behavior in your test environment.

---

## Architectural Decisions

### Why Prefer Integration Tests for Services
Unit tests with all collaborators mocked verify that code paths execute correctly given controlled inputs. Integration tests with real repositories verify that the code paths produce correct database state. For services that orchestrate database operations, the database state IS the output — integration tests provide stronger confidence.

### Why Not Mock Eloquent Models
Mocking an Eloquent model is fragile and tightly couples the test to implementation details. Models have rich internal behavior (relationships, accessors, mutators, event dispatch) that is lost when mocked. The standard recommendation is: if you need to mock a model, extract the logic to a service where the model is a collaborator, not the subject under test.

### Why Test Transaction Rollback
The most expensive service bug is a silent partial commit — half of the operation committed, the other half silently discarded. This happens when an exception is caught inside `DB::transaction()` without re-throw. Testing only the success path never catches this. The rollback test verifies that the atomicity guarantee of the transaction is upheld.

---

## Tradeoffs

### Unit vs Integration Tests for Services

| Aspect | Unit Test | Integration Test |
|--------|-----------|-----------------|
| Speed | ~1–5ms | ~10–100ms |
| Confidence | Tests logic isolation | Tests real interaction with database |
| Mocking | All collaborators mocked | Real repos, mocked external boundaries |
| Failure detection | Logic errors | Logic + query + wiring errors |

### Spy vs Mock for Collaborators

| Tool | When to Use | Example |
|------|-------------|---------|
| Mock | Collaborator provides data | `paymentGateway->charge()` |
| Spy | Collaborator is a side effect | `notifier->sendConfirmation()` |
| Fake | Laravel framework service | `Event::fake()`, `Mail::fake()` |

### DatabaseTransactions vs RefreshDatabase

| Trait | Speed | Behavior | Use Case |
|-------|-------|----------|----------|
| `DatabaseTransactions` | Fast (~5ms per test) | Wraps test in transaction; no migration | Most service integration tests |
| `RefreshDatabase` | Slow (~500ms per suite) | Drops and re-migrates | Tests that modify schema |

---

## Performance Considerations

### Test Suite Execution
A service test suite with 200 tests:
- Unit tests (all mocked): ~0.2–1 second
- Integration tests (real DB): ~2–20 seconds
- Optimized (DatabaseTransactions + parallel): ~2–5 seconds

### DatabaseTransactions Overhead
Each test wrapped in a transaction adds ~1–5ms overhead for the begin/commit/rollback operations. For 100 tests, the overhead is ~100–500ms — negligible compared to the migration cost of `RefreshDatabase`.

### Parallel Testing
Service integration tests using `DatabaseTransactions` are NOT safe to run in parallel — transactions per-process conflict with shared database state. Use `RefreshDatabase` with multiple test databases for parallel execution, or run service tests sequentially (fast enough for most suites).

---

## Production Considerations

### Coverage Targets for Services
Every service method should have at least:
- One success test (happy path, expected output)
- One failure test (exception, error handling, transaction rollback)
- One edge case test (boundary conditions, empty results, null inputs)

For methods with conditional branches, each branch should have at least one test.

### CI Pipeline Placement
Service integration tests should run after linting and static analysis but before full feature tests. They provide the fastest feedback loop for business logic bugs — faster than feature tests, more reliable than unit tests.

### Refactoring and Test Resilience
Tests that verify service behavior (database state, return values, event dispatch) survive internal refactoring. Tests that verify implementation (exact method call order, private method execution) break on refactoring. Prefer behavior verification over implementation verification.

---

## Common Mistakes

### Over-Mocking
Why it happens: Mocking all dependencies to avoid database setup. Why it's harmful: Mocked tests pass even when the real implementation has query errors, missing relationships, or type mismatches. The test suite provides false confidence. Better approach: Use real repositories with a real database for integration tests. Mock only external boundaries (payment gateways, email APIs, HTTP clients).

### Not Testing Error Paths
Why it happens: The success path is the obvious test; error paths require more setup. Why it's harmful: The most expensive bugs come from unhandled errors. A service that silently catches and swallows an exception looks correct in success tests but corrupts data in production. Better approach: Every service method should have at least one test that verifies correct behavior when a dependency throws or returns unexpected data.

### Testing Private Methods
Why it happens: The private method has complex logic that seems worth testing directly. Why it's harmful: Tests that call private methods are fragile — they break when the method is renamed, extracted, or inlined. The test is tied to implementation, not behavior. Better approach: Extract the complex logic to a separate, testable class, or test it through the public method that calls it.

### Using RefreshDatabase Unnecessarily
Why it happens: Following documentation examples without understanding the tradeoff. Why it's harmful: `RefreshDatabase` drops and re-runs migrations for each test class, adding ~500ms per class for migration execution. A suite of 20 service test classes spends 10 seconds just on migrations. Better approach: Use `DatabaseTransactions` by default for service integration tests. Switch to `RefreshDatabase` only when migration behavior is being tested.

### Shared State Across Tests
Why it happens: Setting up shared state in `setUp()` and expecting each test to use it independently. Why it's harmful: A stateful singleton service persists data from Test A into Test B. If tests run in random order, Test B fails intermittently. Better approach: Use `DatabaseTransactions` to isolate each test's database state. Reset singleton instances in `setUp()` using `app()->forgetInstance()`.

---

## Failure Modes

### Service Tests That Pass but Production Fails
The most dangerous failure mode: all tests pass, but the service behaves incorrectly in production. This happens when:
- Mocks don't match real dependency behavior (mock returns a value, real dependency throws)
- Tests don't cover transaction rollback (silent partial commit passes tests)
- Tests run in PHP-FPM (no state leaks) but production runs in Octane (state leaks)

Each of these requires specific test coverage to prevent.

### Flaky Tests from Singleton State
A singleton service registered in a provider persists across tests within the same PHPUnit process. If one test sets state on the service and another test reads it, the test order determines the result. Random test ordering (recommended) catches this intermittently. Fix: Reset singletons in `setUp()`.

### afterCommit Callbacks in Test Transactions
`DatabaseTransactions` wraps each test in a transaction. `afterCommit` callbacks registered during the test fire when the test's transaction commits — at the end of the test method. This means the callback executes before any assertion after the callback registration, which may be unintuitive. Use `Event::fake()` or explicit assertions to verify post-commit behavior.

---

## Ecosystem Usage

### Spatie Packages
Spatie's package tests use a mix of unit and integration tests for their service classes. Internal services are tested with real implementations. External integrations (mail, HTTP) use fakes. This pattern is documented in their testing guidelines.

### Laravel Jetstream
Jetstream's action tests use `DatabaseTransactions` and test with real database operations. Actions are tested by executing them and asserting against database state. No Eloquent mocking — actions are tested with real model interactions.

### Community Standard
The community standard (2024–2026) for service testing:
- `DatabaseTransactions` for service integration tests
- `Event::fake()`, `Mail::fake()`, `Queue::fake()` for framework service side effects
- `Http::fake()` for external API calls
- Spies for verifying orchestration
- Mocks only at system boundaries (external SDKs, third-party APIs)
- No Eloquent mocking — use real database interactions

---

## Related Knowledge Units

### Prerequisites
- Service Class Design — What services are and how they compose dependencies
- Service Orchestration — Understanding what orchestration to verify in tests
- Transaction Management — Understanding transaction behavior to test rollback

### Related Topics
- Controller Testing — How controller testing differs from service testing
- Stateless Service Design — How statelessness enables simple, isolated tests

### Advanced Follow-up Topics
- Action Testing — Testing single-purpose action classes
- Feature Testing — Full-stack HTTP tests that exercise services indirectly
- Mocking Strategies — Advanced mock/spy/fake patterns for service testing

---

## Research Notes

### Key Insight
The distinction between unit and integration tests for services is less important than the boundary where mocking stops. The rule: mock at the system boundary, not at the internal layer boundary. Use real implementations for your own repositories/services/actions. Mock external APIs, payment gateways, and third-party SDKs. This gives the highest confidence per test second.

### Key Controversy
Some teams advocate for full mocking (unit testing) for all services to maximize test speed. Others advocate for real database integration tests to maximize confidence. The pragmatic consensus: services that primarily compute values (price calculators, validators) are best unit-tested. Services that primarily orchestrate database operations are best integration-tested with real databases.

### Version-Specific Notes
- `DatabaseTransactions` trait: Laravel 5.x+
- `Event::fake()`: Laravel 5.8+
- `Http::fake()`: Laravel 6.x+
- `$this->mock()` helper: Laravel 5.x+
- No version-specific changes to service testing principles in Laravel 10–13
