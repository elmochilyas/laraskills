# Use Constructor Injection for Shared Dependencies, Method Injection for Action-Specific
---
## Category
Architecture
---
## Rule
Inject dependencies used across multiple methods via the constructor. Use method injection only for dependencies used by a single method.
---
## Reason
Constructor injection declares shared dependencies once, providing a clear contract of the class's requirements. Method injection for shared deps repeats type-hints, DRY violations, and makes refactoring harder.
---
## Bad Example
```php
class OrderController
{
    public function index(OrderService $orders) { $orders->all(); }
    public function store(CreateOrderRequest $r, OrderService $orders) { $orders->create($r); }
    public function show(OrderService $orders, string $id) { $orders->find($id); }
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

    public function index() { $this->orders->all(); }
    public function store(CreateOrderRequest $r) { $this->orders->create($r); }
    public function show(string $id) { $this->orders->find($id); }
}
```
---
## Exceptions
When a dependency is used in exactly one method and the class otherwise has no need for it in the constructor.
---
## Consequences Of Violation
Repetitive type-hints; harder to refactor; unclear dependency contract.

---

# Do Not Use Method Injection in Middleware handle()
---
## Category
Framework Usage
---
## Rule
Never add type-hinted service parameters to middleware `handle()` methods. Use constructor injection for all middleware dependencies.
---
## Reason
Middleware `handle()` has a fixed signature `($request, $next)` enforced by the pipeline. The framework does not resolve additional parameters — extra type-hints cause type errors or unexpected behavior.
---
## Bad Example
```php
public function handle(Request $request, Closure $next, LoggerInterface $logger): mixed
{
    $logger->info('Request received');
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
    $this->logger->info('Request received');
    return $next($request);
}
```
---
## Exceptions
No common exceptions. Middleware dependencies always use constructor injection.
---
## Consequences Of Violation
Type errors; unexpected behavior; middleware may not execute correctly.

---

# Order Parameters: Container-Resolved First, Runtime Last
---
## Category
Framework Usage
---
## Rule
Place container-resolved type-hinted parameters before route parameters in controller action signatures.
---
## Reason
Route model bindings are resolved positionally before method injection. If a container-resolved parameter comes after a positional binding, it may receive the wrong value.
---
## Bad Example
```php
public function show(Order $order, OrderService $service): View
// $service may receive $order's route binding value
```
---
## Good Example
```php
public function show(OrderService $service, Order $order): View
// $service resolved by container; $order bound positionally
```
---
## Exceptions
When all parameters are container-resolved (no route bindings).
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
The container resolves parameters by matching their type-hints. Without a type-hint, the parameter is skipped — it receives its default value or causes an error.
---
## Bad Example
```php
public function handle(OrderPlaced $event, $logger): void
{
    $logger->info('Handled'); // $logger is not resolved
}
```
---
## Good Example
```php
public function handle(OrderPlaced $event, LoggerInterface $logger): void
{
    $logger->info('Handled'); // Properly resolved
}
```
---
## Exceptions
Primitive parameters (int, string) are not resolved by the container — provide defaults or explicit overrides.
---
## Consequences Of Violation
Parameters not resolved; null or default values instead of expected services.

---

# Prefer Constructor Injection for Hot-Path Endpoints
---
## Category
Performance
---
## Rule
Use constructor injection instead of method injection for high-throughput controller actions to avoid per-call Reflection overhead.
---
## Reason
Method injection uses `Container::call()` which applies Reflection on every invocation. Constructor injection resolves dependencies once at construction time, eliminating per-call overhead.
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
When the endpoint is low-traffic and the service is used in only one method.
---
## Consequences Of Violation
Per-request Reflection overhead; suboptimal performance under high load.

---

# Use Method Injection for Listener handle() Methods
---
## Category
Architecture
---
## Rule
Inject services into event listener methods via the `handle()` signature, not the listener constructor.
---
## Reason
Listeners are resolved per-event by the container. Method injection resolves dependencies at dispatch time, providing access to request-scoped services. Constructor injection would resolve dependencies at registration time, which is too early.
---
## Bad Example
```php
class SendOrderConfirmation
{
    public function __construct(
        private MailService $mail, // Resolved too early — at registration
    ) {}

    public function handle(OrderPlaced $event): void
    {
        $this->mail->send($event->order);
    }
}
```
---
## Good Example
```php
class SendOrderConfirmation
{
    public function handle(OrderPlaced $event, MailService $mail): void
    {
        $mail->send($event->order);
    }
}
```
---
## Exceptions
When the listener needs a service that is not request-scoped and is used across multiple methods.
---
## Consequences Of Violation
Dependencies resolved at wrong time; request-scoped services unavailable.

---

# Avoid Excessive Method Injection Parameters
---
## Category
Maintainability
---
## Rule
Limit type-hinted parameters in a single method to 3-4. Group related services into a single object when there are more.
---
## Reason
Excessive method parameters make the method signature hard to read, document, and test. Grouping related services clarifies the method's intent and keeps the signature manageable.
---
## Bad Example
```php
public function process(
    Request $request,
    OrderService $orders,
    PaymentGateway $payment,
    LoggerInterface $log,
    MailService $mail,
    AnalyticsService $analytics,
): void
{
    // Too many parameters — hard to reason about
}
```
---
## Good Example
```php
public function process(
    Request $request,
    OrderService $orders,
    NotificationService $notifications, // Groups mail + log + analytics
): void
{
    // Clean, focused signature
}
```
---
## Exceptions
When each parameter is genuinely independent and a grouping abstraction would be unnatural.
---
## Consequences Of Violation
Hard-to-read method signatures; testing difficulty; maintainability debt.
