## Rule 1: Domain Model incorporates both data and behavior
---
## Category
Architecture
---
## Rule
Domain Model classes contain both state (data) and behavior (methods that enforce business rules and invariants). Anemic data-only classes are not Domain Models.
---
## Reason
Separating data and behavior (anemic model) places business logic in services, scattering it and making it hard to find, test, and reuse.
---
## Bad Example
```php
class Order
{
    public string $status; // public property, no behavior
    public float $total;
}
// Business logic in service:
$order->status = 'approved'; // external mutation
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

    public function isApproved(): bool
    {
        return $this->status->equals(OrderStatus::Approved);
    }
}
```
---
## Exceptions
DTOs, CQRS read models, and simple data structures that intentionally have no behavior.
---
## Consequences Of Violation
Anemic domain model, scattered business logic, SRP violation in services.
---
## Rule 2: Use Domain Model when business logic is complex with many interacting rules
---
## Category
Architecture
---
## Rule
Use Domain Model when the business logic has: multiple interacting rules, invariants that must be enforced, complex state transitions, or rules that change frequently.
---
## Reason
Simple Transaction Script or Table Module patterns are better for simple CRUD; Domain Model adds beneficial structure only when logic is complex.
---
## Bad Example
```php
// Transaction Script for a complex domain with 50 business rules
class LoanApplicationScript
{
    public function execute(array $data): void
    {
        // 500 lines of procedural logic — hard to maintain
    }
}
```
---
## Good Example
```php
// Domain Model: LoanApplication, CreditScore, Collateral, etc.
// Each class encapsulates its behavior and rules
class LoanApplication
{
    public function evaluate(CreditScore $score, Collateral $collateral): Decision
    {
        if ($score->isBelowThreshold()) {
            return Decision::reject('Low credit score');
        }
        if (!$collateral->covers($this->amount)) {
            return Decision::reject('Insufficient collateral');
        }
        return Decision::approve();
    }
}
```
---
## Exceptions
Simple CRUD applications with minimal business rules (use Transaction Script or Active Record).
---
## Consequences Of Violation
Massive procedural scripts, hard-to-test business rules, maintenance burden.
---
## Rule 3: Domain Model classes should be unit-testable without infrastructure
---
## Category
Testing
---
## Rule
Domain Model classes should be testable with plain PHPUnit tests—no database, no HTTP, no framework.
---
## Reason
If Domain Model tests require infrastructure, the model is coupled to infrastructure and not a true Domain Model.
---
## Bad Example
```php
class OrderTest
{
    public function test_approve(): void
    {
        $order = Order::find(1); // requires database
        $order->approve();
    }
}
```
---
## Good Example
```php
class OrderTest
{
    public function test_approve(): void
    {
        $order = new Order(OrderStatus::Pending, new Money(100));
        $order->approve();
        $this->assertTrue($order->isApproved());
    }
}
```
---
## Exceptions
When the domain logic naturally requires a repository for invariant enforcement (rare; use domain service instead).
---
## Consequences Of Violation
Slow tests, infrastructure dependency, not a true domain model.
