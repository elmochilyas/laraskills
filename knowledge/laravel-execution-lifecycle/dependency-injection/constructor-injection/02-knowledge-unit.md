# Constructor Injection

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Constructor Injection is the canonical dependency injection pattern in Laravel. Dependencies are declared as type-hinted parameters in a class constructor, and the service container automatically resolves and injects them when the class is instantiated. This pattern is the preferred mechanism for obtaining dependencies across the framework because it makes dependencies explicit, enforces immutability (dependencies are set once at construction time), and integrates seamlessly with the container's auto-resolution. It is the default and recommended approach for Controllers, Jobs, Listeners, and most resolvable classes.

## Core Concepts
- **Type-hinted constructor parameters:** The class declares `public function __construct(SomeDependency $dep)` and the container reads the parameter's type via Reflection.
- **Automatic resolution:** When the container builds an object, it inspects the constructor's parameter list, resolves each type-hinted class, and passes them in order — no manual wiring required.
- **Implicit binding:** If no explicit binding exists for a given type, the container falls back to its auto-resolution strategy (recursive Reflection-based construction).
- **Singleton and contextual binding awareness:** The container respects `singleton()`, `when()->needs()->give()`, and other binding modifiers during constructor resolution.
- **Explicit dependency contract:** Constructor Injection makes dependencies visible in the class signature, enabling static analysis tools, IDE autocompletion, and clear documentation of required collaborators.

## Mental Models
- **Function Signature Analogy:** Think of the constructor as a function's parameter list — every parameter is a required argument the class needs to operate. The container acts as the caller that supplies those arguments.
- **Candy Machine Model:** The constructor is the coin slot. Insert the right type-hints (coins) and the container dispenses the fully-configured class. You never see the internal machinery.
- **Wiring Harness:** Each constructor parameter is a wire that connects the class to the rest of the application. The container is the harness that bundles them together at instantiation time.

## Internal Mechanics
1. The container's `build()` method is called when resolving a concrete class name.
2. `build()` uses `ReflectionClass` to retrieve the constructor via `$reflector->getConstructor()`.
3. If no constructor exists, the class is instantiated directly with `new $class(...)`.
4. If a constructor exists, each parameter is inspected via `$constructor->getParameters()`.
5. For each parameter, the container checks:
   - If the parameter type is a class/interface (via `ReflectionParameter::getType()`).
   - If explicit binding exists for that type → resolve the bound concrete.
   - If contextual binding exists via `when($class)->needs($param)->give(...)` → use that.
   - If variadic parameters are detected → resolve all tagged bindings.
   - If a default value exists → use the default (makes the dependency optional).
   - If the parameter is a primitive with no binding → throw `BindingResolutionException`.
6. Dependencies are resolved recursively — if a dependency's constructor itself has dependencies, those are resolved first.
7. Once all arguments are gathered, the class is instantiated via `$reflector->newInstanceArgs($dependencies)`.

## Patterns
- **Primary Constructor Injection:** Declare all required dependencies in the constructor. This is the pattern for services, repositories, controllers, and most classes.
- **Optional Dependency via Default Null:** `public function __construct(?Logger $logger = null)` — container skips resolution if the parameter has a default and no explicit binding exists.
- **Variadic Tagged Injection:** `public function __construct(Reportable ...$handlers)` — the container resolves all bound `Reportable` implementations and injects them as an array.
- **Contextual Injection:** Use `$container->when(PhotoController::class)->needs(Filesystem::class)->give(function () { return Storage::disk('local'); })` within constructor parameters.
- **Deferred Resolution via Closures:** Inject `Closure` or use `\Illuminate\Container\Container::getInstance()->make(...)` inside the constructor body (anti-pattern — avoid when possible).

## Architectural Decisions
- **Why constructors over setter injection:** Constructor injection guarantees that the object is never in an invalid state — all dependencies are present at the moment of creation. Setter injection allows partial construction, leading to temporal coupling.
- **Why type-hints over string names:** Type-hints enable static analysis, IDE tooling, and refactoring tools. String-based resolution (`$container->make('database')`) bypasses the type system and hides dependencies.
- **Why no auto-wiring of primitives:** The container cannot resolve scalar values (strings, ints, arrays) without explicit binding or defaults. This forces the developer to make a conscious decision about configuration values.
- **Why Reflection-based resolution:** Reflection allows the container to resolve dependencies without requiring the developer to register every class explicitly — a tradeoff of runtime introspection for developer convenience.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Explicit dependency declaration | Constructor bloat with many parameters | Can lead to Over-Injection Anti-Pattern |
| Automatic resolution by container | Reflection overhead on first resolution | Slight cold-start penalty (mitigated by cached bindings) |
| Immutable dependencies | Cannot swap at runtime after construction | Must use container instance swapping for testing |
| Static analysis friendly | Requires all dependencies at construction | Circular dependencies cause immediate crashes |
| No manual wiring needed | Debugging resolution failures is indirect | Requires understanding of container chain |

## Performance Considerations
- **Reflection caching:** The container does not cache Reflection data per-request in a default Laravel app. Use `php artisan optimize` or a compiled service provider to cache binding metadata.
- **Deep resolution chains:** A class whose constructor injects A, whose constructor injects B, whose constructor injects C results in three levels of Reflection calls. In practice this is microseconds per level and negligible.
- **Singleton resolution:** If a dependency is bound as a singleton, the Reflection resolution occurs only once. All subsequent requests for the same type return the pre-built instance.
- **Deferred service providers:** Constructor injection into service providers is resolved when the provider is registered; use deferred providers to avoid resolving heavy dependencies early.

## Production Considerations
- **Monitor resolution failures:** `BindingResolutionException` in production logs indicates a missing or misconfigured binding. These should be caught and logged during bootstrap.
- **Avoid constructor side effects:** The constructor should only accept and assign dependencies. Never perform I/O, database queries, or HTTP calls in the constructor of an injected class.
- **Use contextual binding for varying implementations:** When different consumers need different implementations of the same interface, use `when()->needs()->give()` rather than modifying the consumer's constructor.
- **Be mindful of optional dependencies:** A constructor with multiple optional dependencies with defaults may silently bypass the container's resolution, leading to unexpected `null` values.

## Common Mistakes
- **Not type-hinting the interface:** `__construct(Filesystem $fs)` binds to the concrete class; use `__construct(FilesystemContract $fs)` and bind the contract in the container for proper decoupling.
- **Mixing injection with manual instantiation:** `new SomeClass()` inside a class bypasses the container entirely — the returned instance has no injected dependencies.
- **Forgetting to resolve variadic dependencies:** Variadic parameters are only resolved if the type is bound in the container. Loose variadic `...$args` without type-hints are ignored.
- **Circular dependencies:** Class A injects B, B injects A. The container detects this via a recursion depth limit and throws a `CircularDependencyException`.

## Failure Modes
- **BindingResolutionException for unbound primitives:** A constructor expects `int $pageSize` with no default and no binding. Resolution fails with a message indicating an unresolvable primitive parameter.
- **CircularDependencyException:** The container detects an infinite recursion loop when resolving a circular chain. The stack trace shows the resolution path.
- **TargetInterfaceNotInstantiableException:** An interface type-hint exists in the constructor, but no binding maps it to a concrete implementation.
- **ClassNotFoundException:** A type-hinted class does not exist (typo in import or missing dependency). PHP throws this at class load time, not at resolution time.

## Ecosystem Usage
- **Laravel core itself:** The framework uses constructor injection extensively — MailManager, QueueManager, Router, HttpKernel all receive their dependencies via constructor.
- **Laravel Nova:** Nova's resource fields, tools, and cards use constructor injection for accessing request context and configuration.
- **Laravel Horizon:** The supervisor and worker processes inject their dependencies (Redis connection, job repository) via constructors.
- **Laravel Telescope:** Watchers and data collectors use constructor injection to receive the application's service container and configuration.
- **Common packages:** spatie/laravel-medialibrary, barryvdh/laravel-debugbar, and most first-party packages rely on constructor injection for their public API.

## Related Knowledge Units

### Prerequisites
- **Auto-Resolution Strategy** — the underlying mechanism powering automatic constructor resolution
- **Service Container Basics** — how the container manages bindings, singletons, and resolution
- **PHP Reflection API** — ReflectionClass, ReflectionParameter used by the container's `build()` method

### Related Topics
- **Method Injection** — alternative injection path for controller actions and event handlers
- **Interface Binding Resolution** — how interfaces in constructor type-hints are mapped to concretes
- **Testing with the Container** — how to test classes that receive dependencies via constructor

### Advanced Follow-up Topics
- **Over-Injection Anti-Pattern** — when constructor injection is overused and how to refactor
- **Injection Guidelines by Class Type** — which class types should use constructor injection vs alternatives
- **Service Locator Anti-Pattern** — why pulling dependencies from the container undermines constructor injection
- **HTTP Kernel Internals** — how the kernel resolves controllers with constructor dependencies

## Research Notes
- Laravel's `build()` method is defined in `Illuminate\Container\Container::build()` and is the core of constructor resolution. Key lines: ReflectionClass retrieval, parameter iteration, recursive `build()` calls for nested dependencies.
- The `BoundMethod` class is used by `Container::call()` for method injection but is not involved in constructor injection — that path goes directly through `Container::make()` → `build()`.
- Laravel 10 introduced no significant changes to constructor injection mechanics. The implementation has been stable since Laravel 5.x.
- Third-party autowiring containers (PHP-DI, Symfony DI) offer similar functionality but with more sophisticated caching and annotation-based configuration.
