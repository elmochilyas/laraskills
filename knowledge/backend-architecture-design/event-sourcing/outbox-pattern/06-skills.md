# Skill: Implement the Outbox Pattern

## Purpose

Reliably publish events as part of a database transaction to ensure atomicity between state changes and event publication.

## When To Use

- When event publication must be atomic with database writes
- Systems requiring at-least-once event delivery guarantees
- Event-driven microservices where consistency matters
- When dual writes (DB + message broker) risk inconsistency

## When NOT To Use

- When events are not critical (occasional loss is acceptable)
- When using an event store that handles this natively
- Simple in-process event dispatch (no atomicity required)

## Prerequisites

- Database transaction support
- Message broker/event bus
- Background worker for outbox processing

## Inputs

- Events that must be published atomically with DB transactions
- Database schema for outbox table
- Retry and cleanup policies

## Workflow

1. Create an `outbox_messages` table (id, event_type, event_body, created_at, published_at, retry_count)
2. Within the same DB transaction that modifies state, insert event into outbox table
3. Run a background worker/process that polls the outbox table
4. Worker publishes unpublished events to the message broker
5. Mark events as published after successful broker acknowledgment
6. Implement retry with exponential backoff for failed publications
7. Implement a cleanup job for old published records
8. Monitor outbox table for stuck/unpublished messages

## Validation Checklist

- [ ] Outbox_messages table created with required columns
- [ ] Event inserted into outbox in same transaction as state change
- [ ] Background worker polls and publishes unpublished events
- [ ] Events marked as published after broker acknowledgment
- [ ] Retry mechanism for failed publications
- [ ] Cleanup job for old published records
- [ ] Monitoring for stuck/unpublished messages
- [ ] Idempotent event consumers handle potential duplicate delivery

## Common Failures

- Outbox insert in separate transaction (defeats purpose)
- No retry mechanism (events stuck forever)
- No cleanup (table grows unbounded)
- No monitoring (silent failures)
- Workers not idempotent (duplicate publication)
- Publishing before marking as published (crash resends)

## Decision Points

- Polling frequency vs latency tradeoff?
- Remove published events vs mark as published?
- Worker count: single (ordered delivery) vs multiple (parallel throughput)?

## Performance Considerations

- Outbox insert adds minimal overhead (same transaction)
- Polling interval determines publication latency (100ms typical)
- Table size management: archive old records, not delete at high throughput
- Index on `published_at IS NULL` for efficient polling

## Security Considerations

- Outbox events may contain sensitive data; encrypt event_body
- Access controls on outbox table
- Worker should have minimum required permissions
- Cleanup must respect data retention policies

## Related Rules (from 05-rules.md)

- Rule 1 (Read Models): Build read models via projectors listening to domain events, never via dual writes
- Rule 5 (Command Bus): Wrap every command dispatch with transactional middleware

## Related Skills

- Implement Event Bus Patterns
- Design Event Sourcing Components
- Implement Dead Letter Handling

## Success Criteria

- Zero events lost due to dual-write inconsistency
- Event publication latency within acceptable threshold (< 1 second)
- Stuck/unpublished events detected and alerted within minutes
