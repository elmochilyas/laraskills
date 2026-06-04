# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mocking, Fakes & Test Doubles |
| Knowledge Unit | Mockery Integration |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Test double taxonomy, Service container, Dependency injection |
| Related KUs | Laravel fakes, HTTP Client faking, Partial mock patterns, Spy patterns |
| Source | domain-analysis.md K033 |

# Overview

Mockery is the de facto mocking framework in the Laravel ecosystem, providing `mock()`, `partialMock()`, and `spy()` helpers integrated into Laravel's base TestCase. While Laravel's native fakes are preferred for framework services, Mockery is used for custom interfaces, third-party SDKs, and scenarios requiring precise call verification. Understanding Mockery patterns is essential for testing service boundaries where fakes don't exist.

# Core Concepts

- **`$this->mock(Class::class)`**: Creates a full mock where all methods have default return values (null). Expectations set with `shouldReceive()`.
- **`$this->partialMock(Class::class)`**: Creates a partial mock where unmocked methods call the real implementation.
- **`$this->spy(Class::class)`**: Creates a spy that records all calls. Verify with `shouldHaveReceived()`.
- **`shouldReceive('method')`**: Defines expectation that a method will be called. Specify arguments (`with()`), return value (`andReturn()`), call count.
- **`shouldHaveReceived('method')`**: Spy method for post-hoc call verification.
- **Mocking facades**: `Facade::shouldReceive('method')` directly. Less common in modern Laravel (prefer fakes).
- **Container binding**: `$this->instance(Contract::class, $mock)` binds mock into container for auto-injection.

# When To Use

- For custom interfaces and repositories (services without built-in fakes)
- For third-party SDKs where no fake exists
- When precise call count verification is needed (call exactly N times)
- For partial mocking when one method of a class needs overriding
- For spies when you need post-hoc verification without pre-configured expectations

# When NOT To Use

- For Laravel-native services that have built-in fakes (use `::fake()` instead)
- For testing Eloquent models (extremely brittle; use feature tests with factories)
- When a real implementation is simpler and faster than a mock
- For over-mocking (mocking everything in sight — test becomes brittle)

# Best Practices (WHY)

- **Prefer fakes over mocks for Laravel services**: `Event::fake()`, `Mail::fake()`, etc. are less brittle than `Event::shouldReceive()`. Reserve mocks for custom interfaces.
- **Set expected call count explicitly**: `shouldReceive('send')->once()` or `->times(3)`. Without `times()`, the method can be called 0, 1, or 10 times and the test passes.
- **Use spies for post-hoc verification, mocks for pre-configured behavior**: Spies (`shouldHaveReceived`) are less brittle for checking "did this happen?" scenarios. Mocks are better for "when this happens, return X."
- **Don't mock Eloquent models**: Eloquent's magic methods, relationships, and query builder make mocks extremely brittle. Use factory-created models in feature tests.
- **Prefer dependency extraction over partial mocking**: If you need to mock one method of a class, consider extracting that method to a separate collaborator. Partial mocking tests internal structure.

# Architecture Guidelines

- **Mock vs Fake**: Fakes for Laravel services. Mocks for custom interfaces. Spies for post-hoc verification.
- **Mock vs Spy**: Mocks when call count matters. Spies when call existence matters.
- **Partial mock vs dependency extraction**: Prefer extracting a dependency over partial mocking.
- **`mock()` vs `instance()` + `Mockery::mock()`**: Use `$this->mock()` for container-managed classes. Use `Mockery::mock()` directly for classes not resolved from the container.

# Performance Considerations

- Mock creation: 1-5ms per mock (class generation + reflection).
- Expectation setup: <0.1ms per expectation.
- Mock reset (`Mockery::close()`): <0.5ms per mock.
- Spy call recording: <0.01ms per recorded call.

# Security Considerations

- Mocks of security-related interfaces (auth providers, token generators) must accurately simulate security behavior. A mock that always returns "authenticated" may hide auth bugs.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Over-mocking (mocking everything) | Testing in isolation | Tests become brittle; refactoring breaks many tests | Mock only service boundaries; use real implementations for value objects |
| Using partial mocks for internal method testing | Partial mock to "test just this method" | Tests internal structure, not behavior | Test through public API. Extract separate collaborator if needed |
| Not setting expected call count | `shouldReceive('send')->andReturn(true)` without `times()` | Method called 0, 1, or 10 times; test passes regardless | Use `once()`, `twice()`, `times(N)` explicitly |
| Mocking Eloquent models | Avoiding database setup | Eloquent's magic methods make mocks extremely brittle | Use factory-created models in feature tests |
| Using mocks where fakes exist | Familiarity with Mockery | More brittle tests; more setup code | Use `::fake()` for all Laravel-native services |

# Anti-Patterns

- **Mocking everything**: Every dependency is mocked, even value objects and collections. Tests break on any refactoring. Use real implementations for stable dependencies.
- **No call count verification**: `shouldReceive('method')` without `once()` or `times(N)`. The method may never be called but the test passes.
- **Partial mocking public API**: Using partial mock to intercept a method that should be an external dependency. Code smell — extract the dependency.
- **Mocking facades**: `User::shouldReceive('find')` instead of using a real User model. Use feature tests with real models.

# Examples

```php
// Contract boundary mocking
public function test_order_service_uses_repository()
{
    $repo = $this->mock(OrderRepositoryInterface::class);
    $repo->shouldReceive('find')
        ->with(1)
        ->once()
        ->andReturn(Order::factory()->make());

    $service = new OrderService($repo);
    $result = $service->getOrder(1);

    $this->assertNotNull($result);
}

// Partial mock for method isolation
public function test_order_service_calculates_shipping()
{
    $service = $this->partialMock(OrderService::class);
    $service->shouldReceive('getShippingRate')
        ->with('zip-12345')
        ->once()
        ->andReturn(5.99);

    $result = $service->calculateTotal(
        Order::factory()->make(['zip' => 'zip-12345'])
    );

    $this->assertEquals(105.99, $result);
}

// Spy for post-hoc verification
public function test_logger_is_called_on_error()
{
    $logger = $this->spy(LoggerInterface::class);
    $service = new ErrorHandler($logger);

    $service->handle(new \Exception('test error'));

    $logger->shouldHaveReceived('error')
        ->with('test error')
        ->once();
}

// Mock with argument matching
public function test_mock_with_specific_arguments()
{
    $api = $this->mock(ThirdPartyApi::class);
    $api->shouldReceive('charge')
        ->with(Mockery::on(fn ($amount) => $amount > 0))
        ->once()
        ->andReturn(['status' => 'success']);

    $service = new PaymentService($api);
    $result = $service->processPayment(50.00);

    $this->assertTrue($result);
}
```

# Related Topics

- **Prerequisites**: Test double taxonomy, Service container, Dependency injection
- **Related**: Laravel fakes, HTTP Client faking, Partial mock patterns, Spy patterns
- **Advanced**: Custom Mockery matchers, Mockery configuration, Partial mock vs extraction refactoring

# AI Agent Notes

- Mockery is for custom interfaces only. For Laravel services (Mail, Event, Queue, etc.), use built-in fakes. The rule of thumb: if `::fake()` exists, use it. If not, use Mockery.
- Always specify call count expectations (`once()`, `twice()`, `times(N)`). Without it, zero calls would still pass the test.
- Spies are less brittle than mocks for verification scenarios. Use `$this->spy(Class::class)` and `shouldHaveReceived()` when you just need to confirm a call happened.

# Verification

- [ ] Mocks are used only for custom interfaces, not Laravel-native services
- [ ] Every `shouldReceive()` has an explicit call count (`once()`, `twice()`, `times(N)`)
- [ ] Eloquent models are not mocked (use feature tests with factories)
- [ ] Spies are used for post-hoc verification where appropriate
- [ ] Over-mocking is avoided (real implementations for stable/value dependencies)
- [ ] Partial mocks are used sparingly (prefer dependency extraction)
- [ ] `Mockery::close()` is handled by the test framework
- [ ] Mock expectations match the actual interface (no `BadMethodCallException`)
