# Use Method Injection for Action-Specific Dependencies Only
---
## Category
Architecture
---
## Rule
Prefer method injection for dependencies used by a single method and constructor injection for dependencies used across multiple methods.
---
## Reason
Repeating the same dependency type-hint across every method violates DRY and hides which dependencies are shared. Constructor injection makes shared dependencies visible once, while method injection keeps action-specific dependencies where they are used.
---
## Bad Example
```php
class OrderController
{
    public function index(OrderService $orders) { /* ... */ }
    public function store(CreateOrderRequest $request, OrderService $orders) { /* ... */ }
    public function show(OrderService $orders, string $id) { /* ... */ }
}
```
---
## Good Example
```php
class OrderController
{
    public function __construct(
        private OrderService $orders, // Shared — injected once
    ) {}

    public function index() { /* ... */ }
    public function store(CreateOrderRequest $request) { /* ... */ }
    public function show(string $id) { /* ... */ }
}
```
---
## Exceptions
When a service is used in exactly one method and moving it to the constructor would require adding a parameter for a single use case.
---
## Consequences Of Violation
Repetitive type-hints; harder to refactor; less visible dependency contract.

---

# Do Not Use Method Injection in Middleware handle()
---
## Category
Framework Usage
---
## Rule
Never add type-hinted service parameters to middleware `handle()` methods. Use constructor injection for middleware dependencies.
---
## Reason
Middleware `handle()` has a fixed signature expected by the framework — `($request, $next)`. Adding extra parameters causes type errors or unexpected behavior because the framework does not resolve additional parameters for middleware.
---
## Bad Example
```php
public function handle(Request $request, Closure $next, LoggerInterface $logger): mixed
{
    $logger->info('Request: '.$request->path());
    return $next($request);
}
```
---
## Good Example
```php
public function __construct(
    private LoggerInterface $logger,
) {}

public function handle(Request $request, Closure $next): mixed
{
    $this->logger->info('Request: '.$request->path());
    return $next($request);
}
```
---
## Exceptions
No common exceptions. Middleware dependencies must always use constructor injection.
---
## Consequences Of Violation
Type errors; unexpected parameter resolution behavior; middleware may not execute correctly.

---

# Order Parameters: Container-Resolved First, Runtime Last
---
## Category
Framework Usage
---
## Rule
Place container-resolved type-hinted parameters before runtime parameters (route bindings) in controller action signatures.
---
## Reason
Route model bindings are resolved positionally by the framework before `Container::call()` processes method injection. If a container-resolved parameter comes after a route binding positionally, it may receive the route parameter value instead of a resolved service.
---
## Bad Example
```php
public function show(Order $order, OrderService $service): View
// $order is a route binding; $service might receive wrong value
```
---
## Good Example
```php
public function show(OrderService $service, Order $order): View
// $service container-resolved; $order positionally bound
```
---
## Exceptions
When all parameters are type-hinted and resolved by the container (no route bindings).
---
## Consequences Of Violation
Incorrect parameter values; unexpected type errors; hard-to-debug resolution failures.

---

# Always Type-Hint Method-Injected Parameters
---
## Category
Maintainability
---
## Rule
Every method parameter intended for container resolution must have an explicit class or interface type-hint.
---
## Reason
The container resolves parameters by matching their type-hints. Without a type-hint, the container cannot determine which class to resolve — the parameter receives its default value or throws an error.
---
## Bad Example
```php
public function handle(OrderPlaced $event, $logger): void
{
    $logger->info('Event handled'); // $logger is not resolved
}
```
---
## Good Example
```php
public function handle(OrderPlaced $event, LoggerInterface $logger): void
{
    $logger->info('Event handled'); // Properly resolved
}
```
---
## Exceptions
Primitive parameters (int, string) are not resolved by the container — they come from explicit overrides or defaults.
---
## Consequences Of Violation
Parameters not resolved; null or default values injected instead of expected services.

---

# Avoid Method Injection for Dependencies Used in Multiple Methods
---
## Category
Maintainability
---
## Rule
Move a dependency to constructor injection when it appears in more than one method's parameter list.
---
## Reason
Duplicating type-hints across multiple methods creates repetition and makes refactoring harder. Constructor injection declares the dependency once and makes it available to all methods.
---
## Bad Example
```php
public function index(LoggerInterface $log) { $log->info('index'); }
public function store(LoggerInterface $log) { $log->info('store'); }
public function show(LoggerInterface $log) { $log->info('show'); }
```
---
## Good Example
```php
public function __construct(
    private LoggerInterface $log,
) {}

public function index() { $this->log->info('index'); }
public function store() { $this->log->info('store'); }
public function show() { $this->log->info('show'); }
```
---
## Exceptions
No common exceptions — shared dependencies belong in the constructor.
---
## Consequences Of Violation
Repetitive parameter lists; harder to refactor; less maintainable code.

---

# Avoid Method Injection in Hot Paths
---
## Category
Performance
---
## Rule
Prefer constructor injection over method injection for high-throughput controller actions that are called frequently.
---
## Reason
Method injection uses `Container::call()` which applies Reflection on every invocation. Constructor injection resolves dependencies once at construction time, avoiding per-call Reflection overhead.
---
## Bad Example
```php
public function index(ExpensiveService $service): View
{
    return $service->render(); // Reflection cost on every request
}
```
---
## Good Example
```php
public function __construct(
    private ExpensiveService $service,
) {}

public function index(): View
{
    return $this->service->render(); // No per-request Reflection
}
```
---
## Exceptions
When the service is used in only one method and performance profiling shows no bottleneck.
---
## Consequences Of Violation
Per-request Reflection overhead on high-traffic endpoints; suboptimal performance.

---

# Use Method Injection for Service Provider boot() Methods
---
## Category
Code Organization
---
## Rule
Type-hint needed services directly in the `boot()` method signature rather than pulling them from `$this->app`.
---
## Reason
The container's `call()` method resolves parameters of `boot()` automatically. This provides clean, explicit access to framework services without manually calling `$this->app->make()`.
---
## Bad Example
```php
public function boot(): void
{
    $router = $this->app->make(Router::class);
    $router->middleware('web')->group(base_path('routes/web.php'));
}
```
---
## Good Example
```php
public function boot(Router $router): void
{
    $router->middleware('web')->group(base_path('routes/web.php'));
}
```
---
## Exceptions
When no services are needed — `boot()` can remain parameterless.
---
## Consequences Of Violation
Unnecessary manual resolution; less readable provider code.
