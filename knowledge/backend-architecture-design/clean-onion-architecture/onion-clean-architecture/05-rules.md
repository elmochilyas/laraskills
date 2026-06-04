## Rule 1: Dependencies point inward — domain core must never reference outer layers
---
## Category
Architecture
---
## Rule
The innermost domain circle may only reference itself; outer circles (Application, Infrastructure, Presentation) may reference inward. Enforce with automated checks.
---
## Reason
Inward-only dependency ensures the domain remains framework-agnostic, testable, and reusable across any delivery mechanism.
---
## Bad Example
```php
// Domain core imports Laravel's DB facade
class Order
{
    public function total(): float
    {
        return DB::table('order_items')->sum('price');
    }
}
```
---
## Good Example
```php
// Domain core is plain PHP with interfaces
class Order
{
    public function __construct(
        private OrderItemCollection $items
    ) {}

    public function total(): Money
    {
        return $this->items->sum(fn(OrderItem $i) => $i->price());
    }
}
```
---
## Exceptions
Cross-cutting infrastructure like annotations/attributes that are compile-time only (e.g., Symfony routes on controllers in the outermost ring).
---
## Consequences Of Violation
Framework lock-in, untestable domain logic, violation of DIP.
---
## Rule 2: Define repository interfaces in the domain, implement them in infrastructure
---
## Category
Architecture
---
## Rule
Repository contracts (interfaces) belong in the Domain circle; concrete implementations (Eloquent, Doctrine) belong in the Infrastructure circle.
---
## Reason
DIP demands that the domain defines the contract; infrastructure provides the mechanism. This allows swapping storage without touching domain logic.
---
## Bad Example
```php
// Interface defined in Infrastructure
namespace App\Infrastructure\Persistence;

interface OrderRepository {}
// Domain depends on infrastructure interface → inward dependency broken
```
---
## Good Example
```php
// Interface in Domain
namespace App\Domain\Order\Repositories;

interface OrderRepository
{
    public function save(Order $order): void;
}

// Implementation in Infrastructure
namespace App\Infrastructure\Persistence;

class EloquentOrderRepository implements OrderRepository {}
```
---
## Exceptions
When the DDD Aggregate Repository pattern is used consistently and the interface is defined alongside the aggregate in the domain.
---
## Consequences Of Violation
DIP violation, domain depends on infrastructure, unable to swap implementations.

> **ECC Context Note:** Clean Architecture mandates repository interfaces for domain persistence-agnosticism. However, the ECC default prefers direct Eloquent access for standard Laravel applications where multiple persistence implementations are not required. Review the Repository Justification Criteria in `docs/architecture-decisions/repository-vs-direct-eloquent.md` before introducing repositories. The criteria in this rule apply strictly when a clean architecture layer boundary has been explicitly adopted for that module.
---
## Rule 3: Outer circles must communicate via ports and adapters, not direct instantiation
---
## Category
Architecture
---
## Rule
Inject dependencies through interfaces (ports) at the boundary; instantiate concrete adapters in the composition root only.
---
## Reason
Direct instantiation of adapters in outer layers creates compile-time coupling that defeats the clean architecture goal.
---
## Bad Example
```php
class PaymentService
{
    public function __construct()
    {
        $this->gateway = new StripeGateway(); // direct instantiation
    }
}
```
---
## Good Example
```php
class PaymentService
{
    public function __construct(
        private PaymentGateway $gateway // injected port
    ) {}
}
```
---
## Exceptions
Value objects and domain primitives are always created directly; the rule applies to services with side effects.
---
## Consequences Of Violation
Compile-time coupling, untestable services, adapter lock-in.
---
## Rule 4: Keep domain entities pure and use application services for use-case orchestration
---
## Category
Architecture
---
## Rule
Domain entities encapsulate behavior and invariants; application services orchestrate use cases by coordinating entities, repositories, and domain services.
---
## Reason
Orchestration logic in domain entities bloats them with infrastructure concerns; orchestration in application services keeps entities lean and focused.
---
## Bad Example
```php
class Order
{
    public function place(): void
    {
        $this->repo->save($this); // entity orchestrating persistence
        Mail::send(...); // entity sending email
    }
}
```
---
## Good Example
```php
class PlaceOrderUseCase
{
    public function execute(OrderDto $dto): OrderResult
    {
        $order = Order::create($dto->items());
        $this->repo->save($order);
        $this->eventDispatcher->dispatch(new OrderPlaced($order->id()));
        return new OrderResult($order);
    }
}
```
---
## Exceptions
When the domain entity needs to enforce an invariant that involves persistence (e.g., unique constraint violated).
---
## Consequences Of Violation
Bloated entities, domain coupled to infrastructure, testing difficulty.
---
## Rule 5: Place all DI container configuration in a single composition root
---
## Category
Architecture
---
## Rule
Define dependency injection (wire-up of concrete implementations to interfaces) in exactly one location per application boundary.
---
## Reason
Scattered DI configuration makes it impossible to see the entire dependency graph in one place, leading to duplicate bindings and configuration errors.
---
## Bad Example
```
Bindings scattered across ServiceProviderA.php, ServiceProviderB.php, Controller constructor injection + facades.
```
---
## Good Example
```php
// AppServiceProvider — single composition root
$this->app->bind(OrderRepository::class, EloquentOrderRepository::class);
$this->app->bind(PaymentGateway::class, StripeGateway::class);
```
---
## Exceptions
Lazy-loaded service providers for feature modules that are conditionally enabled (but they should still be minimal).
---
## Consequences Of Violation
Duplicate bindings, hard-to-debug resolution errors, scattered configuration.
