# Decision Trees: Synchronous vs Queued Event Handling

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Synchronous vs queued event handling
- **Knowledge Unit ID:** CPC-03
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Sync vs queue for event handler | Architecture | Event listener registration |
| 2 | Critical consistency vs tolerable latency | Architecture | Handler placement |
| 3 | Same event with both sync and queued handlers vs split events | Architecture | Multi-handler event design |

---

## Decision 1: Sync vs queue for event handler

### Context
Every event handler has a choice: run synchronously in the same request or defer to a queue worker. Sync handlers provide consistency (they run within the same transaction) but block the response. Queued handlers improve response time and provide retry resilience but introduce eventual consistency. The decision depends on whether the handler is within or across contexts, and how critical its consistency is.

### Decision Tree

```
Does the handler run within the same bounded context as the event source?
├── YES → Default to sync
│   Is the handler expensive (email, PDF, API call >100ms)?
│   ├── YES → Queue it — user doesn't need to wait
│   │   The handler's result isn't needed for the response
│   └── NO → Sync is correct
│       Handler is fast (<100ms) and consistent
└── NO (handler runs in a different bounded context)
    → Default to queue
    Queuing decouples availability — downstream context being down
    doesn't block the upstream
    Does the handler require immediate consistency?
    ├── YES → Use sync (rare — consider redesigning the contract)
    │   If Context B must be immediately consistent with Context A,
    │   a synchronous contract call may be more appropriate than an event
    └── NO → Queue is correct
        Set `$afterCommit = true` on the queued handler
```

### Rationale
Sync within context ensures consistency — inventory deduction runs in the same transaction as order creation. Queue across contexts ensures availability — the Billing context being down doesn't block the Ordering context. The boundary decision is straightforward: within = sync (for consistency), across = queue (for availability). The exceptions are expensive operations within a context (which should be queued for UX) and critical consistency across contexts (which should use synchronous contracts instead of events).

### Recommended Default
Sync within context; queue across contexts

### Risks
- All-queue approach: worker down = inconsistent state for critical operations
- All-sync approach: user waits for expensive operations, downstream failures cascade
- Queue without `afterCommit`: phantom events on transaction rollback

### Related Rules
- Default to sync within context, queue across contexts (CPC-03/05-rules.md)
- Keep critical side effects synchronous (CPC-03/05-rules.md)
- Queue expensive or slow operations (CPC-03/05-rules.md)

### Related Skills
- Choose Between Synchronous and Queued Event Handling (CPC-03/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)

---

## Decision 2: Critical consistency vs tolerable latency

### Decision Tree

```
What happens if the handler fails or doesn't run?
├── Data corruption or business rule violation
│   → Handler is CRITICAL — must be sync
│   Examples: inventory deduction, account balance update, order status change
│   These must be consistent within the same transaction
│   If the handler fails, the entire operation should fail
│   Queue risk: handler fails silently, system becomes inconsistent
├── User experience degradation but no data corruption
│   → Handler can be sync or queue — depends on cost
│   Example: sending confirmation email, updating search index
│   If fast (<100ms), sync is fine. If slow, queue it.
└── No user-facing impact
    → Handler is non-critical — queue is fine
    Examples: analytics tracking, log aggregation, cache warming
    These can tolerate eventual consistency
```

### Rationale
The criticality of the handler determines the sync/queue decision. If the handler failing would corrupt data or violate business rules (inventory deducted twice, balance not updated), it must be synchronous within the same transaction. If the handler failing means a user doesn't get an email, that's a degradation but not corruption — it can be queued with retries. The most dangerous pattern is queuing critical side effects "for performance" — when the worker fails, the system is inconsistent with no recovery.

### Recommended Default
Critical handlers (data integrity) = sync; non-critical handlers (notifications, analytics) = queue

### Risks
- Queuing critical handlers: data corruption on worker failure
- Sync for expensive handlers: poor user experience, slow responses
- Missing retry for queued critical handlers: permanent failure on transient error

### Related Rules
- Keep critical side effects synchronous (CPC-03/05-rules.md)
- Queue expensive or slow operations (CPC-03/05-rules.md)
- Always set `$afterCommit = true` on queued handlers (CPC-03/05-rules.md)

### Related Skills
- Choose Between Synchronous and Queued Event Handling (CPC-03/06-skills.md)
- Implement Job Middleware for Retry (CPC-11/06-skills.md)
- Monitor Queue Health (CPC-12/06-skills.md)

---

## Decision 3: Same event with both sync and queued handlers vs split events

### Decision Tree

```
Does the event need both sync and queued handlers?
├── YES → Single event with multiple listeners (correct approach)
│   `Event::listen(OrderPlaced::class, DeductInventory::class); // sync`
│   `Event::listen(OrderPlaced::class, SendEmail::class)->onQueue('emails'); // queued`
│   Pros: one event, different handlers choose their mode
│   Cons: sync handler failure prevents queued handler from running
│   Can sync and queued handlers be ordered intentionally?
│   ├── YES → Good — order critical before non-critical
│   │   Sync handlers run first (critical), then event is queued to workers
│   └── NO → Events can be reordered — handle by criticality
└── NO (all handlers want the same mode)
    → Single mode is fine — all sync or all queue
    If all sync: event runs entirely in request lifecycle
    If all queue: event is processed entirely by workers
    Consider: should each handler really be the same mode?
    ├── YES → Single mode is correct
    └── NO → Use multiple listeners with different modes
```

### Rationale
Laravel supports registering both sync and queued listeners for the same event. This is intentional and useful — a critical handler (inventory deduction) runs synchronously, while a non-critical handler (email notification) is queued from the same event. The event is dispatched once; Laravel runs sync listeners immediately and queues queued listeners. One event, multiple handler types.

### Recommended Default
Single event class with sync + queued listeners as needed

### Risks
- Splitting into two events for sync/queued: duplicate event dispatch, confusion
- Sync handler failure blocking queue: if sync handler throws, the operation fails and queued handlers don't run
- All-queued approach: no sync handlers for critical operations

### Related Rules
- A single event can have both sync and queued listeners (CPC-03/05-rules.md)
- Keep critical side effects synchronous (CPC-03/05-rules.md)
- Queue expensive or slow operations (CPC-03/05-rules.md)

### Related Skills
- Choose Between Synchronous and Queued Event Handling (CPC-03/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
- Implement Job Batching and Chaining (CPC-10/06-skills.md)
