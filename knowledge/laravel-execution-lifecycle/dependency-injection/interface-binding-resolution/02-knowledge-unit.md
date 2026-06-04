# Interface Binding Resolution

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Interface Binding Resolution is the mechanism by which Laravel's service container maps an interface (or abstract class) to a concrete implementation. It is the explicit counterpart to auto-resolution: where auto-resolution handles concrete classes automatically, interface bindings require explicit registration via `$container->bind(Interface::class, Concrete::class)` or `$container->singleton(Interface::class, Concrete::class)`. This pattern enables programming to interfaces, swap-able implementations, and clean separation of concerns. Resolution flows through the same `Container::make()` path as concrete resolution, but with a lookup step that translates the abstract to a concrete before construction.

## Core Concepts
- **Abstract-to-concrete mapping:** A binding tells the container "when Interface X is requested, instantiate Concrete Y (and resolve its own dependencies)".
- **Interface as type-hint:** The consumer type-hints the interface in the constructor; the container detects the interface, looks up its binding, and resolves the concrete.
- **Explicit registration required:** The `bind()` or `singleton()` method must be called, typically in a service provider, before the interface can be resolved.
- **Contextual binding:** `$container->when(Consumer::class)->needs(Interface::class)->give(Concrete::class)` allows different concretes for different consumers.
- **Binding aliases:** An interface can be bound to another abstract, which is itself bound to a concrete, forming a resolution chain.
- **Binding resolution scope:** Bindings can be contextualized to a specific consumer or globally applied.

## Mental Models
- **Contract and Implementer Model:** The interface is a contract; the binding is the registrar that pairs the contract with a specific law firm (implementation). The consumer only knows the contract.
- **Swappable Engine Model:** Think of the interface as an engine mount. Any engine (concrete) that fits the mount can be swapped in. The binding is the bolt that secures this particular engine. To swap, you change the binding, not the vehicle class.
- **Map and Territory Model:** The interface is a place name on a map. The binding is the GPS coordinate. `make()` looks up the coordinate, travels there, and builds whatever it finds.

## Internal Mechanics
1. `Container::make($abstract)` is called with an interface name as `$abstract`.
2. `Container::has($abstract)` checks registered bindings, contextual bindings, and aliases.
3. If no binding exists, the container attempts auto-resolution via `Container::build($abstract)`.
4. `build()` creates `ReflectionClass($abstract)` and immediately fails because `ReflectionClass` on an interface cannot be instantiated — the container catches this via `isInstantiable()` check.
5. If a binding does exist, `Container::resolve($abstract)` is called:
   - `$this->getContextualBinding($abstract)` is checked first (for consumer-specific bindings).
   - `$this->getBinding($abstract)` is consulted:
     - Returns a `Closure` or a concrete class name string.
     - If concrete is a string → `Container::make($concrete)` is called recursively.
     - If concrete is a Closure → it's invoked with the container as argument.
   - `$this->make($concrete)` resolves the concrete class (which may itself have constructor dependencies).
   - If the resolved concrete implements the interface, it's returned. If not, a type mismatch error should be reported (though the container does not strictly validate this).
6. The resolved concrete instance is returned to the original caller, fully constructed with its own dependencies.
7. For `singleton()` bindings, the resolved instance is stored in `$this->instances[]` and returned on subsequent calls without re-resolving.

## Patterns
- **Simple Interface Binding:** `$app->bind(LoggerInterface::class, MonologLogger::class)` — standard mapping.
- **Singleton Interface Binding:** `$app->singleton(CacheInterface::class, RedisCache::class)` — shares one instance across the application.
- **Closure Binding:** `$app->bind(PaymentInterface::class, function ($app) { return new StripePayment($app['config']['stripe.key']); })` — factory-based resolution with custom logic.
- **Contextual Binding:** `$app->when(ReportController::class)->needs(ReportGeneratorInterface::class)->give(PdfReportGenerator::class)` — different implementations per consumer.
- **Binding to Factory:** `$app->bind(ReportInterface::class, ReportFactory::class)` — binds to a factory class that itself is resolved via the container.
- **Alias Binding:** `$app->alias(LoggerInterface::class, 'logger')` — allows resolution by string alias.
- **Tagged Binding:** `$app->tag([CsvReport::class, PdfReport::class], 'reports')` — bind multiple implementations to a tag, then `$app->tagged('reports')` retrieves all.

## Architectural Decisions
- **Why require explicit binding for interfaces:** The container has no way to automatically determine which concrete should implement an interface. Explicit binding forces the developer to make a conscious architectural decision about implementation selection.
- **Why contextual binding exists:** Global interface binding means every consumer gets the same implementation. Contextual binding enables different parts of the application to use different implementations of the same interface without modifying the consumer.
- **Why Closure bindings are supported:** Closures allow complex construction logic (config injection, factory patterns, conditional implementation selection) that cannot be expressed as a simple class name.
- **Why no multi-implementation auto-resolution:** The container cannot know whether an interface should map to one concrete or many. The developer must explicitly choose between `bind()` (single) and `tag()` (multi).

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Swap implementations without changing consumers | Requires manual binding registration | Forgetting to bind causes runtime errors |
| Enables programming to interfaces | One more file to maintain (service provider) | Slightly more code than concrete injection |
| Contextual binding isolates concerns | Contextual binding logic can sprawl | Hard to see all bindings at a glance |
| Closure bindings allow custom construction | Closure bindings are opaque to analysis | IDE cannot trace resolution through closures |
| Singleton bindings optimize performance | Singleton state leaks across requests | Must ensure implementations are stateless |

## Performance Considerations
- **Binding lookup is fast:** The binding map is a plain PHP array (`$this->bindings` or `$this->instances`). Lookup is O(1).
- **Singleton interface bindings:** The concrete is resolved once. All subsequent `make(Interface::class)` calls return the same instance. This is the most performant pattern for stateless services.
- **Closure binding overhead:** Closure-based bindings execute the closure on every resolution (unless bound as singleton). Ensure closures are lightweight or use singleton for shared services.
- **Contextual binding lookup:** Contextual bindings are stored in a nested array (`$this->contextual`). Lookup is O(n) on the number of contextual bindings — negligible for <100 entries, measurable for thousands.
- **Large binding sets:** An application with 1000+ interface bindings has negligible overhead during resolution but increased memory usage for the binding array. Use deferral and service provider caching for large binding sets.

## Production Considerations
- **Always bind interfaces in service providers:** Never call `$app->bind()` outside of a service provider. Sporadic bindings in application code are hard to track and violate separation of concerns.
- **Use `php artisan make:provider` and register in `config/app.php`:** Ensure all binding providers are registered in the `providers` array. Unregistered providers mean missing bindings.
- **Validate bindings at boot:** If a binding is critical, resolve it in the `boot()` method of a service provider to fail fast. Catching a missing binding at boot is better than at request time.
- **Be careful with singleton state:** A singleton bound to an interface stores one instance per application lifecycle. In a long-running process (Octane, Swoole), that instance persists across requests. Ensure no request-scoped state is stored.
- **Use `when()->needs()->give()` sparingly:** Contextual bindings are powerful but opaque. Document them clearly or use dedicated service providers per context.

## Common Mistakes
- **Binding interface to a non-instantiable class:** `$app->bind(LoggerInterface::class, AbstractLogger::class)` — abstract classes cannot be instantiated. The error surfaces only at resolution time.
- **Forgetting to bind:** Type-hinting `PaymentInterface` without a binding → `TargetInterfaceNotInstantiableException` at runtime.
- **Binding singleton with mutable state:** `$app->singleton(CounterInterface::class, MutableCounter::class)` — the singleton is shared across requests; state leaks.
- **Binding in route file:** Registering bindings in `routes/web.php` means they run on every request and are difficult to test in isolation.
- **Binding to a class with unresolvable dependencies:** `$app->bind(Interface::class, FragileDependency::class)` where `FragileDependency` has its own unresolvable parameters. The error chain is confusing.

## Failure Modes
- **TargetInterfaceNotInstantiableException:** Interface requested with no binding. The most common DI error in Laravel. Stack trace shows `Container::build()` attempting to instantiate the interface.
- **BindingResolutionException from concrete:** The interface binding exists, but the concrete class's own constructor triggers a resolution failure. The error message mentions the concrete class, not the interface.
- **LogicException (Binding Doesn't Implement Interface):** The container does not natively validate that a bound concrete implements the bound interface. A type error occurs at the call site when the consumer receives an incompatible type.
- **Contextual binding conflict:** Two contextual bindings match the same consumer-interface pair. The last registered binding wins, which may be non-deterministic depending on provider order.

## Ecosystem Usage
- **Laravel core:** `Illuminate\Contracts\Cache\Repository` → `cache` alias; `Illuminate\Contracts\Mail\Mailer` → `mailer` alias. Core contracts are bound in `Illuminate\Foundation\Application` or core service providers.
- **Laravel Horizon:** Horizon binds `HorizonContract` interfaces to its own implementations, allowing third-party packages to swap Horizon storage backends.
- **Laravel Telescope:** Telescope binds its data repository interface to allow custom storage backends (e.g., using MySQL instead of the default SQLite).
- **spatie/laravel-medialibrary:** Binds `MediaRepository` interfaces to allow custom media storage implementations.
- **Common patterns:** Repositories are typically bound via `$app->bind(UserRepositoryInterface::class, EloquentUserRepository::class)`, though this pattern is debated in the Laravel community.

## Related Knowledge Units

### Prerequisites
- **Auto-Resolution Strategy** — the fallback when no interface binding exists
- **Constructor Injection** — where interface type-hints are resolved via this mechanism
- **Service Container Binding API** — `bind()`, `singleton()`, `when()->needs()->give()`

### Related Topics
- **Testing with the Container** — using `instance()` and `swap()` to replace interface bindings in tests
- **Facade Architecture** — facades leverage interface bindings for their underlying resolution
- **Injection Guidelines by Class Type** — which class types should depend on interfaces vs concretes

### Advanced Follow-up Topics
- **Service Locator Anti-Pattern** — interface binding resolution is the proper alternative to service locator
- **Over-Injection Anti-Pattern** — how interface abstraction can mask excessive dependency counts
- **Legacy Kernel Migration** — migrating interface bindings from service providers to ApplicationBuilder

## Research Notes
- `Container::resolve()` is the method that processes bindings. It is defined at `Illuminate\Container\Container::resolve()` and handles the binding lookup, contextual binding, Closure invocation, and concrete resolution.
- The `isInstantiable()` check on `ReflectionClass` is what produces `TargetInterfaceNotInstantiableException`. This check happens inside `Container::build()` before any constructor inspection.
- Laravel's `Contracts` directory at `Illuminate/Contracts/` defines all framework interfaces. The application skeleton ships with `app/Providers/AppServiceProvider.php` as the canonical location for custom interface bindings.
- There is an open debate in the Laravel community about whether repository interfaces and their bindings are necessary for most applications. The "interface early" approach is common in enterprise codebases but is often over-engineering for CRUD applications.
