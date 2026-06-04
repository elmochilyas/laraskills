## Rule 1: Never allow domain entities to be property bags with zero behavior
---
## Category
Architecture
---
## Rule
Every domain entity must encapsulate behavior that enforces invariants; getters and setters alone make an anemic model. At least one meaningful business method per entity.
---
## Reason
Anemic domain models place business logic in services or controllers, violating encapsulation and making the domain model a passive data structure.
---
## Bad Example
```php
class Order
{
    public string $status;
    public float $total;
    // No methods — everything done externally
}
```
---
## Good Example
```php
class Order
{
    public function __construct(
        private OrderStatus $status,
        private Money $total
    ) {}

    public function approve(): void
    {
        if (!$this->status->canTransitionTo(OrderStatus::Approved)) {
            throw new DomainException('Cannot approve in current status');
        }
        $this->status = OrderStatus::Approved;
    }
}
```
---
## Exceptions
DTOs, query results, CQRS read models, and simple data transfer objects that intentionally carry no behavior.
---
## Consequences Of Violation
Business logic scattered in services, encapsulation violated, logic duplication.
---
## Rule 2: Keep domain logic inside the model, not in application services
---
## Category
Architecture
---
## Rule
When a business rule involves only the data of a single aggregate, implement it as a method on that aggregate; services should only orchestrate across aggregates.
---
## Reason
Logic in services that belongs on the model creates an anemic model and makes the logic invisible to anyone reading the domain class.
---
## Bad Example
```php
class OrderService
{
    public function approveOrder(Order $order): void
    {
        if ($order->status !== 'pending') {
            throw new \Exception('...');
        }
        $order->status = 'approved';
    }
}
```
---
## Good Example
```php
class Order
{
    public function approve(): void
    {
        if (!$this->status->equals(OrderStatus::Pending)) {
            throw new DomainException('...');
        }
        $this->status = OrderStatus::Approved;
    }
}

class OrderService
{
    public function approveOrder(OrderId $id): void
    {
        $order = $this->repo->find($id);
        $order->approve();
        $this->repo->save($order);
    }
}
```
---
## Exceptions
Domain services that coordinate multiple aggregates or handle cross-cutting constraints that don't belong to a single entity.
---
## Consequences Of Violation
Anemic model, domain logic duplication, hard to test domain behavior.
---
## Rule 3: Expose intent-revealing interfaces, not property getters
---
## Category
Architecture
---
## Rule
Design entity methods to express business intent (e.g., `canBeCancelled()`, `markAsShipped()`) rather than exposing raw property accessors.
---
## Reason
Gette-driven models expose implementation details and invite external logic to replace domain behavior.
---
## Bad Example
```php
if ($order->status === 'pending' && $order->createdAt->diffInHours() > 24) {
    $order->status = 'cancelled';
}
```
---
## Good Example
```php
if ($order->canBeCancelled()) {
    $order->cancel();
}
```
---
## Exceptions
Read-only properties needed for presentation (e.g., `$order->id()`, `$order->createdAt()`) that are conceptually public.
---
## Consequences Of Violation
Encapsulation erosion, domain logic leaked to clients, messy code.
---
## Rule 4: A rich model does not mean every object must be complex—start small and enrich deliberately
---
## Category
Architecture
---
## Rule
Begin with a simple model and add behavior as patterns emerge; avoid over-engineering a rich model before understanding the domain.
---
## Reason
Over-engineering a rich model upfront creates speculative complexity that may never be used.
---
## Bad Example
```php
class Email
{
    public function __construct(
        private string $localPart,
        private string $domain,
        private EmailStatus $status
    ) {
        $this->validate();
    }
    // 20 methods for a value object used in one place
}
```
---
## Good Example
```php
class Email
{
    public function __construct(
        private string $value
    ) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Invalid email');
        }
    }
}
```
---
## Exceptions
For well-understood, stable domain concepts where the complexity is known upfront (e.g., `Money`, `OrderStatus`).
---
## Consequences Of Violation
Speculative complexity, YAGNI violation, increased maintenance burden.
---
## Rule 5: Write unit tests against domain behavior, not against getter values
---
## Category
Testing
---
## Rule
Test the behavior of domain entities (state transitions, invariant enforcement, side-effect events), not the values of their properties.
---
## Reason
Testing getters creates brittle tests that break on refactoring; testing behavior ensures the domain model is trusted for its logic.
---
## Bad Example
```php
public function test_order_status(): void
{
    $order = new Order();
    $this->assertEquals('pending', $order->status);
}
```
---
## Good Example
```php
public function test_approve_transitions_status(): void
{
    $order = Order::createPending();
    $order->approve();
    $this->assertTrue($order->isApproved());
}

public function test_cannot_approve_twice(): void
{
    $order = Order::createPending();
    $order->approve();
    $this->expectException(DomainException::class);
    $order->approve();
}
```
---
## Exceptions
When the property represents a computed value that is itself a business concept (e.g., `$order->total()` that is calculated).
---
## Consequences Of Violation
Brittle tests, testing implementation not behavior, low test confidence.
