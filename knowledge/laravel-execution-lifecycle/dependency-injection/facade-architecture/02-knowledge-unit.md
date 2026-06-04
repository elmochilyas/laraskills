# Facade Architecture

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Facade Architecture is Laravel's static proxy pattern that provides a concise, expressive syntax for accessing container-resolved services. Each facade is a class extending `Illuminate\Support\Facades\Facade` that implements `getFacadeAccessor()` returning a service name or class name, which the facade base class uses to resolve the underlying instance from the container at runtime. Facades combine the convenience of static methods with the testability of instance-based services, by deferring resolution to the container and allowing hot-swapping of the underlying instance in tests. They are intentionally-designed service locators that trade architectural purity for developer ergonomics.

## Core Concepts
- **Static Proxy Pattern:** A design pattern where static method calls on a facade class are forwarded to an underlying instance method on a container-resolved object.
- **`getFacadeAccessor()`:** The single required method on a facade class — returns a string (service alias, class name, or interface name) used by the base class to look up the underlying instance.
- **`Facade::getFacadeRoot()`:** Resolves the underlying instance from the container using the accessor string. The result is cached in a static `$resolvedInstance` array per-facade-class.
- **`__callStatic()` magic:** PHP's `__callStatic()` is triggered when a static method that does not exist is called on the facade class. The base class catches this, resolves the root, and proxies the call.
- **Alias loading:** Facades are registered as class aliases in `config/app.php` `aliases` array, making them available without importing. Laravel's alias loader autoloads them lazily.
- **Facade fakes:** `Facade::fake()` and `shouldReceive()` swap the underlying instance with a Mockery mock, enabling test assertions on static facade calls.

## Mental Models
- **Phone Switchboard Model:** The facade class is the operator switchboard. When you call `Cache::get()`, the switchboard looks up the number (accessor), connects to the service (container resolve), and forwards the call. You never dial the service directly.
- **Stunt Double Model:** In production, the facade resolves the real service. In tests, `Facade::fake()` swaps in a stunt double (mock) that looks the same but behaves differently. No one else in the code knows the difference.
- **Vending Machine Model:** The facade is the button panel on a vending machine. `Cache::get()` is pressing A3 — the machine (container) dispenses the correct item (service instance). The button panel hides the vending mechanism entirely.

## Internal Mechanics
1. **Registration:** The facade class is registered in `config/app.php` `aliases` array. On first use, the autoloader loads the alias (which is the facade class).
2. **Static Call:** A call to `Cache::get('key')` is made. PHP does not find a static `get()` method on `Cache`, so it invokes `Facade::__callStatic('get', ['key'])`.
3. **Facade Root Resolution:**
   - `__callStatic()` calls `Facade::resolveFacadeInstance('cache')` via `getFacadeAccessor()`.
   - `resolveFacadeInstance()` checks `$resolvedInstance['cache']` — if cached, return it.
   - If not cached, calls `$app['cache']` (container array access, which resolves from the container).
   - The resolved instance is stored in `$resolvedInstance` for subsequent calls.
4. **Method Proxy:** The facade calls `$instance->get('key')` and returns the result.
5. **Real-Time Facades:** Puts `Facades\` namespace prefix in front of any class name. `Facades\App\Services\PaymentService::charge()` resolves `App\Services\PaymentService` from the container and proxies the call. This works via a separate `RealTimeFacade` mechanism that does not require custom facade classes.
6. **Facade Fake:** `Cache::fake()` calls `Facade::swap($mockInstance)`, which stores the mock in `$resolvedInstance` and also replaces the container binding so that `resolve('cache')` returns the mock.

## Patterns
- **Standard Facade:** `class Cache extends Facade { protected static function getFacadeAccessor() { return 'cache'; } }` — maps to a named container binding.
- **Real-Time Facade:** `Facades\App\Services\PaymentService::charge()` — no explicit facade class needed. The `Facades\` prefix triggers automatic facade behavior via `RealTimeFacadeHandler`.
- **Facade with Class Accessor:** `getFacadeAccessor() { return LoggerInterface::class; }` — maps to an interface binding, allowing the facade to resolve whatever concrete is bound.
- **Facade with Method Reference:** A facade that resolves a class via `getFacadeAccessor() { return SomeClass::class; }` — the container auto-resolves the concrete class.
- **Deferred Facade (Lazy Loading):** Facades are inherently lazy — the underlying service is not resolved until the first static call. This is automatic due to `resolveFacadeInstance()`.
- **Facade Fake with return values:** `Cache::shouldReceive('get')->once()->andReturn('cached-value')` — mocks the underlying instance for testing.

## Architectural Decisions
- **Why static proxy instead of static methods:** Static methods on concrete classes are hard-coded and untestable. The static proxy pattern allows the facade to intercept the call, resolve the real instance from the container, and delegate. Testability is preserved because the instance can be swapped.
- **Why alias registration:** Laravel resolves facades by their fully-qualified class name via the autoloader and then adds a class alias (`class_alias`) to make them available without `use` statements. This eliminates import boilerplate for the most common services.
- **Why `getFacadeAccessor()` returns a string, not an instance:** The string acts as a key into the container's bindings. This decouples the facade from the concrete instance — the binding can change without modifying the facade.
- **Why Real-Time Facades exist:** They eliminate the need to write a facade class for every custom service. Prefix `Facades\` to any class name and it becomes a facade — useful for prototyping and quick injection.
- **Why facades are not banned despite being service locators:** Laravel's facades are "honest" service locators — the dependency is explicit (`use Cache;`), the proxy mechanism is transparent, and the faking capability restores testability. The framework documentation actively acknowledges the pattern's nature.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Concise, readable syntax (`Cache::get('key')`) | Static coupling to facade class | Cannot use dependency injection with facades |
| Lazy resolution — no cost until called | Magic proxy obscures actual target | Debugging requires knowing the facade root class |
| Full testability via `shouldReceive()` | Cannot use PHPStorm "Find Usages" on facade calls effectively | Static analysis tools struggle to trace proxy calls |
| Real-Time Facades reduce boilerplate | Only works with classes the container can resolve | Non-container-aware services cannot be proxied |
| Alias registration eliminates imports | Alias collisions possible | Two packages cannot register `Cache` alias |

## Performance Considerations
- **Facade root caching:** `resolveFacadeInstance()` caches the resolved instance in a static class array. Per-request, each facade resolves exactly once regardless of how many calls are made.
- **Alias autoloading cost:** The first use of a facade triggers an autoloader lookup for the alias, then loads the facade class file, then resolves from the container. Total cost is minimal (<0.1ms) per unique facade per request.
- **Real-Time Facade overhead:** The `Facades\` prefix is handled by a custom autoloader registered in `Application::registerCoreContainerAliases()`. This involves an additional namespace look-up before delegating to the real class. Slightly slower than standard facades.
- **Facade `shouldReceive()` performance:** Using `shouldReceive()` enables Mockery expectations on the underlying instance, which adds overhead for the mocked methods. Only use faking in tests.
- **Alias array iteration at registration:** The `aliases` array is iterated by `AliasLoader::load()` on first alias load. A very large aliases array (100+ entries) adds marginal startup cost. Only facades that are actually used trigger resolution.

## Production Considerations
- **Use facades sparingly in business logic:** Facades are acceptable in controllers, middleware, and route files but should be replaced with injection in domain services and repositories.
- **Real-Time Facades in production:** Ensure the underlying class is bound in the container (explicitly or resolvable). Unbound Real-Time Facades fail with a container resolution error.
- **Avoid facade calls in long-running processes (Octane/Swoole):** Facade root caching uses static properties. In long-running processes, the cached facade root is request-scoped. Call `Facade::clearResolvedInstance('cache')` or use `app('cache')` to avoid stale instances.
- **Alias collision management:** When two packages register the same alias (e.g., both provide a `Cache` facade), the last registered alias wins. Register your facades early in the provider list to override effectively.
- **Monitoring facade usage:** Use Laravel Telescope to see which facades are resolved during a request. This helps identify unnecessary facade resolution in hot paths.

## Common Mistakes
- **Calling `getFacadeRoot()` prematurely:** The facade cannot resolve its root until the container is bootstrapped. Calling it in service provider `register()` methods may fail because bindings are not yet available.
- **Using facades in tests without clearing state:** `Facade::clearResolvedInstance('cache')` must be called between tests if facades are faked, otherwise test isolation is broken.
- **Assuming facades are thread-safe:** In Octane or concurrent contexts, the static `$resolvedInstance` cache is shared across requests. A facade resolved in one request may be visible in another if not cleared.
- **Extending Facade incorrectly:** The `getFacadeAccessor()` method is `protected static`. Making it public or forgetting the `static` keyword cause unexpected behavior.
- **Using Real-Time Facades for non-container classes:** A class that cannot be resolved by the container (e.g., one with unresolvable primitives in the constructor) will fail with `BindingResolutionException`.

## Failure Modes
- **RuntimeException: "A facade root has not been set":** The `Facade::setFacadeApplication($app)` call has not been made. This typically happens when facades are used before the application is bootstrapped, or in a standalone script that doesn't import Laravel's autoloader.
- **BindingResolutionException from facade resolution:** The accessor string in `getFacadeAccessor()` does not match any container binding. The error surfaces at the first static call, not at registration time.
- **BadMethodCallException:** The proxied method does not exist on the underlying instance. The facade forwards the call via `call_user_func_array`, and PHP throws the exception from the underlying class.
- **Alias collision error:** Two packages register the same class alias. PHP's `class_alias()` does not fail, but the behavior is non-deterministic (which one wins depends on load order).

## Ecosystem Usage
- **Laravel core facades:** `Route`, `Cache`, `Config`, `DB`, `Event`, `Log`, `Mail`, `Queue`, `Redis`, `Schema`, `Storage`, `Validator` — these are the most commonly used facades, each mapping to a core service.
- **Laravel Horizon:** Horizon registers its own facades (`Horizon::`) for dashboard metrics and queue monitoring.
- **Laravel Telescope:** Telescope provides `Telescope::` facade for recording entries and configuring recording filters.
- **Spatie packages:** `Spatie\Permission\Facades\Permission` and `Spatie\MediaLibrary\Facades\MediaLibrary` provide facade access.
- **Community pattern:** Most Laravel packages that expose services offer a facade and an injectable contract, giving consumers the choice between injection and static proxy.

## Related Knowledge Units

### Prerequisites
- **Service Container** — how facades resolve their underlying instances from the container
- **Interface Binding Resolution** — facades often resolve through interface bindings
- **PHP __callStatic() Magic** — the language-level mechanism enabling static proxies

### Related Topics
- **Constructor Injection** — the injection alternative to facade usage
- **Testing with the Container** — facade faking and instance swapping
- **Service Locator Anti-Pattern** — facades as intentional, testable service locators

### Advanced Follow-up Topics
- **Injection Guidelines by Class Type** — when to use facades vs injection per class category
- **Kernel Bootstrappers** — how `RegisterFacades` bootstrapper initializes the alias system
- **Kernel Version Evolution** — how facade aliases changed across Laravel versions

## Research Notes
- The base `Facade` class is at `Illuminate\Support\Facades\Facade`. Key methods: `__callStatic()`, `resolveFacadeInstance()`, `getFacadeRoot()`, `swap()`, `fake()`, `shouldReceive()`, `clearResolvedInstance()`, `setFacadeApplication()`.
- Real-Time Facades are implemented via `Illuminate\Support\Facades\RealTimeFacade` and a custom autoloader registered in `Application::boot()`. The autoloader intercepts classes under the `Facades\` namespace, generates a facade class on the fly using `eval()`, and caches it.
- The alias loading system is in `Illuminate\Foundation\AliasLoader`. It registers as the last autoloader via `spl_autoload_register()` and loads aliases lazily — only when the alias class name is actually used.
- `Facade::spy()` (available in recent Laravel versions) works like `fake()` but wraps in a Mockery spy instead, allowing expectations to be set after the fact.
- Laravel 11 removed many core facade classes from the framework's `src/` and now ships them as standalone packages (`laravel/ui` facades, etc.). The core `illuminate/support` package still contains the base Facade class.
