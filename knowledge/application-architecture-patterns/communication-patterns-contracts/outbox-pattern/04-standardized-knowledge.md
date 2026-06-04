# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Outbox pattern for reliable event delivery
Knowledge Unit ID: CPC-10
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

The Outbox pattern guarantees that events are eventually dispatched by storing them in the same database transaction as the business operation. Instead of dispatching an event directly (which risks the event being lost if the dispatch fails after the DB commit, or the event being dispatched if the DB transaction rolls back), the event is written to an `outbox` table within the same transaction. A separate process (worker or DB trigger) reads from the outbox table and publishes the events. This ensures exactly-once (or at-least-once) delivery without distributed transactions.

---

# Core Concepts

- **Transactional outbox:** An `outbox` table in the application's database. Events are inserted into this table within the same DB transaction as the business operation. If the transaction commits, the events are persisted. If it rolls back, the events are discarded.
- **Outbox publisher:** A separate worker that polls the outbox table, publishes the events to the message bus, and marks them as published. If the publish fails, the worker retries.
- **At-least-once delivery:** The outbox pattern guarantees events are published at least once. Consumers must be idempotent.

---

# When To Use

- Event delivery must be guaranteed. The event must be published if and only if the transaction commits.
- Cross-context communication where reliability matters.

---

# When NOT To Use

- Non-critical events where temporary loss is acceptable (logging, analytics).
- Simple scenarios where `dispatchAfterCommit` is sufficient and the queue is not a single point of failure.

---

# Best Practices

- **Write to outbox in the same transaction as the business operation.** WHY: If the outbox write is in a separate transaction, the business transaction commits but the outbox write fails — the event is lost. Both must be in the same DB transaction.
- **Make consumers idempotent.** WHY: Outbox provides at-least-once delivery, not exactly-once. Duplicates are possible. Consumers must handle duplicate events safely.
- **Use polling publisher for simplicity.** WHY: A scheduled command (Laravel `schedule:run` every minute) polls the outbox table and publishes pending events. Simple and reliable. No additional infrastructure beyond the database.
- **Implement outbox cleanup.** WHY: Archive or delete published outbox records after a retention period to prevent table bloat.

---

# Architecture Guidelines

- Outbox table: `id`, `type`, `payload`, `occurred_at`, `published_at`, `created_at`.
- Write to outbox in same transaction as business operation.
- Polling publisher: scheduled command processes pending events.
- Mark as published after successful dispatch.
- Cleanup published records after retention period.
- `dispatchAfterCommit` is a lightweight alternative for non-critical events.

---

# Performance Considerations

- Adds a database write per event within the existing transaction (negligible overhead).
- Polling latency: events not published immediately (typically up to 1 minute with per-minute scheduler).
- Cleanup job overhead for large outbox tables.

---

# Security Considerations

- Outbox events can contain sensitive data. Ensure payload serialization handles data appropriately.

---

# Common Mistakes

1. **No outbox:** Dispatching events without transactional guarantee. Cause: oversight. Consequence: if the event dispatch fails after the DB commit, the event is lost. If the event dispatches but the DB rolls back, the event is sent for a change that never happened. Better: use the outbox pattern.

2. **Outbox in a separate transaction:** Writing to the outbox in a separate transaction from the business operation. Cause: not understanding the pattern. Consequence: business transaction commits, outbox write fails — event lost. Better: write to outbox in the same transaction.

3. **No idempotency in consumers:** Relying on exactly-once delivery from the outbox. Cause: misunderstanding. Consequence: duplicates cause incorrect state. Better: consumers must handle duplicates (idempotent handlers).

---

# Anti-Patterns

- **No transactional guarantee**: Events dispatched outside a transaction. Phantom events or lost events.
- **Separate transaction outbox**: Outbox written after the business transaction. Window for data loss.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| CPC-02 Domain events basics | CPC-03 Sync vs queued events | CPC-09 Event sourcing |
| DBC-12 Eventual consistency | CPC-05 Message bus | DBC-11 Multi-context transactions |

---

# AI Agent Notes

- Write events to outbox table in same DB transaction as business operation.
- Use polling publisher for reliable dispatch.
- Consumers must be idempotent (at-least-once delivery).
- Clean up published records to prevent table bloat.

---

# Verification

- [ ] Outbox writes are in the same transaction as the business operation
- [ ] A polling publisher processes pending events
- [ ] Consumers are idempotent (handle duplicates safely)
- [ ] Published records are cleaned up after retention period
- [ ] Outbox pattern is used for critical events (not logging/analytics)
