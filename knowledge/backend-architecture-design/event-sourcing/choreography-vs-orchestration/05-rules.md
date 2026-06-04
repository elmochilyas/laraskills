## Rule 1: Prefer choreography for simple workflows; switch to orchestration when complexity requires visibility
---
## Category
Architecture
---
## Rule
Use choreography (each service reacts to events independently) for simple 2–3 step workflows. Switch to orchestration (a dedicated coordinator) when the workflow has branching, error handling, or compensation logic that spans > 3 services.
---
## Reason
Choreography's decentralized nature makes complex workflows hard to trace, debug, and manage; orchestration centralizes coordination logic for visibility.
---
## Bad Example
```
7 microservices each react to events for order fulfillment.
When something fails: "Who is the coordinator? Where is the saga state?" — no one knows.
```
---
## Good Example
```
Simple: Order → Email → Notification (choreography: each reacts independently).
Complex: Order → Payment → Inventory → Shipping → Notification (orchestration: FulfillmentSaga coordinates).
```
---
## Exceptions
When the choreography is simple enough (< 3 steps) and well-monitored with distributed tracing.
---
## Consequences Of Violation
Lost saga state, hard-to-debug failures, incomplete compensations.
---
## Rule 2: Orchestrators must be stateless event handlers, not stateful services
---
## Category
Architecture
---
## Rule
The orchestrator listens for events and issues commands; it should only track workflow progress in an external durable store (database), never in memory.
---
## Reason
In-memory state is lost on restart; fallible orchestrators that lose state leave the saga permanently incomplete.
---
## Bad Example
```php
class OrderSaga
{
    private array $state = []; // in-memory state — lost on restart

    public function onPaymentReceived(PaymentReceived $event): void
    {
        $this->state['payment'] = true;
    }
}
```
---
## Good Example
```php
class OrderSaga
{
    public function __construct(private SagaStateRepository $repo) {}

    public function onPaymentReceived(PaymentReceived $event): void
    {
        $state = $this->repo->find($event->orderId);
        $state->paymentReceived();
        if ($state->canProgress()) {
            $this->commandBus->dispatch(new ReserveInventory($event->orderId));
        }
        $this->repo->save($state);
    }
}
```
---
## Exceptions
When the orchestrator is a transient process that can safely fail and restart (e.g., batch job).
---
## Consequences Of Violation
Lost saga state, stuck workflows, manual recovery needed.
---
## Rule 3: Use orchestrators for sagas that require compensating transactions
---
## Category
Architecture
---
## Rule
When a workflow requires compensating actions on failure (cancel order, refund payment), use an orchestrator that tracks each step and issues compensations in reverse order.
---
## Reason
Choreography's decentralized compensations are hard to coordinate—each service must independently handle failure, leading to incomplete or out-of-order compensations.
---
## Bad Example
```
Order → Payment → Inventory → Shipping
Payment fails. Services independently try to compensate.
Order: cancels. Inventory: releases (but payment never completed). Inconsistent.
```
---
## Good Example
```
Orchestrator: tracks steps [OrderCreated → PaymentReceived → InventoryReserved → Shipped]
On Payment failure: orchestrator issues [ReleaseInventory → CancelOrder] in reverse order.
All compensations tracked to completion.
```
---
## Exceptions
When each service's compensation is idempotent and can be safely retried independently.
---
## Consequences Of Violation
Partial compensations, data inconsistency, manual reconciliation.
---
## Rule 4: Choreography services must not assume order of event delivery
---
## Category
Architecture
---
## Rule
Design each choreography participant to handle out-of-order or duplicate events; use idempotency keys and state-based logic.
---
## Reason
In distributed systems, events may arrive out of order or be redelivered; assuming ordered delivery leads to state corruption.
---
## Bad Example
```php
class InventoryService
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        // Assumes OrderConfirmed always arrives before OrderPlaced
        $this->reserve($event->items);
    }
}
```
---
## Good Example
```php
class InventoryService
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        if ($this->alreadyProcessed($event->eventId)) return;
        if ($this->canReserve($event->items)) {
            $this->reserve($event->items);
        }
    }
}
```
---
## Exceptions
When using a message broker with guaranteed order per partition (Kafka) within the same partition.
---
## Consequences Of Violation
State corruption from out-of-order events.
---
## Rule 5: Monitor choreographed workflows with end-to-end distributed tracing
---
## Category
Reliability
---
## Rule
Implement distributed tracing across all choreography participants so the full workflow can be traced from start to finish.
---
## Reason
Choreography's lack of a central coordinator makes debugging failures difficult; distributed tracing is the only way to see the full picture.
---
## Bad Example
```
Order placed. Email not sent. "Let's check the logs of each service individually."
Spread across 5 services. Takes hours to trace.
```
---
## Good Example
```
Trace ID: order-abc-123
Span 1: OrderService → OrderPlaced (120ms)
Span 2: EmailService → handleOrderPlaced (50ms)
Span 3: EmailService → sendEmail (200ms) ← failure here (SMTP timeout)
Full trace visible in one dashboard.
```
---
## Exceptions
Simple 2-service choreography where log correlation is sufficient.
---
## Consequences Of Violation
Hours of manual debugging, slow incident response, frustrated developers.
