# DI Container Basics

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
The Laravel service container (`Illuminate\Container\Container`) is the foundation of the entire framework — it manages class dependencies, performs dependency injection, and controls object lifecycle. Understanding the container's core mechanisms (binding, resolution, singletons, aliases) is essential before diving into specific injection patterns. The container is both a registry (storing abstract-to-concrete mappings) and a factory (constructing objects with all their dependencies).

## Core Concepts

### Container as Dependency Manager
The container stores bindings (abstract → concrete mappings) and resolves them on demand. It is both a registry and a factory.

### bind()
Registers an abstract-to-concrete mapping. Each resolution creates a new instance.

### singleton()
Like `bind()` but the resolved instance is cached — subsequent resolutions return the same instance.

### instance()
Stores a pre-built object directly. Bypasses resolution entirely.

### make()
Resolves an abstract from the container. Returns a fully-constructed instance with all dependencies injected.

### call()
Invokes a callable with method injection — resolves type-hinted parameters from the container.

### Auto-Resolution
If no explicit binding exists, the container attempts to construct the class using Reflection on its constructor.

### Aliases
Short string names that map to abstract classes — `$container->alias('db', DatabaseManager::class)`.

### Container vs Application
`Illuminate\Foundation\Application` extends `Container` and adds Laravel-specific features (bootstrapping, providers, path resolution).

## Mental Models

### The Vending Machine
The container is a vending machine. You press a button (request an abstract — `make('Logger')`), and the machine dispenses the product (concrete instance). The machine knows which product to dispense because it was stocked (bound) beforehand. Some products are unique (singleton — only one can of soda). Others are refilled each time (bind — fresh cup of coffee each press).

### The Hotel Concierge
The container is a hotel concierge. You ask for a service (`make(DatabaseManager::class)`), and the concierge finds the right person, ensures they have all their tools (dependencies), and brings them to you. If you always want the same person (singleton), the concierge remembers and sends the same one every time.

### The Blueprint Factory
The container is a factory with blueprints. `bind()` adds a blueprint that says "to build a Car, use these parts (Engine, Wheels)". `make()` executes the blueprint — gathering the engine and wheels, injecting them into the car. `singleton()` is a blueprint for a limited edition — built once, displayed forever.

## Internal Mechanics

### Container Core Structure
```php
// Illuminate\Container\Container key properties:
$bindings    = []; // ['abstract' => ['concrete' => ..., 'shared' => bool]]
$instances   = []; // ['abstract' => resolved instance]
$aliases     = []; // ['alias' => 'abstract']
$contextual  = []; // ['consumer' => ['abstract' => 'concrete']]
$resolved    = []; // ['abstract' => true]
$buildStack  = []; // Current resolution chain (cycle detection)
$tags        = []; // ['tag' => ['abstract1', 'abstract2']]
```

### Resolution Flow
```php
// Container::make($abstract)
// 1. Check $instances — return if already resolved (singleton)
// 2. Check $aliases — resolve alias to abstract
// 3. Check $contextual — consumer-specific binding?
// 4. Check $bindings — explicit binding?
// 5. Auto-resolution — build($concrete)
//    a. Check $buildStack for cycles
//    b. Push class to $buildStack
//    c. ReflectionClass → getConstructor → getParameters
//    d. Resolve each parameter recursively (step 2-5)
//    e. Pop from $buildStack
//    f. newInstanceArgs($resolvedDependencies)
// 6. Fire resolution callbacks (resolving, afterResolving)
// 7. Return instance
```

### Global Container Access
```php
// Multiple ways to access the same container:
$container = app();
$container = Container::getInstance();
$container = resolve('app');
$db = $container->make('db');
$db = app('db');
$db = $container['db']; // ArrayAccess
```

## Patterns

### Composition Root Pattern
All dependency wiring is centralized in service providers. Controllers and services never construct their own dependencies. The container is the composition root.

### Interface Binding Pattern
Bind interfaces to concrete implementations: `$app->bind(UserRepositoryInterface::class, EloquentUserRepository::class)`. Enables swapping without changing consumer code.

### Singleton for Stateless Services Pattern
If a service has no per-request state, `singleton()` saves memory and resolution time.

## Architectural Decisions

### Why a shared container instead of per-class factories?
A shared container enables centralized wiring, lifecycle management, and cross-cutting concerns (resolution callbacks, rebinding). Per-class factories would duplicate these capabilities.

### Why ArrayAccess on the container?
ArrayAccess provides a familiar syntax (`$app['db']`) alongside method syntax (`$app->make('db')`). This was a design choice for developer convenience.

### Why separate Container and Application classes?
Separation of concerns. `Container` provides generic DI container functionality. `Application` extends it with Laravel-specific features (providers, bootstrapping, paths). This allows using the container independently of Laravel.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Centralized dependency management | Container becomes a God object | Must guard against over-use in business logic |
| Auto-resolution reduces boilerplate | Reflection overhead on each make() | Explicit bindings needed for hot paths |
| Singleton pattern saves memory | Singleton with mutable state leaks data | Use scoped() for request-aware state |
| ArrayAccess is convenient | Hides the make() call | Can encourage service locator pattern |

## Performance Considerations

- **make() with explicit binding:** O(1) lookup, instantiation cost depends on the class's dependency chain.
- **make() with auto-resolution:** Reflection overhead per-resolution (~0.01-0.05ms per class) for deep dependency graphs.
- **Singleton resolution:** Full cost paid once, subsequent calls return cached instance — near-zero cost.
- **instance():** Lowest overhead — the object is already built and stored in an array.

## Production Considerations

- **Bind interfaces in service providers:** Never bind outside of provider `register()` methods.
- **Use singleton for stateless services:** Database connections, cache managers, loggers.
- **Use contextual binding:** `$app->when(Consumer::class)->needs(Interface::class)->give(Concrete::class)`.
- **Monitor resolution time:** Use Laravel Telescope to track container resolution times.
- **Pre-resolve hot-path services:** In Octane, resolve frequently-used services at worker startup.

## Common Mistakes

- **Binding in route files:** `app()->bind(...)` in routes — bindings scattered, hard to test.
- **Forgetting to bind interfaces:** Interface type-hint without binding — `TargetInterfaceNotInstantiableException`.
- **Singleton with mutable state:** Singleton stores per-request data — state leaks between requests.
- **app() in business logic:** `app(Service::class)` in domain code — hidden dependencies, testing difficulty.
- **Binding concrete to concrete:** `bind(Service::class, Service::class)` — no benefit, auto-resolution handles it.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Uninstantiable interface | `TargetInterfaceNotInstantiableException` | Interface not bound to concrete | Register binding in provider |
| Circular dependency | `CircularDependencyException` | A depends on B, B depends on A | Restructure classes |
| Primitive resolution failure | `BindingResolutionException` | Primitive parameter without default or binding | Add default value or binding |
| Singleton state leak | Data from request A visible in request B | Singleton stores mutable state | Convert to scoped() |

## Ecosystem Usage

- **Laravel Framework:** Core services (events, log, router, cache, DB) are registered as singletons in the application constructor.
- **Laravel Telescope:** Uses the container to resolve watchers. Registers its own bindings in `TelescopeServiceProvider`.
- **Laravel Horizon:** Binds queue-related services. Uses `instance()` for the current job payload.
- **Spatie packages:** Register bindings in package service providers. Use singleton for stateless services.

## Related Knowledge Units

### Prerequisites
- (Foundational — no prior Laravel KU knowledge needed)

### Related Topics
- [Constructor Injection (ku-02)](../ku-02-constructor-injection/02-knowledge-unit.md) — how the container injects via constructors.
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md) — auto-resolution strategy.
- [Interface Binding (ku-08)](../ku-08-interface-binding/02-knowledge-unit.md) — binding interfaces to concrete implementations.
- [Contextual Binding (ku-05)](../ku-05-contextual-binding/02-knowledge-unit.md) — consumer-specific binding resolution.

## Research Notes
- The Container class is at `src/Illuminate/Container/Container.php`.
- Key properties: `$bindings`, `$instances`, `$aliases`, `$contextual`, `$resolved`.
- `Container::getInstance()` returns the global container instance.
- The `build()` method is the core of auto-resolution — uses ReflectionClass.
