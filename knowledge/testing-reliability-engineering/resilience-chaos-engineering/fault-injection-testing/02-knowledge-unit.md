# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Resilience & Chaos Engineering
Knowledge Unit: Fault Injection Testing with Laravel Resilience
KU Code: ku-03-fault-injection-testing
ECC Phase: 4
Last Updated: 2026-06-02

# Executive Summary
Laravel Resilience is a fault injection package (v0.7.0) that enables deterministic resilience testing by simulating real failures in container-managed services. Unlike traditional mocking (which replaces services entirely), Resilience injects faults into real service instances, preserving the service's behavior while introducing controlled failures.

# Core Concepts
- **Fault injection**: Introducing controlled failures into a service without replacing it.
- **Service decorator**: Resilience wraps the original service with a decorator that intercepts calls and injects faults.
- **Fault types**: `ExceptionFault` (throws configurable exception), `TimeoutFault` (delays response beyond timeout), `LatencyFault` (delays by configurable duration).
- **Discovery mode**: Scans container bindings to identify injectable services.
- **Scaffold command**: `php artisan resilience:scaffold` generates test templates for discovered services.
- **Fallback assertions**: `assertFallbackUsed()` and `assertDegradedButSuccessful()` verify fallback execution.
- **Container-aware**: Works with services bound to the Laravel service container.

# Mental Models
- **Fault injection as scalpel, not hammer**: Inject faults precisely into specific services and methods. Not a replacement for all testing.
- **Decorator as surveillance**: The decorator watches every call, only interfering when a fault is active. Zero overhead otherwise.
- **Discovery as map**: Discovery reveals what can be tested. It doesn't tell you what should be tested.

# Internal Mechanics
- Resilience uses PHP's `Decorator` pattern via `__call()` magic or generated proxy classes.
- When `Resilience::fake(Service::class, 'method', ExceptionFault::class)` is called, the decorator is configured to intercept the next call to `Service::method()`.
- The decorator checks if a fault is active for the current class/method combination before delegating.
- `ExceptionFault` throws the configured exception. `TimeoutFault` calls `usleep()` for the configured duration.
- Discovery scans the container binding registry using ReflectionClass to identify resolvable services.

# Patterns
- **Discovery-Scaffold-Test pattern**: Run discovery, then scaffold, then customize tests.
- **One fault per test pattern**: Inject exactly one fault type per test. Multiple faults obscure causes.
- **Fallback assertion pattern**: Always assert fallback behavior after fault injection.
- **Exception-first pattern**: Start with `ExceptionFault`, add `LatencyFault` later. Exception injection is faster.

# Architectural Decisions
- **Decision: Decorator over mock**: Preserves real service behavior. Faults are surgical and scoped.
- **Decision: Container-aware design**: Only works with services bound to the container. Promotes dependency injection best practices.
- **Decision: Deterministic over probabilistic**: Faults always trigger when configured. Predictable and debuggable.

# Tradeoffs
- **Deterministic faults vs probabilistic chaos**: Resilience's deterministic faults are predictable and debuggable. Bazooka's probabilistic chaos catches real-world patterns. Both are needed.
- **Scaffold-generated tests vs hand-written**: Scaffold generates a starting point. Customization is required for meaningful assertions.
- **Container binding requirement**: Encourages good DI practices but excludes non-containerized code.

# Performance Considerations
- Fault injection overhead: <0.1ms per service call when no fault is active. Negligible.
- Timeout fault: Delays test by timeout duration. Use 100-500ms for testing instead of production 5s.
- Latency fault: Delays test by configured latency. Use 50-100ms for testing.
- Discovery: 1-10 seconds depending on container bindings. Run on demand.
- Scaffold: Generates files in milliseconds. No performance concern.

# Production Considerations
- Never enable in production: Resilience is for testing and development only. Use environment gating.
- Service decoration safety: The decorator pattern is safe (zero overhead when no fault active) but the package should not be installed in production dependencies.
- Discovery output review: May reveal service bindings and class names. Review before committing.
- Logging: Fault injection logs may include method arguments. Ensure no sensitive data is logged.

# Common Mistakes
- **Treating Resilience like a mocking library**: Resilience doesn't support return value control. Use Mockery/fakes for that.
- **No fallback code before resilience tests**: Writing resilience tests before implementing fallback behavior. Every test fails.
- **Injecting faults without assertions**: Test passes even when fallback doesn't execute.
- **Running resilience tests in the main CI job**: Slow timeout/latency faults delay the entire test suite.

# Failure Modes
- No fallback code: Fault injection always causes test failure. Resilience tests require fallback code.
- Global fault activation: Faults persisting across tests cause unpredictable failures.
- Unscoped fault cleanup: Active faults not cleared in `tearDown()` affect subsequent tests.
- Decorator incompatibility: Final classes or methods with type restrictions may not be decoratable.

# Ecosystem Usage
- Laravel Resilience is pre-1.0 (v0.7.0). API may change. Pin version in `composer.json`.
- The discovery-scaffold-test workflow is the recommended starting point.
- The package has limited community adoption (1 GitHub star as of documentation).
- Used alongside Bazooka for probabilistic chaos and standard testing for behavior verification.

# Related Knowledge Units
- Chaos engineering with Laravel Bazooka
- Circuit breaker patterns (laravel-fuse)
- Degraded mode patterns
- Retry and backoff strategies
- Service container decoration
- Laravel service provider patterns

# Research Notes
- Laravel Resilience is pre-1.0 (v0.7.0). API may change. Pin version and review changelog before upgrading.
- The discovery-scaffold-test workflow is the recommended starting point. Agents should generate code that follows this pattern.
- The package has limited community adoption. Document known limitations and workarounds.
- Fault injection in PHP is constrained by the language's shared-nothing architecture compared to JVM-based languages.
