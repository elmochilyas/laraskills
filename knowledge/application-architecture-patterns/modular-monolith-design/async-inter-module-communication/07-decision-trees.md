# Decision Trees: Asynchronous Inter-Module Communication via Events

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Inter-module asynchronous communication via events
- **Knowledge Unit ID:** MMD-07
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Async events vs sync contracts for cross-module communication | Architecture | Communication design |
| 2 | Queued vs synchronous event dispatch | Performance | Event dispatch |
| 3 | Minimal payload vs full model in events | Architecture | Event design |

---

## Decision 1: Async events vs sync contracts

### Context
Events are the recommended default for most cross-module communication in a modular monolith. They provide the strongest decoupling: the publisher doesn't know subscribers exist. Use events when Module A needs to notify Module B without an immediate response. Use sync contracts when a blocking response is required.

### Decision Tree

```
Does Module A need a response from Module B before proceeding?
├── YES → Synchronous contract (not events)
│   Is the response used in the HTTP response?
│   ├── YES → Sync contract — caller blocks for result
│   └── NO → Could use events with eventual consistency
│       Evaluate: can the operation tolerate delay?
│       ├── YES → Consider events (preferred for decoupling)
│       └── NO → Sync contract
└── NO (fire-and-forget notification)
    → Async events — default choice
    Could the event trigger more than 10 listeners?
    ├── YES → Still events, but audit listener count and document flow
    └── NO → Events are ideal
```

### Rationale
Events decouple modules completely — the publisher imports nothing from the subscriber. This is the strongest form of decoupling. However, events cannot provide return values. If Module A needs to know the result of Module B's processing before proceeding, use sync contracts. For everything else, events are preferred.

### Recommended Default
Async events for cross-module notifications; sync contracts for request-response

### Risks
- Events for blocking operations: callbacks/polling adds complexity
- Events within a single module: adds indirection without decoupling benefit
- Too many events per request (10+): flow becomes opaque

### Related Rules
- Queue Cross-Module Events by Default (MMD-07/05-rules.md)
- Keep Event Payloads Minimal (MMD-07/05-rules.md)
- Past-Tense Event Naming (MMD-07/05-rules.md)
- No Events for Within-Module Communication (MMD-07/05-rules.md)

### Related Skills
- Manage Asynchronous Inter-Module Communication via Events (MMD-07/06-skills.md)
- Manage Sync Inter-Module Communication via Contracts (MMD-06/06-skills.md)

---

## Decision 2: Queued vs synchronous event dispatch

### Context
Cross-module events should be queued by default (implement `ShouldQueue`). Synchronous event dispatch blocks the HTTP response until all listeners complete. A slow listener (email, PDF generation, webhook) adds its latency to every request. Queuing adds ~1-5ms overhead and runs listeners asynchronously.

### Decision Tree

```
Does the listener perform a potentially slow operation (API call, email, file processing)?
├── YES → Queue the listener (ShouldQueue)
│   Is the operation time-sensitive (must happen before next response)?
│   ├── YES → Still queue, but use a high-priority queue
│   └── NO → Queue on default queue
└── NO (fast operation — cache update, in-memory state change)
    Does the response depend on this listener having completed?
    ├── YES → Sync dispatch (data consistency required)
    └── NO → Queue the listener anyway (defensive — fast now, slow later)
```

### Rationale
Queued dispatch is the safe default. A listener that is fast today may become slow tomorrow (database grows, third-party API slows). Queuing from the start avoids retrofitting. The only exception is when response data consistency requires the listener to complete before the response is sent.

### Recommended Default
Queue all cross-module event listeners (ShouldQueue)

### Risks
- Sync dispatch for slow listeners: HTTP response blocked, poor UX
- Queue dispatch for consistency-critical listeners: stale data in response
- Missing `ShouldQueue`: silent performance regression when listener becomes slow

### Related Rules
- Queue Cross-Module Events by Default (MMD-07/05-rules.md)
- Keep Event Payloads Minimal (MMD-07/05-rules.md)
- Make Listeners Idempotent (MMD-07/05-rules.md)

### Related Skills
- Manage Asynchronous Inter-Module Communication via Events (MMD-07/06-skills.md)
- Define and Dispatch Domain Events (LAP-08/06-skills.md)

---

## Decision 3: Minimal payload vs full model in events

### Context
Event payloads should include only the aggregate ID and changed values — never Eloquent models or full serialized aggregates. Full models create coupling (consumer depends on provider's schema), serialization issues, oversize queue payloads, and potential PII exposure.

### Decision Tree

```
Does the payload include an Eloquent model?
├── YES
│   Can the consumer query for the data it needs using the ID?
│   ├── YES → Replace model with ID only
│   └── NO → Replace model with a DTO containing only needed fields
└── NO (already using IDs/DTOs)
    Does the payload include fields not used by any current listener?
    ├── YES → Remove unused fields — minimal payload
    └── NO → Payload is appropriately minimal
```

### Rationale
Event payloads should be the minimum data needed for subscribers to do their work. Including only IDs forces consumers to query the provider through contracts for additional data, which is the correct architectural pattern. Full Eloquent models are always wrong in events — they couple consumers to provider internals.

### Recommended Default
IDs and DTOs only — no Eloquent models

### Risks
- Full models: consumer coupled to provider's database schema
- Full models: Eloquent serialization includes relations, hidden attributes, PII
- Oversized payloads: queue storage limits, serialization overhead
- Too minimal: subscribers need multiple queries to reconstruct context

### Related Rules
- Keep Event Payloads Minimal (MMD-07/05-rules.md)
- Past-Tense Event Naming (MMD-07/05-rules.md)
- Make Listeners Idempotent (MMD-07/05-rules.md)
- Document Module Events (MMD-07/05-rules.md)

### Related Skills
- Manage Asynchronous Inter-Module Communication via Events (MMD-07/06-skills.md)
- Implement Data Transfer Objects (LAP-14/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)
