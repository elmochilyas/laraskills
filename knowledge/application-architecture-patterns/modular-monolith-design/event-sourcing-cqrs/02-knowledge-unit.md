# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Event sourcing and CQRS within modular monolith
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Event sourcing (storing state changes as a sequence of events) and CQRS (separating read and write models) are advanced patterns that fit naturally into a modular monolith architecture. The modular structure provides clear boundaries for event-sourced aggregates (one per module) and CQRS read models (module-owned projections). Within a modular monolith, event sourcing can be implemented without network overhead, and CQRS read models can be maintained in the same process. The modular structure prevents the complexity of these patterns from leaking across domain boundaries.

---

# Core Concepts

**Event Sourcing:** Instead of storing the current state, store the sequence of events that led to the current state. The current state is derived by replaying events. Provides audit trail, temporal querying, and state reconstruction.

**CQRS:** Separate the model that reads data (queries) from the model that writes data (commands). Enables independent optimization of read and write paths.

**In a modular monolith:**
- Each module decides per-aggregate whether to use event sourcing
- Read models (projections) are module-owned
- Event store is a module-specific implementation detail
- Cross-module events still use standard domain events

---

# Mental Models

**The "Append-Only Log" model (Event Sourcing):** The database is an append-only log of events. You never update or delete—only append. The current state is the sum of all past events.

**The "Two Models" model (CQRS):** The write model optimizes for consistency. The read model optimizes for query performance. They are separate data structures, possibly separate databases.

**The "Module-Owned Decision" model:** Not every module needs event sourcing. A module that needs audit trail (financial transactions) can use it; a module that needs simple CRUD (blog posts) can use Eloquent. They coexist.

---

# Internal Mechanics

**Event Store within a module:**
```php
// Billing module writes events to its event store
class BillingEventStore {
    public function append(AggregateRootId $id, DomainEvent ...$events): void;
    public function getEvents(AggregateRootId $id): DomainEvent[];
    public function replayAll(): void;  // Rebuild projections
}
```

**Read model projection:**
```php
// Module-specific projector
class InvoiceProjector {
    public function onInvoiceCreated(InvoiceCreated $event): void {
        InvoiceReadModel::create([
            'id' => $event->invoiceId,
            'customer_id' => $event->customerId,
            'total' => $event->total,
            'status' => 'pending',
        ]);
    }
}
```

**CQRS at module boundary:**
```php
// Write path (command)
class CreateInvoiceHandler {
    public function handle(CreateInvoiceCommand $command): void;
}

// Read path (query)
class InvoiceQueryService {
    public function getInvoice(string $id): InvoiceDto;
}
```

---

# Patterns

**Module-scoped event sourcing:** Only specific aggregates within a module use event sourcing. The module decides which aggregates are event-sourced and which are traditional.

**CQRS as module boundary pattern:** The write path (commands) and read path (queries) are separated at the module level. Internal to the module, they may share infrastructure.

**Projection as cross-module bridge:** Events sourced in one module are projected into another module's read model, enabling cross-module queries without coupling.

---

# Architectural Decisions

**Use event sourcing within a module when:** The module's aggregates need audit trails, temporal queries, or complex state reconstruction. Financial, compliance, and workflow-heavy modules benefit.

**Use CQRS within a module when:** Read and write workloads have different performance requirements. The read model can be denormalized for query performance while the write model enforces consistency.

**Don't apply event sourcing or CQRS module-wide:** Apply per-aggregate where the complexity is justified. A module can have some event-sourced aggregates and some traditional ones.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Complete audit trail for event-sourced aggregates | Significant storage growth | Events accumulate; snapshotting is required |
| Read/write separation optimizes both paths | Dual model maintenance | Write model change may require projection update |
| Temporal queries (what did state look like at any time?) | Complexity—event schema evolution | Versioning events requires planning |
| Module isolation preserved | Learning curve for team | Event sourcing has high cognitive overhead |

---

# Performance Considerations

Event sourcing reads are slower than direct state reads (replaying events). Snapshots mitigate this. CQRS reads are fast (optimized read models). Event store writes are append-only, which is fast but storage grows unboundedly without retention policies.

---

# Production Considerations

Event schema versioning is mandatory. Once events are in the store, you cannot change them. New event versions use new classes; migration scripts handle old events.

Snapshot frequency balances replay time vs. snapshot storage. Typical strategy: snapshot every 100 events or daily.

---

# Common Mistakes

**Event sourcing for everything:** Applying event sourcing to aggregates that don't benefit from it. The overhead is not justified for simple CRUD.

**No snapshot strategy:** After 10,000 events, replaying from the start of time takes minutes. Snapshots provide a checkpoint for faster replay.

**CQRS without justification:** Separating read and write when both have the same performance profile. CQRS adds complexity without benefit if both paths are equally fast.

---

# Failure Modes

**Event schema evolution failure:** A change to an event class breaks replay of old events. Use event versioning with upcasters/downcasters.

**Projection drift:** Read model doesn't match the current state because events were missed or applied out of order. Idempotent projectors prevent this.

---

# Ecosystem Usage

Spatie's `laravel-event-sourcing` package is the standard choice. The `backslashphp/backslash` package provides CQRS and event sourcing for PHP. The `laravel-clean-architecture` package includes CQRS scaffolding.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-07 Async inter-module comm | CPC-08 CQRS pattern | CPC-09 Event sourcing |
| CPC-02 Domain events | CPC-10 Outbox pattern | CPC-11 Distributed tracing |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
