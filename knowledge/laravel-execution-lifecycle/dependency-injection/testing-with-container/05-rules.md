# Use instance() to Mock Interface Bindings in Tests
---
## Category
Testing
---
## Rule
Use `$this->app->instance(Interface::class, $mock)` to replace interface bindings with test doubles in tests.
---
## Reason
`instance()` stores a pre-built object in the container's `$instances` array. Subsequent `make()` calls return the mock directly, bypassing all binding resolution. This provides clean, predictable test doubles for any consumer of the interface.
---
## Bad Example
```php
public function test_order_processing(): void
{
    $service = new OrderService(
        new FakePaymentGateway(), // Manual injection — fragile
    );
}
```
---
## Good Example
```php
public function test_order_processing(): void
{
    $mock = Mockery::mock(PaymentGatewayInterface::class);
    $mock->shouldReceive('charge')->once()->andReturn(true);
    $this->app->instance(PaymentGatewayInterface::class, $mock);

    $service = app(OrderService::class);
    $result = $service->processOrder(new Order(['total' => 100]));
    $this->assertTrue($result);
}
```
---
## Exceptions
When using Laravel's built-in fakes (Event::fake(), Bus::fake(), Queue::fake()) which provide higher-level testing APIs.
---
## Consequences Of Violation
Fragile test setup; manual dependency wiring; missed integration points.

---

# Use shouldReceive() for Facade Faking
---
## Category
Testing
---
## Rule
Use `Facade::shouldReceive()` to set expectations on facade calls in tests rather than setting up real service instances.
---
## Reason
`shouldReceive()` creates a Mockery mock, installs it via `swap()`, and provides assertion-rich expectations (call count, arguments, return values). This is more expressive and resilient than using real service instances.
---
## Bad Example
```php
public function test_orders_are_cached(): void
{
    // No assertion about cache behavior — test is incomplete
    $this->get('/orders')->assertOk();
}
```
---
## Good Example
```php
public function test_orders_are_cached(): void
{
    Cache::shouldReceive('remember')
        ->once()
        ->andReturn(collect([]));

    $this->get('/orders')->assertOk();
}
```
---
## Exceptions
When testing the real service implementation (integration tests for the cache driver itself).
---
## Consequences Of Violation
Untested facade interactions; incomplete test coverage; brittle test assertions.

---

# Reset Scoped Instances Between Tests
---
## Category
Testing
---
## Rule
Call `$this->app->forgetScopedInstances()` in `setUp()` or use `refreshApplication` to clear scoped bindings between tests.
---
## Reason
Scoped instances persist within the test case. If one test resolves a scoped service and another test needs a fresh instance, the stale instance leaks behavior between tests.
---
## Bad Example
```php
public function test_first_request(): void
{
    app()->scoped(Service::class);
    $service = app(Service::class); // Cached for the test
}

public function test_second_request(): void
{
    $service = app(Service::class); // Still the same instance from previous test
}
```
---
## Good Example
```php
protected function setUp(): void
{
    parent::setUp();
    $this->app->forgetScopedInstances();
}
```
---
## Exceptions
When using `refreshesApplication` trait which rebuilds the entire container per test.
---
## Consequences Of Violation
Inter-test contamination; flaky tests; test order dependency.

---

# Prefer Fakes Over Mocks
---
## Category
Testing
---
## Rule
Use Laravel's built-in fakes (Event::fake(), Bus::fake(), Queue::fake(), Http::fake()) instead of Mockery mocks when available.
---
## Reason
Fakes implement the real interface and are more resilient to method signature changes. Mocks break when method signatures change, even if the test doesn't care about that method. Fakes also provide assertion helpers designed for Laravel patterns.
---
## Bad Example
```php
$mock = Mockery::mock(EventDispatcher::class);
$mock->shouldReceive('dispatch')->once();
$this->app->instance(EventDispatcher::class, $mock);
```
---
## Good Example
```php
Event::fake();
// Perform action that dispatches events
Event::assertDispatched(OrderPlaced::class);
```
---
## Exceptions
When no built-in fake exists for the service being tested.
---
## Consequences Of Violation
Fragile tests that break on method signature changes; more verbose test setup.

---

# Clear Facade Resolved Instances Between Tests
---
## Category
Testing
---
## Rule
Call `Facade::clearResolvedInstances()` in `setUp()` to prevent facade state from leaking between tests.
---
## Reason
The Facade base class caches resolved instances in a static `$resolvedInstance` array. Without clearing, a facade fake from one test persists into the next test.
---
## Bad Example
```php
public function test_one(): void
{
    Cache::shouldReceive('get')->andReturn('value');
}

public function test_two(): void
{
    // Cache facade still has the mock from test_one
}
```
---
## Good Example
```php
protected function setUp(): void
{
    parent::setUp();
    Facade::clearResolvedInstances();
}
```
---
## Exceptions
When using `refreshApplication` trait which rebuilds the entire container per test.
---
## Consequences Of Violation
Flaky tests; stale facade expectations; test order dependency.

---

# Use refreshApplication for Full Container Reset
---
## Category
Testing
---
## Rule
Use Laravel's `RefreshesApplication` trait when tests heavily modify container bindings and full isolation is needed.
---
## Reason
`refreshApplication` rebuilds the entire application — container, service providers, and bindings — for each test. This guarantees complete isolation at the cost of ~30-100ms per test.
---
## Bad Example
```php
// No refresh — stale state from previous tests causes failures
public function test_with_overrides(): void
{
    $this->app->instance(Service::class, $mock);
    // Previous test's overrides still present
}
```
---
## Good Example
```php
use Illuminate\Foundation\Testing\RefreshApplication;

// Container is rebuilt per test — complete isolation
public function test_with_overrides(): void
{
    $this->app->instance(Service::class, $mock);
}
```
---
## Exceptions
When test performance is critical and minimal overrides are used — use targeted cleanup instead.
---
## Consequences Of Violation
Inter-test contamination; flaky tests; hard-to-diagnose test failures.

---

# Never Override Core Framework Bindings
---
## Category
Reliability
---
## Rule
Do not replace core framework bindings (`app`, `events`, `config`, `router`) with mocks in tests.
---
## Reason
Core bindings are the backbone of Laravel's internal communication. Replacing them can break the framework's internal operations, causing tests to fail in unexpected ways or silently produce incorrect results.
---
## Bad Example
```php
$this->app->instance('events', Mockery::mock(Dispatcher::class));
// Breaks internal event communication — many framework operations rely on events
```
---
## Good Example
```php
// Use targeted fakes instead
Event::fake(); // Does not replace the dispatcher — decorates it
```
---
## Exceptions
No common exceptions. Core bindings must remain intact for the framework to function.
---
## Consequences Of Violation
Broken framework internals; silent test failures; hours of debugging wasted.
