# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Event design patterns
Knowledge Unit ID: CPC-04
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Event design determines whether events are easy to evolve, debug, and consume. Three core dimensions: schema design (what data the event carries), granularity (one event per type of occurrence vs. generic events), and envelope structure (metadata vs payload separation). Well-designed events carry all data the consumer needs (not just an ID to fetch). Events are immutable; once published, they never change.

---

# Core Concepts

- **Fat events vs. thin events:** A fat event carries all data the consumer might need (e.g., `OrderPlaced` with product names, prices, addresses). A thin event carries only an ID and type. Fat events reduce coupling to the source data store but create larger event schemas.
- **Event envelope:** The outer structure of an event message containing metadata (event ID, type, timestamp, version, correlation ID) separate from the payload (domain data).
- **Event granularity:** Fine-grained events (one per field change) vs. coarse events (one per aggregate change). Coarse events are easier to consume. Fine-grained events give more control.
- **Correlation and causation IDs:** Every event carries a correlation ID (tracing the original operation) and a causation ID (tracing the immediate parent event). Enables tracing across context boundaries.

---

# When To Use

- Cross-context async communication.
- Decoupling side effects from primary operations.
- Audit logging and event sourcing.

---

# When NOT To Use

- Simple CRUD operations with no consumers.
- Request-response flows better served by synchronous calls.

---

# Best Practices

- **Default to fat events.** WHY: Include relevant data the consumer likely needs. Saves round-trips and reduces coupling to source data. The consumer shouldn't need to query the producer to act on the event.
- **Default to coarse granularity.** WHY: One event per meaningful state change, not one per field change. Avoids event noise. Consumers can focus on business-relevant changes.
- **Always use event envelope with metadata.** WHY: The envelope contains event ID, type, timestamp, version, correlation ID, causation ID. The payload contains domain data. This separation enables tracing, versioning, and debugging.
- **Events are immutable.** WHY: Once published, an event must never change. If the schema needs updating, create a new version. Moving from V1 to V2: V2 gets all V1 fields plus new ones. Consumers read the version field and choose the handling path.

---

# Architecture Guidelines

- Fat events: include the data the consumer needs to act without querying the source.
- Versioned event schema: events carry a version label. Consumers can handle multiple versions simultaneously.
- Event envelope separates metadata from payload.

---

# Performance Considerations

- Fat events carry larger payloads but save round-trips.
- Thin events minimize payload but require consumers to query the source (temporal coupling risk).

---

# Security Considerations

- Events may carry sensitive data across context boundaries. Ensure events include only non-sensitive data or apply appropriate masking.

---

# Common Mistakes

1. **Thin events that require fetching:** `OrderPlaced` with only `orderId`. Cause: minimalism taken too far. Consequence: consumers must query the order service, creating temporal coupling — what if the order is deleted later? Better: fat events with relevant data included.

2. **No correlation ID:** Events cannot be traced across contexts. Cause: omission. Consequence: debugging and tracing across contexts is extremely difficult. Better: always include correlation and causation IDs.

3. **Mutable events:** Allowing events to be updated after publication. Cause: convenience for schema changes. Consequence: consumers get inconsistent behavior. Better: events are immutable; create a new version if schema changes.

---

# Anti-Patterns

- **Thin-event mania**: Every event carries only IDs. Consumers constantly query the producer. Fragile coupling.
- **Event version chaos**: No version field. Consumers cannot distinguish between different formats.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| CPC-02 Domain events basics | CPC-01 Interface contracts | CPC-09 Event sourcing |
| CPC-03 Sync vs queued events | CPC-10 Outbox pattern | CPC-11 Distributed tracing |

---

# AI Agent Notes

- Default to fat events (include all relevant data).
- Always include event envelope with metadata.
- Events are immutable — use versioning for schema changes.
- Use coarse granularity (one event per meaningful state change).

---

# Verification

- [ ] Events carry fat payloads (not just IDs)
- [ ] Event envelope includes eventId, eventType, version, timestamp, correlationId, causationId
- [ ] Events are immutable (no update mechanism)
- [ ] Event versions exist for schema migration
- [ ] Events are coarse-grained (one per aggregate change, not per field)
