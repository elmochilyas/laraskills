# Binding Resolution

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Binding Resolution
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Binding resolution is the process by which Laravel's service container transforms an abstract name (interface FQCN, class name, or string key) into a concrete object instance. The resolution pipeline — exposed through `make()`, `makeWith()`, and `build()` — is the core execution path of the container, responsible for evaluating binding definitions, managing the instance cache, invoking factory closures, and falling back to auto-resolution via PHP reflection when no explicit binding exists.

The critical engineering decision in resolution is the auto-resolution fallback. When `make('App\Services\ReportService')` is called and no binding exists, the container does not throw an error — it uses `ReflectionClass` to inspect the constructor, recursively resolves each parameter, and attempts to construct the object. This design eliminates the need to register every class explicitly but introduces non-deterministic resolution: changing a constructor signature changes which concrete implementations are resolved. A developer adding a new interface type-hint to a constructor may silently get a different implementation than expected if no binding exists for that interface.

For production applications, understanding resolution order prevents debugging sessions where "make() returned the wrong object." The resolution chain — instances cache first, then bindings, then auto-resolution — must be internalized. Additionally, resolution via `build()` bypasses the instances cache entirely, forcing fresh construction. This is used internally by `resolve()` to build the initial instance before caching, but calling `build()` directly from application code violates the container's lifecycle contracts.

---

## Core Concepts

### make() — Standard Resolution
The primary public resolution method. Takes an abstract name and optional parameters array. Follows the full resolution chain.

```php
$service = $this->app->make(ReportService::class);
$service = $this->app->make('reports.generator', ['format' => 'pdf']);
```

### makeWith() — Parameterized Resolution
A convenience wrapper around `make()` that passes additional parameters to the constructor during resolution. Useful for classes with primitive constructor dependencies:

```php
$report = $this->app->makeWith(Report::class, [
    'id' => 1234,
    'format' => 'pdf',
]);
```

### build() — Raw Construction
Builds a concrete class instance without caching or binding lookup. This is the raw reflection-based constructor:

```php
// Always creates a new instance, bypassing singletons
$instance = $this->app->build(SomeClass::class);
```

### The Resolution Chain
```
make($abstract)
 1. Normalize abstract (resolve aliases)
 2. Check contextual bindings
 3. Check $instances cache
 4. Check $bindings definition
 5. If no binding and $abstract is a class: auto-resolution via ReflectionClass
 6. Throw BindingResolutionException if unresolvable
```

### Parameter Passing
Parameters passed to `makeWith()` are matched to constructor parameters by name:

```php
public function __construct(int $userId, string $format) { ... }

// makeWith passes ['userId' => 1, 'format' => 'pdf']
// Reflection parameter name matching — NOT positional
```

---

## Mental Models

### The Library Catalog
The container is a library catalog system. When you request a book (`make()`), the system checks: (1) Is it already checked out and on the hold shelf (instances cache)? (2) Is it in the catalog (bindings)? (3) If neither, can we find the author's name in the registry and figure out which book they wrote (auto-resolution)? If none of these work, the system returns "Book not found" (BindingResolutionException).

### The Modular Factory
A factory assembly line where each station (`make()`, `makeWith()`, `build()`) represents a different automation level. Station `make()` follows the full blueprint, Station `makeWith()` lets you customize a few screws, and Station `build()` is the raw 3D printer that always creates from scratch even if a finished product is in the warehouse.

### The DNS Resolution Analogy
Like DNS resolution: first check local cache (instances), then check the hosts file (bindings), then query the DNS server (auto-resolution), then fail with "NXDOMAIN" (BindingResolutionException). Each layer provides faster lookup but narrower scope.

---

## Internal Mechanics

### Container::make() Implementation

```php
public function make($abstract, array $parameters = [])
{
    return $this->resolve($abstract, $parameters);
}
```

### resolve() — The Core Resolution Engine

The protected `resolve()` method (approx 100 lines) implements the full resolution chain:

```php
protected function resolve($abstract, $parameters = [], $raiseEvents = true)
{
    $abstract = $this->getAlias($abstract);  // Step 1: Alias resolution

    $needsContextualBuild = $this->needsContextualBuild($abstract);

    // Step 2: Check instances cache (for singletons/scoped)
    if (isset($this->instances[$abstract]) && ! $needsContextualBuild) {
        return $this->instances[$abstract];
    }

    // Step 3: Check contextual overrides
    $this->withContextualBindings($abstract);

    // Step 4: Track circular dependency via build stack
    $this->buildStack[] = $abstract;

    // Step 5: Get the concrete definition
    $concrete = $this->getConcrete($abstract);

    // Step 6: If concrete is a Closure, execute it; else build it
    $object = $concrete instanceof Closure
        ? $concrete($this, $parameters)
        : $this->build($concrete, $parameters);

    // Step 7: Apply extenders
    foreach ($this->getExtenders($abstract) as $extender) {
        $object = $extender($object, $this);
    }

    // Step 8: Fire resolution callbacks
    if ($raiseEvents) {
        $this->fireResolutionCallbacks($abstract, $object);
    }

    // Step 9: Cache if shared
    if ($this->isShared($abstract) && ! $needsContextualBuild) {
        $this->instances[$abstract] = $object;
    }

    // Step 10: Pop build stack
    array_pop($this->buildStack);

    return $object;
}
```

### build() — Reflection-Based Construction

`build($concrete, $parameters = [])` uses `ReflectionClass` to inspect the constructor:

```php
public function build($concrete, array $parameters = [])
{
    $reflector = new ReflectionClass($concrete);

    if (! $reflector->isInstantiable()) {
        throw new BindingResolutionException("Target [$concrete] is not instantiable.");
    }

    $constructor = $reflector->getConstructor();

    if (is_null($constructor)) {
        // No constructor — instantiate directly
        return new $concrete;
    }

    // Resolve each constructor parameter
    $dependencies = $constructor->getParameters();
    $instances = $this->resolveDependencies($dependencies, $parameters);

    return $reflector->newInstanceArgs($instances);
}
```

---

## Patterns

### Interface Injection via make()
```php
// Binding registration
$this->app->bind(CacheInterface::class, RedisCache::class);

// Resolution — type-hint determines concrete
public function __construct(CacheInterface $cache) { ... }
```

### Parameterized Factory Function
```php
$this->app->bind(SearchService::class, function ($app, array $params) {
    return new SearchService(
        $app->make(ElasticsearchClient::class),
        $params['index'] ?? 'default'
    );
});

// Usage
$search = $this->app->makeWith(SearchService::class, ['index' => 'products']);
```

### Contextual Resolution Override
```php
$this->app->when(ReportController::class)
    ->needs(ReportFormatter::class)
    ->give(PdfReportFormatter::class);

$this->app->when(AnalyticsController::class)
    ->needs(ReportFormatter::class)
    ->give(CsvReportFormatter::class);
```

---

## Architectural Decisions

### Why make() and makeWith() are separate from build()
`make()` and `makeWith()` enforce container lifecycle — caching, callbacks, extenders. `build()` is a low-level construction utility that skips all lifecycle management. The separation ensures that application code uses `make()` (predictable, lifecycle-aware) while the container internals use `build()` (raw, no side effects). The framework further enforces this by making `build()` public but documenting it as an internal method.

### Why resolution checks instances before bindings
The instances-first order ensures that once a singleton is resolved, it remains authoritative. If bindings were checked first, a later `bind()` call could shadow a previously-resolved singleton. The current design gives priority to runtime state (what has been built) over configuration (what is registered). This is critical for test scenarios where `instance()` must override a registered binding.

### Why contextual binding is checked after instances cache
Contextual binding overrides are checked *after* the instances cache. This means that if a singleton was already resolved from a different context, the cache returns the same object regardless of context. The consequence is that contextual bindings only affect the first resolution; after that, the cached singleton is shared across all contexts.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Auto-resolution eliminates explicit bindings | Reflection overhead on first resolution | First request after deploy is slower; warmup mitigates |
| Parameterized resolution via makeWith() | Parameter matching by name (not position) | Refactoring parameter names silently breaks resolution |
| build() enables low-level construction | Bypasses caches, callbacks, and extenders | Calling build() directly in application code breaks lifecycle contracts |
| Contextual binding provides context-specific resolution | Contextual overrides checked after instances cache | Contextual binding has no effect on already-cached singletons |

---

## Performance Considerations

The `make()` call is the most frequent container operation. Each call involves:
- Alias normalization (string lookup in `$aliases`)
- Contextual binding check (array lookup in `$contextual`)
- Instances cache check (O(1) array key existence)
- Bindings check (O(1) array key existence)
- If auto-resolving: `ReflectionClass::getConstructor()` + parameter iteration + recursive `resolve()` for each dependency

For a class with 3 typed constructor dependencies, each of which has its own dependencies, a single `make()` call triggers 7-15 reflection operations. In Octane, where the second call to `make()` returns a singleton in O(1), this overhead is paid only once per worker lifetime.

`makeWith()` adds parameter matching overhead — iterating constructor parameters and matching by name adds ~2-5μs per call depending on constructor arity.

`build()` is the fastest raw construction path, but its bypass of caching means repeated calls create N instances. Using `build()` where `make()` was intended is a performance anti-pattern that multiplies allocation and constructor-logic overhead.

---

## Production Considerations

- **Prefer `make()` over direct instantiation.** Always let the container manage object construction, even for classes without dependencies. This future-proofs against constructor signature changes.
- **Avoid `build()` in application code.** The method is intended for container internals. Calling `build()` prevents extenders and resolution callbacks from executing, breaking service decoration.
- **Use `makeWith()` sparingly.** If a class requires primitive constructor parameters, consider a factory or a parameter object DTO instead.
- **Log resolution failures.** Catch `BindingResolutionException` at the kernel level and log the abstract name and build stack. This reveals missing bindings during development.
- **Pre-resolve during boot.** In production, call `$app->make(HotService::class)` in a service provider's `boot()` method to front-load reflection costs.

---

## Common Mistakes

**Why it happens:** Calling `$this->app->build(Service::class)` in a controller to get a fresh instance. **Why it's harmful:** `build()` bypasses all lifecycle hooks — contextual bindings, extenders, resolution callbacks. The service may lack configuration applied by extenders. **Better approach:** Use `$this->app->make(Service::class)` for standard resolution, or `bind()` with a closure if you need per-resolution control.

**Why it happens:** Passing positional parameters to `makeWith()` instead of named parameters. **Why it's harmful:** The container matches parameters by name using reflection. Positional parameters are ignored if they don't match parameter names. **Better approach:** Always use named parameter arrays matching constructor parameter names.

**Why it happens:** Calling `make()` outside of constructor injection, inside business logic. **Why it's harmful:** This is the service locator anti-pattern — dependencies become implicit, breaking testability and static analysis. **Better approach:** Inject dependencies through the constructor.

**Why it happens:** Expecting `make()` to return a new instance after `singleton()` was called. **Why it's harmful:** Singletons cache the instance permanently. Repeated calls return the same object, so mutation on the returned object affects all consumers. **Better approach:** Use `bind()` if fresh instances are required, or make the singleton stateless.

---

## Failure Modes

### BindingResolutionException — Unregistered Abstract
The container cannot resolve an abstract that is neither bound nor auto-resolvable. **Common causes:** Missing service provider registration, typo in abstract name, interface type-hint without binding. **Detection:** Caught at runtime on first resolution attempt. **Mitigation:** Always register bindings in service providers; use `$app->bound($abstract)` to check before resolution.

### Unresolvable Primitive Dependency
A constructor parameter with a primitive type (string, int, array) has no default value and no binding. **Common causes:** Adding a primitive dependency to a constructor without providing a default or registering a binding. **Detection:** `BindingResolutionException` with "Unresolvable dependency" message. **Mitigation:** Provide default values for optional primitives, use `makeWith()` for required primitives, or register the class with a factory closure.

### Recursive Resolution Loop
A circular reference in build stack causes infinite recursion. **Common causes:** Service A depends on Service B depends on Service A. **Detection:** `CircularDependencyException` thrown by `isCircularDependency()` check in `resolve()`. **Mitigation:** Use the build stack trace in the exception message to identify the cycle. Break the cycle by removing one of the circular references, using setter injection, or introducing a proxy.

---

## Ecosystem Usage

**Laravel Framework Core:** The controller resolution in `Illuminate\Routing\Router` uses `$this->container->make($controllerClass)` to instantiate controllers. This ensures controllers receive their constructor-injected dependencies automatically. Route-level method injection uses `$this->container->call([$controller, $method])` which invokes the method with resolved parameters (including `Request`, route parameters, and bound services).

**Laravel Horizon:** The `Horizon::check()` method uses `$app->make(Contracts\Horizon\Check::class)` to resolve health check contracts. Different checks are registered with `bind()` (each check independent) while the checks collection is a singleton.

**Spatie Ray:** Uses `$app->make(Ray::class)` within its service provider to resolve the Ray debugging client. The client is registered with `singleton()` to maintain connection state across the request lifecycle. Spatie's package service provider uses `make()` in `boot()` to resolve and pre-configure the client.

---

## Related Knowledge Units

### Prerequisites
- Container Fundamentals
- Binding Types

### Related Topics
- Auto-Resolution via Reflection
- Contextual Binding

### Advanced Follow-up Topics
- Circular Dependency Detection
- Resolution Callbacks

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::make()` (lines 180-185): Public entry point, delegates to `resolve()`.
- `Illuminate\Container\Container::resolve()` (lines 600-700): Core resolution engine — alias resolution, contextual bindings, instances cache, build stack, extenders, callbacks.
- `Illuminate\Container\Container::build()` (lines 800-850): Reflection-based construction — ReflectorClass, constructor parameter resolution.
- `Illuminate\Container\Container::resolveDependencies()` (lines 860-900): Iterates constructor parameters; for typed parameters, calls `resolve()`; for primitives, checks defaults or parameter array.
- `Illuminate\Container\Container::getConcrete()` (lines 500-520): Returns closure or class name from bindings, or the abstract itself for auto-resolution.

### Key Insight
The resolution pipeline is intentionally lenient — it tries auto-resolution before failing. This design means that "unexpected resolution" bugs are more common than "resolution failure" bugs. A class that accidentally type-hints an interface without a binding will silently resolve to the interface's registered concretion (if any), or fail with a confusing exception about interfaces not being instantiable.

### Version-Specific Notes
- **Laravel 10.x:** `make()` passed parameters differently — parameter array was merged with contextual parameters. Could cause unexpected parameter overrides.
- **Laravel 11.x:** `makeWith()` introduced as explicit parameterized resolution, separating "parameters for resolution" from "contextual parameters."
- **Laravel 12.x:** `resolve()` refactored to use `Definition` objects. The `getConcrete()` method was updated to return Definition contents rather than raw bindings array entries.
- **Laravel 13.x:** New circular dependency detection algorithm uses depth tracking instead of string matching. Detects recursion across alias chains.
