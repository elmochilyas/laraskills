# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Resilience & Chaos Engineering |
| Knowledge Unit | Laravel Resilience Fault Injection |
| Difficulty | Advanced |
| Maturity | Emerging |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel service container, Dependency injection, Testing with Pest/PHPUnit |
| Related KUs | Chaos engineering (Laravel Bazooka), Circuit breaker patterns, Fallback patterns |
| Source | domain-analysis.md K037 |

# Overview

Laravel Resilience is a fault injection package that enables deterministic resilience testing in Laravel applications by simulating real failures in container-managed services. Unlike traditional mocking (which replaces services entirely), Resilience injects faults (timeout, exception, latency) into real service instances, preserving the service's behavior while introducing controlled failures. It provides a test-first workflow: discover services → scaffold resilience tests → inject faults → assert fallback behavior. The package is at version 0.7.0 (March 2026) and represents a new approach to testing: validating that the application handles real-world failures gracefully without replacing services with mocks.

# Core Concepts

- **Fault injection**: Introducing controlled failures (exception, timeout, latency) into a service without replacing the service itself.
- **Service decorator**: Resilience wraps the original service with a decorator that intercepts calls and can inject faults. The decorator delegates when no fault is active.
- **Fault types**: `ExceptionFault` (throws configurable exception), `TimeoutFault` (delays response beyond threshold), `LatencyFault` (delays response by configurable duration).
- **Discovery mode**: Scans container bindings to identify injectable services. Generates a report of all container-managed services.
- **Scaffold command**: `php artisan resilience:scaffold` generates test templates for discovered services.
- **Fallback assertion**: `assertFallbackUsed()` and `assertDegradedButSuccessful()` verify that the application correctly falls back when faults are injected.

# When To Use

- Testing fallback behavior for external service failures
- Verifying graceful degradation in container-managed services
- Simulating timeout scenarios for HTTP clients, databases, and caches
- Testing circuit breaker triggers with real service decorators
- Complementing unit tests with failure-mode validation

# When NOT To Use

- As a replacement for traditional mocking (use mocks for return value control)
- For services without fallback code (write fallback code first)
- In production (Resilience is a testing/development tool)
- For testing behavior unrelated to failure modes
- When the service cannot be decorated (abstract classes, final constructors)

# Best Practices (WHY)

- **Write fallback code before resilience tests**: Reason: every resilience test will fail if there's no fallback. Implement fallbacks first, then verify them with fault injection.
- **Use per-test fault activation (narrow scope)**: Reason: keeps tests predictable. Global fault activation may affect unrelated tests.
- **Always assert fallback behavior**: Reason: injecting a fault without asserting the fallback verifies nothing. Use `assertFallbackUsed()` or assert degraded response content.
- **Run resilience tests in a separate CI stage**: Reason: timeout/latency faults are slower and should not block initial test feedback.
- **Run discovery when container bindings change**: Reason: new services need resilience test coverage. Schedule quarterly for stable codebases.
- **Use short timeouts for testing**: Reason: timeout faults delay test execution. Configure 100ms instead of 5s for testing scenarios.

# Architecture Guidelines

- **Workflow**: Discover services → scaffold tests → customize assertions → inject faults → verify fallback behavior.
- **Fault type selection**: Exception for crash scenarios, Timeout for slow responses, Latency for degradation testing.
- **Service decorator pattern**: Resilience extends container bindings; no changes to service or consumer code.
- **Fault lifecycle**: Define fault → inject into service → execute call → fault triggers → assert fallback → clear fault after test.
- **Discovery frequency**: Run whenever container bindings change. Schedule quarterly for stable codebases.

# Performance Considerations

- **Fault injection overhead**: <0.1ms per service call when no fault is active. Negligible.
- **Timeout fault**: Delays test by timeout duration. Use short timeouts (e.g., 100ms) for testing.
- **Latency fault**: Delays test by configured latency. Configure minimal (50-100ms) for testing.
- **Discovery**: 1-10 seconds depending on container binding count. Run on demand, not per-test.
- **Scaffold**: Generates files in milliseconds. No performance concern.

# Security Considerations

- **Never enable faults in production**: Resilience is designed for testing only. Use environment gating.
- **Service decorators in production**: The decorator pattern is safe for production (zero overhead when no fault is active), but the package should not be installed in production dependencies.
- **Fault persistence**: Ensure faults are cleared between tests to prevent cross-test contamination.

# Common Mistakes

**Mistake: Treating Resilience like a mocking library**
- Description: `Resilience::fake(Service::class)->shouldReceive('method')->andReturn('value')`
- Cause: Familiarity with mocking APIs
- Consequence: Resilience doesn't work like Mockery; it injects faults, not return values
- Better: Use Resilience for faults. Use Mockery or fakes for return value control.

**Mistake: Not writing fallback code before resilience tests**
- Description: Writing resilience tests for services without fallback implementation
- Cause: "Let's test first, see what breaks"
- Consequence: Every test fails because there's no fallback
- Better: Implement fallback code first, then write resilience tests.

**Mistake: Injecting faults without verifying fallback**
- Description: `$this->injectFault(...); $this->get('/endpoint'); // no assertion`
- Cause: Assuming the fault will cause a visible failure
- Consequence: Test doesn't verify that fallback was actually used
- Better: Always assert fallback behavior.

**Mistake: Running resilience tests in the same job as regular tests**
- Description: Combining all tests in one CI job
- Cause: Simpler CI configuration
- Consequence: Slow timeout/latency faults delay the entire suite
- Better: Run resilience tests in a separate CI stage.

# Anti-Patterns

- **Global fault activation**: Activating faults for the entire test suite instead of per-test.
- **Missing fallback assertions**: Injecting faults but not verifying that fallback code executed.
- **Ignoring discovery results**: Adding new services without running discovery and adding resilience tests.
- **Production deployment**: Installing the Resilience package in production Composer dependencies.

# Examples

**Discover and scaffold**
```bash
php artisan resilience:discover
php artisan resilience:scaffold
php artisan resilience:scaffold --service=PaymentGateway
```

**Fault injection in a test**
```php
test('payment gateway timeout triggers fallback', function () {
    Resilience::fake(PaymentGateway::class)
        ->method('charge')
        ->willThrow(new TimeoutException('Connection timed out'));

    $response = $this->post('/checkout', ['amount' => 100]);

    $response->assertOk();
    $response->assertSee('Payment processing is delayed. We will notify you.');
    $this->assertFallbackUsed();
});
```

**Timeout fault for HTTP client**
```php
test('slow API response is handled gracefully', function () {
    Resilience::fake(ExternalApiClient::class)
        ->method('fetchData')
        ->willTimeout(100);

    $response = $this->get('/dashboard');

    $response->assertOk();
    $response->assertSee('Data temporarily unavailable');
});
```

# Related Topics

- Chaos engineering (Laravel Bazooka)
- Circuit breaker patterns
- Fallback and degraded mode patterns
- Production resilience verification
- Resilience metrics and observability
- Multi-service resilience testing

# AI Agent Notes

- When generating resilience test code, always include fallback assertions (`assertFallbackUsed()`, `assertDegradedButSuccessful()`).
- Use per-test fault activation, not global. Clear faults in `setUp()` or `beforeEach()`.
- Generate resilience tests for all container-managed services with fallback code.
- For CI configurations, generate a separate stage for resilience tests.
- Never generate code that installs or enables Resilience in production.
- Use short timeout values (100-200ms) in generated test code to avoid slow test execution.

# Verification

- [ ] Fallback code exists before resilience tests are written
- [ ] Faults are activated per-test (not globally)
- [ ] Every fault injection is paired with a fallback assertion
- [ ] Resilience tests run in a separate CI stage
- [ ] Discovery is run when container bindings change
- [ ] Short timeout values are used in tests (100ms not 5s)
- [ ] Faults are cleared between tests
- [ ] Resilience package is not installed in production dependencies
