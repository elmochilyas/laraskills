# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Event sourcing fundamentals
Knowledge Unit ID: CPC-09
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Event sourcing stores state changes as a sequence of domain events, rather than a snapshot of current state. The current state is derived by replaying all events (or a snapshot + subsequent events). Every state change is an event appended to the event store. Events are immutable and append-only. The event store is the source of truth. Read models are projections built from events. Event sourcing enables complete audit trails, temporal queries (state at any point), and rebuilding projections from scratch.

---

# Core Concepts

- **Event store:** An append-only log of events. Each event represents a state change. Events are stored in order. No deletes, no updates.
- **Aggregate in event sourcing:** Each aggregate has a sequence of events. The aggregate's current state is reconstructed by replaying its events. The aggregate applies events to rebuild its state.
- **Projection:** A read model built from events. Projections are updated by event handlers. They can be rebuilt from scratch by replaying all events.
- **Snapshot:** Periodically save the aggregate's current state to avoid replaying all events from the beginning. Snapshots are stored alongside the event stream.

---

# When To Use

- Complete audit trail requirements (financial, compliance).
- Temporal queries — need to know state at any point in time.
- Ability to rebuild read models from scratch.

---

# When NOT To Use

- Simple CRUD applications (event sourcing adds significant complexity without benefit).
- Entities that don't need audit trails or temporal queries.

---

# Best Practices

- **Use snapshots for performance.** WHY: Replaying all events from the beginning on every aggregate load degrades performance as the event stream grows. Snapshots store the aggregate state at a point, so only events after the snapshot need replaying.
- **Events are immutable.** WHY: Allowing events to be modified or deleted breaks the append-only guarantee. Projections become inconsistent. Events are facts; facts don't change.
- **Use event sourcing selectively.** WHY: Applying event sourcing to entities that don't need audit trails or temporal queries adds unnecessary complexity. Only use it where the benefits justify the cost.
- **Projections should be idempotent.** WHY: They can be dropped and rebuilt by replaying all events. Used for schema migrations or bug fixes in projection code.

---

# Architecture Guidelines

- Event store: append-only log of domain events.
- Aggregates: replay events to rebuild state.
- Projections: read models updated by event handlers.
- Snapshots: periodic aggregate state saves for performance.
- Implementations: `spatie/laravel-event-sourcing`, PostgreSQL, MySQL event tables, EventStoreDB.

---

# Performance Considerations

- Event replay cost grows with event stream length (mitigated by snapshots).
- Projection rebuild: replay all events (time proportional to total event count).
- Snapshot frequency is a tuning parameter.

---

# Security Considerations

- Event store is the source of truth. Ensure it is backed up and append-only permissions enforced.

---

# Common Mistakes

1. **Event sourcing without snapshots:** Replaying all events from the beginning on every aggregate load. Cause: oversight. Consequence: performance degrades as the event stream grows. Better: use periodic snapshots.

2. **Mutable events:** Allowing events to be modified or deleted. Cause: convenience. Consequence: breaks the append-only guarantee; projections become inconsistent. Better: events are immutable facts.

3. **Event sourcing for everything:** Applying event sourcing to entities that don't need audit trails. Cause: over-engineering. Consequence: unnecessary complexity. Better: use event sourcing selectively.

---

# Anti-Patterns

- **Event sourcing everywhere**: Applied to all entities regardless of need. Massive unnecessary complexity.
- **Snapshot neglect**: No snapshots configured. Event replay gets slower over time.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| CPC-02 Domain events basics | MMD-15 Event sourcing CQRS | CPC-10 Outbox pattern |
| CPC-04 Event design | CPC-08 CQRS pattern | DBC-09 Temporal coupling |

---

# AI Agent Notes

- Use snapshots to avoid full replay on every aggregate load.
- Events are immutable and append-only.
- Use event sourcing selectively where audit trails or temporal queries are needed.
- Projections must be idempotent for rebuild capability.

---

# Verification

- [ ] Event store is append-only (no updates, no deletes)
- [ ] Snapshots are configured for performance
- [ ] Projections are idempotent and rebuildable
- [ ] Event sourcing is only used where justified
- [ ] Aggregate state is rebuilt from events (or snapshot + events)
