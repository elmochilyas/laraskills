# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Synchronous vs queued event handling
Knowledge Unit ID: CPC-03
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Synchronous event handlers execute in the same request lifecycle. Queued handlers are deferred to a worker process. Sync handlers block the response; queued handlers improve response time but introduce eventual consistency. A single event can have both sync and queued handlers.

---

# Core Concepts

- **Synchronous**: All listeners run before response is sent. Listener failure = request failure. Same DB transaction access.
- **Queued**: Listeners pushed to queue, processed by worker. Response sent immediately. Retries on failure.
- **Mixed**: Some listeners sync (critical side effects), some queued (non-critical or expensive).

---

# When To Use

- **Sync within a context**: Events handled synchronously, part of the same transactional boundary.
- **Queue across contexts**: Integration events queued to decouple availability. Context B being down doesn't block Context A.

---

# When NOT To Use

- Queuing everything (critical side effects deferred — worker down = inconsistent state).
- Sync for expensive operations (user waits unnecessarily for email, reports).

---

# Best Practices

- **Default to sync within context, queue across contexts.** WHY: Within a context, events are part of the same transactional boundary. Across contexts, queuing decouples availability.
- **Use sync for critical consistency.** WHY: If an operation must be consistent within the same transaction, use sync. Sacrifices response time for consistency.
- **Use queue for resilience.** WHY: If a handler can fail independently, use a queue. The primary operation succeeds, and the handler is retried later.
- **Always use `afterCommit` for queued events.** WHY: Queued events dispatched inside a transaction — if the transaction rolls back, the event is already on the queue. `afterCommit` ensures the event is only queued if the transaction succeeds.

---

# Architecture Guidelines

- A single event can have both sync and queued listeners.
- Sync: listener runs immediately in the same request.
- Queue: listener implements `ShouldQueue` and `$afterCommit = true`.

---

# Performance Considerations

- Sync: adds microseconds per handler. Blocks response.
- Queue: request completes faster (work deferred). Adds milliseconds to seconds of latency for the handler.

---

# Security Considerations

- Queued handlers run as the application, not as the original user. Authorization context is lost.

---

# Common Mistakes

1. **Queuing everything:** Every event queued, even critical side effects. Cause: simplicity. Consequence: worker down → inconsistent state. Better: sync for critical, queue for non-critical.

2. **Sync for expensive operations:** Processing email/report synchronously. Cause: not considering UX. Consequence: user waits. Better: queue.

3. **Not configuring `afterCommit` for queued events:** Dispatched in transaction, transaction rolls back, event already queued. Cause: oversight. Consequence: phantom events. Better: `$afterCommit = true`.

---

# Anti-Patterns

- **Queue for everything**: No sync handlers. Inconsistent state on worker failure.
- **Sync for slow operations**: Blocks response for non-critical work.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| CPC-02 Domain events basics | CPC-04 Event design | CPC-10 Outbox pattern |
| DBC-12 Eventual consistency | CPC-05 Message bus | CPC-12 Facade pattern risks |

---

# AI Agent Notes

- Default to sync within context, queue across contexts.
- Always set `$afterCommit = true` on queued event handlers.
- Slow operations (email, reports) should always be queued.

---

# Verification

- [ ] Sync handlers used within context
- [ ] Queued handlers used across contexts
- [ ] `$afterCommit` is set on all queued event handlers
- [ ] Critical side effects are sync (not queued)
- [ ] Expensive operations are queued (not sync)
