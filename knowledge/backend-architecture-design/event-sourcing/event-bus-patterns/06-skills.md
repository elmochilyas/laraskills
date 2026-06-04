# Skill: Implement Event Bus Patterns

## Purpose

Design and build event publication and subscription infrastructure for reliable asynchronous communication.

## When To Use

- Decoupling event publishers from subscribers
- Cross-bounded-context communication
- Event-driven workflows and sagas
- Building projection infrastructure for read models

## When NOT To Use

- Simple synchronous method calls within the same service
- When events are an over-engineering for the communication pattern
- When messages require strict ordering and strong consistency

## Prerequisites

- Message queue/broker (RabbitMQ, Kafka, SQS, or Laravel events)
- Event schema definitions
- Publisher and subscriber implementation patterns

## Inputs

- Integration event catalog
- Subscriber analysis (which contexts consume which events)
- Delivery guarantees (at-least-once, exactly-once)

## Workflow

1. Define event bus interface (publish, subscribe, dispatch)
2. Choose transport: Laravel events (in-process) vs queue (async) vs dedicated broker
3. Implement event publishing from domain/application layer
4. Implement event subscribers/handlers for each event type
5. Add middleware for cross-cutting concerns (retry, logging, metrics)
6. Configure delivery guarantees (at-least-once recommended)
7. Implement dead letter handling for failed events
8. Monitor event bus health (event throughput, lag, error rate)

## Validation Checklist

- [ ] Event bus interface abstracts transport details
- [ ] Publishers don't know about subscribers (decoupled)
- [ ] Subscribers are idempotent where possible
- [ ] Delivery guarantee configured (at-least-once)
- [ ] Dead letter handling in place
- [ ] Event bus health monitoring configured
- [ ] Middleware for cross-cutting concerns implemented
- [ ] Events serializable (no closures, no non-serializable objects)

## Common Failures

- Tight coupling between publishers and subscribers
- No dead letter handling (failed events lost)
- Non-serializable event data (queue failures)
- No idempotency in subscribers (duplicate processing)
- Missing monitoring (event processing failures invisible)

## Decision Points

- In-process event bus vs async queue vs Kafka?
- At-least-once vs exactly-once delivery?
- Event schema evolution strategy?

## Performance Considerations

- In-process events: ~1ms latency
- Queue-based (SQS, RabbitMQ): ~50-500ms latency
- Kafka: ~10-100ms with higher throughput
- Monitor consumer lag to detect processing bottlenecks

## Security Considerations

- Event payloads may cross security boundaries; validate and sanitize
- Ensure event bus transport is encrypted (TLS)
- Sensitive events should not be published to unauthorized contexts

## Related Rules (from 05-rules.md)

- Rule 5 (Command Bus): Wrap every command dispatch with transactional middleware
- Rule 1 (Read Models): Build read models via projectors listening to domain events

## Related Skills

- Distinguish Between Domain and Integration Events
- Implement Dead Letter Handling
- Implement Outbox Pattern

## Success Criteria

- Publishers and subscribers can evolve independently
- Event processing failures are captured, alerted, and replayable
- Event bus throughput meets system requirements
