# Skill: Design Event Sourcing Components

## Purpose

Architect the event store, event stream, aggregate, and projector components for a reliable event-sourced system.

## When To Use

- Full audit trail is a business requirement
- Temporal queries needed (state at any point in time)
- Complex domain where event history provides business value
- CQRS maturity Level 4 adoption

## When NOT To Use

- Simple CRUD (event sourcing adds significant complexity)
- When storage cost of event history is prohibitive
- When team has no experience with event-driven patterns
- When query requirements are simple and well-served by current DB

## Prerequisites

- Event sourcing basics (events as source of truth)
- CQRS understanding (Level 3+)
- Event store technology (DynamoDB, EventStoreDB, PostgreSQL event store)

## Inputs

- Domain event catalog
- Aggregate definitions
- Projection/read model requirements
- Snapshot strategy requirements

## Workflow

1. Define event store schema (event_id, aggregate_id, event_type, data, metadata, version, timestamp)
2. Implement aggregate root with event-sourced behavior (apply events, guard invariants)
3. Implement event stream per aggregate (sequential, versioned)
4. Create projectors that listen to event streams and update read models
5. Implement snapshots for aggregates with long streams (> 100 events)
6. Provide event replay capability for rebuilding read models
7. Implement concurrency control via aggregate version checking
8. Set up event store backup and retention policies

## Validation Checklist

- [ ] Event store schema captures all required metadata
- [ ] Aggregates produce and apply events correctly
- [ ] Event streams are sequential with version tracking
- [ ] Projectors update read models from events
- [ ] Snapshot strategy defined (frequency, criteria)
- [ ] Event replay can rebuild read models from scratch
- [ ] Optimistic concurrency control implemented
- [ ] Retention and backup policies documented

## Common Failures

- Not versioning event schemas (breaking changes impossible)
- No snapshot strategy (slow aggregate rebuild)
- Projectors not idempotent (duplicate data on replay)
- Performance not considered (event store becomes bottleneck)
- No retention policy (unlimited event storage)

## Decision Points

- Event store: purpose-built (EventStoreDB) vs relational (PostgreSQL)?
- Snapshot every N events or based on time?
- Retention: keep all events forever or archive after N years?

## Performance Considerations

- Event store writes are append-only (fast)
- Reads require replaying events (slow for long streams)
- Snapshots trade storage for replay speed
- Projections trade write amplification for read speed

## Security Considerations

- Event store contains all historical data — encrypt sensitive fields
- Event metadata should not expose sensitive audit trails
- Access controls: who can replay events, who can read audit history
- GDPR right-to-erasure requires event deletion/obfuscation

## Related Rules (from 05-rules.md)

- Rule 1 (Read Models): Build read models via projectors listening to domain events
- Rule 5 (Read Models): Implement idempotent projectors that can replay events without duplicating data

## Related Skills

- Implement Event Bus Patterns
- Implement Event Versioning and Schema Evolution
- Implement Read Model Strategies

## Success Criteria

- Aggregate state can be rebuilt from event history at any point
- Read models can be rebuilt from scratch via event replay
- Event store append throughput meets write load requirements
