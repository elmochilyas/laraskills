# ECC Standardized Knowledge — Service Testing

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Service Layer Pattern |
| **Knowledge Unit** | Service Testing |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Business Logic |
| **Last Updated** | 2026-06-02 |

---

## Overview

Service testing validates that business logic works correctly in isolation from the HTTP layer. Services should be tested as unit tests — instantiate the service with mocked dependencies, call the method, and assert the result. This is distinct from controller testing (feature tests with HTTP boot) and action testing (unit tests for single operations).

The scope of service testing: method correctness (given input X, does method produce output Y?), dependency interaction (are the right dependencies called with the right parameters?), error handling (does the method handle failure correctly?), orchestration (are multi-step workflows executed in the right order?).

---

## Core Concepts

### Unit Testing Services
Create the service with mocked dependencies (or real implementations where practical), call the method, assert the result.

### Dependency Mocking
Mock repositories, gateways, and external services. Use `Mockery` or Laravel's `$this->mock()` facade.

### Testing Orchestration
For orchestration methods, verify that child actions/services are called in the correct order with the correct parameters.

### Testing Error Handling
Test that exceptions are properly caught, logged, and re-thrown or handled.

---

## When To Use

- Every service method with business logic
- Orchestration methods with multi-step workflows
- Methods with conditional branching
- Methods with error handling

---

## When NOT To Use

- CRUD pass-through methods (test at the controller level)
- Methods that only delegate to a repository (test the repository instead)

---

## Best Practices

### Mock External Dependencies
Mock repositories, HTTP clients, and external services.

**Why:** External dependencies make tests slow, brittle, and dependent on infrastructure. Mocking isolates the service logic.

### Test Real Business Logic, Not Mock Interaction
Verify that the output is correct, not just that a method was called.

**Why:** Interaction testing (asserting method X was called) is less valuable than behavioral testing (asserting result Y is correct). Prefer result assertions over mock verifications.

### Use Factory Data for Inputs
Create test data using factories rather than manually constructing arrays.

**Why:** Factories provide realistic data structures and reduce test setup code. They also keep test data consistent with the actual schema.

### Test All Conditional Branches
Test every `if/else` path in the service method.

**Why:** Untested conditional branches are the most common source of production bugs. Each branch represents a different behavior that must be verified.

---

## Architecture Guidelines

### Service Unit Test
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

    public function test_place_order_creates_order()
    {
        $data = new PlaceOrderData(customerId: 1, items: [['product_id' => 1, 'qty' => 2]]);

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

## Common Mistakes

### Testing Through HTTP
Desc: Testing business logic via HTTP feature tests.
Cause: Convenience — feature tests don't need mocking.
Consequence: Tests are slow (framework boot per test), brittle (HTTP layer changes break them).
Better: Unit test services directly with mocked dependencies.

### Over-Mocking
Desc: Mocking every dependency including simple value objects.
Cause: "All dependencies must be mocked."
Consequence: Tests are tightly coupled to implementation; refactoring breaks many tests.
Better: Use real implementations for simple, fast dependencies. Mock only expensive or external ones.

### Not Testing Error Cases
Desc: Only testing the "happy path."
Cause: Error handling seems secondary.
Consequence: Production errors go uncaught.
Better: Test all exception paths and conditional branches.

---

## Anti-Patterns

### Service Tests as Controller Tests
Testing services by booting the framework and making HTTP requests. This is feature testing, not service testing. Service tests should be fast unit tests.

### Fragile Mock Assertions
Asserting exact parameter values with `once()` instead of allowing some flexibility. Changes to implementation details break the test.

---

## Examples

### Service Test with Orchestration
```php
public function test_place_order_orchestrates_actions()
{
    $orderData = new PlaceOrderData(/* ... */);

    $this->inventoryMock->shouldReceive('handle')
        ->once()
        ->with(Mockery::type('array'))
        ->andReturn(true);

    $this->paymentMock->shouldReceive('handle')
        ->once()
        ->andReturn(new Payment(['id' => 1]));

    $this->orderMock->shouldReceive('handle')
        ->once()
        ->andReturn(new Order(['id' => 1]));

    $result = $this->service->placeOrder($orderData);

    $this->assertInstanceOf(OrderResult::class, $result);
}
```

---

## Related Topics

### Prerequisites
- **Service Class Design** — What services do
- **Testing & Reliability Engineering** — Unit testing fundamentals

### Closely Related
- **Action Testing** — Testing individual action classes
- **Controller Testing** — Testing HTTP integration

### Advanced
- **Service Orchestration** — Testing orchestration workflows

---

## AI Agent Notes

### Important Decisions
- Service tests are unit tests (no framework boot needed)
- Mock external dependencies (repositories, gateways, HTTP clients)
- Test real outputs, not just mock interactions
- Test ALL conditional branches

### Important Constraints
- Services must be testable without HTTP boot
- Mocking should be minimal — mock only what's expensive or external
- Test results, not implementation details
- Each test should verify one behavior

---

## Verification

This document has been validated against:
- PHPUnit/Pest unit testing patterns for Laravel services
- Mockery pattern for service dependency mocking
- Production service test patterns
