# Service Locator Anti-Pattern

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
The Service Locator Anti-Pattern refers to the practice of pulling dependencies directly from the service container within business logic — using `app()`, `resolve()`, `App::make()`, or the `Facade` base class — rather than receiving them via constructor or method injection. While service locators provide a quick way to access container services from anywhere in the codebase, they create hidden dependencies, impede testability, and erode the architectural clarity that explicit injection provides. The pattern is considered acceptable in a narrow set of scenarios: framework bootstrap code, facades (by design), and deferred/lazy resolution where constructor injection is structurally impossible.

## Core Concepts
- **Service Locator:** A design pattern where a client asks a centralized registry (the container) for a dependency rather than receiving it passively.
- **Hidden Dependencies:** A method that calls `app(Logger::class)` has an invisible dependency on `Logger` — it is not declared in the method signature and cannot be inferred from the public API.
- **Temporal Coupling:** The class must be resolved in a context where the container is available. If called outside the Laravel application (e.g., in a standalone script or test without bootstrapped container), `app()` throws a runtime error.
- **Container Awareness:** A class that calls `app()` becomes implicitly coupled to the Laravel application instance, violating the Dependency Inversion Principle.
- **Testability Impedance:** Tests must bootstrap the container to provide fake dependencies, rather than simply passing a mock constructor parameter.

## Mental Models
- **Grab-Bag Model:** Constructor injection is like presenting a shopping list to a cashier. Service locator is like reaching behind the counter and grabbing items yourself — you get what you want, but you're now coupled to the store layout.
- **Extension Cord Model:** `app()` is an extension cord that lets you plug in anywhere without reaching the wall outlet. It's convenient, but every device plugged into the extension cord stops working if the cord is unplugged.
- **Trap Door Model:** The class looks innocent from the outside — a clean constructor. But internally, a trap door (`app()`) opens to pull in hidden dependencies. The public API lies about what the class needs.

## Internal Mechanics
1. `app()` resolves to `Container::getInstance()` and calls `make()`.
2. `resolve()` is a global helper that calls `app()`.
3. `App::make()` is a Facade call that resolves `'app'` from the container and calls `make()`.
4. `Facade::__callStatic()` uses `Facade::getFacadeRoot()` which calls `container()->make($facadeAccessor)`.
5. Every invocation goes through the full resolution pipeline: binding lookup, Reflection, recursion.
6. The resolved instance is used immediately and then discarded (unless the underlying binding is a singleton).
7. Multiple calls to `app(SomeClass::class)` in the same class create multiple instances if not bound as singleton.

## Patterns
- **Global helper abuse:** `$logger = app(Logger::class); $logger->info('...');` scattered throughout business logic.
- **Constructor-based service locator:** A class that accepts the container via constructor injection (`__construct(Container $container)`) and then pulls dependencies from it during methods. This is a disguised service locator — the container itself is the dependency, not the actual services.
- **Facade-as-service-locator:** Calling `Cache::get()`, `Redis::get()`, etc. within domain classes. While facades appear clean, they are service locators under the static proxy pattern.
- **Lazy resolution helper:** `private function logger(): Logger { return app(Logger::class); }` — a private helper that wraps `app()` to reduce verbosity. Still a service locator.
- **Conditional resolution:** `app()->has(PaymentInterface::class) ? app(PaymentInterface::class) : new NullPayment()` — conditional locator usage that makes dependencies non-obvious.

## Architectural Decisions
- **Why the container doesn't prevent it:** Laravel's architecture deliberately provides global container access for convenience during bootstrapping and for legacy code migration. The framework trusts developers to use it responsibly.
- **Why facades are "acceptable" service locators:** Facades offer testability through facade fakes, partial mitigation of the locator harm. They also provide static analysis support and IDE autocompletion.
- **Why `resolve()` exists as a helper:** It mirrors `app()` but is semantically distinct — `resolve()` is documented as "resolve from the container" while `app()` is "get the application instance, then resolve." Both are the same implementation.
- **Why service locator is not banned outright:** In certain scenarios (event listeners with conditional dependence on optional services, deferred resolution in legacy codebases), the locator is the pragmatic choice. Prohibition would create more problems than it solves.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Quick access from anywhere in code | Hidden dependencies not visible in API | New developers cannot tell what a class needs |
| No constructor signature changes needed | Testability requires full container bootstrap | Unit tests become integration tests |
| Simple for prototyping and one-off usage | Coupling to Laravel's application instance | Breaks in non-Laravel contexts (e.g., background scripts, Lumen routes) |
| Useful for deferred/lazy resolution | Runtime errors for missing deps only surface at usage site | No compile-time or static analysis safety net |
| Reduces verbosity in short scripts | Encourages dependency scattering across classes | `app()` calls appear in controllers, models, helpers, views |

## Performance Considerations
- **Repeated resolution overhead:** Each `app(SomeClass::class)` call in a loop resolves a new instance unless bound as singleton. This can be a performance sink in hot paths.
- **No reuse of resolved instances:** Unlike constructor injection (where the same instance is reused for the object's lifetime), `app()` may return different instances on each call if not a singleton, leading to excess memory allocation.
- **Facade resolution is cached per-facade:** Facade root is resolved once per class per request and cached in `$resolvedInstance`, so facade-based service locators are more performant than raw `app()` calls.
- **Container singleton by default:** `app()` calls the container instance which itself is a singleton. The resolution cost of `app()` itself is negligible—the cost is in the dependency being resolved.

## Production Considerations
- **Audit codebase for `app()` and `resolve()` in business logic:** Use PHP_CodeSniffer or custom lint rules to flag service locator usage in domain classes, repositories, and services.
- **Prefer constructor injection in all new code:** Establish team conventions that `app()` is only allowed in service providers, route files (closures), and legacy adapter layers.
- **Set up CI linting to reject PRs with service locator in `app/` directory:** Enforce the rule with automated checks.
- **Service locator in Blade templates:** `@inject('service', 'App\Services\SomeService')` is a Blade directive that uses the container. Use it sparingly — prefer passing data from the controller.

## Common Mistakes
- **Using `app()` in domain events:** `app(Dispatcher::class)->dispatch(...)` inside an event class. The event should be pure data and injected where needed.
- **Using `resolve()` in Eloquent models:** Accessing services inside model accessors, mutators, or events ties the model to the container and breaks serialization.
- **`App::make()` in console commands:** Console commands support constructor injection. Use it instead of `App::make()` or `resolve()` in the `handle()` method.
- **Accepting Container as constructor dependency:** A class that takes `Container $container` and calls `$container->make(...)` in methods is a service locator disguised as proper injection. Accept only the specific dependencies needed.
- **Service locator inside a service class:** A `UserService` class that calls `app(Logger::class)` internally. The logger should be injected in the constructor.

## Failure Modes
- **RuntimeException: "No container instance available":** `app()` is called outside of the Laravel application lifecycle (e.g., in a standalone PHP script, a unit test without set-up, or before the container is bootstrapped).
- **BindingResolutionException at unexpected location:** A class that internally calls `app(UnboundInterface::class)` fails at the point of the `app()` call, not at the class instantiation point, making the error location misleading.
- **Singleton state contamination:** A service locator that resolves the same singleton across multiple consumers may return a stale or mutated instance, leading to hard-to-trace state bugs.
- **Test isolation failure:** When testing a class that uses `app()`, mock replacement requires calling `$container->instance(Class::class, $mock)`, which modifies the shared container and can leak state between tests.

## Ecosystem Usage
- **Laravel core:** The framework itself uses `app()` extensively in its own bootstrap and routing code. For example, `Router` uses `app()` to resolve controller instances. This is acceptable because framework code owns the container.
- **Laravel Debugbar:** The Debugbar uses `app()` and facades to instrument various parts of the application, attaching listeners and collectors to container-resolved services.
- **Laravel Nova:** Nova's internal code uses container access in its action resolution and field hydration pipelines. This is framework-internal usage.
- **Legacy Laravel applications:** Applications written before Laravel 5.5 (when auto-injection became more prominent) often contain extensive `app()` usage. Modernization involves migrating to constructor injection.
- **Third-party packages that provide facades:** Packages that ship facades (e.g., `Spatie\Permission\Facades\Permission`) are by definition service locators, but are acceptable because their facade layer is thin and testable via `Facade::shouldReceive()`.

## Related Knowledge Units

### Prerequisites
- **Constructor Injection** — the preferred alternative to service locator
- **Method Injection** — context-specific alternative to service locator for individual methods
- **Facade Architecture** — facades as intentional, testable service locators

### Related Topics
- **Testing with the Container** — how test isolation is affected by service locator usage
- **Over-Injection Anti-Pattern** — distinguishing service locator abuse from genuine over-injection
- **Injection Guidelines by Class Type** — rules for which classes should inject and which should not

### Advanced Follow-up Topics
- **Interface Binding Resolution** — how proper binding replaces service locator calls
- **HTTP Kernel Internals** — where framework-level container access is acceptable
- **Legacy Kernel Migration** — refactoring service locator patterns during upgrades

## Research Notes
- The term "Service Locator Anti-Pattern" was popularized by Mark Seemann in "Dependency Injection in .NET" (2011), who categorized it alongside the "Control Freak" anti-pattern. The Laravel community has adopted this terminology, though some argue that Laravel's service locator is a "compensating" pattern rather than a pure anti-pattern.
- `app()` is defined in `Illuminate\Foundation\helpers.php`. It calls `Container::getInstance()->make($abstract)` with an optional `$parameters` parameter.
- `resolve()` is defined in `Illuminate\Foundation\helpers.php` (v6+) and is identical to `app()` in behavior, differing only in name. Its existence is primarily semantic — it signals that the developer intends to resolve a dependency, not get the application.
- In Laravel 11, the `@inject` Blade directive still uses the container internally. Consider using `View::composer` with constructor injection as an alternative for complex view data injection.
- Community tools like `laravel-ide-helper` and `barryvdh/laravel-debugbar` can help identify service locator usage patterns in existing codebases.
