# Container Fundamentals

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Container Fundamentals |
| Difficulty | Foundation |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
The service container is Laravel's dependency injection container — a centralized registry that manages class instantiation, dependency resolution, and object lifecycle for every service in the application. Implemented in `Illuminate\Container\Container`, it acts as the composition root where all bindings between interfaces and concrete implementations are registered, and from which all objects are resolved. The Container class is the superclass of `Illuminate\Foundation\Application`, meaning every Laravel application instance *is* a container. The critical engineering decision is that it extends `ArrayAccess`, allowing array-syntax access (`$app['key']`) that maps to the same resolution pipeline as `$app->make('key')`.

## Core Concepts
- **`$bindings` Array** — Maps abstract names to concrete implementations via `Definition` objects containing the concrete class/factory closure and shared flag.
- **`$instances` Cache** — Resolved singleton/scoped objects stored here; subsequent `make()` calls return the same instance without rebuilding.
- **ArrayAccess Implementation** — `$app['logger'] = ...` maps to bind; `$app['logger']` maps to `make()`.
- **Container vs Application** — Application extends Container and adds framework-specific functionality (env detection, path helpers, base providers).
- **Resolution Chain** — `make()` → check `$instances` → check `$bindings` → auto-resolution via `ReflectionClass` → throw `BindingResolutionException`.

## When To Use
- Understanding the foundation of all Laravel service resolution
- Debugging "class not resolving" errors
- Building packages that need to register bindings
- Writing tests that use the container for dependency injection

## When NOT To Use
- Using `$app['key'] = value` for arbitrary data storage (bypasses binding system)
- Calling `build()` directly in application code (bypasses lifecycle)
- Extending the Application class to override container behavior

## Best Practices
- **Always register bindings in service providers**, not in application code. This centralizes wiring and makes dependency configuration discoverable.
- **Use `$app->bound('key')` before resolving in conditional paths** to avoid `BindingResolutionException`.
- **Prefer explicit bindings over auto-resolution for production hot paths** — reflection-based resolution is the slowest path.
- **Avoid array push syntax in service providers** — `$app['services'][] = new Service()` may not trigger rebound callbacks correctly.
- WHY: The container is the composition root of the entire application. Every service, controller, and command depends on its correct configuration. Understanding the container demystifies how Laravel resolves dependencies and prevents "magic" misconceptions.

## Architecture Guidelines
- The Container is the superclass of Application, inheriting 200+ methods. This eliminates delegation boilerplate but creates a monolithic hierarchy.
- All container operations (bind, make, resolve, call) are inherited by the Application.
- The resolution chain is deterministic: instances → bindings → auto-resolution → exception.
- Container extends `ArrayAccess`, `ArrayAccess::offsetGet` calls `make()`, `offsetSet` creates a binding.

## Performance Considerations
- Reflection-based auto-resolution is the slowest path: a `make()` call on an unbound class triggers `ReflectionClass::getConstructor()`, parameter inspection, and recursive resolution.
- `$instances` cache provides O(1) lookups for previously-resolved singletons.
- Each `$bindings` entry stores ~72 bytes; 300 bindings = ~21KB — negligible.
- In Octane, `$instances` accumulates permanently, so monitor growth.

## Security Considerations
- The container stores all service instances; avoid binding sensitive services (e.g., encryption keys) in closures that capture variables from outer scope.
- `$app->make()` can resolve any bound service; ensure authorization gates are not bypassed through container resolution.
- Container access via `app()` helper is global; services resolved this way bypass method-level access controls.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Using container as key-value store | Treating `$app['key'] = value` as generic storage | Bypasses binding system; no contextual binding or extending | Use `$app->instance()` or `$app->bind()` with proper closure |
| Calling `$app->make()` inside controllers | Service locator anti-pattern | Dependencies become implicit; untestable | Declare all dependencies in constructor |
| Assuming `$app['db']` returns new connection each time | Misunderstanding singleton | Same connection instance returned; state leaks across code paths | Use `DB::connection()` or inject `ConnectionInterface` |
| Extending Application class | Overriding container behavior | Breaks on Laravel version upgrades | Use service providers and bootstrappers |

## Anti-Patterns
- **Service Locator in Business Logic** — Using `app()->make()` or `resolve()` in controllers/jobs instead of constructor injection.
- **Binding Concrete-to-Concrete** — Binding `$app->bind(ConcreteA::class, ConcreteB::class)` instead of binding an interface to a concrete.
- **Self-Binding Overuse** — Registering every class explicitly when auto-resolution works fine (adds unnecessary maintenance).
- **Container as Global Registry** — Using `$app['config']` or `$app['db']` as a global key-value store.

## Examples

### Basic binding and resolution
```php
$this->app->bind(PaymentGateway::class, StripeGateway::class);
$gateway = $this->app->make(PaymentGateway::class);
```

### Singleton registration
```php
$this->app->singleton(LoggerInterface::class, MonologLogger::class);
```

### Closure-based factory
```php
$this->app->bind(ReportGenerator::class, function ($app) {
    return new ReportGenerator(
        $app->make(PdfRenderer::class),
        config('reporting.cache_ttl'),
        $app->make(Cache::class)
    );
});
```

## Related Topics
- **Prerequisites:** None (this is the root KU)
- **Closely Related:** Binding Types, Binding Resolution, Container Aliases
- **Advanced:** Auto-Resolution via Reflection, Contextual Binding, Circular Dependency Detection
- **Cross-Domain:** Service Providers (register bindings via container)

## AI Agent Notes
- When debugging binding resolution failures, trace the resolution chain: instances → bindings → auto-resolution.
- For Octane memory issues, check `count($container->getInstances())` for unexpected singleton growth.
- The container is not magic — it's PHP Reflection API and cached arrays. Understanding this demystifies auto-resolution.

## Verification
- [ ] Can explain the resolution chain (instances → bindings → auto-resolution)
- [ ] Understand Container vs Application relationship (inheritance)
- [ ] Know the 4 primary binding types and their lifecycle semantics
- [ ] Can debug `BindingResolutionException` using the resolution chain
- [ ] Understand ArrayAccess implementation and its contract with bind/make
