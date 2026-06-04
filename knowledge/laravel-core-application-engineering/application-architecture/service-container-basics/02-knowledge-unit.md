# Laravel Service Container Basics

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Laravel Service Container Basics
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

The Laravel service container (`Illuminate\Container\Container`) is the dependency injection container that powers the framework's entire object resolution system. It provides automatic constructor injection via PHP Reflection, manual binding for interfaces and abstract classes, singleton management, contextual resolution, and call-time method injection. Every Laravel application uses the container — whether explicitly through `$app->make()` and `$app->bind()`, or implicitly through controller constructors, queued job handlers, command handlers, and event listeners.

The container's architectural significance extends beyond simple DI: it is the brain of the framework. Service providers register into it. Facades proxy through it. Controllers are resolved by it. Middleware is instantiated through it. Understanding how the container resolves dependencies — and the mental model shifts required between zero-config auto-resolution and explicit binding — is the single most important skill for advanced Laravel development.

The container supports four resolution strategies, attempted in order: contextual binding override, explicit binding, interface-to-class binding, and auto-resolution via reflection. Understanding this priority chain explains why bindings are "overridable" and why explicit bindings always take precedence over auto-resolution.

---

## Core Concepts

### Binding
Binding is the act of telling the container how to resolve a class or interface. The three primary methods are:
- **`bind()`** — Creates a new instance every time. Closure or class name.
- **`singleton()`** — Same instance returned on every resolution.
- **`instance()`** — Directly injects an existing object as a singleton.
- **`scoped()`** — Same instance within a given scope/lifecycle (Laravel 11+).

Bindings are stored in the container's `$bindings` array, keyed by abstract name (typically an interface or class name). Each binding stores a concrete (class name, closure, or builder callback) and a `shared` boolean flagging singletons.

### Resolution
Resolution is the act of retrieving a concrete instance from the container:
- **`make($abstract)`** — Resolve a class/interface, with optional parameters.
- **`get($abstract)`** — Resolve, throws exception if not resolvable (strict).
- **`build($concrete)`** — Core resolution engine; used internally by `make()`, also usable standalone.
- **`call($callable, $parameters)`** — Invoke a callable with method injection.
- **`resolve()`** — Internal method that orchestrates the resolution process.

Resolution always returns a fresh instance unless `singleton()` or `instance()` was used.

### Auto-Resolution
If no explicit binding exists for a class, the container attempts to construct it via reflection:
1. Inspect the class constructor via `ReflectionClass::getConstructor()`
2. If no constructor, instantiate with `new $concrete` (trivial)
3. If constructor exists, inspect parameters via `ReflectionMethod::getParameters()`
4. For each parameter, determine type hint
5. If the parameter is a class/interface, recursively resolve it
6. If the parameter has a default value, use it
7. If neither, throw `BindingResolutionException`

This recursive resolution can span an arbitrary depth — the container will resolve the entire dependency graph as long as every class is concretely resolvable.

### Contextual Binding
Contextual binding (`when()->needs()->give()`) allows different concrete implementations of the same abstract type depending on which class is consuming it. This is the container's solution to the "constructor ambiguity" problem — when class A needs `PaymentGatewayInterface` implementation X, and class B needs implementation Y.

### Tagged Bindings
`tag(['service1', 'service2'], 'tag-name')` groups multiple bindings under a single tag. `tagged('tag-name')` resolves all tagged bindings as an array. Used by the framework for collecting middleware, routes, commands, and other registrable collections.

---

## Mental Models

### Blueprints vs Buildings
A `bind()` call is a blueprint — instructions for construction, not the building itself. Every `make()` call follows the blueprint to construct a new building. A `singleton()` call stores the first building and hands out copies of it. An `instance()` call places a prefabricated building directly into the container. This distinction clarifies when code runs: closure bindings run at resolution time, not registration time.

### Hotel Concierge
The container is a hotel concierge. You tell them what you need (abstract interface), and they figure out how to get it (resolution). Sometimes you give specific instructions ("when ordering room service, always use the main kitchen" = contextual binding). Sometimes you say "give me whatever is standard" (auto-resolution). The concierge handles the logistics so you don't have to know where things come from.

### Dependency Graph as a Tree
Every `make()` call initiates a tree traversal. `$app->make(OrderController::class)` starts at the root. The container inspects `OrderController`'s constructor, finds `OrderService`, resolves it, which requires `OrderRepository` and `PaymentGateway`, which each require `DatabaseConnection` and `HttpClient`, and so on. The container depth-first traverses this tree, constructing leaf nodes first and working back up. This tree view helps debug deep resolution chains and understand where circular dependencies form.

### Service Locator vs Container
The container is a service locator (you ask for things by name) but also a DI container (it automatically wires constructors). The distinction matters because pure DI pushes dependencies in from above (inversion of control), while service location pulls dependencies from a central registry. Laravel's container does both: `make()` is service location when used explicitly, but controller instantiation is DI when the framework calls `make()` on your behalf. The service location usage is the controversial pattern — explicit `app()->make()` in application code creates hidden dependencies that testing cannot mock without container awareness.

---

## Internal Mechanics

### Container Data Structures

The container maintains several internal arrays:
- **`$bindings`** — Array of `Binding` objects (abstract => concrete + shared flag)
- **`$instances`** — Resolved singleton instances (abstract => instance)
- **`$resolved`** — Tracking flags for rebound callbacks
- **`$contextual`** — Nested array: `[consumer => [abstract => concrete]]`
- **`$tags`** — Tag to binding mapping
- **`$reboundCallbacks`** — Callbacks for `rebinding()` listeners
- **`$buildStack`** — Currently-resolving classes (used for circular detection)
- **`$with`** — Temporary constructor parameter overrides

### build() — The Core Resolution Engine

`Container::build($concrete)` is the reflection-based resolver:

1. **Class existence check:** If concrete is a closure, invoke it and return. Otherwise, verify class exists via `class_exists()`.
2. **Constructor inspection:** `$reflector = new ReflectionClass($concrete)`. If `!$reflector->isInstantiable()`, throw `BindingResolutionException` (can't instantiate interface/abstract).
3. **Constructor parameters:** `$constructor = $reflector->getConstructor()`. If null, return `new $concrete`.
4. **Parameter parsing:** For each constructor parameter:
   - If the parameter has a non-class type hint (string, int, array), check if a contextual binding override exists for this parameter name. If not, use the default value. If no default value, throw `BindingResolutionException`.
   - If the parameter has a class type hint, resolve it recursively via `make()`
   - If the parameter is a variadic argument, resolve all tagged bindings
5. **Instance creation:** `$reflector->newInstanceArgs($dependencies)` — construct with resolved dependencies
6. **Build stack maintenance:** Push/pop the class name to/from `$buildStack` for circular detection

### make() Resolution Flow

`Container::make($abstract)`:

1. **Already resolved singleton check:** If `$abstract` exists in `$instances`, return it immediately (O(1) lookup).
2. **Contextual binding check:** Inspect `$contextual[consumer][abstract]`. If found, resolve via the contextual concrete.
3. **Explicit binding check:** If `$abstract` exists in `$bindings`:
   - If binding is a closure, invoke with `$this->app` as parameter
   - If binding is a class name, call `build()` with it
   - Automatically marked as resolved unless it's a contextual re-resolution
4. **Interface-to-class binding check:** Try `$this->getAlias($abstract)`. If an alias exists, `make()` the aliased class.
5. **Auto-resolution:** Call `build($abstract)` directly. This works for concrete class names but fails for interfaces without bindings.

If all steps fail, `BindingResolutionException` is thrown.

### call() — Method Injection

`Container::call($callable, $parameters = [])` enables method injection:

1. Inspect the callable's type
2. If it's a class+method string (e.g., `SomeClass@method`), resolve the class first
3. Use `ReflectionFunctionAbstract` (via `ReflectionMethod` or `ReflectionFunction`) to inspect parameters
4. For each parameter:
   - If the parameter name exists in `$parameters` array, use the provided value
   - If the parameter has a class type hint, resolve from container
   - Otherwise, use default value or throw
5. Call the function with resolved parameters

`call()` is used by queue job dispatching, event listener invocation, middleware resolution, and `Controller::callAction()`.

### Circular Dependency Detection

The container maintains a `$buildStack` array tracking classes currently in resolution. Before resolving a new class, the container checks if the class is already in the build stack. If so, a circular dependency is detected. The container tracks a max depth (default 25) and throws `LogicException` with "Circular dependency detected" message when exceeded. This prevents infinite recursion.

The limit is a safety net, not a design feature. If you hit it, your dependency graph has a cycle that must be broken — typically by restructuring one class to use the container as a service locator (calling `app()->make()` at runtime rather than constructor injection) or by extracting an interface.

---

## Patterns

### Constructor Injection
The primary mode of dependency acquisition throughout Laravel. Dependencies are declared in the constructor and are autowired by the container. This is the explicit dependency pattern — the class declares what it needs, and the container provides it.

Pattern constraints:
- All constructor dependencies are mandatory (unless typed with a nullable class or default value)
- Constructor injection couples the class to container-driven instantiation
- Unit tests must either resolve via container or manually construct with mock dependencies

### Method Injection
Parameters typed as classes on controller methods, event listener methods, and job `handle()` methods are resolved from the container at call time. This is distinct from constructor injection — the dependency is specific to the operation, not the class.

Examples in the framework:
- Controller action methods receive typed request classes
- Job `handle()` methods can receive other services
- Event listener `handle()` methods receive the event instance as the first parameter

### Setter Injection (via after-resolving callbacks)
The container supports `resolving()` callbacks that fire after a binding is resolved. These are used for "setter injection" — calling setter methods or applying configuration to resolved instances. The framework internally uses this for:
- Applying middleware configuration
- Setting database connection properties
- Configuring mailer instances

After-resolving callbacks are registered via `$app->afterResolving()` and are indexed by abstract name or universal (all resolutions).

### Factory Pattern via Closure Bindings
Closure bindings are the most flexible container pattern. A closure binding receives the container as its parameter and can perform arbitrary construction logic:

```
$app->bind(PaymentGateway::class, function ($app) {
    return new PaymentGateway(
        $app['config']['services.stripe.secret'],
        $app->make(HttpClient::class)
    );
});
```

This is preferred over auto-resolution when construction requires configuration values, conditional logic, or complex initialization.

---

## Architectural Decisions

### Why Zero-Config Resolution Exists
Laravel chooses zero-config (reflection-based) resolution over explicit registration because PHP's per-request execution model makes reflection affordable — the reflection cost is paid once per request, not once per application lifetime. In compiled languages (Java, C#), reflection-based DI would be prohibitively expensive. In PHP, the cost is acceptable because the entire application lifecycle is one request. This tradeoff is the foundational decision that makes Laravel's container feel "magical" — classes just work without registration.

### Why Explicit Bindings Override Reflection
Explicit bindings override auto-resolution because explicit intent is more reliable than convention. When you `$app->bind(Interface::class, Concrete::class)`, you are stating a design decision. Reflection can hint at dependencies but cannot make design decisions. This ordering (explicit > reflection) ensures that convention never overrides configuration.

### Why contextual Binding Is Nested, Not Fluent
The `when()->needs()->give()` API is nested because contextual bindings form a matrix (consumer × abstract → concrete). A flat API would require consumer-abstract-concrete as a triple, which forces consumer knowledge into the binding location. The nested API reads as "when resolving for X, needs Y, give Z" which mirrors how developers reason about contextual requirements.

### No Service Collection by Default
Unlike Java Spring (which scans the classpath), the container requires explicit registration for interfaces and abstract classes. This is deliberate: auto-scanning would make resolution unpredictable and slow. Concrete classes work without registration only because their constructors resolve deterministically. Interface bindings must always be explicit.

---

## Tradeoffs

### Auto-Resolution vs Explicit Binding
Auto-resolution is zero-ceremony but silent — changes to constructor dependencies are automatically reflected in resolution without explicit registration. This is fast for development but can cause unexpected behavior when a class changes in ways the developer didn't anticipate. Explicit binding makes dependencies visible but requires maintenance. One community rule of thumb: if a class depends on interfaces (polymorphism), bind explicitly. If a class depends on concrete classes, auto-resolution is acceptable.

### Closure Bindings vs Class Bindings
Closure bindings run arbitrary code at resolution time, making them powerful but opaque — the construction logic is invisible to static analysis. Class name bindings (e.g., `$app->bind(Interface::class, Concrete::class)`) are analyzable and can be auto-resolved internally. The tradeoff is expressiveness vs transparency.

### Container as Service Locator vs DI Container
Using `app()->make()` inside application code (service locator pattern) creates implicit dependencies that are invisible in the class signature. This makes testing harder (mocks must be bound before the class resolves) and violates the explicit dependency principle. However, it avoids constructor pollution for optional dependencies and simplifies conditional resolution. The tradeoff is testability vs convenience. The community consensus: constructor injection for mandatory dependencies, `resolve()` helper via container for truly optional ones.

### Performance vs Convenience
Reflection-based resolution is approximately 2-4x slower than direct instantiation for simple classes and 5-10x slower for deep dependency graphs. For a typical controller with 3-4 dependency levels, this adds 1-3ms. For batch operations resolving 1000+ objects, this becomes significant. The container's `call()` method adds additional reflection overhead. Applications processing large collections should prefer direct instantiation (new keyword) for hot paths.

---

## Performance Considerations

### Reflection Cost
PHP's Reflection API is inherently slower than direct instantiation because it requires class introspection, method enumeration, and parameter analysis. `Container::build()` calls:
- `ReflectionClass::__construct()` — class parsing
- `ReflectionClass::getConstructor()` — method lookup
- `ReflectionMethod::getParameters()` — parameter analysis
- `ReflectionParameter::getType()` — type resolution (N times for N parameters)

For a class with 5 dependencies, each requiring its own resolution, this is approximately 20 reflection calls. The cost is proportional to dependency graph depth, not binding count.

### Singleton Storage
`$instances` array lookup is O(1). Once a singleton is resolved, subsequent `make()` calls return instantly. This is why singletons are preferred for services that are expensive to construct or are used on every request.

### Resolution Caching
The container does not cache resolved instances (except singletons). Each `make()` call for a non-singleton repeats the full resolution chain. For hot-path objects (e.g., resolved inside a loop), this creates measurable overhead. The solution: retrieve the object once from the container and reuse the instance locally.

### Binding Closure Optimization
Closure bindings are more efficient than class-name bindings for complex construction because they avoid the reflection cost of `build()`. The closure is invoked directly with the container — no reflection needed. However, the closure itself is opaque for analysis. A class-name binding triggers `build()`, which then recursively resolves dependencies. For simple construction (new with known dependencies), class-name binding is faster because the container's resolution chain is already optimized.

---

## Production Considerations

### Binding Registration Order
The order of binding registration does not affect resolution priority — explicit bindings always override auto-resolution regardless of when they were registered. However, if two explicit bindings register for the same abstract, the second overwrites the first. This is relevant when packages register bindings in their service providers and the application wants to override them — the application's provider must load after the package's provider.

### Testing with Container Mocks
In tests, `$this->instance(Abstract::class, $mock)` replaces the binding with a mock without affecting the original binding. The container's `instance()` method stores the mock in `$instances`, which takes highest priority in the resolution flow. After the test, `$app->forgetInstance(Abstract::class)` clears the mock.

### Contextual Binding for Multi-Tenancy
Contextual binding is the primary mechanism for multi-tenant dependency variation. For example, when a controller needs a tenant-specific database connection, contextual binding maps the controller to the correct connection without changing the controller's code. This keeps tenant awareness at the container level rather than bleeding into application logic.

### Container Serialization
The container is not serializable — $bindings may contain closures that cannot be serialized. This is relevant for queue jobs that serialize the entire application state. Jobs should never reference the container directly in serialized state. Instead, dependencies should be resolved before job construction and stored as plain properties.

---

## Common Mistakes

### Expecting make() to Return Fresh Instance for Singletons
Developers often call `make()` expecting a fresh instance, unaware of a singleton binding registered by a package. The fix: explicitly check for singleton bindings in service providers, or use `$app->forgetInstance($abstract)` to clear the cached singleton before resolution.

### Constructor Injection in Classes Created with new
The container only auto-injects dependencies for classes it creates. If a class is instantiated with `new SomeClass()` inside application code, its constructor dependencies are not automatically resolved. The class must either use `app()->make()` or receive fully-resolved dependencies from the caller. This pattern mistake is most common in factories and constructors of value objects.

### Binding to Concrete Class That Doesn't Exist
`$app->bind(Abstract::class, Concrete::class)` where `Concrete` doesn't exist or has unresolvable dependencies throws `BindingResolutionException` at resolution time, not registration time. The error is deferred until the binding is resolved, making it harder to trace. Service providers should validate critical bindings during boot if possible.

### Overriding Core Framework Bindings
Binding to a core Laravel interface (e.g., `Illuminate\Contracts\Cache\Repository`) without understanding the original implementation's dependencies can break framework internals. The replaced binding must satisfy all contracts and expected interface methods that the framework calls internally.

### Circular Dependency Through Constructor
Class A depends on class B through constructor injection, and class B depends on class A through constructor injection. The container detects this via the build stack and throws. The fix: break the cycle by converting one dependency to method injection (via `call()`) or to runtime resolution via service locator.

---

## Failure Modes

### BindingResolutionException: Target [Interface] is not instantiable
This is the most common container failure. It occurs when `make()` attempts to resolve an interface or abstract class without an explicit binding. The error message shows the interface name. Fix: register a binding from the interface to a concrete class.

### BindingResolutionException: Unresolvable dependency resolving [Parameter] in class [Class]
Occurs when a constructor parameter has a type hint that the container cannot resolve and no default value. This typically indicates a missing dependency or a type hint for a class that hasn't been required/imported.

### Circular Dependency Loop
Occurs when the resolution graph contains a cycle. Error message: "Circular dependency detected while building [ClassA]". The build stack in the error includes the chain of classes being resolved, showing the cycle path. Fix: break the cycle by restructuring dependencies.

### Maximum Resolution Depth Exceeded
Occurs when the dependency graph exceeds the maximum depth (25). This typically indicates either a genuine circular dependency or an extremely deep object graph that should be flattened. The error is a safety mechanism to prevent infinite recursion.

---

## Ecosystem Usage

### Framework Resolution
Almost every Laravel feature resolves through the container:
- Controllers are resolved by `class_exists()` + `make()` in the Router
- Middleware is resolved by the Pipeline via `make()`
- Event listeners are resolved by `call()` during dispatch
- Queue jobs are resolved via `make()` in the worker
- Commands are resolved by `call()` in the Artisan Kernel
- Mailables, notifications, and notifications channels are resolved via `make()`

### Package Registration
Packages use the container as their primary integration point. A package's service provider binds interfaces to implementations, registers singletons, and configures contextual bindings. The container's `resolving()` callbacks allow packages to configure their services after resolution without requiring explicit setup.

### Spatie Packages
Spatie's ecosystem heavily uses the container for configuration and extensibility:
- `spatie/laravel-data` uses the container to resolve custom casts and rules
- `spatie/laravel-permission` binds its `PermissionRegistrar` as a singleton
- `spatie/laravel-query-builder` resolves allowed filters and sorts through the container

### Laravel Debugbar
The Debugbar hooks into the container via `resolving()` callbacks to track dependency resolution, providing visibility into which services are resolved and their resolution time. This is the primary tool for diagnosing container performance issues.

---

## Related Knowledge Units

- **Service Provider Strategies** — Providers are how bindings are registered; understanding the container is prerequisite to understanding providers
- **Bootstrapping Lifecycle** — The container is instantiated during `bootstrap/app.php` and populated during `RegisterProviders` and `BootProviders`
- **Service Layer Pattern** — Services are the primary consumers of container injection
- **Configuration Management** — Config values are resolved from the container via `$app['config']`
- **Directory Conventions** — PSR-4 autoloading ensures classes can be auto-resolved by the container

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container` (~900 lines) — the complete implementation
- Key methods: `build()`, `make()`, `resolve()`, `bind()`, `singleton()`, `call()`
- Internal arrays: `$bindings`, `$instances`, `$contextual`, `$resolved`, `$buildStack`

### Key Insight
The container's contextual binding system (`when()->needs()->give()`) is the most underused feature in production Laravel applications. It solves the "multiple implementations of the same interface" problem without requiring service locators or factories. Most developers encounter the problem and reach for a factory class before considering contextual binding.

### Version-Specific Notes
- `scoped()` bindings were added in Laravel 11, enabling lifecycle-scoped singletons
- Prior to Laravel 11, all singletons were application-scoped (same instance across all requests in Octane)
- The `rebound()` callback feature exists but is rarely used in application code — primarily used by the framework itself for cache invalidation
- `Container::call()` behavior is consistent across all supported versions, though parameter resolution has edge case differences with union types in PHP 8+
