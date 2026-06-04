## Rule 1: Domain events are recorded as part of the aggregate's state; integration events are published for external consumption
---
## Category
Architecture
---
## Rule
Domain events are produced by aggregates and stored as part of the event stream (event sourcing) or raised within the boundary (standard). Integration events are published to a message broker for other services/contexts.
---
## Reason
Domain events represent what happened in the domain; integration events represent the notification to the outside world. Mixing them conflates internal state changes with external contracts.
---
## Bad Example
```php
// Domain event and integration event are the same object
class OrderPlaced
{
    // Used both as event store record and Kafka message
}
```
---
## Good Example
```php
// Domain event (recorded in event store)
class OrderPlaced
{
    public function __construct(
        public readonly OrderId $orderId,
        public readonly OrderData $data
    ) {}
}

// Integration event (published to message broker)
class OrderPlacedIntegration
{
    public function __construct(
        public readonly string $orderId,
        public readonly array $orderData,
        public readonly string $version = '1.0'
    ) {}
}
```
---
## Exceptions
When the domain event and integration event have identical structure and the same consumers (small systems with one consumer).
---
## Consequences Of Violation
Tight coupling between internal state and external contract, versioning conflicts.
---
## Rule 2: Integration events must be versioned independently from domain events
---
## Category
Architecture
---
## Rule
Apply semver to integration events; a breaking change to an integration event increments its version. Domain events are immutable once recorded.
---
## Reason
Domain events are historical records that never change; integration events are contracts with external consumers that may evolve.
---
## Bad Example
```
Domain event OrderPlaced changes signature (adds new field).
Integration event is the same object—breaks all consumers.
```
---
## Good Example
```
Domain event OrderPlaced (v1): recorded in event store, never changes.
Integration event OrderPlacedIntegrationV1 → OrderPlacedIntegrationV2 (with new fields).
Both versions coexist during migration.
```
---
## Exceptions
When the integration event is internal to the same bounded context (not truly an integration).
---
## Consequences Of Violation
Consumer breakage on domain schema changes, impossible to evolve contract.
---
## Rule 3: Translate domain events to integration events in a projector or publisher
---
## Category
Architecture
---
## Rule
A dedicated projector/publisher reads domain events and translates them into integration events for external consumption; aggregates must not publish integration events directly.
---
## Reason
Aggregates should not be aware of external messaging concerns; translation isolates domain from infrastructure.
---
## Bad Example
```php
class Order
{
    public function place(): void
    {
        // ...
        $this->publisher->publish('order.placed', $this->data); // aggregate knows about messaging
    }
}
```
---
## Good Example
```php
class Order
{
    public function place(): void
    {
        // ...
        $this->record(new OrderPlaced($this->id, $this->data)); // aggregate records domain event
    }
}

class OrderIntegrationPublisher
{
    public function __invoke(OrderPlaced $event): void
    {
        $integration = new OrderPlacedIntegration(
            orderId: (string) $event->orderId,
            orderData: $event->data->toArray(),
            version: '2.0'
        );
        $this->messageBus->publish('order.placed', $integration);
    }
}
```
---
## Exceptions
When the system is too small to warrant separate transformation (domain event is the integration event one-to-one).
---
## Consequences Of Violation
Aggregate awareness of external infrastructure, coupling domain to messaging.
---
## Rule 4: Integration events must be backward-compatible; use extended fields for additions
---
## Category
Architecture
---
## Rule
When adding fields to an integration event, use optional fields with defaults so existing consumers are not required to change.
---
## Reason
Breaking integration events force all consumers to update simultaneously, defeating the purpose of event-driven decoupling.
---
## Bad Example
```
Integration event OrderPlaced adds required field "customerVipStatus".
All consumers break immediately on deploy.
```
---
## Good Example
```
Integration event OrderPlaced adds optional field "customer_vip_status" with default null.
Existing consumers: ignore new field.
New consumers: use the field.
```
---
## Exceptions
Security or compliance changes where old consumers must not have access to old data format.
---
## Consequences Of Violation
Coordinated deployments, consumer breakage, trust erosion.
---
## Rule 5: Store integration events in the outbox before publishing (guaranteed delivery)
---
## Category
Reliability
---
## Rule
Write integration events to an outbox table in the same database transaction as the aggregate change; a separate publisher reads and sends them to the broker.
---
## Reason
Without an outbox, publishing an integration event can fail after the database write, causing inconsistency (event lost, data saved).
---
## Bad Example
```php
DB::transaction(fn () => {
    $order->save();
    $this->bus->publish(new OrderPlacedIntegration(...)); // If publish fails, event lost
});
```
---
## Good Example
```php
DB::transaction(fn () => {
    $order->save();
    Outbox::create(['type' => 'order.placed', 'payload' => json_encode($event)]);
});
// OutboxPublisher picks up and sends asynchronously
```
---
## Exceptions
When the message broker supports distributed transactions (XA) and the team accepts the complexity.
---
## Consequences Of Violation
Lost events, silent data inconsistency, missing notifications.
