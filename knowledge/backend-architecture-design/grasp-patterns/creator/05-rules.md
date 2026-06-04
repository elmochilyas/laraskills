## Rule 1: Assign creation responsibility to the class that has the data needed to create
---
## Category
Architecture
---
## Rule
Class B should be responsible for creating instances of Class A if B: (a) contains or composes A, (b) closely uses A, (c) has the initializing data for A, or (d) records instances of A.
---
## Reason
The Creator pattern assigns creation to the class that naturally has the context and data, avoiding scattered creation logic and maintaining encapsulation.
---
## Bad Example
```php
// Service creates InvoiceLineItem without having the data
class InvoiceService
{
    public function createInvoice(array $data): Invoice
    {
        $items = [];
        foreach ($data['items'] as $itemData) {
            $items[] = new InvoiceLineItem(/* ... */);
        }
        // ...
    }
}
```
---
## Good Example
```php
// Invoice creates its own line items — it has the context
class Invoice
{
    /** @param LineItemData[] $itemsData */
    public static function create(array $itemsData): self
    {
        $items = array_map(
            fn(LineItemData $d) => new LineItem($d->description, new Money($d->amount)),
            $itemsData
        );
        return new self($items);
    }
}
```
---
## Exceptions
When creation is complex and a dedicated Factory is more appropriate (Factory pattern).
---
## Consequences Of Violation
Creation logic scattered, classes don't own their children.
---
## Rule 2: Use Factory (not Creator) when creation logic is complex or requires configuration
---
## Category
Architecture
---
## Rule
When creating an object requires: conditional logic, configuration, or assembling parts from different sources, delegate creation to a Factory instead of using the Creator pattern.
---
## Reason
Complex creation logic in the creator violates SRP; Factories encapsulate that complexity.
---
## Bad Example
```php
class Order
{
    public static function fromCheckout(array $cartData, Customer $customer): self
    {
        // Complex logic: validate cart, apply discounts, calculate tax, create items
        // Order should not know all this
    }
}
```
---
## Good Example
```php
class OrderFactory
{
    public function createFromCheckout(CheckoutData $data): Order
    {
        $items = $this->createItems($data->cart);
        $total = $this->calculateTotal($items, $data->customer);
        return Order::create($items, $total);
    }
}
```
---
## Exceptions
When the creation logic is trivial (just `new` with no transformation).
---
## Consequences Of Violation
SRP violation in creator, complex creation mixed with domain logic.
---
## Rule 3: Aggregate roots create their own child entities
---
## Category
Architecture
---
## Rule
The aggregate root is responsible for creating its child entities and value objects; external code must go through the root to create children.
---
## Reason
Allowing external code to create children directly bypasses aggregate invariants and consistency rules.
---
## Bad Example
```php
$order = Order::find($id);
$item = new OrderItem(/* ... */); // created outside the aggregate
$order->items->add($item); // bypasses invariant checks
```
---
## Good Example
```php
$order = Order::find($id);
$order->addItem($itemData); // aggregate root creates and validates
```
---
## Exceptions
Performance bulk operations where the aggregate root is temporarily bypassed with explicit documentation.
---
## Consequences Of Violation
Bypassed invariants, inconsistent aggregate state.
---
## Rule 4: Prefer static factory methods over `new` for domain object construction
---
## Category
Architecture
---
## Rule
Provide named static factory methods (e.g., `Order::fromCart()`, `Money::fromFloat()`) instead of public constructors for domain objects.
---
## Reason
Named factories communicate intent and allow different creation paths with different names, unlike a single constructor.
---
## Bad Example
```php
$order = new Order($customer, $items, $payment, $shipping); // unclear intent
```
---
## Good Example
```php
$order = Order::fromCart($customer, $cart);
$order = Order::fromSubscription($customer, $plan); // different intent, different method
```
---
## Exceptions
Value objects and simple DTOs where `new` is clear enough (e.g., `new Money(100, 'USD')`).
---
## Consequences Of Violation
Unclear creation intent, multiple construction paths in one constructor.
