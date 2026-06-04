## Rule 1: Depend on abstractions (interfaces), not concrete classes
---
## Category
Architecture
---
## Rule
Classes should depend on interfaces/abstract types rather than concrete implementations. Inject dependencies through constructors.
---
## Reason
Concrete coupling prevents substituting implementations, makes testing harder, and violates DIP.
---
## Bad Example
```php
class OrderService
{
    private EloquentOrderRepository $repo; // concrete coupling

    public function __construct()
    {
        $this->repo = new EloquentOrderRepository(); // instantiation coupling
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private OrderRepository $repo // abstraction
    ) {}
}
```
---
## Exceptions
Value objects and domain primitives which have no behavior to substitute.
---
## Consequences Of Violation
Tight coupling, untestable code, hard to swap implementations.
---
## Rule 2: Keep the number of dependencies per class low (≤ 5 for services)
---
## Category
Architecture
---
## Rule
Constructor injection should have at most 5 parameters for application services. More indicates the class has too many responsibilities.
---
## Reason
High fan-out (many dependencies) makes a class fragile—changes in any collaborator can force changes in it.
---
## Bad Example
```php
class OrderService
{
    public function __construct(
        private OrderRepository $r1,
        private CustomerRepository $r2,
        private PaymentGateway $p1,
        private Mailer $m1,
        private InventoryClient $i1,
        private EventDispatcher $e1,
        private Logger $l1
    ) {}
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private PaymentGateway $payments,
        private NotificationService $notifications
    ) {}
}
```
---
## Exceptions
Infrastructure classes (middleware, service providers) that naturally wire many dependencies.
---
## Consequences Of Violation
High efferent coupling, fragile code, excessive DI configuration.
---
## Rule 3: Couple to stable, well-tested interfaces—not volatile ones
---
## Category
Architecture
---
## Rule
Design interfaces to be stable (few expected changes). Volatile interfaces cause cascading changes across all dependents.
---
## Reason
Stable interfaces minimize the ripple effect; if an interface changes often, each change forces updates across all dependents.
---
## Bad Example
```php
// Interface that changes every sprint
interface OrderProcessor
{
    public function process(array $data): array;
    // method signature changes frequently
}
```
---
## Good Example
```php
// Stable interface with specific contracts
interface OrderValidator
{
    public function validate(Order $order): ValidationResult;
}
```
---
## Exceptions
Early-stage prototypes where interfaces are intentionally volatile as the design evolves.
---
## Consequences Of Violation
High maintenance cost, frequent cascading changes, resistance to interface changes.
---
## Rule 4: Use events to decouple components that don't need synchronous responses
---
## Category
Architecture
---
## Rule
When component A needs to notify component B but does not need B's response to continue, use events instead of direct calls.
---
## Reason
Direct calls create compile-time and runtime coupling; events decouple the publisher from the subscriber, allowing each to evolve independently.
---
## Bad Example
```php
class OrderService
{
    public function placeOrder(OrderData $data): void
    {
        $order = $this->repo->save($data);
        $this->emailService->sendConfirmation($order); // direct coupling
        $this->inventoryService->reserveItems($order->items); // direct coupling
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function placeOrder(OrderData $data): void
    {
        $order = $this->repo->save($data);
        $this->events->dispatch(new OrderPlaced($order));
    }
}
// EmailService and InventoryService subscribe independently
```
---
## Exceptions
When a synchronous response is required (e.g., check inventory before placing order).
---
## Consequences Of Violation
Tight coupling between unrelated services, difficult to add new subscribers.
---
## Rule 5: Avoid circular dependencies at all costs
---
## Category
Architecture
---
## Rule
Never allow two classes/modules to depend on each other directly or transitively. Use interfaces or events to break cycles.
---
## Reason
Circular dependencies create inseparable components; you cannot test, change, or extract one without the other.
---
## Bad Example
```
Module A → Module B → Module A (circular)
```
---
## Good Example
```
Module A → Interface → Module B
// or
Module A → Event → Module B
```
---
## Exceptions
Bidirectional relationships in the same aggregate where both are part of the same cohesive unit.
---
## Consequences Of Violation
Inseparable modules, impossible independent testing, distributed monolith.
