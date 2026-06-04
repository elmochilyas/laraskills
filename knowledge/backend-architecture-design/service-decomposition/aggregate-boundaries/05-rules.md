## Rule 1: An aggregate root is the only entry point for modifying its members
---
## Category
Architecture
---
## Rule
All changes to entities within an aggregate must go through the aggregate root. External code must never directly modify child entities.
---
## Reason
Bypassing the aggregate root allows direct modification of child entities, circumventing invariant enforcement and consistency rules.
---
## Bad Example
```php
$order = Order::find($id);
$order->items()->create([...]); // bypasses aggregate root
```
---
## Good Example
```php
$order = Order::find($id);
$order->addItem(ItemData::fromRequest($request)); // through aggregate root
```
---
## Exceptions
Bulk operations for reporting/analytics where invariants are explicitly bypassed and documented.
---
## Consequences Of Violation
Bypassed invariants, inconsistent aggregate state.
---
## Rule 2: Keep aggregates small—reference other aggregates by identity, not by object reference
---
## Category
Architecture
---
## Rule
An aggregate should hold a reference to other aggregates by their ID (e.g., `CustomerId`), not by object reference. Only the root and its owned entities exist within the aggregate.
---
## Reason
Object references across aggregates create coupling and load overhead—every time you load the aggregate, you load its related aggregates too.
---
## Bad Example
```php
class Order
{
    private Customer $customer; // full object reference — loads entire Customer aggregate
}
```
---
## Good Example
```php
class Order
{
    private CustomerId $customerId; // identity reference only

    public function customerId(): CustomerId
    {
        return $this->customerId;
    }
}
```
---
## Exceptions
When the referenced aggregate is a true descendant (not a separate aggregate) and belongs within the same consistency boundary.
---
## Consequences Of Violation
Unnecessary object loading, implicit coupling, large aggregate graphs.
---
## Rule 3: One transaction per aggregate—never modify multiple aggregates in one transaction
---
## Category
Architecture
---
## Rule
A single request/transaction must modify at most one aggregate root. Multi-aggregate changes must use eventual consistency (events/sagas).
---
## Reason
Modifying multiple aggregates in one transaction removes the aggregate boundary's purpose and creates lock contention.
---
## Bad Example
```php
DB::transaction(function () {
    $order = Order::find($id);
    $order->complete();
    $customer = Customer::find($customerId);
    $customer->incrementOrderCount(); // second aggregate in same transaction
});
```
---
## Good Example
```php
// Modify one aggregate
$order->complete();
$this->repo->save($order);
// Publish event for eventual consistency
$this->events->dispatch(new OrderCompleted($order->id(), $order->customerId()));
```
---
## Exceptions
When the aggregates are truly inseparable (same bounded context, same consistency requirement) and documented in ADR.
---
## Consequences Of Violation
Lock contention, transaction conflicts, aggregate boundary erosion.
---
## Rule 4: Define aggregate boundaries by consistency requirements, not by data relationships
---
## Category
Architecture
---
## Rule
An aggregate includes the entities that must be consistent together. If two entities can be temporarily inconsistent, they belong in different aggregates.
---
## Reason
Data relationships (foreign keys) don't imply consistency requirements; forcing strongly consistent updates across loosely-coupled entities creates unnecessary transaction contention.
---
## Bad Example
```
"Order has items, and order has payment." → One aggregate.
But payment may need separate consistency rules.
```
---
## Good Example
```
Order aggregate: Order + OrderItems (must be consistent).
Payment aggregate: Payment (consistency through saga).
If payment fails, order can still exist (eventual consistency).
```
---
## Exceptions
When the business requires strong consistency across entities that would normally be separate aggregates.
---
## Consequences Of Violation
Unnecessarily large aggregates, transaction contention, performance issues.
---
## Rule 5: Publish domain events from aggregate roots for side effects
---
## Category
Architecture
---
## Rule
Aggregate roots should publish domain events when state changes; application services subscribe to these events to trigger side effects.
---
## Reason
Aggregates that directly trigger side effects (email, API calls) are coupled to infrastructure and violate SRP.
---
## Bad Example
```php
class Order
{
    public function complete(): void
    {
        $this->status = OrderStatus::Completed;
        Mail::to($this->customerEmail)->send(new OrderConfirmation($this));
        // side effect in aggregate
    }
}
```
---
## Good Example
```php
class Order
{
    public function complete(): void
    {
        $this->status = OrderStatus::Completed;
        $this->record(new OrderCompleted($this->id, $this->customerId));
    }
}
// Application service handles side effect
class OrderCompletionService
{
    public function onOrderCompleted(OrderCompleted $event): void
    {
        $this->mailer->sendConfirmation($event->orderId);
    }
}
```
---
## Exceptions
When the side effect is a fundamental part of the aggregate's invariant (e.g., "order must send confirmation to be completed").
---
## Consequences Of Violation
SRP violation, infrastructure coupling, hard-to-test aggregates.
