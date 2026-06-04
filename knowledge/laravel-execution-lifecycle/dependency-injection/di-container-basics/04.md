# ku-01: DI Container Basics

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **KU:** ku-01-di-container-basics
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
The Laravel service container (`Illuminate\Container\Container`) is the foundation of the entire framework — it manages class dependencies, performs dependency injection, and controls object lifecycle. Understanding the container's core mechanisms (binding, resolution, singletons, aliases) is essential before diving into specific injection patterns.

## Core Concepts
- **Container as dependency manager**: The container stores bindings (abstract → concrete mappings) and resolves them on demand. It is both a registry and a factory.
- **`bind()`**: Registers an abstract-to-concrete mapping. Each resolution creates a new instance.
- **`singleton()`**: Like `bind()` but the resolved instance is cached — subsequent resolutions return the same instance.
- **`instance()`**: Stores a pre-built object directly. Bypasses resolution entirely.
- **`make()`**: Resolves an abstract from the container. Returns a fully-constructed instance with all dependencies injected.
- **`call()`**: Invokes a callable with method injection — resolves type-hinted parameters from the container.
- **Auto-resolution**: If no explicit binding exists, the container attempts to construct the class using Reflection on its constructor.
- **Aliases**: Short string names that map to abstract classes — `$container->alias('db', DatabaseManager::class)`.
- **Container vs Application**: `Illuminate\Foundation\Application` extends `Container` and adds Laravel-specific features (bootstrapping, providers, path resolution).

## When To Use
- Any time a class needs services resolved — let the container handle construction.
- For managing shared instances (singletons) — database connections, cache managers, loggers.
- When implementing dependency injection — the container is the injection mechanism.
- In tests, to swap real implementations with mocks via `instance()`.

## When NOT To Use
- For simple data objects (DTOs) — `new UserData(...)` is fine, the container is not needed.
- In hot loops — repeated `$container->make()` calls add overhead. Pre-resolve or use direct construction.
- When you need to bypass the container's lifecycle — use `new` for objects that don't need injection.

## Best Practices (WHY)
- **Bind interfaces, not concretions**: `$app->bind(UserRepositoryInterface::class, EloquentUserRepository::class)` enables swapping without changing consumer code.
- **Register bindings in service providers**: Never call `$app->bind()` outside of a provider's `register()` method.
- **Prefer singleton for stateless services**: If a service has no per-request state, `singleton()` saves memory and resolution time.
- **Use contextual binding**: `$app->when(Consumer::class)->needs(Interface::class)->give(Concrete::class)` for consumer-specific implementations.

## Architecture Guidelines
- The container is created in `bootstrap/app.php` and stored as a singleton — there is exactly one container per application instance.
- Service providers are the composition root — all dependency wiring happens here.
- The container supports ArrayAccess — `$app['db']` is equivalent to `$app->make('db')`.
- Container resolution callbacks (`resolving()`, `afterResolving()`) allow decorating resolved instances without modifying bindings.

## Performance
- `make()` with explicit binding: O(1) lookup, instantiation cost depends on the class's dependency chain.
- `make()` with auto-resolution: Reflection overhead per-resolution (~0.01-0.05ms per class) for deep dependency graphs.
- Singleton resolution: Full cost paid once, subsequent calls return cached instance — near-zero cost.
- `instance()`: Lowest overhead — the object is already built and stored in an array.

## Security
- The container resolves any bound class — ensure bindings don't expose internal services to untrusted contexts.
- Container instances themselves should not be passed to untrusted code (service locator exposure).
- In multi-tenant apps, clear scoped singletons between tenants to prevent data leakage.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Binding in route files | `app()->bind(...)` in routes | Convenience during prototyping | Bindings scattered, hard to test | Use service providers |
| Forgetting to bind interfaces | Interface type-hint without binding | Not registering in provider | TargetInterfaceNotInstantiableException | Always bind interfaces in providers |
| Singleton with mutable state | Singleton stores per-request data | Not understanding service lifecycle | State leaks between requests | Use scoped() or ensure stateless |
| app() in business logic | `app(Service::class)` in domain code | Convenience over injection | Hidden dependencies, testing difficulty | Inject via constructor |
| Binding concrete to concrete | `bind(Service::class, Service::class)` | Unnecessary registration | No benefit — auto-resolution handles it | Remove the binding or bind an interface |

## Anti-Patterns
- **Service locator**: Using `app()` inside business logic instead of constructor injection — hides dependencies, breaks testability.
- **Container as dependency**: A class that accepts `Container $container` and pulls deps in methods — disguised service locator.
- **Over-binding**: Registering every class explicitly — auto-resolution handles concrete classes automatically.
- **Modifying bindings at runtime**: Using `instance()` to swap bindings during a request — creates unpredictable behavior.

## Examples
```php
// Binding in service provider
public function register()
{
    $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
    $this->app->singleton(AnalyticsService::class, function ($app) {
        return new AnalyticsService($app['config']['analytics.key']);
    });
    $this->app->instance('debug', true);
}

// Resolution
$users = app(UserRepositoryInterface::class);
$analytics = app(AnalyticsService::class);
```

## Related Topics
- Constructor Injection (ku-02) — how the container injects via constructors
- Automatic Injection (ku-04) — auto-resolution strategy when no binding exists
- Interface Binding (ku-08) — binding interfaces to concrete implementations
- Contextual Binding (ku-05) — consumer-specific binding resolution

## AI Agent Notes
- The Container class is at `src/Illuminate/Container/Container.php`.
- Key properties: `$bindings`, `$instances`, `$aliases`, `$contextual`, `$resolved`.
- `Container::getInstance()` returns the global container instance.
- The `build()` method is the core of auto-resolution — uses ReflectionClass.

## Verification
- [ ] All interface bindings are registered in service providers
- [ ] No `app()` calls in business logic (controllers, services, models)
- [ ] Singletons are stateless (no per-request data stored in properties)
- [ ] No binding registration outside of service providers
- [ ] Container bindings are documented and organized by provider
