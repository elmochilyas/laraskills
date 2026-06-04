# Skill: Apply Event Sourcing and CQRS Within a Modular Monolith

## Purpose
Use event sourcing (store state as event sequences) and CQRS (separate read/write models) per-aggregate where justified — audit trails, temporal queries, and divergent read/write workloads — while keeping the event store module-specific and using standard events for cross-module communication.

## When To Use
- Event sourcing: aggregates needing audit trails, temporal queries, complex state reconstruction (financial, compliance, workflow-heavy)
- CQRS: read and write workloads with different performance requirements, data shapes, or change frequencies

## When NOT To Use
- Event sourcing for everything (overhead not justified for simple CRUD)
- CQRS without justification (same performance profile — double maintenance without benefit)
- Applying patterns module-wide instead of per-aggregate

## Prerequisites
- Module boundaries with clear aggregate roots
- Understanding of event streams, projectors, and upcasters
- Laravel event system or dedicated event store library

## Inputs
- Identified aggregates needing audit trail or temporal queries
- Read vs write workload analysis
- Event schema decisions

## Workflow
1. **Apply event sourcing per-aggregate, not module-wide.** Decide per aggregate whether event sourcing provides value. A module can have both event-sourced and traditionally persisted aggregates.

2. **Keep the event store as a module-specific implementation detail.** Each module owns its event store tables and infrastructure. Never share event stores across modules.

3. **Version events from day one.** Include a version identifier in every event class. When schema changes, create new version classes with upcasters to migrate old events during replay.

4. **Implement snapshots for long-running aggregates.** Snapshot every 100 events or daily. Snapshots prevent minutes-long replay times for aggregates with 10,000+ events.

5. **Apply CQRS only when read/write workloads diverge.** Separate read and write models only when they have different performance requirements, data shapes, or change frequencies.

6. **Use module-specific projectors for cross-module reads.** When another module needs data from an event-sourced module, build a projector in the consuming module that listens to standard domain events and builds a local read model.

7. **Do not use event-sourced events for cross-module communication.** Event-sourced events are private to the aggregate's implementation. Use standard Laravel domain events for cross-module communication.

## Validation Checklist
- [ ] Event sourcing applied per-aggregate, not module-wide
- [ ] Snapshots configured for long-running aggregates (100+ events)
- [ ] Events are versioned with upcasters
- [ ] Event store is module-specific (not shared)
- [ ] CQRS is justified by different read/write performance needs
- [ ] Projectors for cross-module reads use standard domain events
- [ ] Cross-module communication uses standard events, not event-sourced events

## Common Failures
- **Event sourcing for everything.** Applying to aggregates that don't benefit — unnecessary complexity.
- **No snapshot strategy.** Replaying from start after 10,000 events causes minutes-long replay times.
- **CQRS without justification.** Separating read/write with same performance profile — double maintenance without benefit.
- **Shared event store across modules.** Defeats module isolation — all modules coupled to the same event store schema.

## Decision Points
- **Event store library vs custom implementation?** Use a library (spatie/event-sourcing, EventSauceLabs) for standard features; custom for specific requirements.
- **Snapshot frequency?** Every 100 events or daily — balances replay time vs. snapshot storage.

## Performance Considerations
- Event sourcing reads slower than direct state reads (replaying events). Snapshots mitigate this.
- CQRS reads are fast (optimized read models).
- Event store writes are append-only (fast) but storage grows unboundedly without retention.

## Security Considerations
- Event store provides an immutable audit trail — useful for compliance.
- Ensure event store access is restricted to the owning module.
- Standard domain events should not contain sensitive data.

## Related Rules
- Rule: Event Sourcing Per-Aggregate (MMD-15/05-rules.md)
- Rule: Module-Specific Event Store (MMD-15/05-rules.md)
- Rule: Version Events From Day One (MMD-15/05-rules.md)
- Rule: Implement Snapshots (MMD-15/05-rules.md)
- Rule: Apply CQRS Only When Justified (MMD-15/05-rules.md)
- Rule: Module-Specific Projectors (MMD-15/05-rules.md)
- Rule: Standard Events for Cross-Module Comm (MMD-15/05-rules.md)

## Related Skills
- Define and Dispatch Domain Events (LAP-08/06-skills.md)
- Apply CQRS Pattern (CPC-08/06-skills.md)
- Manage Async Inter-Module Communication (MMD-07/06-skills.md)
- Design Event Sourcing (CPC-09/06-skills.md)

## Success Criteria
- Event sourcing is applied only where justified (audit trail, temporal queries, complex state reconstruction).
- Event store is module-specific with versioned events and snapshotting.
- CQRS is applied only where read/write workloads diverge.
- Cross-module communication uses standard domain events, not event-sourced events.
