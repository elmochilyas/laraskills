# Skill: Distinguish Between Domain and Integration Events

## Purpose

Design events at the right level of granularity — domain events for internal business logic, integration events for cross-system communication.

## When To Use

- When events serve both internal domain logic and external propagation
- Designing event schemas for cross-bounded-context communication
- Determining which events to publish to message brokers vs handle internally

## When NOT To Use

- Systems with no event-driven interactions
- When all consumers are internal to the same bounded context

## Prerequisites

- Bounded context boundaries understood
- Event sourcing or event-driven architecture basics
- Domain event pattern knowledge

## Inputs

- Event catalog from Event Storming
- Consumer analysis (internal handlers vs external subscribers)
- Bounded context map

## Workflow

1. Identify all events from Event Storming or domain analysis
2. Classify each event: domain event (internal, same context) vs integration event (cross-context)
3. Domain events: captured, stored, and handled within the same bounded context
4. Integration events: transformed from domain events, published to message bus for other contexts
5. Keep integration events at a higher level of abstraction (coarse-grained, stable schema)
6. Version integration events explicitly; domain events can evolve more freely
7. Map integration events to context mapping relationships (OHS, Published Language)

## Validation Checklist

- [ ] Each event classified as domain or integration
- [ ] Domain events not published outside their context
- [ ] Integration events transformed from domain events (not raw domain events)
- [ ] Integration events have explicit versioning
- [ ] Integration event schemas are stable and consumer-compatible
- [ ] Domain events can evolve independently within their context
- [ ] Integration events aligned with context mapping patterns

## Common Failures

- Publishing raw domain events as integration events (coupling consumers to internal details)
- Using same event schema for both purposes (schema rigidity)
- Domain events polluted with integration concerns (routing keys, headers)
- Integration events too fine-grained (chatty cross-context communication)
- Versioning integration events but not communicating breaking changes

## Decision Points

- What level of detail should the integration event carry vs the domain event?
- Which domain events need corresponding integration events?
- How to transform domain events into integration events?

## Performance Considerations

- Integration event serialization/deserialization adds overhead
- Too many integration events flood message brokers
- Batch multiple domain changes into single integration events where appropriate

## Security Considerations

- Integration events may expose internal domain details to other contexts
- Never pass sensitive data in integration events that external contexts shouldn't see
- Integration events need their own authorization model

## Related Rules (from 05-rules.md)

- Rule 4 (Event Storming): Keep events in the past tense (OrderPlaced, InvoicePaid)

## Related Skills

- Implement Event Bus Patterns
- Implement Event Versioning and Schema Evolution
- Define Context Mapping Relationships

## Success Criteria

- Integration events change less frequently than domain events
- Consumer contexts never depend on internal domain event schemas
- Domain events can be refactored without affecting cross-context subscribers
