# Decision Trees: Event Design Patterns

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Event design patterns
- **Knowledge Unit ID:** CPC-04
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Fat event vs thin event | Architecture | Event payload design |
| 2 | Coarse granularity vs fine granularity | Architecture | Event scope |
| 3 | Event envelope vs flat event structure | Architecture | Event metadata design |

---

## Decision 1: Fat event vs thin event

### Context
Fat events include all data the consumer likely needs. Thin events carry only IDs and force the consumer to query the producer for details. Fat events create larger payloads but make consumers self-sufficient. Thin events minimize payload size but create temporal coupling — what if the producer deletes the referenced data?

### Decision Tree

```
What data does the consumer need to act on the event?
├── Multiple fields from the producer's aggregate
│   → Fat event — include all relevant data
│   `OrderPlaced` with customerId, customerEmail, total, currency, lineItems
│   Consumer processes the event without querying the producer
│   Temporal coupling risk eliminated
├── Only an identifier (just needs to know "something happened")
│   → Thin event may be acceptable
│   `FileUploaded` with just fileId — consumer fetches from file storage
│   Is the referenced data permanent and accessible later?
│   ├── YES → Thin event is acceptable
│   │   Data won't be deleted; consumer can always fetch it
│   └── NO → Fat event is safer
│       If the data might be deleted/archived, include it in the event
└── Extremely large payload (video, images, 100MB+ data)
    → Thin event with signed URL
    Include a signed URL to the data instead of the raw payload
    Consumer downloads data when needed
```

### Rationale
Fat events are the default because they eliminate temporal coupling. When an event carries only an order ID, and later the order is deleted or archived, the consumer can no longer process the event. With a fat event carrying all needed data, the event is self-contained and the consumer is independent. The cost is larger event payloads, but the benefit is consumer autonomy. The exception is extremely large payloads (video, images) where including the data is impractical.

### Recommended Default
Fat events with all data consumers need; thin events only for permanent reference IDs

### Risks
- Thin event: temporal coupling — consumer breaks if producer deletes referenced data
- Fat event with too much data: includes fields no consumer uses, harder to change
- Thin event with large payload: impractical to include — use signed URL

### Related Rules
- Default to fat events (CPC-04/05-rules.md)
- Always include an event envelope with metadata (CPC-04/05-rules.md)
- Version event schemas explicitly (CPC-04/05-rules.md)

### Related Skills
- Design Event Payloads, Granularity, and Envelope Structure (CPC-04/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
- Implement Distributed Tracing (CPC-11/06-skills.md)

---

## Decision 2: Coarse granularity vs fine granularity

### Decision Tree

```
What state change does the event represent?
├── An aggregate-level change (order placed, payment received)
│   → Coarse event — one event per meaningful business occurrence
│   `OrderPlaced` — all changes related to placing the order
│   Consumers listen to the business event, not field details
│   Pros: fewer events, easier to consume, stable event types
│   Cons: consumer gets all changes even if they only care about one
├── A field-level change (email changed, status updated)
│   → Fine event — one event per individual field change
│   `UserEmailChanged`, `OrderStatusUpdated`
│   Pros: precise, consumers only get what they need
│   Cons: event explosion, unstable schema, harder to evolve
└── A combination of both
    → Default to coarse; add fine events only where consumers need precision
    Most consumers want business events, not field-level details
    Only add fine-grained events when a specific consumer needs it
```

### Rationale
Coarse granularity is the default because events should represent business facts, not data changes. `OrderPlaced` is a stable business concept. `OrderTotalUpdated` plus `OrderStatusChanged` plus `OrderShippingAddressSet` are technical details that change when the implementation changes. Coarse events are also easier to consume — one listener instead of three. Fine-grained events are useful when consumers need to react to specific field changes, but they should be the exception, not the default.

### Recommended Default
Coarse granularity (one event per aggregate-level business event)

### Risks
- Fine-grained events: event explosion, unstable schema, noisy
- Coarse event too broad: consumer can't distinguish which field changed
- Mixed granularity without documentation: confusing for consumers

### Related Rules
- Default to coarse-grained events (CPC-04/05-rules.md)
- Include correlation and causation IDs (CPC-04/05-rules.md)
- Never mutate an event after publication (CPC-04/05-rules.md)

### Related Skills
- Design Event Payloads, Granularity, and Envelope Structure (CPC-04/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
- Implement Event Sourcing (CPC-09/06-skills.md)

---

## Decision 3: Event envelope vs flat event structure

### Decision Tree

```
Does the event need metadata (ID, type, version, timestamp)?
├── YES → Use event envelope
│   Separate metadata from domain payload
│   Envelope: eventId, eventType, version, timestamp, correlationId, causationId
│   Payload: domain-specific data
│   Always use for integration events (cross-context)
│   Pros: metadata doesn't pollute payload, tracing works, versioning is explicit
│   Cons: slightly more complex structure
└── NO (in-process, same-context event)
    → Flat structure may be acceptable for internal events
    Internal events can omit envelope since the caller and listener share
    the same process context
    But: still include correlation ID for debugging
    Consider using envelope anyway for consistency when events may
    later become integration events
    ├── YES → Use envelope now — future-proofing
    └── NO → Flat event is fine for internal-only use
```

### Rationale
The event envelope separates concerns: metadata for routing, tracing, and versioning; payload for domain data. This separation enables infrastructure code to inspect and route events based on envelope fields without touching the payload. Correlation and causation IDs in the envelope enable distributed tracing across context boundaries. For internal events within a single context, the envelope is optional but recommended for consistency and future-proofing.

### Recommended Default
Event envelope for all integration events; flat structure acceptable for internal-only events

### Risks
- No envelope: metadata mixed in payload, harder to route/debug
- No correlation ID: cannot trace events across contexts
- No version in envelope: consumers can't distinguish event formats

### Related Rules
- Always include an event envelope with metadata (CPC-04/05-rules.md)
- Version event schemas explicitly (CPC-04/05-rules.md)
- Include correlation and causation IDs (CPC-04/05-rules.md)

### Related Skills
- Design Event Payloads, Granularity, and Envelope Structure (CPC-04/06-skills.md)
- Implement Distributed Tracing (CPC-11/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)
