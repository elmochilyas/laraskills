## Rule 1: An event-sourced aggregate records domain events, not state snapshots
---
## Category
Architecture
---
## Rule
Aggregates in event sourcing record events representing state changes; the current state is derived by replaying events. Never persist the aggregate's state directly and never mix write-model state with event stream.
---
## Reason
Persisting state alongside events defeats event sourcing's purpose: you lose the audit trail and cannot reconstruct past states.
---
## Bad Example
```php
class Order
{
    public function place(): void
    {
        $this->status = 'placed'; // state mutation
        Event::save(new OrderPlaced($this->id)); // also save event
        // State and event both persisted — but state is the source of truth
    }
}
```
---
## Good Example
```php
class Order extends EventSourcedAggregate
{
    private OrderStatus $status;

    public function place(): void
    {
        $this->record(new OrderPlaced($this->id));
    }

    public function applyOrderPlaced(OrderPlaced $event): void
    {
        $this->status = OrderStatus::Placed;
    }
}
```
---
## Exceptions
Snapshotting for performance: persist the state at event N to avoid replaying all events from the beginning.
---
## Consequences Of Violation
Event sourcing anti-pattern, lost audit trail, wrong architecture.
---
## Rule 2: Store the event stream in an append-only store—never update or delete past events
---
## Category
Architecture
---
## Rule
The event store is append-only; past events must never be modified, deleted, or reordered. Correction events (e.g., OrderCorrected) are appended for corrections.
---
## Reason
Mutating past events breaks the audit trail, invalidates projections, and destroys the system's trustworthiness.
---
## Bad Example
```
Bug in OrderPlaced event data. Developer directly edits the event in database.
Result: all projections and replays now show different history.
```
---
## Good Example
```
Bug discovered. Developer appends OrderCorrected event with corrected data.
Result: audit trail preserved, replays correct, projections rebuildable.
```
---
## Exceptions
When a legal/compliance requirement demands physical deletion of PII (GDPR right to erasure — use anonymization event, not deletion).
---
## Consequences Of Violation
Broken audit trail, projection inconsistencies, lost trust.
---
## Rule 3: Separate event store from read models — store once, project many times
---
## Category
Architecture
---
## Rule
The event store is the single source of truth; read models are derived projections. Never write to read models directly; always project from events.
---
## Reason
Direct writes to read models bypass the event store, creating multiple sources of truth that will inevitably diverge.
---
## Bad Example
```php
class PlaceOrderHandler
{
    public function handle(PlaceOrder $command): void
    {
        $this->eventStore->append(new OrderPlaced(...));
        OrderReadModel::create([...]); // dual write to read model
    }
}
```
---
## Good Example
```php
class PlaceOrderHandler
{
    public function handle(PlaceOrder $command): void
    {
        $this->eventStore->append(new OrderPlaced(...));
    }
}

class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        OrderReadModel::create($event->data); // projected from event
    }
}
```
---
## Exceptions
When building a new projection that requires backfilling from existing data.
---
## Consequences Of Violation
Multiple sources of truth, data divergence, lost event sourcing benefits.
---
## Rule 4: Use upcasters for event schema evolution, not migrations
---
## Category
Architecture
---
## Rule
When an event's schema changes, write an upcaster that transforms the old event format to the new format during replay. Never run SQL migrations on the event store.
---
## Reason
Event store is append-only; SQL migrations on events change history, breaking the audit trail and replays.
---
## Bad Example
```sql
ALTER TABLE events MODIFY payload ... -- modifies stored events
```
---
## Good Example
```php
class OrderPlacedUpcaster implements Upcaster
{
    public function canUpcast(StoredEvent $event): bool
    {
        return $event->type === 'OrderPlaced' && !isset($event->payload['currency']);
    }

    public function upcast(StoredEvent $event): StoredEvent
    {
        $payload = $event->payload;
        $payload['currency'] = 'USD'; // default for old events
        return $event->withPayload($payload);
    }
}
```
---
## Exceptions
When the event store technology physically requires schema changes (rare; most store JSONB or similar).
---
## Consequences Of Violation
Corrupted event history, broken replays, lost audit trail.
---
## Rule 5: Implement snapshots for aggregates with long event streams (> 100 events)
---
## Category
Reliability
---
## Rule
For aggregates that accumulate more than 100 events, persist a periodic snapshot of the state to avoid replaying the entire stream on every load.
---
## Reason
Loading an aggregate with 1000+ events by replaying all of them is slow; snapshots provide a fast-forward mechanism.
---
## Bad Example
```php
// Load order with 500 events, replay all 500 every time
$order = Order::load($orderId); // slow
```
---
## Good Example
```php
// Load snapshot at event 480, replay only events 481–500
$order = Order::load($orderId, snapshotFrequency: 100); // fast
```
---
## Exceptions
When aggregate streams are always short (< 50 events) and replay is fast enough.
---
## Consequences Of Violation
Poor performance on stream replay, slow aggregate loading.
