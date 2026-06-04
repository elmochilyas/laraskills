# Action Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Actions Pattern
- **Knowledge Unit:** Action Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Action testing is the practice of verifying single-operation classes in isolation. Actions are the most testable pattern in Laravel because they are plain PHP classes with constructor injection — they can be instantiated without booting the framework, without database connections, and without HTTP state. This enables pure unit tests that execute in milliseconds, test the business logic directly, and fail with precise error messages about exactly which operation broke.

The engineering significance is that action testing shifts the testing burden from HTTP integration tests (slow, fragile, coupled to routing) to unit tests (fast, isolated, precise). An application with 50 actions and 150 action tests can verify every business operation in under a second without a single HTTP call, database query, or queue worker. The remaining integration tests cover only the orchestration and entry-point adapter logic.

---

## Core Concepts

### Action as Testable Unit
An action encapsulates exactly one operation with all its dependencies injectable. This makes it a perfect test unit:

- Constructor parameters are dependencies (mockable, stubbable)
- Method parameters are operational input (controllable per test)
- Return value is the operation result (assertable)
- Exceptions are failure signals (assertable)

Every aspect of the action's contract is testable without infrastructure.

### Unit Test vs Integration Test for Actions
The choice between unit and integration testing for actions depends on the action's dependency chain:

- **Pure unit test**: Instantiate the action with mocked dependencies. No database, no framework boot. Tests run in <1ms. Best for actions whose collaborators are interfaces or injected services.
- **Hybrid test**: Instantiate the action with real dependencies but use `RefreshDatabase` for Eloquent queries. Tests run in <10ms. Best for actions that use Eloquent directly without repository abstraction.
- **Integration test**: Call the action through a controller or command. Framework boots. Tests run in <100ms. Best for verifying the full adapter-action-infrastructure chain.

### The Testing Pyramid for Actions
```
     ┌──────────────────────────┐
     │  Integration tests (10%) │  Full stack: controller→action→database
    ┌┴──────────────────────────┴┐
    │  Hybrid tests (30%)         │  Action with real database
   ┌┴─────────────────────────────┴┐
   │  Pure unit tests (60%)         │  Action with mocked collaborators
   └────────────────────────────────┘
```

The majority of action tests should be pure unit tests. Hybrid tests cover actions whose primary collaborator is a database. Integration tests cover the edges where actions connect to entry points.

---

## Mental Models

### Action as Function with Side Effects
An action is a function: input → output + side effects. Testing should verify:
1. Given input X, the action calls collaborator Y with arguments Z (interaction test)
2. Given input X, the action returns result R (return value test)
3. Given invalid input X, the action throws exception E (error test)

This maps to Arrange-Act-Assert: set up the input and mock expectations, call the action, verify the outcome.

### Mock the Neighbors, Trust the Action
When testing action A that composes action B, mock B and verify that A calls B correctly. Do NOT test B's behavior as part of A's test. Each action has its own test class. Composition is verified at the orchestrator level, not in individual action tests.

### Test the Business Rule, Not the Method
Name action tests by the business outcome, not the technical operation:

- Good: `test_it_prevents_registration_when_email_is_duplicate`
- Bad: `test_it_calls_user_repository_create`

A test named by business outcome survives refactoring. A test named by implementation detail breaks when the implementation changes.

---

## Internal Mechanics

### Instantiation Without Framework
An action with only interface dependencies can be instantiated without any Laravel boot:

```php
// No framework boot needed
$repo = Mockery::mock(UserRepositoryInterface::class);
$action = new CreateUserAction($repo);
$result = $action->execute(['name' => 'Test']);

$this->assertEquals('Test', $result->name);
```

This works because PHP's constructor does not require the container. The action is a plain object. The test bypasses the container entirely.

### Instantiation With Concrete Dependencies
An action that type-hints a concrete class (not an interface) requires the concrete class to be instantiable:

```php
class CreateUserAction
{
    public function __construct(
        private UserRepository $users,  // Concrete class
    ) {}
}

// Test: must instantiate UserRepository
$users = new UserRepository(new DatabaseConnection(config('database')));
$action = new CreateUserAction($users);
```

If `UserRepository` itself has complex dependencies, the test must either mock them or use the container. This is why interface dependencies are preferred for testability — they can be mocked with zero setup.

### Spatie QueueableAction Fake
When testing actions that use `QueueableAction`, use `QueueableActionFake` to intercept dispatches:

```php
QueueableActionFake::fake();

// Execute code that dispatches the action
$service->checkout($cart);

// Assert action was dispatched
QueueableActionFake::assertPushed(GenerateInvoiceAction::class);
QueueableActionFake::assertPushedWithChain(GenerateInvoiceAction::class, SendReceiptAction::class);
QueueableActionFake::assertPushedTimes(GenerateInvoiceAction::class, 1);
QueueableActionFake::assertNotPushed(GeneratePdfAction::class);
```

The fake intercepts `onQueue()->execute()` calls and tracks them in memory. No queue driver is needed.

---

## Patterns

### Pure Unit Test Pattern
Instantiate the action with mocked dependencies, call execute, assert interactions:

```php
public function test_it_creates_a_user(): void
{
    $repo = Mockery::mock(UserRepository::class);
    $repo->shouldReceive('create')
        ->once()
        ->with(['name' => 'Test', 'email' => 'test@test.com'])
        ->andReturn(new User(['id' => 1, 'name' => 'Test', 'email' => 'test@test.com']));

    $action = new CreateUserAction($repo);
    $user = $action->execute(['name' => 'Test', 'email' => 'test@test.com']);

    $this->assertEquals('Test', $user->name);
    $this->assertEquals('test@test.com', $user->email);
}
```

- **Purpose**: Test the action's interaction with its dependencies in isolation.
- **Benefits**: Milliseconds execution; no database; no framework boot; precise failure messages.
- **Tradeoffs**: Mocks must match real implementation behavior — if the mock's expectations differ from the real dependency, the test passes but the system fails.

### Hybrid Database Test Pattern
Use `RefreshDatabase` and call the action with real Eloquent dependencies:

```php
public function test_it_persists_user_to_database(): void
{
    $action = new CreateUserAction(new UserRepository());
    $user = $action->execute(['name' => 'Test', 'email' => 'test@test.com']);

    $this->assertDatabaseHas('users', [
        'name' => 'Test',
        'email' => 'test@test.com',
    ]);
}
```

- **Purpose**: Verify that the action's database interactions are correct.
- **Benefits**: Tests the real SQL queries; catches schema mismatches and constraint violations.
- **Tradeoffs**: Slower (database setup/teardown); requires `RefreshDatabase` or `DatabaseTransactions` trait.

### Orchestration Verification Pattern
When a service orchestsrates multiple actions, test the orchestrator with mocked actions:

```php
public function test_checkout_orchestrates_actions_in_order(): void
{
    $validateCart = Mockery::mock(ValidateCartAction::class);
    $chargePayment = Mockery::mock(ChargePaymentAction::class);
    $createOrder = Mockery::mock(CreateOrderAction::class);

    $validateCart->shouldReceive('execute')->once()->ordered();
    $chargePayment->shouldReceive('execute')->once()->ordered();
    $createOrder->shouldReceive('execute')->once()->ordered()->andReturn($order);

    $service = new CheckoutService($validateCart, $chargePayment, $createOrder);
    $result = $service->checkout($cart, $user);

    $this->assertSame($order, $result);
}
```

- **Purpose**: Verify that the orchestrator calls actions in the correct order with the correct data.
- **Benefits**: Isolates orchestration logic from execution logic; tests can run in milliseconds.
- **Tradeoffs**: Tests orchestration wiring, not business outcomes — a mock may not reflect real action behavior.

### Queued Action Test Pattern
Use `QueueableActionFake` to verify dispatch behavior:

```php
public function test_it_dispatches_invoice_generation(): void
{
    QueueableActionFake::fake();

    $action = new CreateOrderAction();
    $order = $action->execute($cart);

    QueueableActionFake::assertPushed(GenerateInvoiceAction::class);
    QueueableActionFake::assertPushed(function (GenerateInvoiceAction $action) use ($order) {
        return $action->orderId === $order->id;
    });
}
```

- **Purpose**: Verify that queued side effects are dispatched when expected.
- **Benefits**: No queue worker needed; assertions are immediate; can inspect the action's state.
- **Tradeoffs**: Cannot verify that the queued action actually succeeds — the fake only tracks dispatch, not execution.

### Business Rule Test Pattern
Test actions by domain rules, not by method calls:

```php
public function test_it_rejects_duplicate_emails(): void
{
    $this->expectException(DuplicateEmailException::class);

    $repo = Mockery::mock(UserRepository::class);
    $repo->shouldReceive('findByEmail')->with('existing@test.com')->andReturn(new User());
    $repo->shouldReceive('create')->never();

    $action = new CreateUserAction($repo);
    $action->execute(['name' => 'Test', 'email' => 'existing@test.com']);
}
```

- **Purpose**: Enforce business rules through the action's behavior.
- **Benefits**: Tests document the domain rules explicitly; failure messages are about domain violations, not technical details.
- **Tradeoffs**: Requires the action to throw domain-specific exceptions (not generic `\Exception`).

---

## Architectural Decisions

### Mock vs Real Dependencies
The decision to mock or use real dependencies depends on what is being tested:

- **Mock dependencies** when testing the action's interaction logic: "does the action call the right method with the right arguments?" This is appropriate for actions that coordinate multiple collaborators.
- **Use real dependencies** when testing the action's data transformation: "does the action produce the correct output from the given input?" This is appropriate for actions whose primary collaborator is the database.

The rule of thumb: mock services the action controls (repository, mailer, gateway); use real infrastructure for data the action transforms (database queries, file operations).

### Test Isolation Granularity
Each action deserves its own test class. The test class contains one test per business rule:

```
tests/Unit/Actions/
├── CreateUserActionTest.php
│   ├── test_it_creates_a_user_with_valid_data
│   ├── test_it_rejects_duplicate_email
│   ├── test_it_hashes_password_before_storing
│   └── test_it_dispatches_welcome_email
├── SuspendUserActionTest.php
│   ├── test_it_marks_user_as_suspended
│   ├── test_it_revokes_active_sessions
│   └── test_it_notifies_user_of_suspension
└── ...
```

One test file per action file. This is the 1:1 mapping that makes action testing predictable — every action has exactly one test file in the corresponding location.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Pure unit tests run in <1ms | Mock expectations can diverge from real behavior | Supplement with integration tests for critical paths |
| Each action has a dedicated test class | File proliferation — 50 actions = 50 test files | Test file count mirrors action file count naturally |
| Business rule tests document domain behavior | Tests must be updated when business rules change | Tests serve as living documentation — updates are expected |
| Orchestration tests verify calling order | Mock order expectations are fragile | Use ordered mocking sparingly; test order only when it matters |
| QueueableActionFake tests dispatch without queue | Fake cannot verify worker-side execution | Supplement with a single worker integration test per queue action |

| Benefit | Cost | Consequence |
|---------|------|-------------|
| No framework boot for pure unit tests | Cannot test framework integration (auth, middleware, events) | Test framework integration at the controller or feature level |
| Hybrid tests verify real SQL queries | Slower test suite (seconds instead of milliseconds) | Acceptable tradeoff — database tests catch schema issues that mocks miss |
| QueueableActionFake is immediate | Does not test serialization/deserialization | Add a serialization test for actions with complex parameters |

---

## Performance Considerations

### Test Execution Time
A pure unit action test (mocked dependencies, no database) executes in 0.1-0.5ms. A full suite of 200 action tests runs in under 100ms. This is significantly faster than feature tests (each requires framework boot, ~20-30ms).

### Parallel Test Execution
Action tests are parallel-safe because they do not share state — each test creates its own action instance with its own mocks. PHPUnit's parallel execution (`--parallel`) works without modification.

### Database Test Speed
Hybrid action tests using `RefreshDatabase` take 5-10ms per test (migration + query). Using `DatabaseTransactions` (rollback instead of remigrate) reduces this to 1-3ms per test. Use `DatabaseTransactions` for action tests that only read/write data without schema changes.

---

## Production Considerations

### Test Naming Convention
Action test names should mirror action class names with a `Test` suffix and match the directory structure:

```
Source: app/Actions/User/CreateUserAction.php
Test:   tests/Unit/Actions/User/CreateUserActionTest.php
```

This 1:1 mapping ensures developers can always find the test for any action without searching.

### Continuous Integration
Action tests should run in the CI pipeline's fastest stage — they require no external services (database, queue, cache, mail). Run pure unit tests first; if they pass, run slower hybrid tests and integration tests.

### Coverage Expectations
Every action should have at least:
- One happy-path test (operation succeeds with valid input)
- One validation test (operation rejects invalid input)
- One exception test (operation throws the expected exception for failure cases)
- One side-effect test (operation triggers the expected side effects)

For actions with complex logic, add tests for edge cases (empty input, boundary values, concurrent calls).

---

## Common Mistakes

### Testing Actions Through HTTP Controllers
Writing a feature test that sends an HTTP request to test action logic adds unnecessary indirection:

```php
// WRONG: testing action through HTTP
public function test_create_user(): void
{
    $response = $this->post('/users', ['name' => 'Test']);
    $response->assertCreated();
}

// RIGHT: testing action directly
public function test_create_user(): void
{
    $action = new CreateUserAction(new UserRepository());
    $user = $action->execute(['name' => 'Test']);
    $this->assertDatabaseHas('users', ['name' => 'Test']);
}
```

The HTTP test validates the route, middleware, and controller — not the action. Test the action directly; test the HTTP layer in a separate, smaller set of tests.

### Not Testing Validation Inside Actions
If an action validates its input (using a validator or throwing exceptions for invalid data), the validation must be tested. The most common mistake is assuming validation is covered by the controller's `FormRequest` — when the action is called from a queue or CLI, the `FormRequest` is bypassed.

### Over-Mocking
Mocking every dependency creates tests that pass with wrong implementations:

```php
// Fragile: over-mocked
$repo->shouldReceive('create')->once()->andReturn(new User());
// The test passes even if 'create' expects different parameters than what the action sends
```

Test with real implementations for simple dependencies. Mock only when the dependency has expensive setup (API client, file system, mailer).

### Testing Queued Actions With Database Assertions
Detecting that an action was dispatched by checking the database for changes assumes the queued action has already executed. In a test without a queue worker, the action was never processed. Assert on the dispatch, not on the worker's output.

### Shared Mutable Mocks
Reusing a mock across multiple tests creates test pollution — the first test sets expectations that the second test's assertions don't expect. Create fresh mocks in each test method or use `Mockery::close()` in teardown.

---

## Failure Modes

### Mock Expectation Drift
A mocked dependency's real implementation changes its method signature, but the test's mock still expects the old signature. The test passes (mock accepts the old call), but production fails (real code calls a method that doesn't exist). Mitigate by supplementing critical path tests with integration tests that use real implementations.

### Database State Leakage
A hybrid test that creates database records without cleaning up affects subsequent tests. Use `RefreshDatabase` or `DatabaseTransactions` to ensure each test starts with a clean state. Never rely on manual cleanup in `tearDown()`.

### Time-Dependent Test Failure
An action that uses `now()`, `Carbon::now()`, or `Date::now()` in its logic will produce different results depending on when the test runs. Use Laravel's `Clock` facade or Carbon's `setTestNow()` to freeze time in tests:

```php
Carbon::setTestNow(Carbon::create(2026, 6, 2, 12, 0, 0));
$action = new CreateUserAction($repo);
$user = $action->execute(['name' => 'Test']);
$this->assertEquals('2026-06-02', $user->created_at->format('Y-m-d'));
```

---

## Ecosystem Usage

### Laravel Jetstream Tests
Jetstream action tests follow the hybrid pattern — they use `RefreshDatabase` and call actions with real Eloquent models. Jetstream actions are tested as part of feature tests, not in isolation. This is consistent with Jetstream's convention of thin actions with minimal dependencies.

### Spatie Packages
Spatie's open source packages test actions using a mix of pure unit and hybrid tests. The `QueueableActionFake` is provided specifically for testing queued action dispatch. Spatie's test suite for queueable actions includes serialization tests that verify the action can be serialized/deserialized through a real queue driver.

### Lorisleiva Laravel Actions
The package provides its own test helpers for asserting action dispatch, validation errors, and authorization checks. The test helpers abstract away the difference between synchronous and queued execution, allowing tests to verify the action's behavior without caring about the execution mode.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — understanding the action's structure is prerequisite to testing it
- Service Layer Testing — testing patterns for services that orchestrate actions
- PHPUnit / Pest Basics — the testing framework used for action tests

### Related Topics
- Action Composition — how to test composed actions at the orchestrator level
- Queued Actions — testing dispatch fakes without a queue worker
- Transactional Actions — testing actions that interact with database transactions

### Advanced Follow-up Topics
- Mocking Strategies — when to mock, stub, spy, or use real implementations
- Test-Driven Development with Actions — how actions enable RED-GREEN-REFACTOR cycles
- Property-Based Testing for Actions — generating input variations to find edge cases

---

## Research Notes

- Actions are uniquely suited for pure unit testing among all Laravel patterns because they have no base class, no framework contract, and no required trait. A plain PHP class with constructor injection is the most testable structure in Laravel.
- The 1:1 action-to-test mapping is not enforced by any tool — it is an organizational convention. PHPUnit's test discovery does not care whether action tests mirror action files. The convention must be documented and followed by the team.
- `QueueableActionFake` works by replacing the `QueueableAction` trait's dispatch mechanism with an in-memory tracker. The fake is registered by calling `QueueableActionFake::fake()` before the test and reset by calling `QueueableActionFake::assertNothingPushed()` in teardown.
- The distinction between "testing the action" and "testing through the action" is subtle but important. Testing THROUGH the action (via HTTP) adds coupling; testing THE action (directly) isolates it. Teams that consistently test actions directly report faster test suites and fewer flaky tests.