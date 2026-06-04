# Auto-Resolution via Reflection

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Auto-Resolution via Reflection
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Auto-resolution via reflection is the mechanism by which Laravel's service container constructs objects without explicit bindings by reading their constructor signatures at runtime. Implemented in `Container::build()`, this process uses PHP's `ReflectionClass` and `ReflectionParameter` APIs to inspect constructor parameters, recursively resolve each type-hinted dependency, and handle primitive parameters with defaults or explicit overrides. This is the foundation of Laravel's "zero-configuration" dependency injection — controllers, jobs, listeners, and middleware all receive their dependencies automatically through this path.

The critical engineering decision is that auto-resolution treats unbound concrete classes the same as bound abstract interfaces — the container inspects the class, discovers its dependencies, and resolves them recursively. This means adding a new interface type-hint to a constructor changes the resolution behavior for the entire dependency graph. If the interface has no registered binding, the container attempts to instantiate the interface directly and fails with "Target [InterfaceName] is not instantiable." The consequence is that auto-resolution works perfectly for concrete classes but fails silently-invisible for interfaces without bindings, creating a class of bugs where constructor signatures drift from available bindings.

For production applications, auto-resolution is a double-edged sword. It eliminates hundreds of lines of boilerplate binding registration, but it also hides the dependency graph from static analysis. Tools like PHPStan cannot determine which concrete implementations will be resolved at runtime. Teams should use auto-resolution as the default (register nothing) and add explicit bindings only when: (a) binding interfaces, (b) customizing constructor parameters, or (c) enabling decoration via `extend()`.

---

## Core Concepts

### ReflectionClass Constructor Inspection
The container uses `ReflectionClass::getConstructor()` to discover constructor parameters:

```php
$reflector = new ReflectionClass($concrete);
$constructor = $reflector->getConstructor();

if ($constructor) {
    $dependencies = $constructor->getParameters();
    // Resolve each parameter...
}
```

### Parameter Type Resolution
Each `ReflectionParameter` is inspected for type hints. If a class/interface type-hint exists, the container recursively resolves it:

```php
if ($param->hasType() && ! $param->getType()->isBuiltin()) {
    $class = $param->getType()->getName();
    $instance = $this->resolve($class); // Recursive resolution
}
```

### Primitive Parameter Handling
Built-in types (string, int, array, bool) cannot be auto-resolved. The container checks for default values or the parameters array passed to `makeWith()`:

```php
if ($param->isDefaultValueAvailable()) {
    return $param->getDefaultValue();
}

// Check passed parameters array
if (isset($parameters[$param->getName()])) {
    return $parameters[$param->getName()];
}

// Unresolvable
throw new BindingResolutionException("Unresolvable dependency ...");
```

### Variadic Constructor Parameters
Variadic parameters (e.g., `Service ...$services`) are supported. The container collects tagged bindings or passed parameters:

```php
if ($param->isVariadic()) {
    // Collect from parameters array or tagged bindings
    return (array) ($parameters[$param->getName()] ?? []);
}
```

---

## Mental Models

### The Reverse Engineer
Auto-resolution is like a mechanic reverse-engineering a car by looking at every part's part number. The mechanic reads the engine block (constructor), finds each bolt's spec (type-hint), and orders the matching parts (resolves dependencies). If a spec says "part #ABC-123" but that part is an abstract blueprint (interface), the mechanic can't machine it — they need a concrete part number (binding).

### The Dependency Detective
A detective given a case file (class name) who reads the file, finds references to other cases (constructor dependencies), opens those files, reads their references, and so on until every case is solved. If any case file references an unsolved mystery (interface without binding), the entire investigation halts.

### The Recipe Cook
A cook who must make a dish with no recipe. They look at the dish name (class), read the ingredient list (constructor parameters), and for each ingredient, figure out how to make it (resolve recursively). If an ingredient is listed as "some kind of sauce" (interface), the cook can't proceed without knowing which specific sauce (binding).

---

## Internal Mechanics

### Container::build() — The Core Reflection Engine

The `build()` method is the entry point for auto-resolution. It handles four cases:

1. **No constructor:** Instantiate directly with `new $concrete`
2. **All typed parameters:** Resolve each via recursive `resolve()` call
3. **Mixed typed + primitive:** Resolve types recursively, extract primitives from defaults or parameters
4. **Unresolvable primitive:** Throw `BindingResolutionException`

```php
public function build($concrete, array $parameters = [])
{
    if ($concrete instanceof Closure) {
        return $concrete($this, $parameters);
    }

    $reflector = new ReflectionClass($concrete);

    if (! $reflector->isInstantiable()) {
        throw new BindingResolutionException("Target [$concrete] is not instantiable.");
    }

    $constructor = $reflector->getConstructor();

    if (is_null($constructor)) {
        return new $concrete;
    }

    $dependencies = [];
    foreach ($constructor->getParameters() as $param) {
        $dependencies[] = $this->resolveDependency($param, $parameters);
    }

    return $reflector->newInstanceArgs($dependencies);
}
```

### resolveDependency() Method

The per-parameter resolution logic (internal, not public API):

```php
protected function resolveDependency(
    ReflectionParameter $param, array $parameters
) {
    // Check explicit parameters first
    if (array_key_exists($param->getName(), $parameters)) {
        return $parameters[$param->getName()];
    }

    // Type-hinted class/interface — recursive resolution
    $type = $param->getType();
    if ($type && ! $type->isBuiltin()) {
        $class = $type->getName();
        try {
            return $this->resolve($class);
        } catch (BindingResolutionException $e) {
            if ($param->isDefaultValueAvailable()) {
                return $param->getDefaultValue();
            }
            throw $e;
        }
    }

    // Primitive — check default or fail
    if ($param->isDefaultValueAvailable()) {
        return $param->getDefaultValue();
    }

    if ($param->isVariadic()) {
        return [];
    }

    throw new BindingResolutionException("Unresolvable dependency ...");
}
```

### Build Stack and Circular Detection

During auto-resolution, the container pushes each abstract onto `$buildStack`:

```php
$this->buildStack[] = $abstract;
// ... resolve dependencies recursively ...
array_pop($this->buildStack);
```

Before pushing, it checks if the abstract already exists in the stack:

```php
if ($this->isCircularDependency($abstract)) {
    throw new CircularDependencyException(
        "Circular dependency detected: " . implode(' -> ', $this->buildStack)
    );
}
```

---

## Patterns

### Interface Binding for Auto-Resolution Targets
```php
// Without binding, auto-resolution fails for interfaces
// Register binding:
$this->app->bind(ReportRenderer::class, PdfRenderer::class);

// Now auto-resolution works:
class ReportController {
    public function __construct(ReportRenderer $renderer) { }
}
```

### Mixed Constructor with Primitives and Objects
```php
class ReportGenerator {
    public function __construct(
        protected ReportRepository $repository, // Auto-resolved
        protected string $format = 'pdf',       // Default value
        protected ?int $limit = null             // Nullable with default
    ) {}
}

// Auto-resolution succeeds with defaults
$generator = $this->app->make(ReportGenerator::class);

// Override via makeWith()
$generator = $this->app->makeWith(ReportGenerator::class, [
    'format' => 'csv',
    'limit' => 100,
]);
```

### Nullable Type-Hints for Optional Dependencies
```php
class Logger {
    public function __construct(
        protected ?AlertingService $alerts = null // Optional dependency
    ) {}
}

// Auto-resolution resolves to null if not bound
$logger = $this->app->make(Logger::class);
// $logger->alerts === null
```

---

## Architectural Decisions

### Why the container uses ReflectionClass instead of PHP's built-in autoloading
PHP's class autoloader only handles file loading, not dependency resolution. The container needs to inspect constructor parameters, which requires the class to be loaded via autoloader first, then reflected upon. ReflectionClass is the only PHP API that provides constructor parameter metadata (names, types, defaults) without executing the constructor. The alternative — requiring explicit factory closures for every class — would eliminate auto-resolution entirely but add massive boilerplate.

### Why auto-resolution throws exceptions instead of returning null
Failing loudly ensures that missing bindings are discovered immediately during development rather than silently producing null-dependency objects. The container could return a proxy or null object, but this would mask configuration errors until the missing dependency's method was called (a "fail late" pattern). Laravel's choice of "fail early" aligns with the framework's philosophy of helpful, immediate error messages.

### Why primitive parameters require defaults or explicit passing
Auto-resolution cannot synthesize primitive values (what would the default integer be?). Requiring defaults in the constructor signature or explicit parameter passing through `makeWith()` forces developers to think about primitive dependencies rather than relying on magic. The tradeoff is that adding a required primitive to an existing constructor breaks all existing auto-resolution callers — a refactoring hazard.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero boilerplate for simple classes | Reflection adds ~50-200μs per resolution chain | Every first-resolution pays a reflection tax; pre-resolve mitigates |
| Automatically adapts to constructor changes | Breaking changes to constructor silently affect resolution | Adding a required interface parameter without binding causes runtime crash |
| Works with any concrete class | Does not work with interfaces without binding | Forces developers to register interface bindings (good discipline) |
| Deep recursive resolution | Deep dependency trees cause N reflection calls | A 5-layer deep graph triggers 5+ recursion calls at ~50μs each |

---

## Performance Considerations

Each auto-resolution call performs: `ReflectionClass::getConstructor()` (1-2μs), `ReflectionMethod::getParameters()` iterate (0.5μs per parameter), `ReflectionParameter::getType()` (0.3μs), `ReflectionType::getName()` (0.2μs), plus recursive `resolve()` for each typed parameter. A class with 3 typed parameters triggers ~4μs of reflection overhead plus recursive resolution of each dependency (which may themselves trigger reflection).

The reflection results are not cached by the container. Each `make()` call on an unbound class re-reflects the constructor. Laravel 12+ introduced a `ReflectionCache` for `Container` to cache reflectors, but this cache is per-container-instance and persists across resolutions. In Octane, the cache lives for the worker lifetime, so the reflection cost is paid once per worker per class.

Auto-resolution is the slowest path in the container. For Octane hot paths, pre-registering bindings (even for concrete classes) replaces reflection with pre-compiled closure resolution, which is ~10x faster (5μs vs 50μs).

---

## Production Considerations

- **Pre-register hot-path classes as bindings.** For services resolved on every request, replace auto-resolution with `$app->bind(Class::class)` or `$app->singleton(Class::class)`. This bypasses reflection and uses the faster closure-based resolution.
- **Avoid deep constructor dependency chains in auto-resolved classes.** Each level adds recursive reflection overhead. Consider factories or DTOs for classes with 4+ constructor parameters.
- **Use `ReflectionCache` features in Laravel 12+.** Enable reflector caching by calling `$app->enableReflectionCache()` in `bootstrap/app.php` if available.
- **Add PHPStan rules to detect auto-resolution of interfaces without bindings.** Use `@phpstan-require-extends` or custom rules to flag constructor parameters typed as interfaces without container bindings.

---

## Common Mistakes

**Why it happens:** Type-hinting an interface in a constructor without registering a binding for that interface. **Why it's harmful:** Auto-resolution attempts to instantiate the interface directly and throws `BindingResolutionException: "Target [InterfaceName] is not instantiable."` **Better approach:** Always register a binding for every interface used as a constructor type-hint, or use concrete class names.

**Why it happens:** Adding a required primitive parameter (string, int) to a constructor without a default value. **Why it's harmful:** All existing auto-resolution callers break with `Unresolvable dependency` exception. **Better approach:** Always provide default values for primitive constructor parameters, or use a configuration object/DTO.

**Why it happens:** Assuming auto-resolution caches reflection results. **Why it's harmful:** Each call to `make()` on an unbound class triggers fresh reflection. **Better approach:** Pre-register bindings for classes resolved multiple times, or ensure ReflectionCache is enabled.

**Why it happens:** Relying on auto-resolution for classes that accept variadic constructor parameters without tagged bindings. **Why it's harmful:** Variadic parameters resolve to an empty array unless tagged bindings or explicit parameters are provided. **Better approach:** Use `tag()` to register tagged services for variadic injection.

---

## Failure Modes

### Target is Not Instantiable
The reflectors `ReflectionClass::isInstantiable()` returns false. **Common causes:** Type-hinting an interface or abstract class without a binding. **Detection:** `BindingResolutionException` at resolution time. **Mitigation:** Register a binding mapping the abstract to a concrete class.

### Unresolvable Primitive Dependency
A constructor parameter with a built-in type has no default value and no match in the parameters array. **Common causes:** Adding a scalar parameter without a default. **Detection:** `BindingResolutionException` with parameter name and class. **Mitigation:** Always provide default values, use `makeWith()` to pass primitives, or use a configuration object.

### Recursive Resolution Crash
A circular dependency in auto-resolution. **Common causes:** Class A's constructor requires Class B, whose constructor requires Class A. **Detection:** `CircularDependencyException` with the build stack trace showing the cycle. **Mitigation:** Break the cycle by removing one of the constructor dependencies, using setter injection, or introducing a lazy proxy.

---

## Ecosystem Usage

**Laravel Framework Core:** Controllers registered in routes are auto-resolved by the router: `$this->container->make($controllerClass)`. No explicit binding is required for controller classes. The `handle()` method on middleware with constructor dependencies is also auto-resolved. Event listeners, queued jobs, and mailables all use auto-resolution by default.

**Spatie Laravel Permission:** The `PermissionRegistrar` class uses auto-resolution for its constructor dependencies (cache, config, db). The package only registers bindings for its interfaces; concrete helpers resolve automatically.

**Monica CRM:** Controllers are never explicitly bound. They rely entirely on auto-resolution. The `ContactsController` constructor receives `ContactRepositoryInterface`, `ContactService`, and `Cache` through auto-resolution (with `ContactRepositoryInterface` explicitly bound to a concrete repository).

---

## Related Knowledge Units

### Prerequisites
- Container Fundamentals
- Binding Resolution
- Binding Types

### Related Topics
- Circular Dependency Detection

### Advanced Follow-up Topics
- Contextual Binding
- Resolution Callbacks

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::build()` (lines 800-850): Core reflection-based construction.
- `Illuminate\Container\Container::resolveDependencies()` (lines 860-950): Iterates ReflectionParameters and resolves each.
- `Illuminate\Container\Container::resolvePrimitive()` (internal, ~960-1000): Handles primitive parameter resolution with defaults and parameters array.
- `Illuminate\Container\Container::isCircularDependency()` (lines 700-720): Checks build stack for duplicates.
- `Illuminate\Container\RewriteReflectionCache` (Laravel 12+): Optional reflection caching feature.

### Key Insight
The `isInstantiable()` check on the reflector is the single point where interface vs concrete class resolution diverges. For interfaces, it returns false and throws. For concrete classes with abstract dependencies, it recurses. This means a concrete class that extends an abstract class will fail at auto-resolution if the abstract class constructor requires unresolvable dependencies — even if the concrete class overrides the constructor.

### Version-Specific Notes
- **Laravel 10.x:** No reflection caching. Every `make()` called reflection fresh. Build stack was tracked as string array.
- **Laravel 11.x:** Introduced nullable parameter support for optional dependencies. `ReflectionParameter::getType()` handling improved for union types (PHP 8.2+).
- **Laravel 12.x:** Optional `ReflectionCache` feature added — caches `ReflectionClass`, `ReflectionMethod`, and parameter metadata per container instance. Enable with `Container::enableReflectionCache()`.
- **Laravel 13.x:** Reflection cache enabled by default. Build stack now tracks depth with integer counter instead of string matching for circular detection.
