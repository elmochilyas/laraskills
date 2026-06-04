# Decision Trees: Outbox Pattern for Reliable Event Delivery

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Outbox pattern for reliable event delivery
- **Knowledge Unit ID:** CPC-10
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Outbox vs `dispatchAfterCommit` | Architecture | Event delivery reliability |
| 2 | Polling publisher vs CDC (Change Data Capture) | Architecture | Outbox processing mechanism |
| 3 | Same-transaction outbox vs separate-transaction outbox | Architecture | Outbox insertion strategy |

---

## Decision 1: Outbox vs `dispatchAfterCommit`

### Context
Laravel's `dispatchAfterCommit` dispatches the event after the database transaction commits, but the dispatch itself goes through the queue — the queue could be down, the job could be lost, or the process could crash after the commit but before the dispatch call completes. The Outbox pattern writes the event to a database table within the same transaction, guaranteeing persistence, and a separate worker publishes it.

### Decision Tree

```
Can the application tolerate losing this event?
├── NO — event must be delivered
│   → Use the Outbox pattern
│   Critical: payment notifications, order fulfillment triggers, audit events
│   The event must be published if and only if the transaction commits
│   Outbox guarantees persistence before any dispatch attempt
│   └── Is the event a financial or compliance event?
│       ├── YES → Outbox is REQUIRED
│       │   Lost financial events cause reconciliation failures
│       └── NO → Outbox still strongly recommended
│           Critical non-financial events also need reliability
├── YES — temporary loss is acceptable
│   → `dispatchAfterCommit` is sufficient
│   Non-critical: analytics events, logging, notification preferences sync
│   Temporary loss of an analytics event is acceptable
│   No financial or compliance impact
└── Is the queue a single point of failure?
    ├── YES → Outbox adds resilience
    │   Queue goes down → events in outbox survive
    └── NO → `dispatchAfterCommit` is acceptable for non-critical
```

### Rationale
`dispatchAfterCommit` is a lightweight mechanism that works for non-critical events but provides no delivery guarantee — the queue worker could fail before processing, the queue could back up and lose jobs, or the process could crash between commit and dispatch. The Outbox pattern guarantees at-least-once delivery by persisting the event in the same transaction as the business operation. The cost is an extra database table and a polling worker. Reserve outbox for events where delivery is critical.

### Recommended Default
Outbox for critical events; `dispatchAfterCommit` for non-critical

### Risks
- No outbox for critical events: event lost on queue failure or process crash
- Outbox for analytics: unnecessary complexity, table bloat
- `dispatchAfterCommit` assumption: queue is reliable — it's not

### Related Rules
- Write to the outbox in the same transaction as the business operation (CPC-10/05-rules.md)
- Make all outbox consumers idempotent (CPC-10/05-rules.md)
- Use `dispatchAfterCommit` for non-critical events (CPC-10/05-rules.md)

### Related Skills
- Implement Outbox Pattern for Reliable Event Delivery (CPC-10/06-skills.md)
- Choose Sync vs Queued Events (CPC-03/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)

---

## Decision 2: Polling publisher vs CDC (Change Data Capture)

### Decision Tree

```
What latency is acceptable between event creation and publication?
├── Up to 1 minute
│   → Polling publisher (scheduled command)
│   Laravel `schedule:run` every minute polls the outbox table
│   Processes pending events, publishes to queue/bus, marks as published
│   Pros: simple, no additional infrastructure, reliable
│   Cons: up to 1 minute latency, extra DB query per poll
│   └── Is the outbox table large (> 1M pending records)?
│       ├── YES → Optimize query with index on `published_at` + batch processing
│       └── NO → Simple query is fine
├── Sub-second latency
│   → CDC (Change Data Capture) — e.g., Debezium
│   Streams database changelog to the message bus
│   Near real-time event capture from the database
│   Pros: sub-second latency, no polling, captures all changes
│   Cons: complex infrastructure (Debezium, Kafka), requires binlog
└── Is the infrastructure team experienced with CDC?
    ├── YES → CDC can be considered if latency requirements demand it
    └── NO → Polling publisher — CDC requires specialized operational knowledge
```

### Rationale
The polling publisher is the default because it's simple, reliable, and requires no additional infrastructure beyond the database and Laravel's scheduler. One-minute latency is acceptable for most use cases — events don't need to arrive in milliseconds. CDC with Debezium provides sub-second latency but requires Kafka, Kafka Connect, Debezium, and database binlog configuration — significant operational complexity. Only invest in CDC when latency requirements genuinely demand it.

### Recommended Default
Polling publisher (Laravel scheduled command); CDC only for sub-second latency requirements

### Risks
- CDC complexity: infrastructure overhead, binlog management, schema changes break CDC
- Polling latency: up to 1 minute delay before event is published
- No cleanup: outbox table grows unbounded with published records

### Related Rules
- Use a polling publisher for simplicity (CPC-10/05-rules.md)
- Implement outbox cleanup (CPC-10/05-rules.md)
- Write to the outbox in the same transaction as the business operation (CPC-10/05-rules.md)

### Related Skills
- Implement Outbox Pattern for Reliable Event Delivery (CPC-10/06-skills.md)
- Implement Message Bus (CPC-05/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)

---

## Decision 3: Same-transaction outbox vs separate-transaction outbox

### Decision Tree

```
How does the outbox insert relate to the business transaction?
├── In the SAME database transaction
│   → Correct implementation
│   DB::transaction(function () {
│       // business operation
│       // outbox insert
│   });
│   Both succeed or both roll back atomically
│   Pros: atomic guarantee, no window for data loss
│   Cons: longer transaction duration (negligible)
└── In a SEPARATE transaction (after the business transaction)
    → Incorrect — violates the outbox pattern
    DB::transaction(function () {
        // business operation
    }); // commits
    
    DB::transaction(function () {
        // outbox insert
    }); // may fail
    Risk: business commits, outbox write fails → event lost
    Risk: business rolls back, outbox previously committed → phantom event
    
    ├── Phantom event: outbox inserts before business commits
    │   Business rolls back but event was already queued
    └── Lost event: business commits before outbox
        Business commits, then outbox insert fails → event never published
        NEVER accept this risk
```

### Rationale
The entire point of the outbox pattern is the atomic guarantee: the event is persisted if and only if the business operation commits. Writing to the outbox in a separate transaction breaks this guarantee in both directions. If the outbox insert happens before the business transaction commits and the business rolls back, a phantom event is published. If the outbox insert happens after the business commits and the insert fails, the event is lost. Both are unacceptable.

### Recommended Default
Always write to the outbox in the same database transaction as the business operation

### Risks
- Separate transaction: phantom events or lost events
- Outbox before business commit: phantom event on business rollback
- Outbox after business commit: event lost on outbox write failure

### Related Rules
- Write to the outbox in the same transaction as the business operation (CPC-10/05-rules.md)
- Make all outbox consumers idempotent (CPC-10/05-rules.md)
- Use `dispatchAfterCommit` for non-critical events (CPC-10/05-rules.md)

### Related Skills
- Implement Outbox Pattern for Reliable Event Delivery (CPC-10/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
- Manage Multi-Context Transactions (DBC-11/06-skills.md)
