# Auto-Resolution Strategy

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Auto-Resolution Strategy is the fallback mechanism by which Laravel's service container resolves a class when no explicit binding has been registered. It uses PHP Reflection to inspect the class constructor, recursively resolve its type-hinted dependencies, and instantiate the class. This strategy is what makes Laravel's container feel "magical" — classes can be injected without any prior registration. It is the default behavior when `Container::make($class)` is called for a concrete, non-bound class name, and it operates on the principle of convention over configuration.

## Core Concepts
- **ReflectionClass::getConstructor():** The entry point — retrieves the constructor method if one exists.
- **ReflectionParameter::getType():** Determines whether a parameter is a class, interface, or primitive type.
- **Recursive resolution:** Each class-typed parameter triggers another `Container::make()` call, forming a resolution chain.
- **No explicit binding required:** Auto-resolution works for any concrete class whose constructor parameters are all resolvable (either themselves concrete classes, interfaces with bindings, or have default values).
- **Implicit singleton handling:** If a resolved dependency is bound as a singleton, the same instance is reused; otherwise a new instance is created each time.
- **Primitive fallback:** Scalar parameters without default values cause a `BindingResolutionException` because the container has no way to auto-resolve raw strings, ints, or arrays.

## Mental Models
- **Onion Model:** Think of auto-resolution as peeling an onion. The container starts with the outermost class, inspects its constructor, finds dependencies, resolves each one (each potentially with their own dependencies), and works inward until all layers are fully resolved.
- **Dependency Tree Traversal:** Auto-resolution is a depth-first traversal of the dependency graph. The container resolves the deepest dependency first, then works back up.
- **Convention Over Configuration:** If you write the type-hint, the container figures out the rest. No configuration files, no XML, no annotations — just PHP type declarations.

## Internal Mechanics
1. `Container::build($concrete)` is called when `make()` encounters a class with no registered binding.
2. `$reflector = new ReflectionClass($concrete)` is created.
3. `$constructor = $reflector->getConstructor()`:
   - If `null` (no constructor or no parameters) → `new $concrete` directly.
   - If constructor exists → proceed to parameter resolution.
4. `$constructor->getParameters()` returns the parameter array.
5. For each `$parameter`:
   - `$type = $parameter->getType()`:
     - If `null` → no type-hint. Check for default value or throw.
     - If a class type → proceed.
   - `$type->isBuiltin()`:
     - If true → primitive parameter. Check default value or `BindingResolutionException`.
     - If false → class/interface type.
   - `$parameterName = $type->getName()` — the fully-qualified class name.
   - Check `$this->has($parameterName)`:
     - If bound → resolve via `$this->make($parameterName)`.
     - If not bound → auto-resolve via recursive `$this->build($parameterName)`.
   - Check contextual binding: `$this->getContextualBinding($concrete, $parameter)`.
   - Check variadic: if `$parameter->isVariadic()` → resolve all implementations bound to the type.
6. Dependencies are collected into `$dependencies[]`.
7. `$reflector->newInstanceArgs($dependencies)` constructs the object.
8. If any step fails, the exception bubbles up with a clear message indicating which class and parameter caused the failure.

## Patterns
- **Concrete Class Auto-Resolution:** The simplest case — `Container::make(Logger::class)` when `Logger` has no constructor or an empty constructor. No bindings needed.
- **Chained Auto-Resolution:** `class A { function __construct(B $b) }` + `class B { function __construct(C $c) }` + `class C` — the container resolves A → B → C without any bindings.
- **Mixed Resolution (Bound + Auto):** `class A { function __construct(B $b, LoggerInterface $logger) }` — `B` auto-resolved, `LoggerInterface` resolved via a binding. The container handles both transparently.
- **Default Value Short-Circuit:** `class A { function __construct(?Logger $logger = null) }` — if no binding exists for `Logger`, the container skips resolution and passes `null`.
- **Interface Without Binding:** Auto-resolution fails with `TargetInterfaceNotInstantiableException` if an interface type-hint has no concrete binding.

## Architectural Decisions
- **Why auto-resolution at all:** Explicit binding of every class would be prohibitively verbose for large applications. Auto-resolution enables a "zero-configuration" DI experience for the common case (concrete classes with simple dependency trees).
- **Why not auto-resolve primitives:** Scalar values have semantic meaning that the container cannot infer. `int $timeout = 30` is a configuration decision; auto-resolving it would require arbitrary default values.
- **Why Reflection instead of PHP 8 attributes:** Reflection works across all PHP versions supported by Laravel. Attributes (PHP 8.0+) could theoretically replace Reflection, but the Reflection-based approach is proven and well-understood.
- **Why no caching of auto-resolution results:** The class structure does not change at runtime, so auto-resolution results are deterministic. However, caching them requires a compilation step, which Laravel's container does not implement natively (unlike Symfony's compiled container).

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero configuration for common cases | Reflection overhead on first resolution | Cold-start performance cost |
| Intuitive and easy to learn | Implicit dependencies can hide complexity | New developers may not understand the resolution chain |
| Works with third-party code without bindings | No compile-time validation | Runtime errors for missing dependencies |
| Handles concrete classes automatically | Interface resolution requires explicit bindings | Developers must remember to register interface bindings |
| Recursive resolution handles deep trees | Deep chains are hard to debug | Resolution failure stack traces can be long |

## Performance Considerations
- **Reflection per request:** By default, `ReflectionClass` is constructed fresh each time a class is auto-resolved. This is fast (~0.01-0.05ms per class on most systems) but adds up for deep dependency graphs.
- **No auto-resolution caching:** Unlike Symfony's container (which compiles to plain PHP), Laravel auto-resolves at runtime with no caching layer. Third-party packages like `laravel-compiled` or `laravel-di-cache` can mitigate this.
- **Singleton optimization:** If auto-resolved dependencies are singletons, the Reflection cost is paid exactly once per process lifetime. Subsequent resolutions return the cached instance.
- **OpCache does not help Reflection:** OpCache caches the compiled PHP bytecode, but Reflection calls are runtime introspections that execute on every invocation regardless of OpCache. The only solution is to avoid the resolution path (use explicit bindings) or cache the Reflection results.

## Production Considerations
- **Monitor auto-resolution volume:** High request rates with deep auto-resolution chains can add latency. Profile using Laravel Telescope or a custom middleware that logs `Container::build()` calls.
- **Prefer explicit bindings for critical paths:** For the hot request path (e.g., controller resolution in every request), register explicit bindings or singletons to bypass auto-resolution.
- **Enable OPcache:** While OPcache does not cache Reflection results, it does reduce the cost of loading the class files themselves. Always enable OPcache in production.
- **Use `php artisan optimize`:** The optimize command caches service provider registrations and facades. It does not cache auto-resolution but reduces overall bootstrap overhead.

## Common Mistakes
- **Assuming auto-resolution works for interfaces:** `Container::make(LoggerInterface::class)` throws `TargetInterfaceNotInstantiableException` unless a binding exists. Always bind interfaces to concretes.
- **Forgetting to bind dependencies of bound classes:** Binding `LoggerInterface` to `MonologLogger` works only if `MonologLogger`'s own constructor dependencies are resolvable, either via auto-resolution or bindings.
- **Auto-resolving with primitive parameters:** A class with `__construct($config)` (no type-hint, no default) always fails. The container has no information about what `$config` should be.
- **Deep circular dependencies through auto-resolution:** Auto-resolution does not detect circular dependencies until the recursion limit is hit. The error message includes the resolution chain, which can be very long for deep graphs.

## Failure Modes
- **TargetInterfaceNotInstantiableException:** An interface or abstract class appears in a constructor parameter with no binding. Resolution stops immediately.
- **BindingResolutionException for primitive:** A scalar parameter with no default and no type-hint. The container reports the class name and parameter index.
- **CircularDependencyException:** Auto-resolution detects a loop. The container throws after a configurable recursion depth (default 100 or similar).
- **ClassNotFoundException:** The class specified is not autoloadable. PHP throws this, not the container, but it surfaces during the ReflectionClass construction.

## Ecosystem Usage
- **Laravel core:** Core framework classes that don't have explicit bindings rely on auto-resolution. Most service providers, middleware, and commands use auto-resolution for their own dependencies.
- **Laravel Nova:** Nova's resource fields and lenses auto-resolve their dependencies without requiring explicit bindings in the Nova service provider.
- **spatie/laravel-medialibrary:** The Media and File classes auto-resolve their dependencies (filesystem, image drivers) via auto-resolution combined with facade access.
- **Community packages:** Most packages that provide injectable services rely on auto-resolution for their public API, registering only interface-to-concrete bindings for abstractions.

## Related Knowledge Units

### Prerequisites
- **PHP Reflection API** — ReflectionClass, ReflectionParameter, and instantiability checks
- **Constructor Injection** — the primary consumer of auto-resolution
- **Service Container Internals** — how `build()`, `make()`, and `resolve()` interact

### Related Topics
- **Method Injection** — uses auto-resolution for method parameter resolution in `BoundMethod`
- **Interface Binding Resolution** — the explicit counterpart when auto-resolution cannot handle interfaces
- **Injection Guidelines by Class Type** — guidance on when auto-resolution is appropriate vs. explicit binding

### Advanced Follow-up Topics
- **Service Locator Anti-Pattern** — how auto-resolution enables clean injection vs hidden container pulls
- **Testing with the Container** — how auto-resolution affects test isolation and mocking strategies
- **Kernel Bootstrappers** — how bootstrappers are resolved via the container at framework startup

## Research Notes
- Auto-resolution is implemented entirely in `Container::build()` at `Illuminate\Container\Container::build()`. The method is 40-60 lines and has remained structurally unchanged since Laravel 5.0.
- The recursive depth limit for auto-resolution is controlled by `Container::$buildStack` — an array that tracks the current resolution chain. When an existing class appears in `$buildStack`, the container throws a circular dependency exception.
- Symfony's container does NOT have auto-resolution by default — every dependency must be explicitly wired. Laravel's auto-resolution is a philosophical departure that prioritizes developer convenience over explicit configuration.
- PHP-DI (a third-party DI container) also supports auto-resolution but with additional features like attribute-based injection and PHP 8.1 readonly property injection, which Laravel's container lacks.
