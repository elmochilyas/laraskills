# Skill: Implement Event Sourcing with Append-Only Event Store

## Purpose
Store state changes as an append-only sequence of domain events. Use snapshots for performance. Make projections idempotent and rebuildable. Version events in the store. Use event sourcing selectively where audit trails or temporal queries are needed.

## When To Use
- Complete audit trail requirements (financial, compliance)
- Temporal queries — need to know state at any point in time
- Ability to rebuild read models from scratch

## When NOT To Use
- Simple CRUD applications (adds significant complexity without benefit)
- Entities that don't need audit trails or temporal queries

## Prerequisites
- Domain events basics (CPC-02)
- Event design understanding (CPC-04)

## Inputs
- Aggregate root definitions
- Event stream requirements

## Workflow
1. **Use snapshots for performance.** Periodically save the aggregate's current state to avoid replaying all events from the beginning. Load aggregate from snapshot + events after snapshot.

2. **Never modify or delete events.** Treat the event store as strictly append-only. Append a correction event instead of mutating committed events. Events are immutable facts.

3. **Use event sourcing selectively.** Apply only to aggregates that genuinely need audit trails, temporal queries, or replayable projections. Not every entity needs event sourcing.

4. **Make projections idempotent.** Every projection handler must handle the same event multiple times and produce the same result. Use `updateOrInsert` and other idempotent patterns.

5. **Version events in the event store.** Store a version or event type identifier with every event. Use upcasters to handle schema evolution for old events in the store.

## Validation Checklist
- [ ] Event store is append-only (no updates, no deletes)
- [ ] Snapshots are configured for performance
- [ ] Projections are idempotent and rebuildable
- [ ] Event sourcing is only used where justified
- [ ] Aggregate state is rebuilt from events (or snapshot + events)
- [ ] Events are versioned in the store

## Common Failures
- **Event sourcing without snapshots.** Full replay on every aggregate load — performance degrades as stream grows.
- **Mutable events.** Projections become inconsistent; audit trail destroyed.
- **Event sourcing for everything.** Unnecessary complexity for entities that don't need audit trails.

## Decision Points
- **Event sourcing vs ORM?** Use event sourcing when audit trails, temporal queries, or rebuildable projections are required. Use ORM for everything else.
- **Snapshot frequency?** Depends on event volume. Start with every 100 events or daily; tune based on aggregate load patterns.

## Performance Considerations
- Event replay cost grows with stream length (mitigated by snapshots).
- Projection rebuild: replay all events (time proportional to total event count).
- Snapshot frequency is a tuning parameter.

## Security Considerations
- Event store is the source of truth. Ensure backups and append-only permissions are enforced.
- Events may carry sensitive data — ensure appropriate handling.

## Related Rules
- Rule: Use snapshots for performance (CPC-09/05-rules.md)
- Rule: Never modify or delete events (CPC-09/05-rules.md)
- Rule: Use event sourcing selectively (CPC-09/05-rules.md)
- Rule: Make projections idempotent (CPC-09/05-rules.md)
- Rule: Version events in the event store (CPC-09/05-rules.md)

## Related Skills
- Design Domain Events (CPC-02/06-skills.md)
- Design Event Payloads (CPC-04/06-skills.md)
- Implement CQRS (CPC-08/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)

## Success Criteria
- Event store is strictly append-only — no updates or deletes of committed events.
- Snapshots are configured for every event-sourced aggregate to prevent full-stream replay.
- Event sourcing is applied only to entities that need audit trails or temporal queries.
- All projections use idempotent handlers (safe for rebuild/replay).
- All stored events carry explicit version identifiers with upcasters for schema evolution.
