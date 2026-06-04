# Phase 5: Action Testing Rules

---

## Rule: Maintain 1:1 Mapping Between Action Files and Test Files

---

## Category

Testing

---

## Rule

Every action class must have exactly one corresponding test class. The test file path must mirror the action's source path under `tests/Unit/Actions/`. Shared test classes covering multiple actions are forbidden.

---

## Reason

A 1:1 mapping ensures that developers can always find the test for any action without searching or guessing. When an action is modified, the developer knows exactly which test file to update. Shared test classes hide failures — a test failure in a shared class does not immediately indicate which action is broken.

---

## Bad Example

```
tests/
└── Unit/
    └── ActionsTest.php  // Single file with tests for 20 different actions
```

---

## Good Example

```
tests/
└── Unit/
    └── Actions/
        ├── CreateUserActionTest.php
        ├── UpdateUserProfileActionTest.php
        └── DeleteUserActionTest.php
```

---

## Exceptions

Parameterized test classes that differ only in input data (e.g., `CreateOrderActionTest` with a data provider for different order types) are a single test class and do not need to be split.

---

## Consequences Of Violation

Testing risks: action modifications may not have corresponding test updates. Maintenance risks: failing tests do not pinpoint which action is broken. Code Organization risks: test discovery becomes a manual search process.

---

---

## Rule: Name Action Tests by Business Outcome, Not Technical Operation

---

## Category

Testing

---

## Rule

Action test method names must describe the business outcome being verified, not the technical operation being performed. Name patterns like `test_it_calls_repository_create` or `test_method_returns_user` are forbidden.

---

## Reason

Business-outcome names survive refactoring. When the implementation changes (repository is renamed, return type changes from Model to DTO), the test name `test_it_prevents_registration_when_email_is_duplicate` is still accurate. Technical-operation names break or become misleading when implementation details change.

---

## Bad Example

```php
public function test_it_calls_user_repository_create(): void
{
    $repo = Mockery::mock(UserRepository::class);
    $repo->shouldReceive('create')->once();
    // Tests implementation detail, not business outcome
}

public function test_method_returns_user_object(): void
{
    // Tests return type, not business outcome
}
```

---

## Good Example

```php
public function test_it_registers_a_new_user(): void
{
    // Happy path — business outcome
}

public function test_it_rejects_duplicate_email_addresses(): void
{
    // Business rule — survives any implementation change
}

public function test_it_hashes_password_before_storing(): void
{
    // Security requirement — stable business constraint
}
```

---

## Exceptions

Exception tests that verify specific error conditions may reference the exception class name to aid debugging: `test_it_throws_duplicate_email_exception_when_email_exists`.

---

## Consequences Of Violation

Testing risks: tests break on every refactoring even when business outcomes are unchanged. Maintenance risks: developers stop trusting action tests when they fail for non-functional reasons. Code Review risks: test names do not communicate the business requirements being verified.

---

---

## Rule: Use Pure Unit Tests as the Primary Testing Strategy

---

## Category

Testing

---

## Rule

At least 60% of action tests must be pure unit tests — the action is instantiated with mocked dependencies, no database connection, no framework boot, and no HTTP context. Pure unit tests must run in under 1ms per test.

---

## Reason

Pure unit tests provide the fastest feedback loop. A suite of 100 pure unit action tests runs in under 100ms, enabling sub-second test feedback during development. Framework-coupled tests (HTTP feature tests, database hybrid tests) are 20-300x slower. The action pattern's plain-PHP nature makes it uniquely suited for pure unit testing among all Laravel patterns.

---

## Bad Example

```php
// HTTP feature test instead of direct unit test:
public function test_user_registration(): void
{
    $response = $this->postJson('/api/register', [
        'name' => 'John',
        'email' => 'john@test.com',
        'password' => 'secret123',
    ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('users', ['email' => 'john@test.com']);
    // 20-30ms — slow, coupled to HTTP, tests routing + middleware + action
}
```

---

## Good Example

```php
// Pure unit test — no framework boot:
public function test_it_registers_a_new_user(): void
{
    $users = Mockery::mock(UserRepository::class);
    $users->shouldReceive('create')
        ->once()
        ->andReturn(new User(['id' => 1, 'name' => 'John']));

    $action = new CreateUserAction($users, new PasswordHasher());
    $user = $action->execute(new CreateUserData(
        name: 'John',
        email: 'john@test.com',
        password: 'secret123',
    ));

    $this->assertEquals('John', $user->name);
    // 0.1-0.5ms — 200x faster
}
```

---

## Exceptions

Actions whose primary collaborator is the database (Eloquent queries that cannot be abstracted behind a repository) should use hybrid tests with `DatabaseTransactions`. This accounts for approximately 30% of action tests. Pure unit tests should still be the majority.

---

## Consequences Of Violation

Testing risks: slow test suites discourage frequent test execution. Scalability risks: as the action count grows, the test suite becomes too slow for development feedback. Maintenance risks: HTTP feature tests break when routes or middleware change, even when action logic is correct.

---

---

## Rule: Limit Mocking to Expensive or Unreliable Dependencies

---

## Category

Testing

---

## Rule

Only mock dependencies that are expensive (API clients, mailers, file systems), unreliable (network services, third-party gateways), or non-deterministic (random generators, clocks). Use real implementations for repositories, value objects, and simple infrastructure.

---

## Reason

Over-mocking creates tests that pass with incorrect implementations. A mocked repository's `create()` method returns whatever the test specifies — the test never verifies that the real repository actually stores the data correctly. Real implementations for simple dependencies increase test coverage without significant speed cost.

---

## Bad Example

```php
public function test_it_creates_a_user(): void
{
    // Mocking a simple Eloquent repository — over-mocking:
    $repo = Mockery::mock(UserRepository::class);
    $repo->shouldReceive('create')
        ->once()
        ->andReturn(new User(['id' => 1]));

    $logger = Mockery::mock(LoggerInterface::class);
    $logger->shouldReceive('info')->once();
    // Logger was mocked for a simple info call...

    $mailer = Mockery::mock(Mailer::class);
    $mailer->shouldReceive('send')->never();

    // 4 mocks for a simple create operation — brittle and slow
}
```

---

## Good Example

```php
public function test_it_creates_a_user(): void
{
    // Real repository (or simple test double):
    $users = new InMemoryUserRepository();

    // Real logger — just creates an object, no cost:
    $logger = new NullLogger();

    // Mock only the expensive collaborator:
    $mailer = Mockery::mock(Mailer::class);
    $mailer->shouldReceive('send')->once();

    $action = new CreateUserAction($users, $logger, $mailer);
    $action->execute(['name' => 'John', 'email' => 'john@test.com']);
    // 1 mock instead of 4 — faster, more meaningful
}
```

---

## Exceptions

When testing error handling or edge cases that are difficult to trigger with real implementations (network timeout, database deadlock), mocking the dependency that produces the error condition is appropriate.

---

## Consequences Of Violation

Testing risks: tests pass with incorrect implementations. Maintenance risks: mock-heavy tests break on every implementation change. Scalability risks: each mock adds test setup overhead and fragility.

---

---

## Rule: Freeze Time in Time-Dependent Action Tests

---

## Category

Testing

---

## Rule

Every action test that involves time-dependent logic (`now()`, `Carbon::now()`, `Date::now()`, timestamps) must freeze time using `Carbon::setTestNow()` or Laravel's `Clock` facade. Tests must not depend on the actual wall clock time.

---

## Reason

Time-dependent tests that use the real clock produce different results depending on when they run. Tests that pass during the day may fail at midnight. Tests that run on the first of the month may produce different results than tests run mid-month. Frozen time makes tests deterministic and reproducible.

---

## Bad Example

```php
public function test_it_sets_expiry_to_30_days(): void
{
    $action = new CreateSubscriptionAction($repo);
    $result = $action->execute($data);

    // This assertion may fail depending on when the test runs:
    $this->assertEquals(
        now()->addDays(30)->toDateString(),
        $result->expires_at->toDateString()
    );
    // A millisecond difference between "now" in the action and "now" in the assertion
}
```

---

## Good Example

```php
public function test_it_sets_expiry_to_30_days(): void
{
    Carbon::setTestNow(Carbon::parse('2026-06-01 12:00:00'));

    $action = new CreateSubscriptionAction($repo);
    $result = $action->execute($data);

    $this->assertEquals(
        '2026-07-01',
        $result->expires_at->toDateString()
    );

    Carbon::setTestNow();
}
```

---

## Exceptions

Tests that explicitly verify time-related behavior across different times (e.g., "subscription expires at end of month regardless of when created") may freeze time to multiple values across different test methods.

---

## Consequences Of Violation

Testing risks: non-deterministic test failures based on execution time. Reliability risks: tests that pass in CI but fail at certain times of day, month, or year. Maintenance risks: developers learn to distrust and ignore flaky tests.

---

---

## Rule: Test Business Rules, Not Only the Happy Path

---

## Category

Testing

---

## Rule

Every action must have test coverage for validation failures, exception paths, edge cases, and authorization-denied scenarios — not just the success path. A minimum of one happy-path test, one validation/exception test, and one side-effect test per action is required.

---

## Reason

Production failures overwhelmingly occur in edge cases and error paths, not in the happy path. An action that only has happy-path tests provides false confidence — it passes CI but fails in production when invalid input is received, dependencies are unavailable, or business rules are violated.

---

## Bad Example

```php
// Only happy path is tested:
public function test_it_creates_an_order(): void
{
    $result = $this->createOrderAction->execute($validData);
    $this->assertInstanceOf(Order::class, $result);
}
// What happens when:
// - Items are out of stock?
// - Payment is declined?
// - User is not authorized?
// - Order total exceeds credit limit?
```

---

## Good Example

```php
public function test_it_creates_an_order(): void
{
    $result = $this->createOrderAction->execute($validData);
    $this->assertInstanceOf(Order::class, $result);
}

public function test_it_fails_when_inventory_is_insufficient(): void
{
    $this->expectException(InsufficientInventoryException::class);
    $this->createOrderAction->execute($outOfStockData);
}

public function test_it_charges_payment_on_order_creation(): void
{
    $this->createOrderAction->execute($validData);
    $this->paymentGateway->shouldHaveReceived('charge')->once();
}
```

---

## Exceptions

Trivial pass-through actions (simple CRUD with no business logic) that are awaiting a second caller before being extracted may have only a happy-path test. This is a temporary exception — once business logic is added, exception tests become mandatory.

---

## Consequences Of Violation

Reliability risks: production failures in error paths are not caught by the test suite. Testing risks: false confidence from green tests that do not exercise failure modes. Maintenance risks: edge-case bugs are discovered by users instead of tests.

---

---

## Rule: Use QueueableActionFake for Queued Action Dispatching Tests

---

## Category

Testing

---

## Rule

Actions that dispatch to the queue using Spatie's `QueueableAction` must be tested with `QueueableActionFake` to intercept dispatches in memory. Tests must not assert on worker-side results by checking database state without a running queue worker.

---

## Reason

A queued action dispatched during a test without a queue worker is never processed. Asserting on database state to verify queued action behavior assumes the action has already executed — but without a worker, it has not. `QueueableActionFake` intercepts the dispatch and records what was sent, enabling assertions on the dispatch itself without requiring a worker.

---

## Bad Example

```php
public function test_it_dispatches_invoice_generation(): void
{
    $order = Order::factory()->create();
    $this->createOrderAction->execute($order);

    // Wrong: asserts on database assuming the queued action ran
    $this->assertDatabaseHas('invoices', ['order_id' => $order->id]);
    // Without a queue worker, this assertion always fails
}
```

---

## Good Example

```php
public function test_it_dispatches_invoice_generation(): void
{
    QueueableActionFake::fake();

    $order = $this->createOrderAction->execute($cart);

    QueueableActionFake::assertPushed(GenerateInvoiceAction::class);
    QueueableActionFake::assertPushed(function (GenerateInvoiceAction $a) use ($order) {
        return $a->orderId === $order->id;
    });
}
```

---

## Exceptions

A single integration test per critical queued action may use a real queue worker (e.g., `Queue::fake()` with `dispatchSync()`) to verify the full dispatch-to-execution cycle. This supplements — not replaces — the `QueueableActionFake` unit test.

---

## Consequences Of Violation

Testing risks: dispatch tests that assert on worker results silently pass or fail regardless of actual dispatch behavior. Maintenance risks: developers assume queued actions work correctly but never verify the dispatch contract. Reliability risks: dispatching failures are caught only in production.

---

---

## Rule: Do Not Test Actions Through HTTP Feature Tests as Primary Strategy

---

## Category

Testing

---

## Rule

Action business logic must be tested by calling the action class directly in unit tests. HTTP feature tests must not be the primary mechanism for verifying action behavior.

---

## Reason

Feature tests add 20-30ms of framework boot time per test, couple assertions to routing and middleware, and require maintaining HTTP request/response constructs. A feature test failure does not indicate whether the bug is in the action, the controller, the middleware, the route, or the request validation. Direct action unit tests isolate the action logic and provide precise failure signals.

---

## Bad Example

```php
// Primary test strategy: HTTP feature tests for every action
public function test_can_register_user(): void
{
    $response = $this->post('/register', [
        'name' => 'John',
        'email' => 'john@test.com',
        'password' => 'secret123',
    ]);
    $response->assertRedirect('/dashboard');
    // 25ms — fails if route changes, middleware changes, or any HTTP concern changes
}
```

---

## Good Example

```php
// Primary test strategy: direct action unit test
public function test_it_registers_a_user(): void
{
    $action = new RegisterUserAction(
        new InMemoryUserRepository(),
        new PasswordHasher(),
    );
    $user = $action->execute(new RegisterUserData(
        name: 'John',
        email: 'john@test.com',
        password: 'secret123',
    ));
    $this->assertEquals('John', $user->name);
    // 0.3ms — tests only the action logic
}

// Additional: a single feature test per endpoint to verify the adapter layer
```

---

## Exceptions

One feature test per controller endpoint is acceptable to verify that the HTTP adapter layer (controller data extraction, routing, middleware) works correctly. This feature test does not re-test the action's business logic — it verifies the adapter, not the action.

---

## Consequences Of Violation

Performance risks: test suites become 20-300x slower than necessary. Testing risks: action logic is tested indirectly, making failures harder to diagnose. Maintenance risks: feature tests break on routing, middleware, or HTTP changes that have nothing to do with the action's business logic.

---
