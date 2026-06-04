# Use Constructor Injection for Shared Controller Dependencies
---
## Category
Architecture
---
## Rule
Inject shared services in the controller constructor and action-specific dependencies (Request, route parameters) via method injection.
---
## Reason
Repeating the same service type-hint across every action method duplicates type-hints and obscures which dependencies are shared. Constructor injection makes shared dependencies visible once.
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
        private OrderService $orders,
    ) {}

    public function index() { /* ... */ }
    public function store(CreateOrderRequest $request) { /* ... */ }
    public function show(string $id) { /* ... */ }
}
```
---
## Exceptions
No common exceptions for controllers with shared dependencies across actions.
---
## Consequences Of Violation
Repetitive type-hints; harder to refactor; less visible dependency contract.

---

# Use Method Injection in Listener handle() — Not Constructor Injection
---
## Category
Architecture
---
## Rule
Inject services into event listener `handle()` methods rather than the listener constructor.
---
## Reason
Listeners are resolved by the container when the event dispatcher processes them. Constructor injection resolves dependencies at registration time; method injection resolves them when the event fires, giving access to request-scoped services.
---
## Bad Example
```php
class SendOrderConfirmation
{
    public function __construct(
        private MailService $mail, // Resolved when listener is registered, not when event fires
    ) {}

    public function handle(OrderPlaced $event): void { /* ... */ }
}
```
---
## Good Example
```php
class SendOrderConfirmation
{
    public function handle(OrderPlaced $event, MailService $mail): void
    {
        $mail->send($event->order->user, new OrderConfirmation($event->order));
    }
}
```
---
## Exceptions
When the listener must store a dependency in a property for use across multiple methods.
---
## Consequences Of Violation
Dependencies resolved too early (at registration, not dispatch); request-scoped services unavailable.

---

# Use Method Injection for Queue Job handle() — Not Constructor Injection for Services
---
## Category
Reliability
---
## Rule
Inject non-serializable services in the job `handle()` method, not the job constructor.
---
## Reason
Job constructor dependencies are serialized to the queue payload. Large or non-serializable services increase payload size and may cause serialization errors. Method injection resolves dependencies at execution time on the queue worker.
---
## Bad Example
```php
class ProcessOrder implements ShouldQueue
{
    public function __construct(
        private Order $order,
        private LoggerInterface $logger, // Serialized with job — unnecessary
    ) {}
}
```
---
## Good Example
```php
class ProcessOrder implements ShouldQueue
{
    public function __construct(
        private Order $order, // Only serialized payload
    ) {}

    public function handle(LoggerInterface $logger): void
    {
        $logger->info('Processing order '.$this->order->id);
    }
}
```
---
## Exceptions
When the service must be available during job construction (rare — indicates design issue).
---
## Consequences Of Violation
Increased queue payload size; serialization errors with non-serializable services; wasted storage bandwidth.

---

# Use Constructor Injection Exclusively in Services and Repositories
---
## Category
Architecture
---
## Rule
Always use constructor injection — never `app()` or facades — in service and repository classes.
---
## Reason
Services and repositories contain business logic. Their dependencies must be visible and testable. Constructor injection provides explicit dependency contracts; `app()` hides them.
---
## Bad Example
```php
class OrderRepository
{
    public function find(int $id): ?Order
    {
        $cache = app(CacheInterface::class); // Hidden dependency
        return $cache->remember('order.'.$id, 3600, function () use ($id) {
            return Order::find($id);
        });
    }
}
```
---
## Good Example
```php
class OrderRepository
{
    public function __construct(
        private CacheInterface $cache,
    ) {}

    public function find(int $id): ?Order
    {
        return $this->cache->remember('order.'.$id, 3600, function () use ($id) {
            return Order::find($id);
        });
    }
}
```
---
## Exceptions
No common exceptions for business logic classes.
---
## Consequences Of Violation
Hidden dependencies; difficult testing; container coupling.

---

# Never Resolve Services in Service Provider register()
---
## Category
Reliability
---
## Rule
Do not use `app()->make()` to resolve services in a service provider's `register()` method.
---
## Reason
During `register()`, not all providers have been loaded and some services may not be bound yet. Resolving too early can cause `BindingResolutionException` or return the wrong implementation.
---
## Bad Example
```php
public function register(): void
{
    $this->app->bind(ReportGenerator::class, function ($app) {
        return new ReportGenerator($app->make(CacheInterface::class)); // Resolution during registration
    });
}
```
---
## Good Example
```php
public function register(): void
{
    $this->app->bind(ReportGenerator::class, function ($app) {
        return new ReportGenerator($app->make(CacheInterface::class)); // Resolution during build, not registration
    });
}
```
---
## Exceptions
No common exceptions — use `boot()` for operations that require resolved services.
---
## Consequences Of Violation
Runtime resolution failures; unpredictable behavior due to incomplete binding registration.

---

# Use Method Injection for Service Provider boot() Methods
---
## Category
Architecture
---
## Rule
Type-hint framework services in the `boot()` method signature for automatic injection by the container.
---
## Reason
The container calls `boot()` via `Container::call()`, which resolves type-hinted parameters automatically. This provides clean access to framework services without pulling them from the container manually.
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
public function boot(Router $router, Dispatcher $events): void
{
    $router->middleware('web')->group(base_path('routes/web.php'));
}
```
---
## Exceptions
When no framework services are needed in `boot()` — the method can remain parameterless.
---
## Consequences Of Violation
Unnecessary boilerplate; manual resolution; less readable provider code.
