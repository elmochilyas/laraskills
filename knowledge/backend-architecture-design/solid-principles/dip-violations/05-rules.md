## Rule 1: High-level modules must not depend on low-level modules; both depend on abstractions
---
## Category
Architecture
---
## Rule
Domain and application layers must depend on interfaces (abstractions); infrastructure implementations depend on the same interfaces. Never import concrete infrastructure classes from higher layers.
---
## Reason
DIP violation makes high-level modules coupled to low-level details, preventing independent evolution and making testing impossible without infrastructure.
---
## Bad Example
```php
// High-level use case depends on low-level Eloquent repository
use App\Infrastructure\Persistence\EloquentOrderRepository;

class PlaceOrderUseCase
{
    public function __construct(
        private EloquentOrderRepository $repo // DIP violation
    ) {}
}
```
---
## Good Example
```php
// Both depend on abstraction
use App\Domain\Order\Ports\OrderRepository;

class PlaceOrderUseCase
{
    public function __construct(
        private OrderRepository $repo // abstraction
    ) {}

    public function execute(OrderData $data): void
    {
        $order = Order::create($data);
        $this->repo->save($order);
    }
}

class EloquentOrderRepository implements OrderRepository { /* low-level */ }
```
---
## Exceptions
When the low-level module is guaranteed stable and will never change (e.g., core PHP classes).
---
## Consequences Of Violation
Framework lock-in, untestable use cases, hard to swap implementations.
---
## Rule 2: Inject dependencies through constructors—never instantiate or resolve inside the class
---
## Category
Architecture
---
## Rule
Classes should receive their dependencies via constructor injection. Never use `new`, `app()`, `resolve()`, or Service Locator inside a class.
---
## Reason
Construction inside a class creates hidden coupling and makes testing impossible without changing the class itself.
---
## Bad Example
```php
class OrderService
{
    private OrderRepository $repo;

    public function __construct()
    {
        $this->repo = new EloquentOrderRepository(); // hidden coupling
        // or:
        $this->repo = app(OrderRepository::class); // service locator
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private OrderRepository $repo // injected
    ) {}
}
```
---
## Exceptions
Factory methods that intentionally create value objects (not injectable).
---
## Consequences Of Violation
Hidden dependencies, untestable classes, DIP violation.
---
## Rule 3: Define abstractions in the domain/application layer, not in infrastructure
---
## Category
Architecture
---
## Rule
Interface contracts (ports) belong in the domain or application layer. Infrastructure implements them. Never define domain-relevant interfaces in infrastructure.
---
## Reason
Interfaces defined in infrastructure force the domain to depend on infrastructure just for the interface definition, violating DIP.
---
## Bad Example
```php
// Interface defined in infrastructure
namespace App\Infrastructure\Contracts;

interface OrderRepository
{
    public function save(Order $order): void;
}
// Domain must import infrastructure to use this interface
```
---
## Good Example
```php
// Interface defined in domain
namespace App\Domain\Order\Ports;

interface OrderRepository
{
    public function save(Order $order): void;
}

// Infrastructure implements it
namespace App\Infrastructure\Persistence;

class EloquentOrderRepository implements OrderRepository {}
```
---
## Exceptions
Pure infrastructure abstractions (e.g., `CacheInterface`, `QueueInterface`) that have no domain semantics.
---
## Consequences Of Violation
Domain depends on infrastructure, DIP inverted.
---
## Rule 4: Use composition root to wire abstractions to concretions
---
## Category
Architecture
---
## Rule
The composition root (application entry point) is the only place where abstractions are bound to concretions. No other part of the application should know about the binding.
---
## Reason
Scattered binding knowledge makes changing implementations a project-wide change instead of a single configuration change.
---
## Bad Example
```php
// Binding scattered across multiple service providers
class OrderServiceProvider
{
    public function register(): void
    {
        $this->app->bind(OrderRepository::class, EloquentOrderRepository::class);
    }
}
class PaymentServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, StripeGateway::class);
    }
}
```
---
## Good Example
```php
// Single composition root
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $services = config('architecture.bindings');
        foreach ($services as $abstract => $concrete) {
            $this->app->bind($abstract, $concrete);
        }
    }
}
```
---
## Exceptions
Module-specific service providers that wire only module-internal bindings.
---
## Consequences Of Violation
Scattered wiring, hard to change implementations globally, unclear dependency graph.
---
## Rule 5: Do not depend on concrete classes that are volatile
---
## Category
Architecture
---
## Rule
Depend on abstractions for any module that may change: third-party libraries, infrastructure components, external services. Concrete dependencies are acceptable only for stable constructs (value objects, primitives).
---
## Reason
Volatile concrete classes are the primary source of coupling; depending on them makes every change to the volatility class cascade.
---
## Bad Example
```php
class NotificationService
{
    private SendGridClient $client; // volatile third-party dependency

    public function send(Notification $notification): void
    {
        $this->client->send($notification->toArray());
    }
}
```
---
## Good Example
```php
interface EmailProvider
{
    public function send(Email $email): SendResult;
}

class NotificationService
{
    public function __construct(
        private EmailProvider $mailer // abstraction
    ) {}
}
```
---
## Exceptions
Standard library classes (e.g., `Carbon`, `Collection`) that are stable and ubiquitous.
---
## Consequences Of Violation
Vendor lock-in, untestable code, third-party changes break domain logic.
