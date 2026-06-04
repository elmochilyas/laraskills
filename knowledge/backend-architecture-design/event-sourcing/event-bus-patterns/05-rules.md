## Rule 1: Use queues (message broker) for async integration events; use in-memory dispatch for domain events
---
## Category
Architecture
---
## Rule
Domain events within a bounded context should be dispatched synchronously (in-memory). Integration events across contexts must go through a durable message broker.
---
## Reason
In-memory dispatch for domain events is simple, consistent, and has no infrastructure overhead. Cross-context events require durability and async delivery.
---
## Bad Example
```
Domain events go through RabbitMQ: overhead, latency, serialization for no benefit.
Integration events dispatched in-memory: lost on crash, no durability.
```
---
## Good Example
```
Domain events: dispatched synchronously in-memory (Laravel events).
Integration events: published to RabbitMQ/Kafka with outbox pattern.
```
---
## Exceptions
When the domain event handler has side effects that must survive process restart (use queue).
---
## Consequences Of Violation
Over-engineered domain events, lost integration events.
---
## Rule 2: Choose event bus topology (topic exchange vs. direct exchange) based on consumer types
---
## Category
Architecture
---
## Rule
Use topic exchanges for broadcast events (multiple consumers, different types); use direct exchanges for point-to-point commands. Document the rationale.
---
## Reason
Wrong topology leads to routing problems: direct exchanges for broadcast events require multiple bindings; topic exchanges for commands add unnecessary complexity.
---
## Bad Example
```
All events through a direct exchange — 50 bindings per event type.
Every new consumer: add another binding. Binds become unmaintainable.
```
---
## Good Example
```
Topic exchange: "order.placed" → consumers: EmailService, InventoryService, Analytics
Direct exchange: "reserve.inventory" → consumer: InventoryService only
```
---
## Exceptions
When the message broker is abstracted behind a high-level library that handles routing strategy.
---
## Consequences Of Violation
Unmaintainable routing, cryptic binding configurations.
---
## Rule 3: Implement at-least-once delivery with idempotent consumers
---
## Category
Reliability
---
## Rule
Configure the event bus for at-least-once delivery; design all consumers to be idempotent (processing the same event twice produces the same result).
---
## Reason
At-most-once delivery loses events; exactly-once delivery is extremely hard in distributed systems. At-least-once with idempotent consumers is the practical sweet spot.
---
## Bad Example
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        OrderReadModel::create($event->data); // duplicate if event re-delivered
    }
}
```
---
## Good Example
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        if (ProcessedEvent::where('event_id', $event->eventId)->exists()) {
            return; // idempotency check
        }
        OrderReadModel::updateOrCreate(
            ['order_id' => $event->orderId],
            $event->data
        );
        ProcessedEvent::create(['event_id' => $event->eventId]);
    }
}
```
---
## Exceptions
When the event is a pure notification with no state change (e.g., "cache was invalidated").
---
## Consequences Of Violation
Duplicate data, double processing, state corruption.
---
## Rule 4: Monitor event bus latency and backlog as key health metrics
---
## Category
Reliability
---
## Rule
Track: (a) event production-to-consumption latency, (b) queue depth/backlog size, (c) dead letter queue depth. Alert on anomalies.
---
## Reason
Event-driven systems fail silently; a growing backlog or high latency indicates a problem before users notice.
---
## Bad Example
```
No monitoring. "Orders are processing fine."
Reality: 10K events backed up in the queue, taking 15 minutes to drain.
```
---
## Good Example
```php
Metrics::gauge('event_bus.backlog_size', $queueSize, ['queue' => 'orders']);
Metrics::histogram('event_bus.latency_ms', $latency, ['event' => 'OrderPlaced']);
Alert: backlog > 1000 for 5 minutes.
```
---
## Exceptions
Low-volume systems (100 events/day) where monitoring overhead outweighs benefit.
---
## Consequences Of Violation
Undetected consumer lag, prolonged outages, user-facing staleness.
---
## Rule 5: Never couple event bus topology to domain classes
---
## Category
Architecture
---
## Rule
Event classes should not contain routing information, serialization format hints, or broker-specific annotations. Routing belongs in infrastructure configuration.
---
## Reason
Domain events coupled to infrastructure make changing event buses (e.g., from RabbitMQ to Kafka) a domain change instead of an infrastructure change.
---
## Bad Example
```php
class OrderPlaced
{
    public string $routingKey = 'orders.placed'; // topology in domain
}
```
---
## Good Example
```php
// Domain event — pure data
class OrderPlaced
{
    public function __construct(
        public readonly OrderId $orderId,
        public readonly array $data
    ) {}
}

// Infrastructure configuration
EventBusConfig::bind('OrderPlaced', 'order.placed', 'topic_exchange');
```
---
## Exceptions
When using metadata attributes that are framework-level, not bus-specific (e.g., `#[ShouldQueue]`).
---
## Consequences Of Violation
Infrastructure coupling, difficult event bus migration.
