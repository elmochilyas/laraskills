# Decision Trees: Eventual Consistency Across Context Boundaries

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Eventual consistency across context boundaries
- **Knowledge Unit ID:** DBC-12
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Eventual consistency vs strong consistency | Architecture | Cross-context data strategy |
| 2 | Idempotent handler with updateOrCreate vs deduplication tracking | Architecture | Event handler design |
| 3 | Passive staleness vs read-your-writes consistency | Architecture | User experience design |

---

## Decision 1: Eventual consistency vs strong consistency

### Context
Eventual consistency is the default for cross-context data synchronization — it allows each context to evolve independently. Strong consistency (synchronous calls) is needed only when correctness depends on current data. The decision is between accepting staleness for independence or paying the coupling cost for immediate consistency.

### Decision Tree

```
Does the consumer require the absolute latest data for correctness?
├── YES — correctness depends on current cross-context data
│   → Use strong consistency (synchronous contract call)
│   Examples: financial transactions, authorization checks, inventory reservation
│   The consumer must see the latest data from the other context
│   Cost: context coupling, reduced availability, latency
│   Can the operation be redesigned to avoid cross-context reads?
│   ├── YES → Redesign if possible — local data with sync events
│   └── NO → Synchronous call is justified
└── NO — display data, non-critical operations, background processing
    → Use eventual consistency (events + local projections)
    Accept temporary staleness in exchange for context independence
    Is the staleness window acceptable?
    ├── YES → Eventual consistency is correct
    │   Define and document the acceptable staleness window
    └── NO (staleness would cause user-facing problems)
        → Either improve sync speed or use strong consistency
```

### Rationale
Eventual consistency is the price of context independence. If Context B reads data from Context A via events, there's a window where Context B's data is stale. For display data (customer name on an invoice), this is acceptable. For authorization data (user's role changed — can they still access this?), it's not. The decision must be made per data type, not as a blanket rule. Financial transactions, permissions, and inventory typically need strong consistency.

### Recommended Default
Eventual consistency for display and non-critical data; strong consistency for correctness-critical operations

### Risks
- Stale authorization data: security breach from slow permission propagation
- Stale display data: user sees outdated information, confusion
- Synchronous call for all cross-context reads: defeats context independence, creates coupling

### Related Rules
- Default to eventual consistency for cross-context data synchronization (DBC-12/05-rules.md)
- Use synchronous contract calls when current data required (DBC-12/05-rules.md)
- Define and document acceptable staleness windows per data type (DBC-12/05-rules.md)

### Related Skills
- Manage Eventual Consistency Across Context Boundaries (DBC-12/06-skills.md)
- Implement Sagas for Multi-Context Transactions (DBC-11/06-skills.md)
- Handle Cross-Context Queries Without JOINs (DBC-07/06-skills.md)

---

## Decision 2: Idempotent handler with updateOrCreate vs deduplication tracking

### Decision Tree

```
What type of operation does the event handler perform?
├── Upsert operation (create or update a record)
│   → Use updateOrCreate
│   `Model::updateOrCreate(['external_id' => $event->id], $data);`
│   Naturally idempotent — same event processed twice produces same result
│   Pros: simple, no extra tables, no cleanup
│   Cons: can't distinguish between update vs no-op
│   Works for: local projections, reference data syncing
├── Insert-only operation (append-only log, audit trail)
│   → Use deduplication tracking
│   `if (ProcessedEvent::where('event_id', $event->id)->exists()) return;`
│   `ProcessedEvent::create(['event_id' => $event->id]);`
│   Pros: prevents duplicate inserts in append-only tables
│   Cons: extra table, cleanup needed for old event IDs
│   Works for: event logs, activity streams, journal entries
└── Side-effect operation (send email, call API, refund payment)
    → Use deduplication tracking + idempotency key
    `$this->paymentProvider->refund($transactionId, idempotencyKey: $event->id);`
    External systems must support idempotency keys
    Pros: prevents duplicate payments, emails, notifications
    Cons: depends on external system's idempotency support
```

### Rationale
`updateOrCreate` is the simplest idempotency pattern — processing the same `UserUpdated` event twice just updates the record to the same state. It's appropriate for upsert operations where the outcome is the same regardless of how many times the event is processed. Deduplication tracking is needed for append-only or side-effect operations where processing the event twice would create duplicate records or duplicate side effects.

### Recommended Default
`updateOrCreate` for upsert projections; deduplication tracking for insert-only and side-effect handlers

### Risks
- Non-idempotent handler: duplicate inserts, double refunds, duplicate emails on retry
- `updateOrCreate` for append-only: creates duplicate rows on retry
- Deduplication table growth: cleanup strategy needed for old event IDs

### Related Rules
- Make all event handlers idempotent (DBC-12/05-rules.md)
- Design compensating transactions to be idempotent (DBC-11/05-rules.md)
- Implement read-your-writes consistency (DBC-12/05-rules.md)

### Related Skills
- Manage Eventual Consistency Across Context Boundaries (DBC-12/06-skills.md)
- Implement Sagas for Multi-Context Transactions (DBC-11/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)

---

## Decision 3: Passive staleness vs read-your-writes consistency

### Decision Tree

```
Is the user reading data that they themselves just wrote or triggered?
├── YES — user initiated the change that triggered eventual consistency
│   → Implement read-your-writes consistency
│   The user who changed data in Context A should see the result in Context B immediately
│   How to implement:
│   ├── Pass context (user ID, session ID) with the read request
│   │   If the user's write is pending sync, read directly from source
│   └── Invalidate local projection on write and re-read from source
│       After user triggers change, force a sync read for their next request
└── NO — user is reading data changed by another user or system
    → Passive staleness is acceptable
    User sees data that is eventually consistent (may be slightly stale)
    UI must handle stale data gracefully:
    ├── Show stale data with freshness indicator ("Updated 2 minutes ago")
    └── Allow user to refresh to get latest data
        Pull-to-refresh triggers sync read for current data
```

### Rationale
Read-your-writes consistency addresses the most visible consistency problem: the user who makes a change then sees stale data because their own write hasn't propagated yet. This creates confusion ("I just changed this — why isn't it showing?"). For passive staleness (user seeing data changed by someone else), a staleness indicator and refresh mechanism is sufficient. The user didn't initiate the change, so they don't expect immediate consistency.

### Recommended Default
Read-your-writes for initiating users; staleness indicators + refresh for passive readers

### Risks
- No read-your-writes: user sees stale data after their own change — confusion, distrust
- Over-engineering read-your-writes: complex logic for rare cases — keep simple
- No staleness indicator: user sees outdated data without knowing it's stale

### Related Rules
- Implement read-your-writes consistency (DBC-12/05-rules.md)
- Design UIs to tolerate stale cross-context data (DBC-12/05-rules.md)
- Monitor the consistency window (DBC-12/05-rules.md)

### Related Skills
- Manage Eventual Consistency Across Context Boundaries (DBC-12/06-skills.md)
- Handle Cross-Context Queries Without JOINs (DBC-07/06-skills.md)
- Implement Sync vs Queued Events (CPC-03/06-skills.md)
