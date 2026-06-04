# Rules: Event sourcing fundamentals

## Rule 1: Use snapshots for performance
---
## Category
Performance
---
## Configure periodic snapshots for every event-sourced aggregate. Never replay all events from the beginning on every aggregate load.
---
## Reason
Without snapshots, event replay time grows linearly with the event stream length. A 100,000-event aggregate loads slowly on every request. Snapshots store aggregate state at a point, so only events after the snapshot need replaying.
---
## Bad Example
```php
// No snapshot — replays all events every time
class OrderAggregate
{
    private array $events = [];
    private int $version = 0;

    public static function loadFromStream(string $id): self
    {
        $aggregate = new self($id);
        $events = EventStore::getEvents($id); // All events, ever

        foreach ($events as $event) {
            $aggregate->applyEvent($event); // Replays 100K events...
        }

        return $aggregate;
    }
}
```
---
## Good Example
```php
// With snapshot — loads from snapshot, replays only new events
class OrderAggregate
{
    private array $events = [];
    private int $version = 0;

    public static function loadFromStream(string $id): self
    {
        $snapshot = SnapshotStore::get($id);
        $aggregate = $snapshot !== null
            ? $snapshot->aggregate
            : new self($id);

        $fromVersion = $snapshot?->version ?? 0;
        $newEvents = EventStore::getEventsSince($id, $fromVersion);

        foreach ($newEvents as $event) {
            $aggregate->applyEvent($event);
        }

        return $aggregate;
    }

    public function takeSnapshot(): void
    {
        SnapshotStore::save(new Snapshot(
            aggregateId: $this->id,
            aggregate: clone $this,
            version: $this->version,
        ));
    }
}
```
---
## Exceptions
Aggregates with very few events (under 100) where replay cost is negligible.
---
## Consequences Of Violation
Loading aggregates gets progressively slower; request timeouts as event streams grow; application becomes unusable for long-lived aggregates.
---

## Rule 2: Never modify or delete events
---
## Category
Reliability | Maintainability
---
## Treat the event store as strictly append-only. Never update or delete events that have been committed.
---
## Reason
Events are immutable facts. Modifying or deleting them breaks projections, invalidates audit trails, and produces non-deterministic replay results. If events need correcting, append a correction event.
---
## Bad Example
```php
// Mutating a committed event — breaks everything
$event = EventStore::find('evt_456');
$event->payload = ['total' => 150.00]; // Mutation!
$event->save();
```
---
## Good Example
```php
// Correction event — preserves immutability
class OrderTotalCorrected
{
    public function __construct(
        public readonly string $orderId,
        public readonly float $previousTotal,
        public readonly float $correctedTotal,
        public readonly string $reason,
        public readonly CarbonImmutable $correctedAt,
    ) {}
}

// Append the correction — facts remain, correction is a new fact
EventStore::append($orderId, new OrderTotalCorrected(
    orderId: $orderId,
    previousTotal: 100.00,
    correctedTotal: 150.00,
    reason: 'Tax miscalculation corrected',
    correctedAt: now()->toImmutable(),
));
```
---
## Exceptions
None. Events are immutable by definition.
---
## Consequences Of Violation
Projections produce different results on replay; audit trail is destroyed; legal and compliance violations; debugging impossible because event history is unreliable.
---

## Rule 3: Use event sourcing selectively
---
## Category
Architecture | Maintainability
---
## Apply event sourcing only to aggregates that genuinely need audit trails, temporal queries, or replayable projections. Never apply event sourcing to every entity in the system.
---
## Reason
Event sourcing adds significant complexity: event store, snapshots, projections, eventual consistency. Applying it to entities that don't need audit trails or temporal queries creates unnecessary maintenance burden.
---
## Bad Example
```php
// Event sourcing for a simple blog comment — unnecessary complexity
class CommentAggregate
{
    use EventSourcing;

    public function postComment(string $text): void
    {
        $this->recordThat(new CommentPosted(
            commentId: $this->id,
            text: $text,
        ));
    }
}
```
---
## Good Example
```php
// Event sourcing for financial entity that needs audit trail
class InvoiceAggregate
{
    use EventSourcing;

    public function issue(Customer $customer, float $amount): void
    {
        $this->recordThat(new InvoiceIssued(
            invoiceId: $this->id,
            customerId: $customer->id,
            amount: $amount,
        ));
    }

    public function markAsPaid(string $paymentReference): void
    {
        $this->recordThat(new InvoicePaid(
            invoiceId: $this->id,
            paymentReference: $paymentReference,
        ));
    }
}

// Simple entity — no event sourcing
class BlogComment
{
    use HasTimestamps;

    public function __construct(
        public string $id,
        public string $postId,
        public string $text,
    ) {}
}
```
---
## Exceptions
Greenfield projects where event sourcing is the primary architectural choice may use it broadly, but this should be an explicit decision, not a default.
---
## Consequences Of Violation
Unnecessary complexity for simple entities; increased storage costs; slower development velocity; team confusion about when to use event sourcing.
---

## Rule 4: Make projections idempotent
---
## Category
Reliability | Testing
---
## Ensure every projection handler is idempotent: processing the same event multiple times produces the same result.
---
## Reason
Projections are rebuilt from scratch by replaying all events during schema migrations or bug fixes. If projections are not idempotent, replays produce incorrect results. Idempotency also handles duplicate event delivery.
---
## Bad Example
```php
class OrderProjection
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        DB::table('order_summaries')->insert([
            'id' => $event->orderId,
            'total' => $event->total,
            'status' => 'placed',
        ]);
        // If replayed: duplicate key error or duplicate rows!
    }
}
```
---
## Good Example
```php
class OrderProjection
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        DB::table('order_summaries')->updateOrInsert(
            ['id' => $event->orderId], // Match condition
            [
                'total' => $event->total,
                'status' => 'placed',
                'updated_at' => now(),
            ],
        );
        // Replaying the same event: updates existing row (idempotent)
    }

    public function onOrderShipped(OrderShipped $event): void
    {
        DB::table('order_summaries')
            ->where('id', $event->orderId)
            ->update([
                'status' => 'shipped',
                'tracking' => $event->trackingNumber,
            ]);
        // Replaying: sets tracking again — same result
    }
}
```
---
## Exceptions
Append-only projections (e.g., audit logs) where each event adds a row. Use event IDs as unique keys to prevent duplicates on replay.
---
## Consequences Of Violation
Rebuilding projections produces incorrect state; duplicate event delivery corrupts read models; schema migrations require manual data fixup.
---

## Rule 5: Version events in the event store
---
## Category
Maintainability
---
## Store a version or event type identifier with every event in the store. Never evolve event schemas without versioning.
---
## Reason
Events live forever. As the system evolves, event schemas change. Without versioning, old events in the store cannot be deserialized by current code, making replay and projections impossible.
---
## Bad Example
```php
// No version — cannot distinguish old format from new
EventStore::append($orderId, [
    'event_type' => 'OrderPlaced',
    'order_id' => $orderId,
    'total' => 100.00,
    // Later: field renamed from 'total' to 'amount' — old events break
]);
```
---
## Good Example
```php
// Versioned event storage
class StoredEvent
{
    public function __construct(
        public readonly string $eventId,
        public readonly string $aggregateId,
        public readonly string $eventType,
        public readonly int $eventVersion, // Schema version
        public readonly array $payload,
        public readonly CarbonImmutable $occurredAt,
    ) {}
}

// Upcaster handles schema evolution
class OrderPlacedUpcaster
{
    public function upcast(StoredEvent $event): array
    {
        return match ($event->eventVersion) {
            1 => [
                'aggregateId' => $event->aggregateId,
                'orderId' => $event->payload['order_id'],
                'total' => $event->payload['total'],
            ],
            2 => $event->payload, // Current version — no transformation needed
            default => throw new UnsupportedEventVersion($event->eventVersion),
        };
    }
}
```
---
## Exceptions
Events that are guaranteed to never change (rare — only system-level lifecycle events).
---
## Consequences Of Violation
Event replay breaks on old events; projections fail during rebuild; migration requires complex one-off scripts; event store becomes a liability instead of an asset.
---
