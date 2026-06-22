# Decision Trees for Laravel Events vs Event Sourcing

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Backend Architecture Design |
| Subdomain | Event Sourcing |
| Knowledge Unit | Laravel Events vs Event Sourcing |
| Related KUs | After-commit events and jobs, Domain events in Eloquent, Model observers |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-EVS-001 | Is this system actually using event sourcing? | P0 |
| DT-EVS-002 | Should we adopt event sourcing for this domain? | P0 |
| DT-EVS-003 | Where should domain events be dispatched — in the model or in the action? | P1 |
| DT-EVS-004 | What should the persisted event table be named? | P1 |

---

## DT-EVS-001: Is This System Actually Using Event Sourcing?

### Decision Context
Teams frequently claim "we use event sourcing" when their system merely fires Laravel events and has listeners. This creates false expectations for stakeholders (replay, temporal queries) and compliance auditors (immutable audit trail). The decision tree verifies whether the system genuinely implements event sourcing or is using a different pattern that needs correct naming.

### Decision Criteria
- Is there an append-only event store (no UPDATE or DELETE on stored events)?
- Are there aggregates that produce events and enforce invariants?
- Are there projections that build read models from the event stream?
- Are there snapshots for performance?
- Are events versioned with schema evolution?
- Can you drop all projections and rebuild them from the event stream (replay)?

### Decision Tree

```
Is there an append-only event store (events are never UPDATEd or DELETEd)?
├── NO → NOT EVENT SOURCING.
│   └── Are events persisted at all?
│       ├── NO → This is "domain events" (fire-and-forget side-effect decoupling)
│       └── YES → This is an "audit log" (persisted for debugging/compliance)
├── YES → Are there aggregates that produce events and enforce invariants?
    ├── NO → NOT EVENT SOURCING. It's an event firehose, not event sourcing.
    ├── YES → Are there projections that build read models from events?
        ├── NO → NOT EVENT SOURCING. Events are stored but not used for state derivation.
        ├── YES → Can you replay all events to rebuild the current state?
            ├── NO → NOT EVENT SOURCING. Replay is a core requirement.
            └── YES → Are events versioned with schema evolution support?
                ├── NO → PARTIAL EVENT SOURCING. Will break on schema changes.
                └── YES → This IS event sourcing. Terminology is correct.
```

### Rationale
Event sourcing is a specific architectural pattern with six required components. A system that fires `event()` and has listeners is using domain events. A system that persists events to a table for debugging is using an audit log. Both are valid patterns — they're just not event sourcing. Mislabeling them creates false expectations and compliance gaps.

### Recommended Default
**Verify all six components before claiming event sourcing.** If any component is missing, use the correct terminology: "domain events," "audit log," or "event-driven architecture."

### Risks Of Wrong Choice
- **Claiming event sourcing without the components**: Stakeholders expect replay, temporal queries, and state derivation. Auditors expect immutable, append-only audit. Neither exists. Trust erodes when the gap is discovered.
- **Being overly cautious and not claiming event sourcing when you have it**: Less harmful — the system works correctly, the terminology is just modestly imprecise. Still worth correcting.

### Related Rules
- Never Call Laravel Events "Event Sourcing"
- If You Store Events for Debugging, Call It an "Audit Log"

---

## DT-EVS-002: Should We Adopt Event Sourcing for This Domain?

### Decision Context
Event sourcing roughly doubles architectural complexity (event store, projections, versioning, snapshots, replay). For most SaaS applications, CRUD + domain events + audit log is sufficient. The decision tree helps determine whether the domain genuinely benefits from event sourcing or whether simpler patterns suffice.

### Decision Criteria
- Is full audit history legally required (finance, healthcare, compliance)?
- Are temporal queries needed ("what did this record look like last Tuesday?")?
- Does the domain need undo/redo or complex state machine rollback?
- Does the domain naturally express as a sequence of immutable events?
- Do you need to rebuild read models from history?
- Is the team experienced with event sourcing (spatie/laravel-event-sourcing)?

### Decision Tree

```
Is full audit history legally required (SOX, HIPAA, PCI-DSS)?
├── YES → EVENT SOURCING MAY BE JUSTIFIED. Evaluate further.
│   └── Can the audit requirement be met with an audit log + CRUD instead?
│       ├── YES → Prefer audit log + CRUD (simpler, meets compliance)
│       └── NO → Event sourcing is justified. Proceed with full implementation.
├── NO → Are temporal queries needed ("what did this look like at time T")?
    ├── YES → EVENT SOURCING MAY BE JUSTIFIED. Evaluate further.
    │   └── Can temporal queries be met with snapshots + audit log instead?
    │       ├── YES → Prefer snapshots + audit log (simpler)
    │       └── NO → Event sourcing is justified.
    ├── NO → Does the domain need undo/redo or complex state machine rollback?
        ├── YES → Consider event sourcing for the specific aggregate, not the whole system
        └── NO → USE CRUD + DOMAIN EVENTS + AUDIT LOG. Event sourcing is over-engineering.
```

### Rationale
Event sourcing adds significant complexity: event store management, schema versioning, projection rebuilds, snapshot strategies, eventual consistency between event store and read models. For most SaaS applications, this complexity provides no business value. The decision tree filters for the concrete requirements that justify the cost.

### Recommended Default
**Default to CRUD + domain events + audit log.** Only adopt event sourcing when a concrete, verifiable requirement (legal audit, temporal queries, undo/redo) cannot be met by simpler patterns.

### Risks Of Wrong Choice
- **Adopting event sourcing without justification**: Months of development spent on infrastructure that provides no business value. Event versioning, projection rebuilds, and eventual consistency bugs drag on feature velocity for years.
- **Not adopting event sourcing when it's genuinely needed**: Compliance audit fails because the audit log allows UPDATE/DELETE. Temporal queries are impossible. Undo/redo must be built manually. The cost of retrofitting event sourcing is higher than building it from the start.

### Related Rules
- Only Adopt Event Sourcing When Requirements Demand It

---

## DT-EVS-003: Where Should Domain Events Be Dispatched — in the Model or in the Action?

### Decision Context
Laravel allows dispatching events from Eloquent models via `$dispatchesEvents` or model observers. It also allows dispatching events explicitly in actions or services. The choice determines when events fire (ORM lifecycle vs. business boundary) and what triggers them (any save vs. explicit business operation).

### Decision Criteria
- Should the event fire only when a business operation occurs, or whenever the model is saved?
- Will the model be created/updated by seeders, imports, or factories?
- Is the event a business concept (OrderPlaced) or a persistence concept (OrderCreated)?
- Do listeners perform side effects that should only happen during real business operations?

### Decision Tree

```
Is the event a business concept (OrderPlaced, SubscriptionCancelled)?
├── YES → DISPATCH IN THE ACTION/SERVICE.
│   └── Will the model be created/updated by seeders, imports, or factories?
│       ├── YES → MUST dispatch in the action (model hooks would fire during seeding)
│       └── NO → Still prefer the action for semantic clarity
├── NO → Is the event a persistence/lifecycle concept (OrderCreated, OrderUpdated)?
    ├── YES → Model lifecycle hooks ($dispatchesEvents, observers) are appropriate
    │   └── Is the listener performing persistence concerns (slug generation, cache invalidation)?
    │       ├── YES → Model observer is the right place
    │       └── NO → Reconsider: is this really a lifecycle event or a business event?
    └── NO → Re-evaluate the event's purpose
```

### Rationale
`$dispatchesEvents = ['created' => OrderPlaced::class]` fires during any `save()` that creates a record — including seeders, data imports, factory generation in tests, and manual DB operations. "Order placed" is a business concept that only makes sense when a customer places an order, not when a seeder creates test data. Dispatching in the action ensures the event fires only at the correct business boundary.

### Recommended Default
**Dispatch domain events (business concepts) explicitly in actions/services. Use model observers only for persistence concerns (slug generation, cache invalidation, audit logging).**

### Risks Of Wrong Choice
- **Domain events via model hooks**: Events fire during seeders (flooding notification queues), data imports (spamming customers), and tests (triggering side effects unintentionally). The business logic boundary is lost.
- **Persistence concerns via actions**: Slug generation, UUID creation, and cache invalidation scattered across multiple actions instead of centralized in the model observer. DRY violation.

### Related Rules
- Dispatch Domain Events Explicitly in Business Logic, Not via Model Lifecycle Hooks

---

## DT-EVS-004: What Should the Persisted Event Table Be Named?

### Decision Context
The name of a database table communicates its purpose. Naming an audit log table `event_store` implies it's the source of truth from which state is derived. Naming it `model_events` or `audit_log` correctly identifies it as a diagnostic record. The wrong name leads engineers to try to rebuild state from a table that was never designed for it.

### Decision Criteria
- Is the table the primary source of truth from which aggregate state is derived?
- Are events in the table append-only (never UPDATEd or DELETEd)?
- Is the table used by projections to build read models?
- Or is the table a diagnostic record of what happened (for debugging/compliance)?

### Decision Tree

```
Is the table the primary source of truth (state is derived from it)?
├── YES → Is it append-only with versioned events and aggregate IDs?
    ├── YES → "event_store" or "stored_events" is appropriate (it IS an event store)
    └── NO → NOT an event store. Use "audit_log" or "model_events"
├── NO → Is the table used for debugging, compliance, or operational visibility?
    ├── YES → Use "audit_log", "model_events", or "activity_log"
    └── NO → Re-evaluate: why are events being persisted at all?
```

### Rationale
An event store is a specific architectural component: append-only, versioned, with aggregate IDs, used by projectors to build read models. An audit log is a diagnostic record of what happened. They serve fundamentally different purposes. The table name should communicate which purpose it serves. Engineers who see `event_store` will try to replay events to rebuild state — if the table isn't designed for that, they waste days.

### Recommended Default
**Default to `model_events` or `audit_log` for diagnostic event records. Only use `event_store` or `stored_events` when the table is genuinely the source of truth with all event sourcing components.**

### Risks Of Wrong Choice
- **Naming an audit log `event_store`**: Engineers try to rebuild state from it and find it's incomplete. Auditors question why "the event store" allows UPDATE and DELETE. The system's architecture is misrepresented.
- **Naming a real event store `audit_log`**: Engineers don't realize they can replay events to rebuild projections. The event sourcing capability is hidden behind misleading naming.

### Related Rules
- If You Store Events for Debugging, Call It an "Audit Log"
