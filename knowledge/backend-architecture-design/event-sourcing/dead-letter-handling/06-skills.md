# Skill: Implement Dead Letter Handling for Events

## Purpose

Reliably handle events that fail processing, preventing message loss and enabling replay and debugging.

## When To Use

- Event-driven systems with async message processing
- When failed events must not be silently dropped
- Systems requiring audit trail of processing failures
- Integrating with unreliable external systems

## When NOT To Use

- Synchronous event processing (failures propagate immediately)
- Non-critical events where occasional loss is acceptable

## Prerequisites

- Event bus infrastructure (RabbitMQ, Kafka, SQS, Laravel queues)
- Failed message storage (database, file, or dedicated queue)

## Inputs

- Event processing failure conditions
- Retry policy (retry count, backoff, timeout)
- Alerting thresholds

## Workflow

1. Define what constitutes a processing failure (exception, timeout, validation)
2. Configure retry policy (number of retries, exponential backoff)
3. After retries exhausted, route failed events to a dead letter queue/table
4. Store original event payload, error details, timestamp, and retry count
5. Implement a dead letter viewer/management UI or CLI
6. Set up alerting when dead letter queue grows beyond threshold
7. Provide manual replay capability for resolved failures
8. Periodically review dead letter queue for systemic issues

## Validation Checklist

- [ ] Failed events go to dead letter queue after retries exhausted
- [ ] Original event payload preserved in dead letter storage
- [ ] Error details (exception, stack trace, timestamp) captured
- [ ] Retry policy defined (count, backoff, timeout)
- [ ] Alerting configured for dead letter queue threshold
- [ ] Manual replay capability implemented
- [ ] Dead letter entries can be searched/filtered

## Common Failures

- No retry before dead letter (transient failures lost)
- Infinite retries without dead letter (blocked processing)
- Dead letter without alerting (failures go unnoticed)
- No replay capability (can't recover after fix)
- Payload not preserved (can't debug or replay)

## Decision Points

- Retry count before dead letter? (typically 3-5)
- Exponential backoff multiplier? (typically 2-4x)
- Dead letter storage: same queue system vs database?

## Performance Considerations

- Dead letter queue needs retention policy (TTL)
- Replay all events from dead letter can overwhelm consumers
- Monitor dead letter queue size and growth rate

## Security Considerations

- Dead letter payloads may contain sensitive data; restrict access
- Ensure dead letter storage encryption matches source
- Replay capability must respect authorization boundaries

## Related Rules (from 05-rules.md)

- Rule 5 (Read Model Strategies): Implement idempotent projectors that can replay events without duplicating data

## Related Skills

- Implement Event Bus Patterns
- Design Event Sourcing Components
- Implement Outbox Pattern

## Success Criteria

- Zero events silently lost due to processing failures
- Dead letter queue reviewed and processed within defined SLAs
- Failed events can be replayed after root cause resolution
