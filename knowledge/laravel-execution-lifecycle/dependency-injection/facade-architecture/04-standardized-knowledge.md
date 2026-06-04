# Facade Architecture

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | Facade Architecture |
| Difficulty | Intermediate |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Facade Architecture is Laravel's static proxy pattern that provides concise, expressive syntax for accessing container-resolved services. Each facade extends `Illuminate\Support\Facades\Facade` and implements `getFacadeAccessor()` returning a service name or class name. The facade base class uses `__callStatic()` to resolve the underlying instance from the container and proxy the call at runtime. Facades combine the convenience of static methods with the testability of instance-based services by deferring resolution to the container and allowing hot-swapping in tests.

## Core Concepts
- **Static Proxy Pattern**: Static method calls on a facade class are forwarded to an underlying instance method on a container-resolved object.
- **getFacadeAccessor()**: Returns a string (service alias, class name, or interface) used by the base class to look up the underlying instance.
- **__callStatic() magic**: PHP's `__callStatic()` catches calls to non-existent static methods, resolves the facade root, and proxies the call.
- **Facade root caching**: The resolved instance is cached in a static `$resolvedInstance` array per-facade-class.
- **Alias loading**: Facades are registered as class aliases in `config/app.php` `aliases` array, making them available without import statements.
- **Real-Time Facades**: Prefix `Facades\` to any class name — `Facades\App\Services\PaymentService::charge()` — and it becomes a facade without a custom facade class.
- **Facade fakes**: `Facade::fake()` and `shouldReceive()` swap the underlying instance with a Mockery mock for testing.

## When To Use
- In controllers, route files, and views for common services (Cache, Log, Config, DB).
- When prototyping — facades provide quick access without constructor wiring.
- In blade templates where constructor injection is not available.

## When NOT To Use
- In domain services, repositories, or business logic — use constructor injection instead.
- When the dependency is used in multiple methods of a class — inject it once in the constructor.
- When testability is critical — constructor injection provides cleaner test setup than facade faking.
- In Octane long-running processes — facade root caching uses static properties that persist across requests.

## Best Practices (WHY)
- **Use facades in controllers, not services**: Controllers orchestrate — facades are acceptable here. *Why: The controller layer is thin and acts as a traffic cop; testability is maintained via facade faking.*
- **Inject dependencies in business logic**: Repositories, services, and actions should use constructor injection. *Why: Classes with business logic should have explicit, visible dependencies for clarity and testability.*
- **Clear facade state between tests**: Call `Facade::clearResolvedInstance('cache')` in test setUp(). *Why: Facade root caching uses static properties — state leaks between tests if not cleared.*
- **Use shouldReceive() over swap()**: `shouldReceive()` provides Mockery expectations; `swap()` just replaces the instance. *Why: shouldReceive() enables richer test assertions about how the facade was used.*

## Architecture Guidelines
- Facade resolution: static call → `__callStatic()` → `resolveFacadeInstance()` → container `make()` → proxy to instance.
- Facade root caching: `$resolvedInstance` is a static array on the base Facade class.
- Alias loading: `AliasLoader` registers class aliases lazily — facades are only loaded when first used.
- Real-Time Facades: implemented via a custom autoloader that intercepts `Facades\` namespace and generates facade classes on the fly.
- Facade faking: `Facade::fake()` calls `swap()` with a Mockery mock, replacing both the cached root and the container binding.

## Performance
- Facade root is resolved once per facade per request (cached in static property).
- Alias autoloading: first use of a facade triggers alias resolution + class loading + container resolution – ~0.1ms total.
- Real-Time Facade overhead: additional autoloader lookup before delegating to the real class — slightly slower than standard facades.
- In Octane: facade root caching persists across requests — call `clearResolvedInstance()` per request if the underlying service should be refreshed.

## Security
- Facades provide global access to services — ensure sensitive operations are not exposed via easily-callable static methods.
- Facade access bypasses constructor dependency controls — any code can call `Cache::get()` without declaring the dependency.
- Real-Time Facades auto-resolve any bound class — ensure untrusted class names cannot be used as facade accessors.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Facade in domain service | `Cache::get()` in repository | Hidden dependency; harder to test | Inject CacheInterface |
| Not clearing facade state between tests | Static $resolvedInstance persists | Previous test's fake affects next test | Clear in setUp() |
| Calling getFacadeRoot() prematurely | Before container is bootstrapped | RuntimeException: "facade root not set" | Only access facades after bootstrap |
| Facade in Octane without clearing | Static cache across requests | Stale service instance returned | Clear per-request or use injection |
| Real-Time Facade for non-container class | Class with unresolvable constructor | BindingResolutionException | Create explicit binding first |

## Anti-Patterns
- **Facade everywhere**: Using `Cache::`, `Log::`, `Config::` inside every class — creates implicit global dependencies.
- **Facade in constructor**: Calling `Cache::get()` inside a constructor — ties resolution to global state at construction time.
- **Not using Facade::fake() in tests**: Setting up real service instances for facade-backed tests instead of using fakes.
- **Custom facades for every service**: Creating facade classes for services that are only used in one or two places.

## Examples
```php
// Standard facade usage (acceptable in controllers)
class OrderController
{
    public function index()
    {
        $orders = Cache::remember('orders.all', 3600, function () {
            return Order::all();
        });
        return view('orders.index', compact('orders'));
    }
}

// Facade fake in tests
public function test_orders_are_cached()
{
    Cache::shouldReceive('remember')
        ->once()
        ->andReturn(collect([]));

    $this->get('/orders')->assertOk();
}
```

## Related Topics
- **Prerequisites:** Service Container — facades resolve underlying instances from the container.
- **Closely Related:** Service Locator Anti-Pattern — facades as intentional, testable service locators.
- **Advanced:** Real-Time Facades, Facade Faking — advanced facade features.
- **Cross-Domain:** AliasLoader, RegisterFacades Bootstrapper.

## AI Agent Notes
- The base `Facade` class is at `Illuminate\Support\Facades\Facade`. Key methods: `__callStatic()`, `resolveFacadeInstance()`, `getFacadeRoot()`, `swap()`, `fake()`.
- Real-Time Facades are implemented via `Illuminate\Support\Facades\RealTimeFacade` and a custom autoloader.
- The alias loading system is in `Illuminate\Foundation\AliasLoader` — registers via `spl_autoload_register()` last.
- `Facade::spy()` works like `fake()` but wraps in a Mockery spy — expectations set after the fact.
- In Laravel 11, some core facades were moved to standalone packages — the base Facade class remains in `illuminate/support`.

## Verification
- [ ] Facades are used only in controllers, views, and route files (not business logic)
- [ ] Domain services and repositories use constructor injection, not facades
- [ ] Test setUp() clears facade resolved instances
- [ ] Octane deployment handles facade root clearing per request
- [ ] Custom facades are created only when a service is used via static proxy across many classes
