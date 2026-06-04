# Testing with the Container

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Testing with the Container covers the techniques and APIs Laravel provides for replacing resolved dependencies during testing. The container's instance swapping capabilities — `instance()`, `swap()`, `forgetInstance()`, and `shouldReceive()` on facades — enable test code to substitute real implementations with mocks, fakes, or stubs. This is the foundation of Laravel's test isolation strategy: because classes resolve their dependencies from the container, tests can intercept resolution at the container level and inject controlled versions. The pattern is essential for unit testing service-injected classes, feature testing with mock services, and isolating the system under test from side effects.

## Core Concepts
- **Container instance swapping:** `$this->app->instance(SomeClass::class, $mock)` replaces the resolved instance for a given abstract. Subsequent `make()` calls return the mock.
- **Facade faking:** `Cache::fake()` swaps the facade's underlying instance with a Mockery mock, enabling assertions like `Cache::shouldReceive('get')->once()->andReturn('value')`.
- **Bus/Event/Notification faking:** `Bus::fake()`, `Event::fake()`, `Notification::fake()` intercept dispatched jobs, events, and notifications at the container level, preventing them from executing.
- **Contract faking:** `Http::fake()`, `Storage::fake()`, `Mail::fake()` replace core Laravel services with in-memory implementations, making feature tests fast and deterministic.
- **Resolution isolation:** `$this->app->forgetInstance($abstract)` clears a resolved singleton so the next `make()` call re-resolves it. Useful for resetting container state between tests.
- **Swap in setup:** Placing `$this->instance()` calls in `setUp()` ensures mocks are active for every test. Using `refreshApplication()` between tests restores the original container.

## Mental Models
- **Pachinko Machine Model:** The container is a pachinko board. When a dependency is requested, the ball drops through pins (bindings) to the target. `instance()` is like inserting a blocker at a specific pin — the ball diverts to your mock instead.
- **Sandbox Model:** The test environment is a sandbox where every real service can be replaced with a cardboard version. The container is the gatekeeper — swap the service at the gate, and every class that enters receives the cardboard version.
- **Green Thread Model:** Each test weaves a new "reality" by injecting custom dependencies. The container ensures that all resolved objects within that test share the same simulated reality. `refreshApplication()` cuts the thread and starts a new reality.

## Internal Mechanics
1. **Test case extends Tests\TestCase** which extends `Illuminate\Foundation\Testing\TestCase`.
2. The base test case calls `$this->createApplication()` in `setUp()`, booting a full Laravel application with a fresh service container.
3. **Container::instance($abstract, $instance):**
   - Stores `$instance` in `$this->instances[$abstract]`.
   - Removes `$abstract` from `$this->bindings` (overrides any existing binding).
   - Sets `$this->resolved[$abstract] = true`.
   - Subsequent `make($abstract)` returns the stored instance directly without Reflection.
4. **Container::forgetInstance($abstract):**
   - Removes `$this->instances[$abstract]`.
   - Removes `$this->resolved[$abstract]`.
   - The next `make($abstract)` goes through the full resolution pipeline again.
5. **Container::swap($abstract, $instance):**
   - Alias for `instance()` — calls `instance()` internally.
6. **Facade::fake():**
   - Creates a Mockery mock of the facade's underlying class.
   - Calls `Facade::swap($mock)`.
   - Sets up the mock to allow any call (`shouldReceive`) without explicit expectations (loose mocking).
7. **Facade::shouldReceive():**
   - If the facade root is not already a mock, calls `Facade::fake()` first.
   - Then calls `Mockery::shouldReceive()` on the mock instance.
8. **Http::fake() / Storage::fake() / Mail::fake():**
   - These are built on top of `instance()` or `swap()`, replacing the core binding with a fake implementation provided by the framework.

## Patterns
- **Simple Mocking:** `$this->instance(Logger::class, Mockery::mock(Logger::class)); $this->instance(Logger::class)->shouldReceive('info')->once();`
- **Facade Faking:** `Event::fake(); // act; Event::assertDispatched(OrderShipped::class);`
- **HTTP Faking:** `Http::fake(['github.com' => Http::response(['ok'], 200)]);`
- **Storage Faking:** `Storage::fake('s3'); Storage::disk('s3')->put('file.txt', 'content');`
- **Mail Faking:** `Mail::fake(); Mail::assertSent(OrderConfirmation::class, function ($mail) { ... });`
- **Bus Faking:** `Bus::fake(); Bus::assertDispatched(ProcessOrder::class);`
- **Partial Instance Swap:** Swap only a subset of services while leaving others intact. `$this->instance('redis', $mockRedis)` while the database connection remains real.
- **Contextual Binding Swap:** `$this->app->when(Reporter::class)->needs(FormatterInterface::class)->give(MockFormatter::class);`

## Architectural Decisions
- **Why `instance()` over `bind()`:** `instance()` stores a pre-built object, bypassing both the binding resolution and the construction step. This is the fastest path and the most predictable — the test has full control over the exact object returned.
- **Why facades are faked separately:** Facade faking operates at the facade root level, not the container level. This allows testing code that uses facades without changing the container bindings that other code might rely on.
- **Why `refreshApplication()` is the default isolation strategy:** The heaviest isolation mechanism — creating a fresh application — guarantees no container state leaks between tests. Lighter strategies (forgetInstance, partial teardown) are available but not the default.
- **Why separate fake classes exist (Http, Storage, Mail):** These fakes implement the same interface as the real service but use in-memory storage. They provide assertion methods that are more expressive and convenient than raw Mockery expectations.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Swap any dependency from any test | Tests depend on container knowledge | New devs must understand container mechanics |
| Facade faking is concise and declarative | Facade mock leaks if not cleared between tests | Intermittent test failures due to stale mock state |
| Built-in fakes (Http, Storage, Mail) reduce boilerplate | Full application boot is slow | Slower test suites; integration-style tests |
| `instance()` is simple and predictable | Shared container state across tests | Must use `refreshApplication()` or manual cleanup |
| Fakes provide custom assertion methods | Fakes may not match real behavior perfectly | False positive passing tests |

## Performance Considerations
- **`refreshApplication()` cost:** Each call creates a new application instance, registers all service providers, and bootstraps the framework. This is the dominant cost in Laravel test suites — typically 20-50ms per test.
- **`$this->instance()` overhead:** Negligible. It stores an object in an array and returns it on subsequent `make()` calls.
- **Facade `shouldReceive()` overhead:** Mockery expectations on facades incur verification cost in `Mockery::close()`, called during PHPUnit's teardown. This is typically <1ms per facade mock.
- **HTTP Fake performance:** `Http::fake()` replaces the HTTP client with a `PendingRequest`-based fake that matches URL patterns against pre-defined responses. Matching is O(n) on the number of fake URL patterns.
- **Storage Fake performance:** `Storage::fake()` uses `FlysystemV2` in-memory adapter. Operations are in-memory and extremely fast (microseconds).
- **Minimize full application boot:** Use `$this->withoutMiddleware()`, `$this->withoutEvents()`, and partial bootstrapping for tests that don't need the full stack.

## Production Considerations
- **Container swapping is for testing only:** Swapping container instances in production code (e.g., during hot-reload or feature flags) is fragile and should be avoided.
- **Never use `instance()` in service providers:** Service providers should register bindings via `bind()` or `singleton()`. Using `instance()` in a provider prevents the test suite from swapping that dependency later.
- **Facade faking in production:** Do not use Facade faking in production code. It is a test-only API and may have unexpected side effects in non-test environments.
- **Leaking mocks between tests:** If a test forgets to call `Mockery::close()` or `Facade::clearResolvedInstance()`, the mock leaks to the next test. Use PHPUnit's `tearDown()` or `LazilyRefreshDatabase` to ensure cleanup.

## Common Mistakes
- **Calling `$this->instance()` after the class under test has already resolved the dependency:** If the dependency was already resolved before your `instance()` call, the old resolved instance is cached and the swap has no effect. Ensure `instance()` is called before the resolution point.
- **Using `shouldReceive()` without `fake()`:** Calling `Cache::shouldReceive('get')` without first calling `Cache::fake()` fails because the facade root is the real instance, which does not have Mockery's `shouldReceive` method.
- **Forgetting to assert expectations:** Mockery requires calling `Mockery::close()` in teardown to verify that expected methods were actually called. Without it, tests pass even if the expected call never happened.
- **Using facades and injection in the same test:** If a class being tested uses constructor injection for `Cache` but also has code paths that call `Cache::get()`, mocking via facade faking may not cover both paths. Mock at both levels or refactor to use one consistently.
- **Over-mocking:** Replacing every single dependency with a mock turns integration tests into mock-verification tests. Use built-in fakes (Http::fake, Storage::fake) when possible, and only mock at boundaries.

## Failure Modes
- **Mockery\Exception\InvalidCountException:** An expected method was called more or fewer times than specified. Thrown during `Mockery::close()`.
- **BadMethodCallException from Mockery:** A method was called on a mock without an expectation. With strict mocking, this fails immediately.
- **RuntimeException: "Facade instance has not been set":** A facade is called before `Facade::setFacadeApplication($app)` was called. In tests, this happens if the facade is called before the test creates the application.
- **Memory limit exhaustion:** Creating multiple mock objects per test across many tests can exhaust PHP memory. Use `Mockery::close()` and `$this->instance()` cleanup in teardown.
- **Resolution mismatch:** `$this->instance()` swaps an interface, but the container binding returns a concrete that was resolved before the swap. The test fails because the real implementation, not the mock, is used.

## Ecosystem Usage
- **Laravel core tests:** The framework test suite extensively uses `instance()`, `swap()`, and facade faking. Every core component's tests demonstrate these patterns.
- **Horizon tests:** Horizon's test suite uses `Bus::fake()` and `Queue::fake()` extensively to assert job dispatching without running workers.
- **Telescope tests:** Uses `Event::fake()` and custom `instance()` swaps to test recording behavior without side effects.
- **Common community practice:** Nearly every Laravel package and application test suite relies on some form of container swapping, with `Http::fake()`, `Event::fake()`, and `Mail::fake()` being the most common.
- **Package development:** Package tests typically use `Orchestra\Testbench` which provides a fresh application per test class, with `$this->app->instance()` for swapping package services.

## Related Knowledge Units

### Prerequisites
- **Constructor Injection** — how classes receive dependencies that tests replace via `instance()`
- **Facade Architecture** — understanding facades is required for proper facade faking
- **PHPUnit / Mockery** — the testing framework and mocking library powering assertions

### Related Topics
- **Interface Binding Resolution** — instance swapping replaces interface-to-concrete bindings
- **Auto-Resolution Strategy** — testing auto-resolved classes requires understanding of the resolution chain
- **Service Locator Anti-Pattern** — service locator complicates testing because it hides the swap point

### Advanced Follow-up Topics
- **Over-Injection Anti-Pattern** — how over-injection bloats test setup with excessive mocks
- **Injection Guidelines by Class Type** — testing considerations per class type (jobs, listeners, controllers)
- **Kernel Bootstrappers** — how test application bootstrapping affects container state isolation

## Research Notes
- `Container::instance()` is defined at `Illuminate\Container\Container::instance()`. It is a simple 5-line method that stores the instance and marks it as resolved.
- `Facade::fake()` is defined at `Illuminate\Support\Facades\Facade::fake()`. It creates a Mockery mock if one doesn't exist and calls `swap()`.
- PHPUnit's `tearDown()` in `Illuminate\Foundation\Testing\TestCase` calls `Mockery::close()` via the `Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration` trait. Ensure this trait is loaded for mock verification.
- `RefreshDatabase` trait does NOT clear container instances. If using `RefreshDatabase`, manual `$this->instance()` cleanup is required between tests that swap the same binding.
- PHP 8.1+ readonly properties interact poorly with instance swapping — once a class is constructed with a readonly dependency, a swapped container instance cannot retroactively change that dependency. The swap only affects new resolutions.
