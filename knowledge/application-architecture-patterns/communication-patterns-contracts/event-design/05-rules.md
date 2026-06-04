# Rules: Event design patterns

## Rule 1: Default to fat events
---
## Category
Design | Maintainability
---
## Include all data the consumer is likely to need in the event payload. Avoid thin events that carry only IDs.
---
## Reason
Thin events force consumers to query the producer to act on the event, creating temporal coupling and additional network round-trips. Fat events make consumers self-sufficient.
---
## Bad Example
```php
// Thin event — consumer must query the order service
class OrderPlaced
{
    public function __construct(
        public readonly string $orderId, // Only ID — consumer must fetch everything
    ) {}
}
```
---
## Good Example
```php
// Fat event — consumer has everything needed
class OrderPlaced
{
    public function __construct(
        public readonly string $orderId,
        public readonly string $customerId,
        public readonly string $customerEmail,
        public readonly float $total,
        public readonly string $currency,
        public readonly array $lineItems,
        public readonly string $shippingAddress,
    ) {}
}
```
---
## Exceptions
Events for extremely large payloads (e.g., video processing results) where including all data would be impractical. Use thin events with a signed URL to the data.
---
## Consequences Of Violation
Temporal coupling: if the producer deletes the referenced data, consumers break. Increased latency from consumer round-trips.
---

## Rule 2: Always include an event envelope with metadata
---
## Category
Architecture | Maintainability
---
## Wrap every event in an envelope that separates metadata (event ID, type, version, timestamp, correlation ID, causation ID) from the domain payload.
---
## Reason
Metadata enables tracing, versioning, debugging, and idempotency handling without polluting the domain payload. Consumers can filter, route, and deduplicate based on envelope fields.
---
## Bad Example
```php
// No envelope — metadata mixed with payload or missing entirely
class OrderPlaced
{
    public function __construct(
        public readonly string $orderId,
        public readonly float $total,
        // No eventId, no version, no correlationId
    ) {}
}
```
---
## Good Example
```php
// Event envelope — metadata separated from payload
readonly class EventEnvelope
{
    public function __construct(
        public string $eventId,
        public string $eventType,
        public string $version,
        public CarbonImmutable $timestamp,
        public string $correlationId,
        public ?string $causationId,
        public array $payload,
    ) {}
}

// Usage
$envelope = new EventEnvelope(
    eventId: Str::uuid()->toString(),
    eventType: 'order.placed',
    version: '1.0',
    timestamp: now()->toImmutable(),
    correlationId: $request->correlationId,
    causationId: null,
    payload: [
        'orderId' => $order->id,
        'total' => $order->total,
    ],
);
```
---
## Exceptions
In-process internal events where tracing is not needed. Envelopes are mandatory for all cross-context integration events.
---
## Consequences Of Violation
Cannot trace events across context boundaries; version migration impossible; debugging distributed flows requires manual log correlation.
---

## Rule 3: Default to coarse-grained events
---
## Category
Design
---
## Publish one event per meaningful aggregate state change, not one event per field change.
---
## Reason
Fine-grained events (one per field) create noise and force consumers to track multiple events to understand a single business operation. Coarse events convey complete business meaning in one message.
---
## Bad Example
```php
// Fine-grained — consumers must listen to multiple events
class OrderStatusChanged {}    // Fired when status changes
class OrderTotalChanged {}     // Fired when total changes
class OrderAddressChanged {}   // Fired when address changes
// ... potentially dozens of events for a single update
```
---
## Good Example
```php
// Coarse-grained — one event per meaningful business operation
class OrderUpdated
{
    public function __construct(
        public readonly string $orderId,
        public readonly string $newStatus,
        public readonly float $newTotal,
        public readonly string $newAddress,
    ) {}
}
```
---
## Exceptions
When specific field-level event tracking is required for compliance or real-time UI updates (e.g., collaborative editing).
---
## Consequences Of Violation
Event noise; consumers must track and correlate many events; replaying event streams is slow and complex; business logic spread across too many handlers.
---

## Rule 4: Never mutate an event after publication
---
## Category
Reliability | Maintainability
---
## Treat all published events as immutable. Never update, delete, or retroactively change an event. Create new event versions instead.
---
## Reason
Events are facts about the past. Mutating them invalidates any projections, audit logs, or event sourcing streams built from them. Consumers that already processed the old event will be inconsistent.
---
## Bad Example
```php
// Directly modifying a published event's payload — breaks immutability
$event = EventStore::find('evt_123');
$event->payload['total'] = 150.00; // Mutation!
$event->save();
```
---
## Good Example
```php
// Publish a correction event instead of mutating
class OrderTotalCorrected
{
    public function __construct(
        public readonly string $orderId,
        public readonly float $previousTotal,
        public readonly float $correctedTotal,
        public readonly string $reason,
    ) {}
}

// Consumers handle the correction event independently
```
---
## Exceptions
If the event was never processed by any consumer (e.g., still in the outbox), it may be corrected before dispatch. Once read, it is immutable.
---
## Consequences Of Violation
Inconsistent projections; audit trail destroyed; event sourcing replays produce different results each time; consumer bugs that are impossible to diagnose.
---

## Rule 5: Version event schemas explicitly
---
## Category
Maintainability
---
## Carry a version label on every event. When the schema changes, increment the version and keep backward compatibility for at least one migration cycle.
---
## Reason
Consumers read the version field and choose the handling path. Without versioning, consumers cannot distinguish between different event formats, causing parse errors.
---
## Bad Example
```php
// No version — consumer has no way to detect schema changes
class OrderPlaced
{
    public function __construct(
        public readonly string $orderId,
        // In production: added 'total' field. Old consumers break.
    ) {}
}
```
---
## Good Example
```php
// Versioned event — V2 adds fields, V1 still works
readonly class OrderPlacedV1
{
    public function __construct(
        public readonly string $orderId,
    ) {}
}

readonly class OrderPlacedV2
{
    public function __construct(
        public readonly string $orderId,
        public readonly float $total,
        public readonly string $currency,
    ) {}
}

// Consumer handles both versions
class OrderPlacedHandler
{
    public function handle(EventEnvelope $envelope): void
    {
        match ($envelope->version) {
            '1.0' => $this->handleV1($envelope),
            '2.0' => $this->handleV2($envelope),
            default => throw new UnsupportedEventVersionException($envelope->version),
        };
    }
}
```
---
## Exceptions
Events that never change schema (e.g., system lifecycle events) do not require explicit versioning.
---
## Consequences Of Violation
Consumers crash on unrecognized event formats; rolling deployments break; schema migration requires coordinated downtime.
---

## Rule 6: Include correlation and causation IDs
---
## Category
Maintainability | Reliability
---
## Always include a correlation ID (tracing the original operation) and a causation ID (identifying the immediate parent event) in every event envelope.
---
## Reason
Correlation IDs enable tracing a request across all context boundaries. Causation IDs build the causal chain, showing which event triggered which subsequent event. Without these, distributed debugging is nearly impossible.
---
## Bad Example
```php
// No tracing IDs — cannot trace event origin or chain
readonly class OrderShipped
{
    public function __construct(
        public readonly string $orderId,
        public readonly string $trackingNumber,
    ) {}
}
```
---
## Good Example
```php
readonly class EventEnvelope
{
    public function __construct(
        public string $eventId,
        public string $eventType,
        public string $version,
        public CarbonImmutable $timestamp,
        public string $correlationId,
        public ?string $causationId,
        public array $payload,
    ) {}
}

// When handling an event and publishing a new one:
$newEnvelope = new EventEnvelope(
    eventId: Str::uuid()->toString(),
    eventType: 'inventory.deducted',
    version: '1.0',
    timestamp: now()->toImmutable(),
    correlationId: $incomingEnvelope->correlationId, // Propagate
    causationId: $incomingEnvelope->eventId,           // Set causation
    payload: ['productId' => 'ABC', 'quantity' => 1],
);
```
---
## Exceptions
Synchronous in-process events within a single request where the request ID is already available in the context.
---
## Consequences Of Violation
Impossible to trace the root cause of cross-context bugs; no visibility into event chains; debugging requires manual log spelunking across services.
---
