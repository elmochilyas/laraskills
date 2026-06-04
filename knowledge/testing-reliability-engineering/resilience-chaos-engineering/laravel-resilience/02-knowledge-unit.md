# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Resilience & Chaos Engineering
Knowledge Unit: Laravel Resilience Fault Injection
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Laravel Resilience is a fault injection package that enables deterministic resilience testing in Laravel applications by simulating real failures in container-managed services. Unlike traditional mocking (which replaces services entirely), Resilience injects faults (timeout, exception, latency) into real service instances, preserving the service's behavior while introducing controlled failures. It provides a test-first workflow: discover services → scaffold resilience tests → inject faults → assert fallback behavior. The package is at version 0.7.0 (March 2026) and represents a new approach to testing: validating that the application handles real-world failures gracefully without replacing services with mocks.

# Core Concepts
- **Fault injection**: Introducing controlled failures (exception, timeout, latency) into a service without replacing the service itself. The service runs normally except for the injected fault.
- **Service decorator**: Resilience wraps the original service with a decorator that intercepts calls and can inject faults. The decorator delegates to the real service when no fault is active.
- **Fault types**: `ExceptionFault` (throws configurable exception), `TimeoutFault` (delays response beyond timeout threshold), `LatencyFault` (delays response by configurable duration).
- **Discovery mode**: Resilience scans the application's service container bindings to identify injectable services. Generates a discovery report of all container-managed services.
- **Scaffold command**: `php artisan resilience:scaffold` generates test templates for discovered services, providing a starting point for resilience test development.
- **Fallback assertion**: `assertFallbackUsed()` and `assertDegradedButSuccessful()` verify that the application correctly falls back when faults are injected.
- **Container-aware**: Resilience works with services bound to the Laravel service container. It decorates them at the container level, so all consumers of that service are affected.

# Mental Models
- **Fault injection vs mocking**: Mocking replaces a service with a test double. Fault injection wraps the real service and lets real errors through. Mocking tests "does the fallback code work?" Fault injection tests "does the fallback code work when the real service fails in specific ways?"
- **Discovery → Scaffold → Test**: The Resilience workflow is three-step. Discover all injectable services → generate test templates → write tests for each service's failure modes.
- **Container decoration as non-invasive**: Resilience decorates services at the container level. The service class doesn't change; the consumer doesn't change. Only the container wiring changes.
- **Degraded but successful**: The goal of resilience testing is not "everything works perfectly" but "the application continues to function, possibly in degraded mode." A degraded response with cached data is better than a 500 error.

# Internal Mechanics
- **Service decoration**: Resilience uses Laravel's `extend()` method on the container to wrap service bindings. When a service is resolved, Resilience returns a decorator that proxies calls to the real service through a fault-checking layer.
- **Fault activation**: Faults are activated per test using the `Resilience::fake()` or `$this->injectFault()` helper. Active faults are stored in memory for the test's lifetime and cleared after each test.
- **Discovery process**: `php artisan resilience:discover` iterates all container bindings, instantiates each service (if possible), and reports: class name, interface, binding type (singleton/bound), and whether it can be decorated.
- **Fault lifecycle**: Define fault (class, method, fault type, parameters) → Inject fault into service → Execute service call → Fault triggers → Assert application behavior → Clear fault after test.
- **Assertion mechanism**: `assertFallbackUsed()` asserts that the fallback code path was executed. Works by setting a flag when fallback is invoked. Test checks the flag after action execution.
- **Exception fault detail**: `ExceptionFault` can throw any exception class. Common choices: `HttpException`, `TimeoutException`, `ConnectionException`, `RuntimeException`.

# Patterns
- **Pattern: Discover and scaffold resilience tests**
  - Purpose: Generate resilience test suite from existing services
  - Benefits: Comprehensive coverage; no manual test creation from scratch
  - Tradeoffs: Generated tests need customization for meaningful assertions
  - Implementation: `php artisan resilience:discover` → `php artisan resilience:scaffold` → customize generated tests

- **Pattern: Timeout fault for HTTP client**
  - Purpose: Test handling of slow external API responses
  - Benefits: Validates timeout configuration and fallback behavior
  - Tradeoffs: Timeout fault delays test execution (by timeout duration)
  - Implementation: Inject `TimeoutFault` into HTTP client service; assert fallback response returned within acceptable time

- **Pattern: Exception fault for database service**
  - Purpose: Test application behavior when database connection fails
  - Benefits: Ensures read-replica fallback or cached data is served
  - Tradeoffs: May cause test pollution if not properly isolated
  - Implementation: Inject `ExceptionFault(ConnectionException::class)` into DB service; assert read-replica or cache used

- **Pattern: Latency fault for cache service**
  - Purpose: Verify application doesn't hang when cache is slow
  - Benefits: Prevents cache-dependent performance degradation
  - Tradeoffs: Adds latency to test execution
  - Implementation: Inject `LatencyFault(2000)` into cache service; assert application degrades gracefully (slower but still functional)

- **Pattern: Fallback verification**
  - Purpose: Assert that fallback code path executes correctly
  - Benefits: Explicit verification of resilience behavior
  - Tradeoffs: Requires fallback code to set assertion markers
  - Implementation: `Resilience::fake(Service::class, 'method'); $this->get('/endpoint'); $this->assertFallbackUsed();`

# Architectural Decisions
- **Resilience vs traditional mocking**: Use Resilience for services where fallback behavior is critical and you need to test the real service's failure modes. Use traditional mocking for services where you only need to control the return value.
- **Fault scope**: Activate faults per test (narrow scope) for predictable tests. Activate globally for integration testing (wider scope, more realistic).
- **Discovery frequency**: Run discovery whenever container bindings change (new service classes, new interfaces). Schedule quarterly if the codebase is stable.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Tests real service failure modes | Requires container-managed services | Refactor non-container services for testability |
| Non-invasive service decoration | Decorator overhead (negligible) | Acceptable for testing environments |
| Discovery → scaffold workflow | Generated tests need customization | Review and customize before committing |
| Fallback assertions verify behavior | Requires fallback code to exist | Write fallback code before resilience tests |

# Performance Considerations
- Fault injection overhead: <0.1ms per service call when no fault is active. Negligible.
- Timeout fault: Delays test by timeout duration (e.g., 5s). Significant. Use short timeouts for testing (e.g., 100ms instead of 5s).
- Latency fault: Delays test by configured latency. Configure minimal latency (50-100ms) for testing.
- Discovery: 1-10 seconds depending on container binding count. Run on demand, not per-test.
- Scaffold: Generates files in milliseconds. No performance concern.

# Production Considerations
- **Never enable faults in production**: Resilience is designed for testing and development only. Use environment gating to prevent production activation.
- **Service decoration in production**: The decorator pattern itself is safe for production (zero overhead when no fault is active), but the package should still not be installed in production Composer dependencies.
- **Fallback test coverage**: Prioritize resilience tests for services that have no redundancy (single database, single cache, single external API). Services with built-in redundancy (read replicas, clustered cache) need less resilience testing.
- **Resilience test CI integration**: Run resilience tests in a separate CI stage after the main test suite. They are slower (due to timeout/latency faults) and should not block initial test feedback.

# Common Mistakes
- **Mistake: Treating Resilience like a mocking library**
  - Why: `Resilience::fake(Service::class)->shouldReceive('method')->andReturn('value')`
  - Why harmful: Resilience doesn't work like Mockery; it injects faults, not return values
  - Better: Use Resilience for faults (exception, timeout, latency). Use Mockery or fakes for return value control.

- **Mistake: Not writing fallback code before resilience tests**
  - Why: "Let's test first, see what breaks"
  - Why harmful: Every test fails because there's no fallback; tests are noise
  - Better: Implement fallback code first, then write resilience tests to verify it

- **Mistake: Injecting faults without verifying fallback**
  - Why: `$this->injectFault(...); $this->get('/endpoint'); // no assertion`
  - Why harmful: Test doesn't verify that fallback was actually used
  - Better: Always assert fallback behavior: `$this->assertFallbackUsed()` or assert degraded response content

- **Mistake: Running resilience tests in the same job as regular tests**
  - Why: "Combine all tests in one CI job"
  - Why harmful: Slow timeout/latency faults delay the entire test suite
  - Better: Run resilience tests in a separate CI stage or scheduled workflow

# Failure Modes
- **Service cannot be decorated**: Abstract classes or services with `final` constructors may not be decoratable. Resilience reports this during discovery. Design services with decoration in mind.
- **Fault persists across tests**: Active fault not cleared after test. Always use `setUp`/`tearDown` or Pest's `beforeEach`/`afterEach` to clear faults.
- **False fallback assertion**: `assertFallbackUsed()` passes even when fallback didn't execute, if the fallback flag was set by a previous test. Reset fallback flags before each test.
- **Container binding complexity**: Services bound via closures or instantiated in service providers may not be discoverable. Ensure proper container binding with class names.

# Ecosystem Usage
- **Laravel Resilience (me-shaon/laravel-resilience)**: v0.7.0 as of March 2026. Early-stage package. Active development. The primary fault injection tool for Laravel.
- **Laravel core**: Resilience patterns are discussed in Laravel's community resources but not yet part of the official testing documentation. The package is community-maintained.
- **Circuit breaker integration**: Resilience works alongside circuit breaker packages (laravel-fuse) — Resilience injects faults to test that circuit breakers trigger correctly.
- **PHP community**: Resilience testing in PHP is an emerging practice; Laravel Resilience is pioneering deterministic fault injection for the ecosystem.

# Related Knowledge Units
- **Prerequisites**: Laravel service container, Dependency injection, Testing with Pest/PHPUnit
- **Related Topics**: Chaos engineering (Laravel Bazooka), Circuit breaker patterns, Fallback and degraded mode patterns
- **Advanced Follow-up**: Production resilience verification, Resilience metrics and observability, Multi-service resilience testing

# Research Notes
- Laravel Resilience is at version 0.7.0 as of early 2026, indicating it is pre-1.0 and may have breaking API changes; teams should pin the version and review changelog before upgrading
- The package's discovery → scaffold → test workflow is inspired by similar tools in the Java ecosystem (Chaos Monkey for Spring Boot) but adapted for PHP's shared-nothing architecture
- Resilience testing is complementary to, not a replacement for, traditional testing; it validates a dimension (failure behavior) that feature tests and unit tests typically don't cover
- The package has limited community adoption (1 GitHub star as of March 2026), meaning community support and examples are minimal; teams adopting it should contribute findings back
- The decorator-based approach to fault injection is non-invasive and works with any service that is bound to the container, making it broadly applicable across Laravel application architectures
