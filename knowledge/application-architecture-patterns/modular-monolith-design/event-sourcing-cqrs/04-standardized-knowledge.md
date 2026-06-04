# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Event sourcing and CQRS within modular monolith
Knowledge Unit ID: MMD-15
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Event sourcing (storing state changes as a sequence of events) and CQRS (separating read and write models) are advanced patterns that fit naturally into a modular monolith. The modular structure provides clear boundaries for event-sourced aggregates (one per module) and CQRS read models (module-owned projections). The modular structure prevents complexity from leaking across domain boundaries — not every module needs these patterns.

---

# Core Concepts

- **Event Sourcing**: Store sequence of events leading to current state. Replay events to derive state. Provides audit trail, temporal querying, state reconstruction.
- **CQRS**: Separate read model (queries) from write model (commands). Enables independent optimization.
- **Module-scoped**: Each module decides per-aggregate whether to use event sourcing. Event store is module-specific. Cross-module events still use standard domain events.

---

# When To Use

- Event sourcing: Module aggregates need audit trails, temporal queries, complex state reconstruction (financial, compliance, workflow-heavy modules).
- CQRS: Read and write workloads have different performance requirements. Read model can be denormalized.

---

# When NOT To Use

- Event sourcing for everything (overhead not justified for simple CRUD).
- CQRS without justification (same performance profile — adds complexity without benefit).
- Applying these patterns module-wide instead of per-aggregate.

---

# Best Practices

- **Apply per-aggregate, not module-wide.** WHY: A module can have some event-sourced aggregates and some traditional ones. Only justify complexity where needed.
- **Implement snapshots for event-sourced aggregates.** WHY: After 10,000 events, replaying from start takes minutes. Snapshots provide checkpoints for faster replay.
- **Version events from day one.** WHY: Once events are in the store, you cannot change them. New event versions use new classes; migration scripts handle old events.
- **Use module-specific projectors for cross-module reads.** WHY: Events sourced in one module projected into another module's read model enables cross-module queries without coupling.

---

# Architecture Guidelines

- Event store is a module-specific implementation detail (not shared).
- Within a module: write path (commands) and read path (queries) separated at module level. May share infrastructure internally.
- Cross-module events still use standard domain events (not event-sourced events).
- Snapshot frequency: every 100 events or daily — balances replay time vs. snapshot storage.

---

# Performance Considerations

- Event sourcing reads slower than direct state reads (replaying events). Snapshots mitigate this.
- CQRS reads are fast (optimized read models).
- Event store writes are append-only (fast) but storage grows unboundedly without retention.
- In-process event sourcing has no network overhead (unlike distributed event sourcing).

---

# Security Considerations

- Event store provides an immutable audit trail — useful for compliance.
- Ensure event store access is restricted to the owning module.

---

# Common Mistakes

1. **Event sourcing for everything:** Applying to aggregates that don't benefit. Cause: excitement about the pattern. Consequence: unnecessary complexity. Better: only event-source aggregates needing audit trail or temporal queries.

2. **No snapshot strategy:** Replaying from the start of time after 10,000 events. Cause: oversight. Consequence: minutes-long replay times. Better: snapshot every 100 events.

3. **CQRS without justification:** Separating read/write with same performance profile. Cause: following trend. Consequence: double maintenance without benefit. Better: apply CQRS only when read/write workloads diverge.

---

# Anti-Patterns

- **Shared event store across modules**: Defeats module isolation — all modules coupled to the same event store schema.
- **Event schema not versioned**: Breaking event class changes break replay of old events.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-07 Async inter-module comm | CPC-08 CQRS pattern | CPC-09 Event sourcing |
| CPC-02 Domain events | CPC-10 Outbox pattern | CPC-11 Distributed tracing |

---

# AI Agent Notes

- Only apply event sourcing per-aggregate where audit trail or temporal queries are required.
- Include snapshot strategy in event-sourced aggregate generation.
- Generate event versioning (upcasters) from the start.

---

# Verification

- [ ] Event sourcing applied per-aggregate, not module-wide
- [ ] Snapshots configured for event-sourced aggregates
- [ ] Events are versioned (upcasters exist)
- [ ] Event store is module-specific (not shared)
- [ ] CQRS is justified by different read/write performance needs
