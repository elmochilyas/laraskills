# Never Call app() in Business Logic Classes
---
## Category
Architecture
---
## Rule
Never use `app()`, `resolve()`, or `App::make()` inside services, repositories, actions, or any class containing business logic.
---
## Reason
Calling `app()` creates hidden dependencies that are invisible in the class signature. This makes the class harder to test, impossible to instantiate outside Laravel, and resistant to static analysis.
---
## Bad Example
```php
class OrderService
{
    public function process(Order $order): void
    {
        $payment = app(PaymentGateway::class);
        $payment->charge($order->total);
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private PaymentGateway $payment,
    ) {}

    public function process(Order $order): void
    {
        $this->payment->charge($order->total);
    }
}
```
---
## Exceptions
Service provider `register()` methods where container access is the class's purpose.
---
## Consequences Of Violation
Hidden dependencies; testing difficulty; container coupling; broken static analysis.

---

# Never Inject Container into Business Logic Classes
---
## Category
Architecture
---
## Rule
Never accept `Container $container` as a constructor parameter in business logic classes.
---
## Reason
A class that receives the container and pulls dependencies internally is a disguised service locator. All dependencies become invisible — the class signature reveals nothing about what the class actually needs.
---
## Bad Example
```php
class OrderService
{
    public function __construct(private Container $container) {}

    public function process(Order $order): void
    {
        $payment = $this->container->make(PaymentGateway::class);
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private PaymentGateway $payment,
    ) {}

    public function process(Order $order): void
    {
        $this->payment->charge($order->total);
    }
}
```
---
## Exceptions
No common exceptions. Container injection in business logic is always a design flaw.
---
## Consequences Of Violation
Hidden dependencies; impossible to unit test without container; static analysis blind.

---

# Declare Every Dependency in the Constructor Signature
---
## Category
Maintainability
---
## Rule
Every collaborator used by a class must appear as a type-hinted constructor parameter.
---
## Reason
The constructor signature is the contract that documents what a class needs to function. Dependencies pulled from the container inside methods violate this contract, making the class's requirements unknowable without reading every method body.
---
## Bad Example
```php
class OrderService
{
    public function process(Order $order): void
    {
        $cache = app(CacheInterface::class); // Not visible in signature
        $payment = app(PaymentGateway::class); // Not visible in signature
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private CacheInterface $cache,
        private PaymentGateway $payment,
    ) {}

    public function process(Order $order): void
    {
        // Dependencies clearly visible in constructor
    }
}
```
---
## Exceptions
No common exceptions for business logic classes.
---
## Consequences Of Violation
Hidden dependencies; incomplete contract; testing difficulty; maintenance confusion.

---

# Use Facades Sparingly and Only in Presentation Layer
---
## Category
Architecture
---
## Rule
Limit facade usage to controllers, Blade views, and route files. Never use facades in domain or application services.
---
## Reason
Facades are intentional, documented service locators. Their tradeoff (convenience vs. explicitness) is acceptable in presentation layers but not in domain logic, where dependency clarity is paramount.
---
## Bad Example
```php
use Illuminate\Support\Facades\Cache;

class UserRepository
{
    public function find(int $id): ?User
    {
        return Cache::remember('user.'.$id, 3600, function () use ($id) {
            return User::find($id);
        });
    }
}
```
---
## Good Example
```php
class UserRepository
{
    public function __construct(
        private CacheInterface $cache,
    ) {}

    public function find(int $id): ?User
    {
        return $this->cache->remember('user.'.$id, 3600, function () use ($id) {
            return User::find($id);
        });
    }
}
```
---
## Exceptions
Facades are acceptable in controllers, route closures, and Blade templates.
---
## Consequences Of Violation
Hidden dependencies; testing difficulty; facade state leaks between tests.

---

# Never Use app() Inside a Loop
---
## Category
Performance
---
## Rule
Never call `app()->make()` inside a loop in business logic. Pre-resolve the dependency before the loop or inject it via constructor.
---
## Reason
Calling `app()` in a loop repeatedly resolves the dependency on each iteration. If the dependency is a singleton, this is wasteful lookup. If it is a new instance, it multiplies allocation and resolution cost.
---
## Bad Example
```php
public function processOrders(array $orders): void
{
    foreach ($orders as $order) {
        $service = app(OrderService::class); // Resolved on every iteration
        $service->process($order);
    }
}
```
---
## Good Example
```php
public function __construct(
    private OrderService $service,
) {}

public function processOrders(array $orders): void
{
    foreach ($orders as $order) {
        $this->service->process($order);
    }
}
```
---
## Exceptions
When the dependency must be a fresh instance per iteration — inject a factory instead.
---
## Consequences Of Violation
Repeated container lookups; unnecessary resolution overhead; performance degradation for large loops.

---

# Do Not Mix Injection Patterns — Use One Consistent Approach
---
## Category
Maintainability
---
## Rule
Choose either constructor injection or service locator for a given class. Never mix both patterns.
---
## Reason
Some dependencies injected, others pulled via `app()` creates inconsistency and confusion. Developers cannot tell at a glance which dependencies a class truly requires — some are visible in the constructor, others hidden in method bodies.
---
## Bad Example
```php
class OrderService
{
    public function __construct(
        private PaymentGateway $payment, // Visible
    ) {}

    public function process(Order $order): void
    {
        $logger = app(LoggerInterface::class); // Hidden
        $this->payment->charge($order->total);
        $logger->info('Charged');
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private PaymentGateway $payment,
        private LoggerInterface $logger,
    ) {}

    public function process(Order $order): void
    {
        $this->payment->charge($order->total);
        $this->logger->info('Charged');
    }
}
```
---
## Exceptions
No common exceptions. Choose constructor injection as the default pattern.
---
## Consequences Of Violation
Inconsistent dependency declaration; confusing contract; difficult maintenance.
