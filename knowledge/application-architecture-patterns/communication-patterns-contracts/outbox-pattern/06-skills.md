# Skill: Implement Outbox Pattern for Reliable Event Delivery

## Purpose
Write events to an outbox table within the same database transaction as the business operation. Use a polling publisher to process pending events. Make consumers idempotent (at-least-once delivery). Clean up published records. Use `dispatchAfterCommit` for non-critical events instead.

## When To Use
- Event delivery must be guaranteed — event published iff transaction commits
- Cross-context communication where reliability matters

## When NOT To Use
- Non-critical events where temporary loss is acceptable (logging, analytics)
- Simple scenarios where `dispatchAfterCommit` is sufficient and queue is not a single point of failure

## Prerequisites
- Domain events basics (CPC-02)
- Sync vs queued events (CPC-03)

## Inputs
- Critical event catalog
- Database schema for outbox table

## Workflow
1. **Write to the outbox in the same transaction as the business operation.** If the outbox write is in a separate transaction, the business transaction can commit while the outbox write fails — the event is lost. Same-transaction guarantees atomicity.

2. **Make all outbox consumers idempotent.** The outbox pattern provides at-least-once delivery. Duplicates are possible. Consumers must handle duplicate events safely — use idempotency checks.

3. **Use a polling publisher for simplicity.** Implement as a scheduled command (Laravel `schedule:run` every minute) that polls the outbox table, publishes pending events, and marks them as published.

4. **Implement outbox cleanup.** Regularly archive or delete published outbox records to prevent table bloat. Configure a retention period.

5. **Use `dispatchAfterCommit` for non-critical events instead of outbox.** Reserve the outbox pattern for events where delivery guarantees are critical. `dispatchAfterCommit` is sufficient for logging, analytics, and non-critical notifications.

## Validation Checklist
- [ ] Outbox writes are in the same transaction as the business operation
- [ ] A polling publisher processes pending events
- [ ] Consumers are idempotent (handle duplicates safely)
- [ ] Published records are cleaned up after retention period
- [ ] Outbox pattern is used for critical events (not logging/analytics)

## Common Failures
- **No outbox.** Events dispatched without transactional guarantee — lost on dispatch failure.
- **Outbox in a separate transaction.** Business transaction commits, outbox write fails — event lost.
- **No idempotency.** Outbox provides at-least-once delivery — duplicates cause incorrect state.

## Decision Points
- **Outbox vs `dispatchAfterCommit`?** Outbox for critical must-not-lose events. `dispatchAfterCommit` for non-critical events where temporary loss is acceptable.
- **Polling publisher vs CDC?** Polling publisher for simplicity (per-minute latency). CDC (Debezium) for sub-second latency requirements.

## Performance Considerations
- Adds a database write per event within the existing transaction (negligible overhead).
- Polling latency: up to 1 minute with per-minute scheduler.
- Cleanup job overhead for large outbox tables.

## Security Considerations
- Outbox events can contain sensitive data. Ensure payload serialization handles data appropriately.

## Related Rules
- Rule: Write to the outbox in the same transaction as the business operation (CPC-10/05-rules.md)
- Rule: Make all outbox consumers idempotent (CPC-10/05-rules.md)
- Rule: Use a polling publisher for simplicity (CPC-10/05-rules.md)
- Rule: Implement outbox cleanup (CPC-10/05-rules.md)
- Rule: Use `dispatchAfterCommit` for non-critical events (CPC-10/05-rules.md)

## Related Skills
- Design Domain Events (CPC-02/06-skills.md)
- Choose Sync vs Queued Events (CPC-03/06-skills.md)
- Implement Message Bus (CPC-05/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)
- Implement Event Sourcing (CPC-09/06-skills.md)

## Success Criteria
- Outbox records are inserted within the same database transaction as the originating business operation.
- A scheduled polling publisher processes pending outbox events and marks them as published.
- All event consumers that use outbox delivery implement idempotency checks.
- Published outbox records are deleted or archived after the retention period.
- `dispatchAfterCommit` is used for non-critical events; outbox is used only for critical must-not-lose events.
