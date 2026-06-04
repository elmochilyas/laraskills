# Service Testing — Engineering Rules

---

## Rule 1: Test Services as Unit Tests, Not Feature Tests

Services must be tested by instantiating them with mocked dependencies and calling methods directly, not by booting the framework and sending HTTP requests.

---

## Category

Testing

---

## Rule

Service tests must be unit tests that construct the service with dependencies (mocked or real) and invoke methods directly. Feature tests (HTTP requests through the framework) must not be used as the primary testing strategy for service logic. Only use feature tests for integration/acceptance scenarios.

---

## Reason

Unit-testing services provides fast feedback (milliseconds per test), isolates failures to the service logic, and avoids framework boot overhead. Feature tests test the HTTP layer, not the service, and are 10-100x slower, discouraging frequent execution.

---

## Bad Example

```php
class OrderServiceTest extends TestCase
{
    // Testing service logic through HTTP — slow, not focused
    public function test_place_order(): void
    {
        $response = $this->postJson('/api/orders', [
            'items' => [['product_id' => 1, 'qty' => 2]],
        ]);
        $response->assertStatus(201);
    }
}
```

---

## Good Example

```php
class OrderServiceTest extends TestCase
{
    private OrderService $service;
    private MockInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = Mockery::mock(OrderRepository::class);
        $this->service = new OrderService($this->repository);
    }

    public function test_place_order_creates_order(): void
    {
        $data = new PlaceOrderData(customerId: 1, items: []);
        $this->repository->shouldReceive('create')
            ->once()
            ->andReturn(new Order(['id' => 1]));

        $result = $this->service->place($data);

        $this->assertInstanceOf(Order::class, $result);
        $this->assertEquals(1, $result->id);
    }
}
```

---

## Exceptions

CRUD pass-through services with no business logic should be tested at the controller/feature level, not at the service unit test level.

---

## Consequences Of Violation

Testing risks: slow test suite (seconds per test instead of milliseconds), tests skipped due to boot time. Maintenance risks: HTTP changes break service tests. Debugging risks: failure may be in HTTP layer, not service logic.

---

## Rule 2: Mock Only External or Expensive Dependencies

Use real implementations for simple, fast, deterministic dependencies. Mock only repositories, HTTP clients, gateways, and external services.

---

## Category

Testing

---

## Rule

When unit-testing services, use real implementations for value objects, DTOs, simple calculators, and any dependency with no I/O. Mock only dependencies that perform I/O (repositories, HTTP clients, gateways, mailers, queues) or have non-deterministic behavior (time-based, random-based).

---

## Reason

Over-mocking creates fragile tests tightly coupled to implementation details. Real implementations for simple logic provide more meaningful test coverage and make tests resilient to refactoring. Mock only what makes tests slow or non-deterministic.

---

## Bad Example

```php
public function test_calculate_total(): void
{
    $pricing = Mockery::mock(PricingService::class);
    $pricing->shouldReceive('calculateTotal')
        ->once()
        ->andReturn(new Money(100));

    $service = new CheckoutService($pricing); // mocking a pure calculator

    // Test passes, but doesn't validate calculation logic
}
```

---

## Good Example

```php
public function test_calculate_total(): void
{
    $pricing = new PricingService(); // real implementation — fast, deterministic
    $service = new CheckoutService($pricing);

    $result = $service->calculateTotal($cart);

    // Test validates actual calculation logic
    $this->assertTrue(Money::fromFloat(115.0)->equals($result));
}
```

---

## Exceptions

When a pure dependency performs expensive computation (e.g., processing large datasets), mocking may be justified for performance. Document the performance rationale.

---

## Consequences Of Violation

Testing risks: tests are tightly coupled to implementation, breaking on refactoring. Maintenance risks: changing internal structure requires updating mock expectations. Reliability risks: over-mocked tests may pass despite broken logic.

---

## Rule 3: Prefer Result Assertions Over Mock Interaction Assertions

Assert on the return value or side effect of the service method, not on whether specific methods were called on dependencies.

---

## Category

Testing

---

## Rule

Service tests must primarily assert on the method's return value, result object, or observable side effects. Mock interaction assertions (e.g., `shouldReceive('create')->once()`) must be limited to verifying that I/O operations occurred with correct parameters. Behavioral assertions are preferred over interaction assertions.

---

## Reason

Result assertions test what the service does, not how it does it. Interaction assertions tie tests to implementation details, making them fragile during refactoring. A test that asserts on the output reveals bugs when the output is wrong; interaction tests may pass with wrong output.

---

## Bad Example

```php
public function test_place_order(): void
{
    $this->repository->shouldReceive('create')
        ->once()
        ->with(Mockery::on(fn($data) => $data['total'] === 100))
        ->andReturn(new Order(['id' => 1, 'total' => 100]));

    $result = $this->service->place($data);

    // Only checks that repository was called — not the actual result
}
```

---

## Good Example

```php
public function test_place_order(): void
{
    $this->repository->shouldReceive('create')
        ->once()
        ->andReturn(new Order(['id' => 1, 'total' => 100]));

    $result = $this->service->place($data);

    $this->assertSame(100, $result->total);
    $this->assertSame('confirmed', $result->status);
}
```

---

## Exceptions

When testing orchestration methods, interaction assertions are necessary to verify that actions are called in the correct order. Even then, prefer result assertions where possible.

---

## Consequences Of Violation

Maintenance risks: refactoring internal implementation breaks many tests. Testing risks: tests may pass despite incorrect output (if mock returns correct value but logic is wrong). Reliability risks: false confidence in test coverage.

---

## Rule 4: Test All Conditional Branches

Every `if/else`, `switch/match`, ternary, and null-coalescing path in a service method must have at least one test case.

---

## Category

Testing

---

## Rule

Service tests must achieve 100% branch coverage within each tested method. Every conditional path must be tested with appropriate input data to exercise that path. Untested branches are prohibited in production service code.

---

## Reason

Untested conditional branches are the most common source of production bugs. Code can have 100% line coverage but 30% branch coverage, meaning 70% of conditional paths are untested. Each untested branch is a potential production failure.

---

## Bad Example

```php
class OrderService
{
    public function place(PlaceOrderData $data): Order
    {
        if ($data->isGuest) {
            $user = $this->createGuestUser($data);
        } else {
            $user = $this->users->find($data->userId);
        }
        // ...
    }
}

// Test only exercises the "else" branch (logged-in user)
public function test_place_order_for_logged_in_user(): void { /* ... */ }
// Missing: test for guest checkout path
```

---

## Good Example

```php
public function test_place_order_for_logged_in_user(): void { /* ... */ }

public function test_place_order_for_guest_user(): void
{
    $data = new PlaceOrderData(
        isGuest: true,
        guestEmail: 'guest@example.com',
        // ...
    );
    // Assert guest user is created and order placed
}
```

---

## Exceptions

Error-handling branches that are impossible to trigger (e.g., a catch block for an exception that cannot be thrown by the try block) may be excluded if documented.

---

## Consequences Of Violation

Reliability risks: untested branches may hide logic errors that reach production. Testing risks: incomplete test coverage gives false confidence. Debugging risks: untested paths fail in production without test safety net.

---

## Rule 5: Use Factory Data for Test Inputs

Service test inputs must be created using factories or factory methods, not raw arrays or inline constructor calls.

---

## Category

Testing

---

## Rule

Test data for service method inputs must be generated using model factories (for Eloquent models), DTO factories, or builder methods. Raw arrays and manual constructor calls with inline data are prohibited for any input with more than 2 fields.

---

## Reason

Factories provide realistic data structures, reduce test setup verbosity, make test data consistent across tests, and isolate tests from constructor signature changes. Raw arrays are brittle — adding a required field breaks every test.

---

## Bad Example

```php
public function test_place_order(): void
{
    $data = new PlaceOrderData(
        userId: 1,
        items: [['product_id' => 1, 'quantity' => 2, 'price' => 100]],
        paymentMethod: 'credit_card',
        billingAddress: '123 Main St',
        shippingAddress: '456 Oak Ave',
        couponCode: null,
        notes: '',
        isGuest: false,
        guestEmail: null,
        // ... if a new field is added, this breaks
    );
}
```

---

## Good Example

```php
public function test_place_order(): void
{
    $data = PlaceOrderDataFactory::make([
        'userId' => 1,
        'items' => [['product_id' => 1, 'quantity' => 2]],
    ]);
}
```

---

## Exceptions

For inputs with 1-2 simple fields (e.g., an ID or a string), inline construction is acceptable.

---

## Consequences Of Violation

Maintenance risks: adding a field to a DTO breaks every test that constructs it inline. Readability risks: test setup code obscures the test's intent. Consistency risks: different tests use different data shapes.

---

## Rule 6: Test Error Handling Paths

Every service method must have tests that verify correct behavior when dependencies throw exceptions or return failure indicators.

---

## Category

Testing

---

## Rule

For each service method, there must be a test that simulates a failure in each external dependency and verifies the service handles it correctly (re-throws, wraps in domain exception, returns fallback, logs appropriately, or triggers compensation).

---

## Reason

Error handling code is the most fragile and least tested part of a service. The "happy path" is exercised by every test, but error paths are only exercised when explicitly tested. Without error tests, production failures in dependency calls go unhandled.

---

## Bad Example

```php
public function test_place_order_success(): void
{
    // Only tests success — no error tests
}
```

---

## Good Example

```php
public function test_place_order_throws_when_payment_fails(): void
{
    $this->paymentMock->shouldReceive('handle')
        ->once()
        ->andThrow(new PaymentFailedException('Card declined'));

    $this->expectException(OrderPlacementFailedException::class);
    $this->expectExceptionMessage('Payment processing failed');

    $this->service->place($data);
}

public function test_place_order_rolls_back_on_inventory_failure(): void
{
    $this->inventoryMock->shouldReceive('handle')
        ->once()
        ->andThrow(new InsufficientStockException());

    DB::shouldReceive('transaction')
        ->once()
        ->andReturnUsing(fn($callback) => $callback()); // Simulate transaction

    $this->expectException(InsufficientStockException::class);

    $this->service->place($data);
}
```

---

## Exceptions

Methods with no external dependencies and no I/O (pure domain logic) have no error handling to test.

---

## Consequences Of Violation

Reliability risks: production failures in dependencies go unhandled. Debugging risks: error handling bugs are discovered in production, not in CI. Maintenance risks: changes to error handling are untested.

---

## Rule 7: Each Test Must Verify One Behavior

Each test method must verify exactly one behavior or outcome. A test that asserts multiple unrelated things must be split.

---

## Category

Testing

---

## Rule

Every test method must have a single assertion focus. A test that checks the return value, verifies a side effect, and asserts a mock interaction is testing three different behaviors. Split into separate test methods, each named after the behavior it verifies.

---

## Reason

Single-behavior tests are independently meaningful (one test fails = one behavior broke), clearly named (test name describes the behavior), and easy to debug (failure points to exactly which behavior broke). Multi-behavior tests obscure which assertion failed.

---

## Bad Example

```php
public function test_place_order(): void
{
    $result = $this->service->place($data);

    $this->assertInstanceOf(OrderResult::class, $result);
    $this->assertEquals(100, $result->total);
    $this->assertEquals('confirmed', $result->status);
    $this->assertEquals(1, $result->order->items->count());
    $this->assertTrue($result->inventoryReserved);
    // Five behaviors in one test
}
```

---

## Good Example

```php
public function test_place_order_returns_order_result(): void { /* ... */ }

public function test_place_order_calculates_correct_total(): void { /* ... */ }

public function test_place_order_sets_status_to_confirmed(): void { /* ... */ }

public function test_place_order_reserves_inventory(): void { /* ... */ }
```

---

## Exceptions

Assertions that verify different aspects of the same result object (e.g., checking multiple fields of a DTO) may be grouped when they represent a single logical outcome.

---

## Consequences Of Violation

Debugging risks: first assertion failure stops the test, hiding broken later assertions. Readability risks: test name is too generic. Maintenance risks: understanding all behaviors requires reading the entire test body.

---

## Rule 8: Do Not Test CRUD Pass-Through at the Service Level

Service methods that only delegate to a repository without adding business logic must not have dedicated service unit tests. Test the behavior at the controller/feature level or skip testing the pass-through.

---

## Category

Testing

---

## Rule

Service methods that contain no business logic — only delegation to a repository or model — must not have service-layer unit tests. These methods must be either removed (if they add no value) or tested at the integration/feature level.

---

## Reason

Testing CRUD pass-through at the service level produces brittle, low-value tests that only verify that a method was called. These tests break on refactoring, add maintenance burden, and provide no safety net for business logic that doesn't exist.

---

## Bad Example

```php
class UserService
{
    public function find(int $id): ?User
    {
        return $this->users->find($id); // pure delegation
    }
}

class UserServiceTest extends TestCase
{
    public function test_find_returns_user(): void
    {
        $this->repository->shouldReceive('find')
            ->with(1)
            ->andReturn(new User(['id' => 1]));

        $result = $this->service->find(1);

        $this->assertInstanceOf(User::class, $result);
        // Low-value test — only verifies delegation happens
    }
}
```

---

## Good Example

```php
// Remove the pass-through service method entirely or
// test at feature level if truly needed

// Or only test when business logic is added:
class UserService
{
    public function find(int $id): ?User
    {
        $user = $this->users->find($id);
        if ($user && $user->isDeleted()) {
            throw new DeletedUserAccessException();
        }
        return $user;
    }
}
```

---

## Exceptions

If a pass-through method is part of a larger orchestration workflow, test the orchestration method, not the individual pass-through.

---

## Consequences Of Violation

Testing risks: brittle, low-value tests that break on refactoring. Maintenance risks: updating a repository method signature breaks many pass-through tests. Efficiency risks: test suite slows down without meaningful coverage gain.
