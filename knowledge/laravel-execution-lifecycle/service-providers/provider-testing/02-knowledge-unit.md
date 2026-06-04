# Provider Testing

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Providers
- **Knowledge Unit:** Provider Testing
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
Service providers are critical infrastructure — if a provider registers the wrong binding, misses a binding, or has a bug in `boot()`, the entire application is affected. Yet providers are rarely tested directly. Provider testing strategies cover how to verify `register()` and `boot()` behavior in isolation, ensure bindings resolve correctly, and validate that the provider produces an expected container state.

---

## Core Concepts
Testing a provider means testing its **contract**: after `register()`, certain bindings must exist; after `boot()`, certain services must be configurable. The standard approach involves creating a fresh application instance (or a mock container), registering the provider, and asserting on the container state. Laravel's `Illuminate\Foundation\Testing\Concerns` provide helpers for application instantiation. Unit tests should verify `register()` in isolation (no `boot()`), while integration tests verify the full `register()` → `boot()` lifecycle. A mock container (`$this->createMock(Container::class)`) can verify that specific `bind()` or `singleton()` calls are made with expected parameters.

---

## Mental Models
Testing a provider is like **testing a circuit breaker panel**. You don't test that the breaker flips (that's the manufacturer's job). You test that flipping the breaker connects the right wire to the right circuit, and that when the breaker is on, the circuit delivers power. Similarly, you test that `register()` creates the right bindings and that `boot()` doesn't throw when those bindings are resolved.

---

## Internal Mechanics
To test a provider, create a test that extends `Orchestra\Testbench\TestCase` (for packages) or a standard PHPUnit test with application bootstrapping. Use `$app = new Application(realpath(__DIR__.'/../../'))` to create a minimal application instance, then `$provider = new MyProvider($app); $provider->register();`. Assert on `$app->bound(MyInterface::class)`, `$app->isShared(MySingleton::class)`, or resolve and test the resolved instance. For `boot()` testing, ensure all dependent providers are also registered, then call `$provider->boot();`. For deferred providers, test that `provides()` returns the expected array.

---

## Patterns
- **Contract test**: Assert that specific bindings exist after `register()`: `$this->assertTrue($app->bound(MyInterface::class))`.
- **Resolution test**: Register the provider, resolve a service, and assert behavior: `$service = $app->make(MyInterface::class); $this->assertInstanceOf(ConcreteImpl::class, $service)`.
- **Boot integration test**: Register all dependent providers, boot, and verify side effects (e.g., routes registered, views available).
- **Provides() test**: For deferred providers, assert that `$provider->provides()` returns the correct identifiers.
- **Isolation test**: Use `Mockery` to verify that `$app->bind()` is called with exact parameters: `$app->expects()->bind(MyInterface::class, ConcreteImpl::class)`.

---

## Architectural Decisions
Provider testing requires balancing isolation vs. integration. Testing `register()` in isolation (with a mock container) is fast and precise — you verify exactly what the provider registers. But it may miss issues where the registered binding doesn't actually resolve correctly (e.g., the concrete class has unresolved constructor dependencies). Full integration testing (with a real app instance) catches these but is slower and more complex. The recommended approach: unit-test `register()` with mock or real container, integration-test `boot()` with a minimal application.

---

## Tradeoffs
- **Isolation vs. realism**: Mock container tests are fast and targeted but may pass when real container tests fail (e.g., missing constructor dependencies in bound classes).
- **Setup complexity**: Testing a provider requires bootstrapping enough of the framework to have a working container. Package testing with Orchestra Testbench simplifies this but adds a dependency.
- **Maintenance burden**: Provider tests break when bindings change, which is frequent in early development. Over-investing in provider tests before APIs are stable leads to high maintenance costs.

---

## Performance Considerations
Provider tests are typically not performance-sensitive (they run in CI, not production). However, bootstrapping a full application for each test can make provider test suites slow. Use test isolation (mock container) for `register()` tests and limit full-bootstrap tests to a few critical integration scenarios. Cache the application instance across tests where possible.

---

## Production Considerations
Provider tests are most valuable when they catch regressions in provider behavior — scenarios where someone modifies a provider and accidentally breaks a binding. Include provider tests in CI gate. For deployments, run provider tests before `php artisan optimize` to confirm the provider manifest will be correct. For packages, provider tests are essential for ensuring compatibility across Laravel versions.

---

## Common Mistakes
- Testing resolution but not registration — passing `$app->make()` doesn't verify the provider registered the binding, just that it exists (it might have been registered elsewhere).
- Not testing `provides()` for deferred providers — a mismatch between `provides()` and actual registered bindings causes silent failures.
- Testing `boot()` without registering prerequisite providers — results in false failures (binding not found) that are not the tested provider's fault.
- Over-mocking — using a mock container that doesn't behave like a real container (e.g., not actually binding/resolving).

---

## Failure Modes
- **False negative in CI**: Provider test fails because of a missing dependency binding that would exist in the full application context. The provider is fine, but the test is wrong.
- **False positive in CI**: Provider test passes in isolation but fails in production because of environment-specific configuration (e.g., a config value the provider depends on).
- **Missed regression**: Tests only verify `register()` but not `boot()`. A change in `boot()` that references a wrong class name goes undetected.

---

## Ecosystem Usage
Package testing with providers is standardized by Orchestra Testbench (`orchestra/testbench`). Most major Laravel packages (Spatie, Barryvdh, etc.) use Testbench to create a Laravel application instance and test their providers. The test pattern typically: create application, register provider, assert bindings, resolve services. First-party Laravel packages use similar patterns in their internal tests.

---

## Related Knowledge Units
### Prerequisites
- provider-fundamentals (what providers do under test)
- PHPUnit/Mockery knowledge (testing tooling)
- Service Container (container assertions for binding verification)

### Related Topics
- register-vs-boot-methods (testing register vs boot behavior)
- deferred-providers (testing provides() accuracy)
- eager-providers (testing eager registration side effects)

### Advanced Follow-up Topics
- Architecture testing for provider contracts
- Automated provider manifest validation
- Boot Order Timing (testing provider ordering dependencies)
- Kernel Architecture (testing with minimal application bootstrap)

---

## Research Notes
### Source Analysis
Orchestra Testbench repository at `orchestra/testbench`. Laravel's own tests use `Illuminate\Tests\Foundation\ProviderTest` patterns. The `Container::bound()`, `Container::isShared()` methods are the primary assertion targets.
### Key Insight
The most bug-prone aspect of providers is the mismatch between `provides()` (for deferred providers) and the actual bindings established in `register()`. This should be the primary focus of provider tests, as it cannot be caught by any other test type.
### Version-Specific Notes
Laravel 11's `bootstrap/providers.php` makes testing manual provider registration slightly different — you register via `$app->register()` rather than adding to a config array. Testbench supports both approaches.
