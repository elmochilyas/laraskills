## Rule 1: Assign responsibility to the class that has the information needed to fulfill it
---
## Category
Architecture
---
## Rule
When a responsibility requires data, assign it to the class that already owns or has access to that data. This minimizes data passing and keeps behavior with data.
---
## Reason
The Information Expert pattern keeps data and behavior together, maintaining encapsulation and avoiding "data classes" that are manipulated externally.
---
## Bad Example
```php
// Service calculates total using Order's data
class OrderService
{
    public function calculateTotal(Order $order): Money
    {
        $total = 0;
        foreach ($order->getItems() as $item) {
            $total += $item->getPrice() * $item->getQuantity();
        }
        return new Money($total);
    }
}
```
---
## Good Example
```php
class Order
{
    /** @param OrderItem[] $items */
    public function __construct(
        private array $items
    ) {}

    public function total(): Money
    {
        return array_reduce(
            $this->items,
            fn(Money $carry, OrderItem $item) => $carry->add($item->subtotal()),
            new Money(0)
        );
    }
}
```
---
## Exceptions
When the data spans multiple objects and no single class is the natural expert; use a Domain Service.
---
## Consequences Of Violation
Anemic domain model, scattered logic, poor encapsulation.
---
## Rule 2: Avoid "get-then-operate" patterns—move the operation to the data holder
---
## Category
Architecture
---
## Rule
If you find yourself calling multiple getters and then applying logic to the results, move that logic into the class that holds the data.
---
## Reason
Get-then-operate patterns produce anemic models and duplicate logic across every place that performs the same operation.
---
## Bad Example
```php
if ($order->getStatus() === 'pending' && $order->getCreatedAt()->diffInHours() > 24) {
    $order->setStatus('cancelled');
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
When the operation depends on data from multiple unrelated objects; use a Domain Service.
---
## Consequences Of Violation
Anemic domain, logic duplication, SRP violation in clients.
---
## Rule 3: Information Expert often conflicts with Low Coupling—privilege the latter
---
## Category
Architecture
---
## Rule
When assigning a responsibility to the Information Expert would create excessive coupling, instead assign it to a less-coupled class and pass the needed data.
---
## Reason
Low coupling is generally more important than perfect information locality; tightly coupling two classes to keep data with behavior can be worse than passing data.
---
## Bad Example
```php
// Putting reporting logic in Order (the expert) couples Order to Report infrastructure
class Order
{
    public function toCsvReport(): string { /* requires CSV library */ }
    public function toPdfReport(): string { /* requires PDF library */ }
}
```
---
## Good Example
```php
// Delegate reporting to a ReportGenerator, passing Order data
class ReportGenerator
{
    public function generateCsv(Order $order): string { /* ... */ }
    public function generatePdf(Order $order): string { /* ... */ }
}
```
---
## Exceptions
When the coupling is low-risk (both classes are in the same module and change together).
---
## Consequences Of Violation
Tight coupling, SRP violation, hard to test.
---
## Rule 4: Disjoint experts for different operations—each operation has its own expert
---
## Category
Architecture
---
## Rule
Different operations have different Information Experts; do not force all operations into one class just because it's an expert for some.
---
## Reason
One class being the expert for all operations leads to God classes; different operations naturally require different experts.
---
## Bad Example
```php
class Order // God class: expert for everything about orders
{
    public function calculateTotal(): Money { /* ... */ }
    public function calculateTax(): Money { /* ... */ }
    public function generateInvoice(): Invoice { /* ... */ }
    public function scheduleShipping(): void { /* ... */ }
    public function validatePayment(): void { /* ... */ }
}
```
---
## Good Example
```php
class Order { /* order-specific behavior only */ }
class TaxCalculator { /* tax-specific data and behavior */ }
class InvoiceGenerator { /* invoice-specific data and behavior */ }
class ShippingScheduler { /* shipping-specific data and behavior */ }
```
---
## Exceptions
When the operations are inherently part of the aggregate's invariant enforcement (they belong in the aggregate root).
---
## Consequences Of Violation
God classes, low cohesion, SRP violation.
