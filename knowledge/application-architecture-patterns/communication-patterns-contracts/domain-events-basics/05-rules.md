# Rules: Domain events within and across contexts

## Rule 1: Name domain events in past tense
---
## Category
Design | Maintainability
---
## Always name domain events as past-tense verb-plus-noun phrases (e.g., `OrderPlaced`, `PaymentReceived`).
---
## Reason
Events are immutable records of facts that already happened. Past-tense naming reinforces this semantic. Imperative names (`PlaceOrder`, `ShipOrder`) indicate commands, not events.
---
## Bad Example
```php
class PlaceOrder // Imperative — this is a command, not an event
{
}
```
---
## Good Example
```php
class OrderPlaced // Past tense — this is a domain event
{
    public function __construct(
        public readonly string $orderId,
        public readonly string $customerId,
    ) {}
}
```
---
## Exceptions
None. Never use imperative naming for events.
---
## Consequences Of Violation
Confusion between commands and events; event handlers called with wrong semantics; event store polluted with imperative-named records.
---

## Rule 2: Dispatch events after DB commit
---
## Category
Reliability
---
## Always use `dispatchAfterCommit` (or `Bus::dispatchAfterCommit`) for all domain events, never dispatch inside an active database transaction.
---
## Reason
Events dispatched inside a transaction are sent even if the transaction rolls back, creating phantom events for changes that never happened. `dispatchAfterCommit` guarantees the event is only dispatched if the transaction commits.
---
## Bad Example
```php
class OrderController
{
    public function placeOrder(Request $request): JsonResponse
    {
        DB::transaction(function () use ($request) {
            $order = Order::create(/* ... */);
            OrderPlaced::dispatch($order); // Dispatched inside transaction
        });
    }
}
```
---
## Good Example
```php
class OrderController
{
    public function placeOrder(Request $request): JsonResponse
    {
        DB::transaction(function () use ($request) {
            $order = Order::create(/* ... */);
            OrderPlaced::dispatchAfterCommit($order); // Dispatched only if commit succeeds
        });
    }
}
```
---
## Exceptions
Synchronous events that must run within the same transaction for consistency (rare — see CPC-03).
---
## Consequences Of Violation
Phantom events for rolled-back transactions; consumers act on changes that never persisted; data inconsistency across contexts.
---

## Rule 3: Separate internal events from integration events
---
## Category
Architecture | Code Organization
---
## Use separate event classes for internal events (within a context) and integration events (across contexts). Never expose internal event data across context boundaries.
---
## Reason
Internal events can carry internal data, entity references, and implementation details. Integration events must be self-contained, contract-governed DTOs. Mixing them exposes internals and creates coupling.
---
## Bad Example
```php
// Single event used both internally and across contexts
class OrderShipped
{
    public function __construct(
        public readonly Order $order, // Internal Eloquent model exposed to other contexts!
    ) {}
}
```
---
## Good Example
```php
// Internal event — can carry entity references
class OrderShippedInternally
{
    public function __construct(
        public readonly Order $order,
    ) {}
}

// Integration event — self-contained DTO, no internals
class OrderShipped
{
    public function __construct(
        public readonly string $orderId,
        public readonly string $trackingNumber,
        public readonly string $carrier,
        public readonly CarbonImmutable $shippedAt,
    ) {}
}
```
---
## Exceptions
In a single-context monolith with no cross-context communication, all events are internal and separation is unnecessary.
---
## Consequences Of Violation
Internal implementation details leak across context boundaries; consumers couple to Eloquent schemas; contract violations go undetected.
---

## Rule 4: Include the aggregate ID in every event
---
## Category
Design | Maintainability
---
## Always include the originating aggregate's ID as a field in every domain event.
---
## Reason
Consumers use the aggregate ID to correlate events to the same business entity. Without it, consumers cannot reconstruct entity state or track history.
---
## Bad Example
```php
class OrderShipped
{
    public function __construct(
        public readonly string $trackingNumber, // No aggregate ID!
        public readonly string $carrier,
    ) {}
}
```
---
## Good Example
```php
class OrderShipped
{
    public function __construct(
        public readonly string $aggregateId, // Always include aggregate ID
        public readonly string $orderId,
        public readonly string $trackingNumber,
        public readonly string $carrier,
    ) {}
}
```
---
## Exceptions
Events that are purely informational (e.g., `HeartbeatDetected`) with no aggregate association.
---
## Consequences Of Violation
Consumers cannot correlate events to entities; event sourcing rebuilds fail; debugging cross-context flows becomes nearly impossible.
---

## Rule 5: Make domain events immutable
---
## Category
Design | Reliability
---
## Define all domain event properties as `public readonly` using constructor promotion. Never provide setters.
---
## Reason
Events are facts. Once published, they must never change. Immutability guarantees that any listener sees the same data, and that replaying event streams produces deterministic results.
---
## Bad Example
```php
class OrderPlaced
{
    public string $orderId; // Mutable — listener could change it
    public string $customerId; // Mutable
}
```
---
## Good Example
```php
class OrderPlaced
{
    public function __construct(
        public readonly string $orderId,
        public readonly string $customerId,
        public readonly CarbonImmutable $occurredAt,
    ) {}
}
```
---
## Exceptions
None. Domain events are always immutable.
---
## Consequences Of Violation
Listeners silently mutate event data; event replay produces non-deterministic results; debugging becomes unreliable.
---

## Rule 6: Model business facts, not technical events
---
## Category
Design
---
## Name and structure domain events around business concepts, not technical operations. Never fire `ModelSaved`, `RowUpdated`, or similar technical events as domain events.
---
## Reason
Technical events couple consumers to persistence details. A `ModelSaved` event tells the consumer nothing about the business meaning. `OrderShipped` conveys intent and relevance.
---
## Bad Example
```php
// Technical event — no business meaning
class OrderModelUpdated
{
    public function __construct(
        public readonly Order $order,
    ) {}
}
```
---
## Good Example
```php
// Business event — conveys meaningful state change
class OrderShipped
{
    public function __construct(
        public readonly string $orderId,
        public readonly string $trackingNumber,
    ) {}
}
```
---
## Exceptions
Technical events (e.g., `ModelSaved`) are acceptable for internal cache invalidation or logging that is purely technical, not domain-driven.
---
## Consequences Of Violation
Consumers couple to database operations; business logic leaks into event handlers; domain language is lost in favor of technical jargon.
---

## Rule 7: Keep event payloads minimal
---
## Category
Maintainability | Performance
---
## Include only the data consumers need in each event. Avoid over-provisioning "just in case" fields.
---
## Reason
Every field in an event is a commitment. Adding a field is easy; removing one is a breaking change. Minimal payloads reduce contract surface area and serialization cost.
---
## Bad Example
```php
class OrderPlaced
{
    public function __construct(
        public readonly string $orderId,
        public readonly string $customerId,
        public readonly string $customerName,
        public readonly string $customerEmail,
        public readonly string $customerPhone,
        public readonly string $billingAddress,
        public readonly string $shippingAddress,
        // ... 15 more fields, most consumers only need orderId + customerId
    ) {}
}
```
---
## Good Example
```php
class OrderPlaced
{
    public function __construct(
        public readonly string $orderId,
        public readonly string $customerId,
        public readonly float $total,
    ) {}
}
```
---
## Exceptions
Integration events must be self-contained (fat enough that consumers don't need to query the source). See CPC-04 for fat event guidance.
---
## Consequences Of Violation
Contract evolution becomes difficult; consumers depend on unnecessary fields; event payload sizes grow unnecessarily.
---
