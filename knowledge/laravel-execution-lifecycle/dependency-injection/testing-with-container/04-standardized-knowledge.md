# Testing with Container

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Testing with Container |
| Difficulty | Intermediate |
| Lifecycle Phase | Testing |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Testing with the service container involves using the container's binding replacement methods — `instance()`, `swap()`, `shouldReceive()`, and `forgetInstance()` — to substitute real services with test doubles (mocks, fakes, stubs) during test execution. Laravel's container is designed for testability: bindings can be overridden before a test runs and restored after. This enables testing code that depends on container services without requiring real implementations, by injecting lightweight test doubles in their place.

## Core Concepts
- **instance()**: Replaces a binding with a pre-built object. `$this->app->instance(Service::class, $mock)` — subsequent `make()` calls return the mock.
- **swap()**: Facade method that replaces the underlying facade instance with a test double. `Cache::swap($mock)` is equivalent to `instance()` for facades.
- **shouldReceive()**: Facade method that creates a Mockery mock and installs it via `swap()`. `Cache::shouldReceive('get')->andReturn('value')`.
- **forgetInstance()**: Removes a resolved singleton from the `$instances` cache, forcing re-resolution on the next `make()` call.
- **forgetScopedInstances()**: Clears all scoped instances — used to reset per-request scoped bindings between tests.
- **Mockery integration**: Facade faking uses Mockery under the hood — expectations are verified during PHPUnit's teardown.

## When To Use
- When testing code that uses facades — replace facades with mocks via `shouldReceive()`.
- When testing code bound to interfaces — replace the interface binding with a mock via `instance()`.
- When testing scoped bindings — reset scoped instances between tests with `forgetScopedInstances()`.
- When testing service providers — verify that the provider registers the expected bindings.

## When NOT To Use
- When testing pure business logic without container dependencies — simple unit tests with `new` are sufficient.
- When you can use Laravel's built-in fakes (Event::fake(), Bus::fake(), Queue::fake()) — these are more expressive.
- When over-mocking — replacing every dependency with a mock instead of testing real interactions.

## Best Practices (WHY)
- **Use instance() for interface bindings**: `$this->app->instance(Interface::class, $mock)` for clean interface mocking. *Why: Ensures any consumer of that interface gets the mock across all resolution paths.*
- **Use shouldReceive() for facades**: Leverages Mockery's expectation API for assertion-rich tests. *Why: Provides count/argument/return-value assertions without manual mock setup.*
- **Reset scoped instances between tests**: Call `$this->app->forgetScopedInstances()` in setUp(). *Why: Scoped bindings persist within a test case — not clearing them causes state leaks between tests.*
- **Use refreshApplication for full reset**: In PHPUnit's `RefreshesApplication` trait, the application is rebuilt per test. *Why: Guarantees clean container state — the safest approach for container-dependent tests.*
- **Prefer fakes over mocks**: Laravel's built-in fakes (Event::fake()) are more resilient to implementation changes. *Why: Fakes implement the real interface; mocks break when method signatures change.*

## Architecture Guidelines
- The `instance()` method stores objects in `$instances` array — subsequent `make()` returns the instance directly.
- `forgetInstance()` removes an entry from `$instances` — the next `make()` re-resolves.
- `swap()` on a facade calls `instance()` on the container facade accessor, then clears the facade's cached root.
- `shouldReceive()` on a facade creates a Mockery mock, calls `swap()`, and registers expectations.
- `$overrides` on the Application allow replacing bindings before the application is fully bootstrapped.

## Performance
- Container overrides in tests add negligible overhead (~0.001ms per override).
- `refreshApplication` recreates the entire application — adds 30-100ms per test but guarantees isolation.
- Using `instance()` is O(1) — direct array store and retrieve.
- Scoped instance flushing (`forgetScopedInstances()`) is O(n) on scoped binding count — typically <0.01ms.

## Security
- Using `instance()` to bypass authentication services in tests is common — ensure tests don't accidentally test with bypassed security.
- Reset all overrides between tests using `refreshApplication` or explicit cleanup — stale overrides leak sensitive behavior.
- Mocked services that throw or return incorrect values may produce false negatives — verify mock behavior matches real service contracts.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Not resetting bindings between tests | Stub persists from previous test | Inter-test contamination — false passes/failures | Use refreshApplication or tearDown cleanup |
| Using shouldReceive() without clearing facade | Fake facade root cached | shouldReceive() fails silently | Clear resolved instances or use refreshApplication |
| Over-mocking | Replacing everything with mocks | Tests pass but production fails | Use integration tests for critical paths |
| Mocking methods that don't exist | Wrong method name in shouldReceive() | Mockery throws on missing expectation at test end | Use `shouldReceive()->byDefault()` for optional methods |

## Anti-Patterns
- **Stale container state**: Running tests without resetting container bindings — leads to flaky tests that depend on execution order.
- **Global facade fakes**: Using Facade::fake() without clearing in tearDown — affects other tests in the same process.
- **Overriding core framework bindings**: Replacing `app`, `events`, `config` bindings — breaks the application's internal communication.
- **Testing container internals**: Writing tests that assert `$this->app->bound()` or `$this->app->isShared()` — test behavior, not implementation.

## Examples
```php
// Mocking an interface binding
public function test_order_service_uses_payment_gateway()
{
    $mock = Mockery::mock(PaymentGatewayInterface::class);
    $mock->shouldReceive('charge')->once()->andReturn(true);
    $this->app->instance(PaymentGatewayInterface::class, $mock);

    $service = app(OrderService::class);
    $result = $service->processOrder(new Order(['total' => 100]));
    $this->assertTrue($result);
}

// Facade faking
public function test_orders_are_cached()
{
    Cache::shouldReceive('remember')
        ->once()
        ->andReturn(collect([]));
    $this->get('/orders')->assertOk();
}
```

## Related Topics
- **Prerequisites:** Container Fundamentals — understanding instance() and forgetInstance().
- **Closely Related:** Facade Architecture — facade faking via shouldReceive() and swap().
- **Advanced:** Scoped Instance Management — forgetScopedInstances() for per-request testing.
- **Cross-Domain:** PHPUnit Integration, Mockery Framework.

## AI Agent Notes
- The `RefreshesApplication` trait in Laravel tests calls `$this->refreshApplication()` in setUp(), rebuilding the container for each test.
- `$this->app->instance()` is the primary method for injecting mocks — it stores in `$instances` and bypasses binding resolution.
- Facade fakes: `Cache::fake()` calls `Facade::swap()` which clears the cached root AND calls `$app->instance()`.
- For static analysis, prefer `app()->instance(Interface::class, $mock)` over facade fakes.
- Scoped bindings are NOT automatically flushed between tests — must call `forgetScopedInstances()` or use `refreshApplication`.

## Verification
- [ ] Tests that mock container bindings use instance() or shouldReceive()
- [ ] Facade fakes are cleared between tests (in setUp or tearDown)
- [ ] Scoped bindings are reset between tests where relevant
- [ ] No stale container state causes inter-test contamination
- [ ] Core framework bindings are not overridden in tests
