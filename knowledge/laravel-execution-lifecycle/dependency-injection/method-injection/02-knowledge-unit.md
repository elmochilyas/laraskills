# Method Injection

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Method Injection is a dependency injection pattern where dependencies are resolved and injected at the method-call level rather than at construction time. In Laravel, this is implemented via the `Container::call()` method and the `Illuminate\Container\BoundMethod` class, which resolve type-hinted parameters on any callable — including controller actions, event handler methods, service provider `boot()` methods, and arbitrary closures. Method injection complements constructor injection by allowing fine-grained dependency provision only in the methods that need them, without polluting the constructor with dependencies used only in a single action.

## Core Concepts
- **Call-site resolution:** Dependencies are resolved at the moment the method is invoked, not when the class is instantiated.
- **Container::call():** The primary entry point; accepts any callable and resolves its type-hinted parameters.
- **BoundMethod class:** `Illuminate\Container\BoundMethod` contains the core logic for resolving method parameters, handling both class-method arrays and closures.
- **Parameter reflection:** Each parameter is inspected via Reflection; class-typed parameters are resolved from the container; scalar parameters are left as-is or provided from a user-supplied array.
- **Explicit parameter overrides:** Users can pass an associative array of parameter values that take precedence over container resolution, enabling mixed injection (container-resolved + user-provided parameters).

## Mental Models
- **Demand-Driven Analogy:** Constructor injection is like stocking your kitchen with everything you might need. Method injection is like ordering groceries only when a specific recipe calls for them.
- **Argument Enrichment Model:** Think of `Container::call()` as a middleware that intercepts the call, enriches it with resolved dependencies, and then forwards it to the target method with a complete argument list.
- **Just-In-Time DI:** Dependencies are not materialized until the method is actually dispatched, reducing the memory footprint of objects that may not need all dependencies at construction.

## Internal Mechanics
1. `Container::call($callable, $parameters = [])` receives a callable and optional parameter overrides.
2. If the callable is a string (`'SomeClass@method'`), it's parsed into a class-method array via `parseCallable()`.
3. The method delegates to `BoundMethod::call()`:
   - `BoundMethod::call($container, $callable, $parameters, $defaultMethod = null)`
4. `BoundMethod` uses reflection to inspect the target method's parameter list via `ReflectionFunctionAbstract::getParameters()`.
5. For each parameter:
   - If a key matching the parameter name exists in `$parameters` → use that value.
   - If the parameter has a class type-hint → resolve from the container via `$container->make($type)`.
   - If the parameter is a variadic class type → resolve all tagged bindings.
   - If a default value exists → use the default.
   - Otherwise → throw `BindingResolutionException`.
6. Resolved arguments are merged with the original callable and invoked via `call_user_func_array($callable, $resolved)`.
7. Controllers: Laravel's `ControllerDispatcher` calls `Container::call()` on the controller method (not the constructor) for action-level injection.
8. Service Provider boot(): The `boot()` method of service providers is called via `Container::call()` if type-hints are present.

## Patterns
- **Controller Action Injection:** `public function index(Request $request, Logger $logger)` — resolves `Request` and `Logger` per-action without requiring them in the controller constructor.
- **Event Handler Injection:** `public function handle(OrderShipped $event, Mailer $mailer)` — injects the event object plus additional container services.
- **Service Provider Boot Injection:** `public function boot(Router $router, Dispatcher $events)` — provides access to framework components in the boot phase.
- **Closure Injection:** `Route::get('/users', function (UserRepository $users) { ... })` — resolves dependencies directly in route closures (convenient for rapid prototyping).
- **Explicit Parameter Override:** `$container->call([$obj, 'method'], ['customArg' => 'value', 'user' => $user])` — mixes user-provided arguments with container-resolved ones.

## Architectural Decisions
- **Why method injection exists alongside constructor injection:** Dependencies specific to a single controller action or event handler would otherwise clutter the constructor, making instantiation heavier and the class harder to test. Method injection allows surgical dependency provision.
- **Why BoundMethod is a separate class:** The logic for resolving method parameters is distinct from the logic for building constructors. BoundMethod handles callables generically, while `build()` in Container handles class instantiation. Separating them allows `BoundMethod` to be used independently (e.g., in Lumen or standalone packages).
- **Why explicit parameter overrides take priority:** The user must be able to pass runtime-specific values (like route parameters or request input) without them being overridden by container resolution. Container resolution is the fallback, not the primary source.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Reduces constructor bloat | Dependency not visible in class signature | Makes class dependencies less obvious at a glance |
| Only resolves on demand | Reflection overhead on every call | Per-request cost for controller actions (mitigated by OpCache) |
| Enables closure injection | Encourages inline resolution in non-DI contexts | Can lead to scattered resolution logic |
| Mixes user args with resolved deps | Parameter name conflicts possible | Array keys must match parameter names exactly |
| Works with any callable | Magic parsing of `Class@method` strings | IDE refactoring does not catch string mismatches |

## Performance Considerations
- **No built-in caching:** Unlike constructor resolution (which at least reuses singletons), method injection uses Reflection on every call. For controller actions, this is a per-request cost.
- **Controller method resolution caching:** Laravel does not cache controller method Reflection data. Third-party packages (like `laravel-optimize`) can precompute this.
- **Closure allocation in routes:** Route closures that use method injection are compiled at route registration time. With many routes, the Reflection calls stack up during route caching.
- **`BoundMethod` is not optimized for the hot path:** Each `Container::call()` invocation creates intermediate Reflection objects. In high-throughput applications, consider explicit dependency resolution in controller constructors instead.

## Production Considerations
- **Use route caching:** Route caching pre-compiles route closures and dispatchers, but does not eliminate method injection Reflection at request time. Profile if controller action injection is on the hot path.
- **Avoid method injection in middleware:** Middleware `handle()` methods are called on every request. Heavy method injection here multiplies across all routes. Prefer constructor injection for middleware.
- **Explicit parameter naming matters:** Container::call() matches parameters by name. Renaming a parameter breaks resolution of user-supplied arguments. Use consistent naming conventions.
- **Logger injection in methods:** Injecting `Psr\Log\LoggerInterface` into many methods individually creates multiple logger instances per request. Prefer a single logger via constructor.

## Common Mistakes
- **Assuming all parameters are resolved:** Only type-hinted class parameters are resolved. Scalar parameters (strings, ints) must be provided via the `$parameters` array or have defaults.
- **Parameter name collisions:** A controller action with `method(User $user, $id)` where `$id` is a primitive — the container will not resolve `$id` and will look for it in the explicit parameters array. Forgetting to pass it throws an error.
- **Method injection in Eloquent models:** Using `Container::call()` on Eloquent model methods is uncommon and fragile. Models should receive dependencies explicitly, not via the container.
- **Over-reliance for critical services:** Method injection in listeners means the dependency is resolved at dispatch time. If the listener is queued, the dependency must be serializable or re-resolvable on the queue worker.

## Failure Modes
- **BindingResolutionException in method:** A type-hinted parameter in a controller action has no binding → 500 error during routing. The stack trace points to `BoundMethod::call()`.
- **ParameterNotFoundException:** An explicit parameter key is expected but missing from the call array. The method argument is undefined, leading to a `TypeError` or `ErrorException`.
- **Unresolvable primitive in closure:** A route closure with `function ($foo)` where `$foo` is not a class type and not provided — `BindingResolutionException` or `TypeError` depending on strict types.
- **Serialization failure in queued listeners:** A listener's `handle()` method receives a non-serializable dependency (e.g., a database connection). When the job is serialized, the dependency is lost.

## Ecosystem Usage
- **Laravel core:** `Application::boot()` calls service provider `boot()` methods via `Container::call()`.
- **Laravel Horizon:** Horizon's job processing pipeline uses `Container::call()` to invoke job `handle()` methods with resolved dependencies.
- **Laravel Telescope:** Watcher methods are invoked via `Container::call()` during request processing.
- **Laravel Nova:** Nova's resource resolution uses method injection for authorization checks and field hydration.
- **Community packages:** Most event subscribers and middleware packages that extend core behavior use method injection for their handler methods.

## Related Knowledge Units

### Prerequisites
- **Constructor Injection** — the companion pattern for class-level dependency provision
- **Auto-Resolution Strategy** — underpins the resolution logic within `BoundMethod`
- **Container::call() Mechanics** — understanding how the container dispatches callables with resolved parameters

### Related Topics
- **Testing with the Container** — how to test callables that rely on method injection
- **Service Locator Anti-Pattern** — how method injection offers a cleaner alternative to inline container pulls
- **Injection Guidelines by Class Type** — when method injection is preferred per class type (controllers, listeners, commands)

### Advanced Follow-up Topics
- **Over-Injection Anti-Pattern** — method injection is one solution to reducing constructor bloat
- **Facade Architecture** — comparing method injection to facade-based service access
- **HTTP Kernel Internals** — how the ControllerDispatcher uses `Container::call()` for action injection

## Research Notes
- `BoundMethod::call()` is defined in `Illuminate\Container\BoundMethod`. The core logic mirrors `Container::build()` but operates on `ReflectionFunctionAbstract` (covers both `ReflectionMethod` and `ReflectionFunction`) rather than `ReflectionClass`.
- The `parseCallable()` method in `Container` (private) is responsible for splitting `Class@method` strings. It does NOT validate that the class exists — that validation happens lazily at call time.
- Laravel 11 changed the default controller action injection behavior: controllers that extend `Illuminate\Routing\Controller` still get method injection, but the `callAction()` method now bypasses `Container::call()` in favor of direct method dispatch with resolved parameters. Verify exact behavior per version.
- `BoundMethod` handles both instance methods and static methods. For static methods, it does not instantiate the class.
