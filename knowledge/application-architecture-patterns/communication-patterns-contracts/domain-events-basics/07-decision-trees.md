# Decision Trees: Domain Events Within and Across Contexts

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Domain events within and across contexts
- **Knowledge Unit ID:** CPC-02
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Domain event vs technical event | Architecture | Event naming |
| 2 | Single event class vs separate internal/integration events | Architecture | Event class design |
| 3 | dispatch() vs dispatchAfterCommit() | Architecture | Event dispatch timing |

---

## Decision 1: Domain event vs technical event

### Context
Events should model business facts — things that matter to the domain. `OrderShipped` is a domain event. `ModelSaved` is a technical event. Technical events couple consumers to implementation details (database operations instead of business concepts). The distinction affects how events are named, what data they carry, and how stable they are.

### Decision Tree

```
Does the event describe a business-relevant occurrence?
├── YES → Domain event — correct
│   `OrderPlaced`, `PaymentReceived`, `UserRegistered`
│   Named in past tense
│   The business cares about this happening
│   Stable — the business concept rarely changes
└── NO → Technical event — avoid
    `ModelSaved`, `RowUpdated`, `CacheCleared`
    Does the event correspond to a genuine domain operation?
    ├── YES → Rename to domain terminology
    │   Instead of `UserUpdated`, use `UserEmailChanged` or `UserProfileUpdated`
    │   Captures the business meaning, not the technical operation
    └── NO (purely technical, no business meaning)
        → Don't expose as a domain event
        Technical events should stay within infrastructure
        Consumers shouldn't know about cache clears or DB writes
```

### Rationale
Domain events are stable because they reflect business language. `OrderPlaced` won't change meaning even if the database schema changes. Technical events (`ModelSaved`) change when the implementation changes, causing unnecessary churn in consumers. Events are a contract — and the contract should be in domain terms, not technical terms. Always ask: "Would a business stakeholder understand this event name?"

### Recommended Default
Domain events named in past tense reflecting business facts

### Risks
- Technical events: consumers couple to implementation details
- Imperative event names (`PlaceOrder` instead of `OrderPlaced`): confuses commands with events
- Event with no business meaning: consumers can't understand when to listen for it

### Related Rules
- Name domain events in past tense (CPC-02/05-rules.md)
- Model business facts, not technical events (CPC-02/05-rules.md)
- Keep event payloads minimal (CPC-02/05-rules.md)

### Related Skills
- Design Domain Events Within and Across Contexts (CPC-02/06-skills.md)
- Choose Sync vs Queued Events (CPC-03/06-skills.md)
- Design Event Payloads (CPC-04/06-skills.md)

---

## Decision 2: Single event class vs separate internal/integration events

### Decision Tree

```
Will the same event be consumed both internally and across context boundaries?
├── YES → Use separate event classes
│   Internal event: carries internal data, entity references, full model
│   `class OrderShipped { public readonly Order $order; }`
│   Integration event: self-contained DTO, cross-context fields only
│   `class OrderShippedIntegration { public string $orderId; public string $status; }`
│   Why separate? Internal events can use entity references (Eloquent models).
│   Integration events must NOT — they cross context boundaries.
└── NO (event is consumed only internally or only externally)
    → Single event class may be sufficient
    Is the event consumed only internally?
    ├── YES → Internal event class — can carry entity references
    │   `class OrderShipped { public readonly Order $order; }`
    └── NO (cross-context only)
        → Integration event class — must be self-contained DTO
        `class OrderShipped { public readonly string $orderId; }`
        No entity references, no implementation details
```

### Rationale
Separate event classes prevent leaking internal implementation details across context boundaries. An internal event can carry the full Eloquent model — it's only consumed within the same context. An integration event must be a self-contained DTO with primitive fields, because crossing a context boundary means the consumer shouldn't know about the producer's schema or entity structure.

### Recommended Default
Separate internal and integration event classes when an event crosses context boundaries

### Risks
- Single event used everywhere: internal model details exposed to other contexts
- Integration event with entity reference: coupled to producer's persistence layer
- Two classes drifting apart: internal and integration events diverge, handlers miss data

### Related Rules
- Separate internal events from integration events (CPC-02/05-rules.md)
- Include the aggregate ID in every event (CPC-02/05-rules.md)
- Keep event payloads minimal (CPC-02/05-rules.md)

### Related Skills
- Design Domain Events Within and Across Contexts (CPC-02/06-skills.md)
- Define Formalized Contracts (CPC-01/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)

---

## Decision 3: dispatch() vs dispatchAfterCommit()

### Decision Tree

```
Is the event dispatched inside a database transaction?
├── YES → Use dispatchAfterCommit()
│   `Event::dispatchAfterCommit()`
│   Event is queued/dispatched only after the DB transaction commits
│   If the transaction rolls back, the event is NOT dispatched
│   This prevents phantom events for rolled-back changes
│   Is the handler synchronous (same request)?
│   ├── YES → dispatchAfterCommit still preferred
│   │   Sync listeners run after commit
│   └── NO (queued handler)
│       → dispatchAfterCommit is REQUIRED
│       MUST set `$afterCommit = true` on the queued handler
└── NO (outside any transaction)
    → dispatch() is acceptable
    No transaction to roll back — event is safe to dispatch immediately
    Still consider dispatchAfterCommit() if:
    - A transaction may be added later
    - Future readers may assume transactional guarantees
```

### Rationale
`dispatch()` inside a transaction dispatches the event before the transaction commits. If the transaction later rolls back, the event has already been processed — listeners may have sent emails, updated caches, or queued further work based on a change that never happened. `dispatchAfterCommit()` ensures the event is only dispatched if the transaction succeeds. This is a critical reliability guarantee for event-driven systems.

### Recommended Default
`dispatchAfterCommit()` by default; `dispatch()` only when no transaction is involved

### Risks
- `dispatch()` inside transaction: phantom events on rollback
- Not using `$afterCommit` on queued handler: event dispatched before commit
- Forgetting `dispatchAfterCommit` in transactional context: unreliable events

### Related Rules
- Dispatch events after DB commit (CPC-02/05-rules.md)
- Always set `$afterCommit = true` on queued handlers (CPC-03/05-rules.md)
- Keep event payloads minimal (CPC-02/05-rules.md)

### Related Skills
- Design Domain Events Within and Across Contexts (CPC-02/06-skills.md)
- Choose Sync vs Queued Events (CPC-03/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)
