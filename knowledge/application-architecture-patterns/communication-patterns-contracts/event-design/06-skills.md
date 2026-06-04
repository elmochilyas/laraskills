# Skill: Design Event Payloads, Granularity, and Envelope Structure

## Purpose
Default to fat events (include all data consumers need). Always wrap events in an envelope separating metadata from payload. Default to coarse granularity (one event per aggregate change). Never mutate events after publication. Version event schemas explicitly. Include correlation and causation IDs.

## When To Use
- Cross-context async communication
- Decoupling side effects from primary operations
- Audit logging and event sourcing

## When NOT To Use
- Simple CRUD operations with no consumers
- Request-response flows better served by synchronous calls

## Prerequisites
- Domain events basics (CPC-02)
- Sync vs queued events (CPC-03)

## Inputs
- Consumer data needs
- Event schema requirements

## Workflow
1. **Default to fat events.** Include relevant data the consumer likely needs — saves round-trips and reduces coupling. The consumer shouldn't need to query the producer to act on the event.

2. **Always use event envelope with metadata.** Separate metadata (event ID, type, version, timestamp, correlation ID, causation ID) from domain payload. Enables tracing, versioning, and debugging.

3. **Default to coarse granularity.** One event per meaningful aggregate state change, not one per field change. Consumers listen to business-relevant events, not noise.

4. **Never mutate an event after publication.** Events are facts about the past. Publish a correction event instead. Once read, events are immutable.

5. **Version event schemas explicitly.** Carry a version label on every event. When schema changes, increment the version and keep backward compatibility for at least one migration cycle.

6. **Include correlation and causation IDs.** Correlation ID traces the original operation across contexts. Causation ID identifies the immediate parent event. Enables distributed debugging.

## Validation Checklist
- [ ] Events carry fat payloads (not just IDs)
- [ ] Event envelope includes eventId, eventType, version, timestamp, correlationId, causationId
- [ ] Events are immutable (no update mechanism)
- [ ] Event versions exist for schema migration
- [ ] Events are coarse-grained (one per aggregate change, not per field)

## Common Failures
- **Thin events that require fetching.** Consumer must query the producer — temporal coupling.
- **No correlation ID.** Events cannot be traced across contexts — debugging nearly impossible.
- **Mutable events.** Consumer behavior becomes inconsistent after updates.

## Decision Points
- **Fat vs thin event?** Default to fat. Use thin only for extremely large payloads (video processing) where thin event carries a signed URL.

## Performance Considerations
- Fat events: larger payloads but save round-trips.
- Thin events: minimal payload but require consumer to query the source (temporal coupling risk).

## Security Considerations
- Events may carry sensitive data across context boundaries. Ensure only non-sensitive data or apply appropriate masking.

## Related Rules
- Rule: Default to fat events (CPC-04/05-rules.md)
- Rule: Always include an event envelope with metadata (CPC-04/05-rules.md)
- Rule: Default to coarse-grained events (CPC-04/05-rules.md)
- Rule: Never mutate an event after publication (CPC-04/05-rules.md)
- Rule: Version event schemas explicitly (CPC-04/05-rules.md)
- Rule: Include correlation and causation IDs (CPC-04/05-rules.md)

## Related Skills
- Design Domain Events (CPC-02/06-skills.md)
- Choose Sync vs Queued Events (CPC-03/06-skills.md)
- Define Formalized Contracts (CPC-01/06-skills.md)
- Implement Event Sourcing (CPC-09/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)
- Implement Distributed Tracing (CPC-11/06-skills.md)

## Success Criteria
- All integration events use fat payloads with all data consumers need.
- Every event is wrapped in an envelope with eventId, eventType, version, timestamp, correlationId, causationId.
- One coarse event per aggregate change — no field-level event noise.
- No mutation of published events — corrections published as new events.
- Event schemas are versioned (V1, V2) with backward compatibility during migration.
