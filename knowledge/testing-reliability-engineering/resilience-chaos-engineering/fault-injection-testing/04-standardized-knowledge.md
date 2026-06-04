# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Resilience & Chaos Engineering
Knowledge Unit: Fault Injection Testing with Laravel Resilience
 KU Code: ku-03-fault-injection-testing
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Laravel Resilience is a fault injection package (v0.7.0) that enables deterministic resilience testing by simulating real failures in container-managed services. Unlike traditional mocking (which replaces services entirely), Resilience injects faults (timeout, exception, latency) into real service instances, preserving the service's behavior while introducing controlled failures. It provides a test-first workflow: discover services → scaffold resilience tests → inject faults → assert fallback behavior.

# Core Concepts
- **Fault injection**: Introducing controlled failures into a service without replacing it. The service runs normally except for the injected fault.
- **Service decorator**: Resilience wraps the original service with a decorator that intercepts calls and injects faults. The decorator delegates to the real service when no fault is active.
- **Fault types**: `ExceptionFault` (throws configurable exception), `TimeoutFault` (delays response beyond timeout), `LatencyFault` (delays by configurable duration).
- **Discovery mode**: Scans container bindings to identify injectable services. Generates a discovery report.
- **Scaffold command**: `php artisan resilience:scaffold` generates test templates for discovered services.
- **Fallback assertions**: `assertFallbackUsed()` and `assertDegradedButSuccessful()` verify fallback execution.
- **Container-aware**: Works with services bound to the Laravel service container. Decorates at container level.

# When To Use
- Services with fallback behavior (cached data, default values, degraded responses)
- External API clients where timeout handling is critical
- Database services with read-replica fallback
- Cache services where fallback to direct query is acceptable
- Circuit breaker testing (verify circuit opens on repeated failures)
- Any service bound to the container with `bind()` or `singleton()`

# When NOT To Use
- Services not bound to the container (instantiated with `new`)
- As a replacement for feature tests (use standard assertions for behavior verification)
- For return value control (use Mockery or fakes for that)
- Without fallback code already implemented (tests will fail predictably)
- In production under any circumstances

# Best Practices (WHY)
- **Write fallback code before resilience tests**: Reason: resilience tests verify fallback behavior. Without fallback code, every test fails with no useful signal.
- **Use the discovery → scaffold → test workflow**: Reason: discovery reveals all injectable services. Scaffold generates tests. Customize scaffolds for meaningful assertions. Don't skip steps.
- **Inject one fault per test**: Reason: multiple faults make it impossible to determine which fault caused the observed behavior. Test each fault type separately.
- **Always assert fallback behavior**: Reason: injecting a fault and not checking the response validates nothing. `assertFallbackUsed()` or assert degraded content.
- **Run resilience tests in a separate CI stage**: Reason: timeout/latency faults make tests slower. Main suite should be fast. Resilience tests can run in a scheduled workflow.
- **Clear faults in setUp/tearDown**: Reason: active faults persisting across tests cause unpredictable failures. Use `beforeEach`/`afterEach` to clear.
- **Start with ExceptionFault, add LatencyFault later**: Reason: exception injection is fastest (no delay). Latency and timeout faults slow down tests. Validate exception handling first.

# Architecture Guidelines
- **Container binding convention**: Bind services to interfaces via `$this->app->bind(Contract::class, Implementation::class)`. Resilience decorates at the binding level.
- **Fallback marker pattern**: Fallback code should set a flag (`$this->fallbackUsed = true`) that resilience assertions check.
- **Fault scope per test**: Use `Resilience::fake()` or `$this->injectFault()` to scope faults to individual tests.
- **Service interface design**: Design service interfaces with resilience in mind. Each method should have a documented failure mode.
- **Testing service provider**: Optionally create `TestingServiceProvider` that binds null implementations for non-critical services.
- **Discovery frequency**: Run discovery when container bindings change. Schedule quarterly for stable codebases.

# Performance
- **Fault injection overhead**: <0.1ms per service call when no fault is active. Negligible.
- **Timeout fault**: Delays test by timeout duration. Use 100-500ms for testing instead of production 5s.
- **Latency fault**: Delays test by configured latency. Use 50-100ms for testing.
- **Discovery**: 1-10 seconds depending on container bindings. Run on demand.
- **Scaffold**: Generates files in milliseconds. No performance concern.
- **Separate CI stage**: Prevents slow resilience tests from blocking fast feature/unit test feedback.

# Security
- **Never enable in production**: Resilience is for testing and development only. Use environment gating.
- **Service decoration safety**: The decorator pattern is safe (zero overhead when no fault active) but the package should not be installed in production dependencies.
- **Discovery output review**: Discovery may reveal service bindings and class names. Review before committing.
- **Logging**: Fault injection logs may include method arguments. Ensure no sensitive data is logged.

# Common Mistakes

**Mistake: Treating Resilience like a mocking library**
- Description: Using `Resilience::fake(Service::class)->shouldReceive('method')->andReturn('value')`
- Cause: Familiarity with Mockery's API; assuming Resilience works the same
- Consequence: Resilience doesn't support return value control; tests fail unexpectedly
- Better: Use Resilience for faults (exception, timeout, latency). Use Mockery/fakes for return value control.

**Mistake: No fallback code before resilience tests**
- Description: Writing resilience tests before implementing fallback behavior
- Cause: "Let's test first, see what breaks"
- Consequence: Every test fails because fallback doesn't exist; tests are noise
- Better: Implement fallback code first, then write resilience tests to verify it.

**Mistake: Injecting faults without assertions**
- Description: `$this->injectFault(...); $this->get('/endpoint'); // no assertion`
- Cause: Assuming the test will visibly fail if resilience is broken
- Consequence: Test passes even when fallback doesn't execute
- Better: Always assert fallback behavior: `assertFallbackUsed()` or check response content.

**Mistake: Running resilience tests in the main CI job**
- Description: Combining resilience tests with feature/unit tests in one CI job
- Cause: "Combine all tests in one CI job for simplicity"
- Consequence: Slow timeout/latency faults delay the entire test suite
- Better: Run resilience tests in a separate CI stage or scheduled workflow.

# Anti-Patterns
- **Global fault activation**: Activating faults globally (not per-test) causes cascading test failures. Always scope faults to individual tests.
- **No environment check**: Running resilience tests without verifying `APP_ENV=testing`. Could accidentally run in staging or production.
- **Fake fallback assertions**: `assertFallbackUsed()` when the fallback flag is never set. The assertion passes vacuously.
- **Over-reliance on discovery**: Discovery identifies what CAN be tested, not what SHOULD be tested. Prioritize critical services.
- **No fallback for fallback**: Testing only the primary fallback. What happens when the fallback itself fails? Test multi-layer resilience.

# Examples

**Laravel Resilience fault injection**
```php
use Illuminate\Support\Facades\Resilience;

test('user profile loads from cache when user API times out', function () {
    Resilience::fake(UserApiService::class, 'fetchUser', TimeoutFault::class);

    $response = $this->get('/profile');

    $response->assertOk();
    $this->assertFallbackUsed();
    $response->assertSee('cached profile');
});
```

**Discovery and scaffold workflow**
```bash
# Discover injectable services
php artisan resilience:discover

# Scaffold resilience tests
php artisan resilience:scaffold

# Run resilience tests
php artisan test --filter=Resilience
```

**Exception fault with custom exception**
```php
test('payment gateway exception triggers order pending state', function () {
    Resilience::fake(
        PaymentGateway::class,
        'charge',
        ExceptionFault::class,
        ['exception' => PaymentFailedException::class]
    );

    $response = $this->post('/orders', ['amount' => 5000]);

    $response->assertStatus(202);
    $this->assertDatabaseHas('orders', ['status' => 'pending_payment']);
    $this->assertFallbackUsed();
});
```

# Related Topics
- Chaos engineering with Laravel Bazooka
- Circuit breaker patterns (laravel-fuse)
- Degraded mode patterns
- Retry and backoff strategies
- Service container decoration
- Laravel service provider patterns

# AI Agent Notes
- Laravel Resilience is pre-1.0 (v0.7.0). API may change. Pin version in `composer.json` and review changelog before upgrading.
- The discovery → scaffold → test workflow is the recommended starting point. Agents should generate code that follows this pattern.
- When generating resilience tests, always include both the fault injection AND the fallback assertion. One without the other is incomplete.
- Prefer `ExceptionFault` over `TimeoutFault` in generated tests — exception injection is faster and more predictable.
- For services without fallback code, the agent should first implement fallback, then generate resilience tests — never generate tests that will fail.
- The package has limited community adoption (1 GitHub star). Agents should document known limitations and workarounds.

# Verification
- [ ] Can discover all container-managed services with `php artisan resilience:discover`
- [ ] Can scaffold resilience tests with `php artisan resilience:scaffold`
- [ ] Can inject ExceptionFault, TimeoutFault, and LatencyFault into any container-bound service
- [ ] `assertFallbackUsed()` correctly identifies when fallback code executed
- [ ] `assertDegradedButSuccessful()` correctly identifies degraded responses
- [ ] Faults are scoped per-test and cleaned up after each test
- [ ] Resilience tests run in a separate CI stage without blocking the main suite
- [ ] Production environment blocks all fault injection via multi-layer gating
