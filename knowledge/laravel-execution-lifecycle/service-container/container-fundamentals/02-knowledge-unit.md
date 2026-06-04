# Container Fundamentals

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Container Fundamentals
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

The service container is Laravel's dependency injection container — a centralized registry that manages class instantiation, dependency resolution, and object lifecycle for every service in the application. Implemented in `Illuminate\Container\Container`, it acts as the composition root where all bindings between interfaces and concrete implementations are registered, and from which all objects are resolved. The Container class is the superclass of `Illuminate\Foundation\Application`, meaning every Laravel application instance *is* a container.

The critical engineering decision in the container's design is that it extends `ArrayAccess`, allowing array-syntax access (`$app['key']`) that maps to the same resolution pipeline as `$app->make('key')`. This dual-access pattern creates an implicit contract where strings, class names, and interface names are interchangeable keys — a design that powers Facades, service provider registration, and deferred provider resolution. The consequence is that every framework component must maintain consistent key naming across bindings, aliases, and resolutions.

For production applications, understanding the container means understanding that it is not magic — it is a concrete PHP class backed by the PHP Reflection API and several internal arrays (`$bindings`, `$instances`, `$aliases`, `$resolved`, `$reboundCallbacks`). Every call to `resolve()`, `make()`, or array access triggers a deterministic resolution chain: check instances cache, check bindings, attempt auto-resolution via reflection, throw `BindingResolutionException`. Mastery of this chain prevents the "why is this class not resolving?" debugging sessions that plague teams unfamiliar with the container internals.

---

## Core Concepts

### Binding Map (`$bindings` Array)
The `$bindings` property on `Container` is an associative array mapping abstract names (interface FQCNs or string keys) to concrete implementations. Each entry stores a `Definition` object containing the concrete class name or factory closure, the binding type (shared vs not), and whether it was resolved already.

```php
// Internal structure of $bindings
[
    'Illuminate\Contracts\Logging\Log' => Definition {
        concrete: 'Monolog\Logger',
        shared: false,
        isResolved: false,
    },
]
```

### Instances Cache (`$instances` Array)
When `singleton()` or `instance()` is used, the resolved object is stored in `$instances`. Subsequent `make()` calls return the same instance without rebuilding. This is the per-request singleton guarantee.

### ArrayAccess Implementation
```php
$app['logger'] = $app->share(function ($app) { ... });  // set
$logger = $app['logger'];  // get — calls make()
isset($app['logger']);      // calls bound()
unset($app['logger']);      // calls offsetUnset()
```

### Container vs Application
`Illuminate\Foundation\Application` extends `Illuminate\Container\Container` and adds framework-specific functionality: environment detection, path helpers, base service provider registration, bootstrap tracking, and the `configure()` method. Everything the Application can do as a container — bind, make, resolve, call — is inherited from Container.

### Resolution Chain
```
make($abstract)
  → has $instances[$abstract]? return it
  → has $bindings[$abstract]? resolve with factory/class
  → is $abstract a class name? try auto-resolution via ReflectionClass
  → throw BindingResolutionException
```

---

## Mental Models

### The Hotel Concierge
The container is a hotel concierge who knows every service in the building. You don't call plumbers or electricians directly — you ask the concierge. The concierge knows who to call, whether to send the same person each time (singleton), or a new person (bind). If you ask for something unfamiliar, they figure it out by looking at what tools the service needs (reflection-based auto-resolution).

### The Blueprint Wall
A construction foreman's wall of blueprints — each blueprint maps an abstract concept ("door", "window") to a specific model and installer. When a worker asks for a "window," the foreman checks the wall, picks the right blueprint, and builds it. The foreman also tracks which blueprints have been built before (instances cache) to reuse existing work.

### The Dependency Graph
Think of the container as a directed acyclic graph of service definitions. Each node is a binding, each edge is a dependency. The container performs topological-order resolution: to build Service A that depends on B, it must build B first. Circular edges cause container crashes (CircularDependencyException).

---

## Internal Mechanics

### Core Data Structures

The `Container` class (`Illuminate\Container\Container`) maintains these private/protected properties:

| Property | Type | Purpose |
|---|---|---|
| `$bindings` | `array<string, Definition>` | All registered bindings |
| `$instances` | `array<string, object>` | Resolved singleton/scoped instances |
| `$aliases` | `array<string, string>` | Abstract → abstract aliases |
| `$resolved` | `array<string, bool>` | Tracks which abstracts have been resolved |
| `$reboundCallbacks` | `array<string, array<callable>>` | Callbacks triggered on rebind |
| `$globalBeforeResolvingCallbacks` | `array<callable>` | Global pre-resolution hooks |
| `$globalResolvingCallbacks` | `array<callable>` | Global resolution hooks |
| `$globalAfterResolvingCallbacks` | `array<callable>` | Global post-resolution hooks |
| `$buildStack` | `array<string>` | Currently resolving stack (circular detection) |
| `$contextual` | `array<string, array<string, string\|callable>>` | Contextual binding rules |
| `$scopedInstances` | `array<string, object>` | Scoped instances (flushed per request) |

### The Bind Method

`bind($abstract, $concrete = null, $shared = false)` is the fundamental registration method. When `$concrete` is null, it defaults to `$abstract` (self-binding). The method stores a `Definition` (or Closure-based binding) and clears any cached instance for that abstract:

```php
public function bind($abstract, $concrete = null, $shared = false)
{
    $abstract = $this->normalize($abstract);
    $concrete = $this->normalize($concrete);

    if (is_null($concrete)) {
        $concrete = $abstract;
    }

    $this->dropStaleInstances($abstract);

    // If the concrete is a Closure, wrap it
    if (! $concrete instanceof Closure) {
        if (! is_string($concrete)) {
            throw new TypeException(...);
        }
        $concrete = $this->getClosure($abstract, $concrete);
    }

    $this->bindings[$abstract] = compact('concrete', 'shared');

    // Fire rebound callbacks
    if ($this->resolved($abstract)) {
        $this->rebound($abstract);
    }
}
```

### Resolution via `make()`

`make($abstract, $parameters = [])` is the public resolution entry point. It normalizes the abstract name (checking aliases), checks instances cache, delegates to `resolve()`:

```php
public function make($abstract, array $parameters = [])
{
    return $this->resolve($abstract, $parameters);
}
```

The `resolve()` method (protected) handles the full resolution chain, including pushing/popping from `$buildStack` for circular dependency tracking.

---

## Patterns

### Constructor Injection (Implicit Binding)
The most common pattern — bind an interface to a concrete class, and the container auto-injects dependencies:

```php
// ServiceProvider registration
$this->app->bind(PaymentGateway::class, StripeGateway::class);

// Resolved with auto-injected dependencies
$gateway = $this->app->make(PaymentGateway::class);
```

### Self-Binding with Closure Factory
When complex construction logic is needed:

```php
$this->app->bind(ReportGenerator::class, function ($app) {
    return new ReportGenerator(
        $app->make(PdfRenderer::class),
        config('reporting.cache_ttl'),
        $app->make(Cache::class)
    );
});
```

### Instance Sharing via singleton()
```php
$this->app->singleton(LoggerInterface::class, MonologLogger::class);
```
This is equivalent to `bind(... shared: true)`. The first resolution creates and caches the instance; all subsequent `make()` calls return the same object.

---

## Architectural Decisions

### Why Container extends ArrayAccess
Laravel chose `ArrayAccess` to mirror PHP's native `$array['key']` pattern, making container access feel like array access. This decision enables service providers to register bindings with `$this->app['key'] = ...` syntax, Facades to resolve via `$app['facade']`, and deferred providers to register by returning arrays of abstract names. The tradeoff is potential confusion between array access (binding registration) and actual array semantics.

### Why Container is the Application Superclass
Rather than a composition pattern where Application has-a Container, Laravel uses inheritance. This eliminates delegation boilerplate — every Application method is a container method. It also means the Application can override container behavior (e.g., `registerCoreContainerAliases()` adds framework aliases). The cost is a monolithic inheritance hierarchy that makes unit testing the Application in isolation more difficult.

### Why Null Concrete Means Self-Binding
When `bind()` or `make()` receives an abstract with no concrete, the container assumes the abstract is a concrete class name and attempts auto-resolution. This design enables zero-configuration resolution for classes with no dependencies on interfaces. The consequence is silent resolution of unregistered classes — which works fine until a class's constructor signature changes and the container silently resolves a wrong dependency.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero-config resolution for simple classes | Reflection overhead on every resolution | Production deployments should pre-resolve hot-path services |
| ArrayAccess makes container feel familiar | Array set (`$app['key'] = X`) and get both use same syntax | Developers may confuse binding registration with resolved instance access |
| Extending Application from Container avoids delegation | Application inherits 200+ container methods | Makes the Application API surface overwhelming; IDE autocomplete noise |
| Singleton caching reduces allocation pressure | Stale state persists across requests in long-running processes | Octane deployments require scoped() instead of singleton() for mutable services |

---

## Performance Considerations

Reflection-based auto-resolution is the slowest path in the container. A `make()` call on an unbound class triggers `ReflectionClass::getConstructor()`, parameter inspection, and recursive resolution for each dependency. For a class with 5 layers of constructor dependencies, this can involve 15-30 reflection calls in a single resolution chain.

The `$instances` cache provides O(1) lookups — resolving a previously-resolved singleton is a simple array access. For Octane or high-throughput queue workers, pre-resolving critical services during boot (`$app->make(CriticalService::class)`) eliminates the first-resolution reflection cost.

Each `$bindings` entry stores a `Definition` object (~72 bytes baseline). An application with 300 bindings consumes ~21KB for the bindings array — negligible. The `$instances` array grows with each resolved singleton; in Octane, this accumulates permanently, so memory grows until the worker restarts.

---

## Production Considerations

- **Pre-resolve hot services in a service provider's `boot()` method** to shift reflection cost from request-time to boot-time. Use `$app->make(CriticalService::class)` to trigger first resolution during boot rather than on the first request.
- **Monitor `$instances` growth** in Octane by logging `count($container->getInstances())` periodically. Unexpected growth indicates a `bind()` where `singleton()` was intended, or the `instance()` method used in a loop.
- **Use `$app->bound('key')` before resolving in conditional paths** to avoid `BindingResolutionException` in edge cases. The container throws hard exceptions on resolution failure — it never returns null.
- **Avoid array push syntax in service providers** — `$app['services'][] = new Service()` modifies the container in ways that may not trigger rebound callbacks correctly. Use `bind()` with explicit closures instead.

---

## Common Mistakes

**Why it happens:** Developers treat the container as a key-value store and use `$app['key'] = value` for arbitrary data. **Why it's harmful:** This bypasses the binding system — the value is stored directly in `$instances` without going through `bind()`, so it won't participate in contextual binding, extending, or rebound callbacks. **Better approach:** Use `$app->instance()` if you must inject a pre-constructed object, or use `$app->bind('key', fn() => value)` to register it as a proper binding.

**Why it happens:** Calling `$app->make()` inside controllers or jobs instead of relying on constructor injection. **Why it's harmful:** This is the service locator anti-pattern — dependencies become implicit, making the class impossible to unit test without mocking the container itself. **Better approach:** Declare all dependencies in the constructor and let the container inject them automatically.

**Why it happens:** Assuming `$app['db']` returns a new connection each time. **Why it's harmful:** The database connection is registered as a singleton. Every `$app['db']` call returns the same connection instance. Modifying connection state (e.g., setting schema visibility) leaks across code paths. **Better approach:** Use `DB::connection()` or inject `ConnectionInterface` for connection-scoped operations.

**Why it happens:** Developers extend the Application class to override container behavior. **Why it's harmful:** The Application class is tightly coupled to the Laravel bootstrap process. Custom Application subclasses break when upgrading Laravel due to method signature changes. **Better approach:** Use service providers and bootstrappers instead of subclassing Application.

---

## Failure Modes

### BindingResolutionException — Unresolvable Dependency
The container cannot resolve a class because a constructor parameter has a non-class type hint (e.g., `string`, `int`, `array`) with no default value and no explicit binding. **Common causes:** Forgetting to register a binding for an interface, or a constructor parameter requiring a primitive value. **Detection:** Caught immediately on first `make()` call. **Mitigation:** Use `makeWith()` to pass primitives, or register the class with a closure factory.

### Type Error in Closure Binding
An incorrectly typed closure parameter causes `TypeError` at resolution time, not registration time. **Common causes:** Type-hinting the wrong interface in a closure. **Detection:** Discovered at runtime, not during boot. **Mitigation:** Unit test every binding closure with `$this->app->make(AbstractClass::class)` in service provider tests.

### Infinite Recursion in Build Stack
A circular dependency chain fills the build stack until memory exhaustion. **Detection:** The container detects the cycle when the circular limit is exceeded (default 200 depth in `isCircularDependency()`). **Mitigation:** Break the cycle by removing one of the constructor dependencies, using setter injection, or introducing a factory/lazy proxy.

---

## Ecosystem Usage

**Laravel Framework Core:** The `Illuminate\Foundation\Application` constructor calls `registerBaseBindings()` which binds core contracts like `App\Http\Kernel`, `App\Console\Kernel`, and `Illuminate\Contracts\Debug\ExceptionHandler` to their concrete implementations. These bindings are the first entries in the container and establish the entire framework wiring.

**Spatie Laravel Package Tools:** The `Spatie\LaravelPackageTools\PackageServiceProvider` uses `$this->app->bind()` and `$this->app->singleton()` within its `register()` and `boot()` lifecycle hooks. Package-specific bindings are registered only when the package is active, demonstrating the container as a conditional binding registry.

**Monica CRM:** The open-source Monica CRM registers custom repository bindings in `AppServiceProvider` using `$this->app->singleton()`. The application binds `ContactRepositoryInterface` to `ContactRepository` and similar repository contracts, using the container as the sole composition root for all data access.

---

## Related Knowledge Units

### Prerequisites
- *(None — this is the foundation topic)*

### Related Topics
- Binding Types
- Binding Resolution
- Container Aliases

### Advanced Follow-up Topics
- Auto-Resolution via Reflection
- Contextual Binding
- Circular Dependency Detection
- Scoped Instance Management

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container` (GitHub, master branch): Core container implementation — 1300+ lines covering bind, make, resolve, call, and all callback systems.
- `Illuminate\Container\Definition`: The binding definition object introduced in Laravel 12 for storing per-binding metadata.
- `Illuminate\Foundation\Application::registerBaseBindings()` (lines 380-420): Shows which core services are bound at Application construction.
- `Illuminate\Foundation\Application::registerCoreContainerAliases()` (lines 650-750): Full alias table mapping Facade names to container abstracts.

### Key Insight
The container is not a DI container in the traditional sense (like PHP-DI or Symfony's container) — it is a combined registry, factory, and auto-resolver. The `ArrayAccess` implementation is what ties all three roles together, enabling array-syntax binding registration, array-syntax resolution, and implicit binding via class name lookup in a single expression.

### Version-Specific Notes
- **Laravel 10.x:** The `Container` class used simple array entries for bindings (`['concrete' => ..., 'shared' => ...]`). No `Definition` value object.
- **Laravel 11.x:** Introduction of `ContextualAttribute` binding via PHP 8 attributes (`#[Context]`, `#[Singleton]`). Binding arrays remained unchanged.
- **Laravel 12.x:** The `Definition` value object was introduced, replacing associative arrays. The `bind()` method signature changed to accept `Definition` instances. Backward compatibility maintained for array syntax.
- **Laravel 13.x:** The `$scopedInstances` array was separated from `$instances` for clearer lifecycle management under Octane. The `flushScoped()` method became a first-class API.
