# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Event sourcing and CQRS within modular monolith
Knowledge Unit ID: MMD-15
Difficulty Level: Expert
Last Updated: 2026-06-02

---
## Rule Name
Apply event sourcing per-aggregate, not module-wide
---
## Category
Architecture
---
## Rule
Decide per aggregate whether to use event sourcing. Within a single module, some aggregates may be event-sourced and others may use traditional persistence. Never apply event sourcing module-wide.
---
## Reason
Event sourcing adds complexity (event store, replay, snapshots, versioning). Most aggregates do not need it. Only event-source aggregates that benefit from audit trails, temporal queries, or complex state reconstruction.
---
## Bad Example
`php
// Entire Billing module is event-sourced
// Invoice (needs audit trail) OK
// PaymentMethod (simple CRUD) unnecessary complexity
// TaxRate (rarely changes) unnecessary complexity
`
---
## Good Example
`php
// Per-aggregate decision
// Modules/Billing/Aggregates/InvoiceAggregate.php - event-sourced
//   Reason: Financial audit trail required
// Modules/Billing/Models/PaymentMethod.php - traditional
//   Reason: Simple CRUD, no audit trail requirement
`
---
## Exceptions
Modules where ALL aggregates genuinely need audit trails (compliance-heavy domains) may use module-wide event sourcing with documented justification.
---
## Consequences Of Violation
Unnecessary complexity for simple aggregates; larger codebase; slower development for CRUD operations.

---
## Rule Name
Keep the event store as a module-specific implementation detail
---
## Category
Architecture
---
## Rule
Each module's event store (tables, infrastructure, schema) must be owned by that module. Never share an event store across modules.
---
## Reason
A shared event store across modules creates coupling at the storage level. All modules depend on the same event store schema and implementation, defeating module isolation.
---
## Bad Example
`php
// Single shared event store for all modules
// Shared/EventStore/EventStore.php
// Billing, Orders, Catalog all write to the same event_streams table
`
---
## Good Example
`php
// Each module owns its event store
// Modules/Billing/Infrastructure/EventStore.php - billing_event_streams
// Modules/Orders/Infrastructure/EventStore.php - orders_event_streams
// Cross-module communication uses standard domain events (not event-sourced events)
`
---
## Exceptions
No common exceptions. Event store isolation is a core module boundary requirement.
---
## Consequences Of Violation
Module isolation defeated; schema changes require cross-module coordination; extraction requires event store separation.

---
## Rule Name
Version events from day one
---
## Category
Maintainability
---
## Rule
Include a version identifier in every event class. When the event schema must change, create a new version class with upcasters to migrate old events.
---
## Reason
Once events are in the store, you cannot change them. New event versions use new classes; upcasters handle old events during replay. Without versioning, replaying events after a schema change fails.
---
## Bad Example
`php
class OrderPlaced
{
    public function __construct(
        public int ,
        public int , // Added later - breaks replay of old events
    ) {}
}
`
---
## Good Example
`php
class OrderPlacedV1
{
    public function __construct(
        public int ,
        public int ,
    ) {}
}

class OrderPlacedV2
{
    public function __construct(
        public int ,
        public int ,
        public string ,
    ) {}
}

class OrderPlacedUpcaster
{
    public function upcast(OrderPlacedV1 ): OrderPlacedV2
    {
        return new OrderPlacedV2(
            orderId: ->orderId,
            customerId: ->customerId,
            customerEmail: '',
        );
    }
}
`
---
## Exceptions
Prototype aggregates with no production data may skip versioning during initial development. Versioning starts before the first production event.
---
## Consequences Of Violation
Replaying old events fails after schema changes; data loss during state reconstruction.

---
## Rule Name
Implement snapshots for long-running aggregates
---
## Category
Performance
---
## Rule
Configure snapshotting for any event-sourced aggregate projected to exceed 100 events. Snapshot every 100 events or daily, whichever comes first.
---
## Reason
Replaying 10,000+ events from the start takes minutes. Snapshots provide checkpoints so replay starts from the latest snapshot, loading 100 events instead of 10,000.
---
## Bad Example
`php
// No snapshots - Invoice aggregate has 15,000 events
// Replaying for state takes 45 seconds per request
`
---
## Good Example
`php
class InvoiceAggregate
{
    const SNAPSHOT_FREQUENCY = 100;

    public function replay(): void
    {
         = ->snapshotStore->latest(->id);
         = ->eventStore->getFrom(
            ->version, ->id
        );
        if () {
            ->state = ->state;
        }
        foreach ( as ) {
            ->apply();
        }
        if (->version - ->version >= self::SNAPSHOT_FREQUENCY) {
            ->snapshotStore->save(->id, ->version, ->state);
        }
    }
}
`
---
## Exceptions
Aggregates that stay under 100 events for their entire lifecycle may not need snapshots.
---
## Consequences Of Violation
Replay time grows linearly with event count; requests time out waiting for state reconstruction.

---
## Rule Name
Apply CQRS only when read/write workloads diverge
---
## Category
Architecture
---
## Rule
Separate read and write models only when read and write workloads have different performance requirements, different data shapes, or different change frequencies. Do not apply CQRS without justification.
---
## Reason
CQRS doubles the model surface area (separate read and write classes, repositories, and tests). If read and write have the same performance profile, this is double maintenance without benefit.
---
## Bad Example
`php
// CQRS applied without justification
// InvoiceReadModel and InvoiceWriteModel have identical schema
// Same queries, same indexes, same access patterns
// Double maintenance, no benefit
`
---
## Good Example
`php
// CQRS justified by different requirements
// InvoiceWriteModel: normalized, transactional, optimized for writes
// InvoiceReadModel: denormalized, includes product names, optimized for listing
// Different indexes, different query patterns, different change frequency
`
---
## Exceptions
Greenfield modules designed for eventual extraction may use CQRS from day one if the read model will become a separate service.
---
## Consequences Of Violation
Double maintenance without benefit; unnecessary complexity; slower development for simple CRUD.

---
## Rule Name
Use module-specific projectors for cross-module reads from event-sourced modules
---
## Category
Architecture
---
## Rule
When one module is event-sourced and another module needs its data, build a projector in the consuming module that listens to the event-sourced module's domain events and builds a local read model.
---
## Reason
External modules should not query the event store directly (event store is module-specific). Projectors translate event-sourced events into consumer-friendly read models while maintaining module isolation.
---
## Bad Example
`php
// Orders module reads directly from Billing's event store
DB::table('billing_event_streams')
    ->where('aggregate_type', 'invoice')
    ->get();
// Direct event store access - defeats module isolation
`
---
## Good Example
`php
// Billing dispatches InvoiceGenerated domain event (standard event, not event-sourced)
// Orders module listens and projects to local read model

class InvoiceProjector
{
    public function handle(InvoiceGenerated ): void
    {
        OrderInvoiceProjection::updateOrCreate(
            ['invoice_id' => ->invoiceId],
            ['total' => ->total, 'status' => ->status],
        );
    }
}
`
---
## Exceptions
No common exceptions. Cross-module access to event stores is always forbidden.
---
## Consequences Of Violation
Module isolation defeated; event store schema couples modules; extraction requires untangling projections.

---
## Rule Name
Do not use event-sourced events for cross-module communication
---
## Category
Architecture
---
## Rule
Cross-module communication must use standard Laravel domain events, not event-sourced events. Event-sourced events are an internal persistence mechanism within a module.
---
## Reason
Event-sourced events are private to the module's aggregate implementation. Their schema changes with aggregate refactoring. Exposing them externally couples other modules to the internal event schema.
---
## Bad Example
`php
// Exposing event-sourced event as cross-module event
class BillingServiceProvider
{
    public function boot(): void
    {
        Event::listen(
            \Modules\Billing\Events\InvoiceAmountRecalculated::class, // event-sourced internal event
            [\Modules\Orders\Listeners\UpdateOrderTotal::class, 'handle'],
        );
    }
}
`
---
## Good Example
`php
// Event-sourced internal event stays private
// Separate domain event for cross-module communication
class InvoiceGenerated
{
    public function __construct(
        public int ,
        public int ,
        public MoneyDTO ,
    ) {}
}

// Dispatched at the end of the command handler after aggregate is saved
event(new InvoiceGenerated(->id, ->orderId, ->total));
`
---
## Exceptions
No common exceptions. Event-sourced events must never cross module boundaries.
---
## Consequences Of Violation
Internal event schema changes break other modules; module isolation defeated; refactoring aggregate requires coordinating with all consumers.
