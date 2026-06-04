# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** Outbox pattern for reliable event publishing
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Outbox pattern vs direct publishing for event delivery
* Decision 2: Outbox polling strategy (scheduled vs continuous)
* Decision 3: Outbox cleanup strategy (delete vs mark vs archive)
* Decision 4: Dual-write consistency approach

---

# Architecture-Level Decision Trees

---

## Decision: Outbox Pattern vs Direct Publishing

---

## Decision Context

Choose whether to use the outbox pattern (DB-first, async publish) or direct publishing during the request.

---

## Decision Criteria

* performance considerations: outbox adds minimal DB write overhead; direct publishing blocks request on broker latency
* architectural considerations: outbox guarantees eventual delivery; direct publishing loses events on broker failure
* security considerations: outbox events stored in DB inherit DB encryption; direct publishing needs broker-level encryption
* maintainability considerations: outbox adds a worker process and monitoring; direct publishing is simpler but less reliable

---

## Decision Tree

Is the event critical (must not be lost under any failure scenario)?
↓
YES → Is the event published as part of a database transaction (aggregate change + event)?
    YES → Outbox pattern (write event to outbox in same transaction; publish asynchronously)
    NO → Can the publishing be wrapped in the same transaction?
        YES → Refactor to include outbox write in the transaction
        NO → Direct publishing with retry + acknowledgment (accept risk of event loss on broker failure)
NO → Is broker downtime acceptable without losing events?
    YES → Is the broker highly available (clustered, multi-AZ)?
        YES → Direct publishing (broker HA makes event loss unlikely; acceptable for non-critical events)
        NO → Outbox pattern (outbox buffers events during broker downtime)
    NO → Outbox pattern (zero event loss guarantee regardless of broker state)
    ↓
    Does the system send > 1000 events/second?
    YES → Outbox pattern needed (direct publishing would block the request for each event)
    ↓
    Is there a need to replay events for projection rebuild?
    YES → Outbox pattern (events are persisted in outbox; can be replayed)
    ↓
    Event tracking and audit requirements:
    TRACKED → Outbox pattern (outbox provides an audit trail of all published events)
    UNTRACKED → Direct publishing may be acceptable (non-critical, no audit requirement)

---

## Rationale

The outbox pattern guarantees that events are never lost by writing them to the database in the same transaction as the business operation. Direct publishing risks event loss when the broker is unavailable or publishing fails after the DB write. For any event that must not be lost, use the outbox pattern.

---

## Recommended Default

**Default:** Outbox pattern for all integration events and any critical domain events. Direct publishing only for non-critical in-process domain events.

**Reason:** The outbox pattern adds minimal complexity (a table insert in the existing transaction + a worker) but guarantees zero event loss. Direct publishing's simplicity doesn't justify the risk for events that matter.

---

## Risks Of Wrong Choice

Direct publishing for critical events: lost events on broker failure or publisher crash, silent data inconsistency, missing notifications. Outbox for everything: unnecessary overhead for non-critical internal events, added worker infrastructure.

---

## Related Rules

- Rule 1: Always write events to the outbox in the same database transaction as the aggregate change
- Rule 2: Do not send events synchronously—pick up from outbox with a separate publisher
- Rule 4: Implement idempotent outbox processing—at-least-once delivery with dedup

---

## Related Skills

- Implement the Outbox Pattern
- Implement Event Bus Patterns

---

## Decision: Outbox Polling Strategy (Scheduled vs Continuous)

---

## Decision Context

Choose whether to poll the outbox on a schedule or listen continuously for new entries.

---

## Decision Criteria

* performance considerations: continuous polling has lower latency but higher DB load; scheduled polling batches efficiently
* architectural considerations: continuous polling adds DB load; scheduled polling is simpler to implement
* security considerations: both need access to outbox table; continuous polling needs persistent worker connection
* maintainability considerations: scheduled polling uses existing cron infrastructure; continuous needs a long-running worker

---

## Decision Tree

What is the acceptable latency between event creation and publication?
< 1s → Continuous polling (worker runs in loop, polls every 100-500ms)
1-5s → Continuous polling with longer interval (poll every 1-2s)
5-60s → Scheduled polling (Laravel scheduler, run every minute)
> 60s → Scheduled polling (cron job every N minutes)
    ↓
    Does the platform support long-running workers (Laravel Horizon, Supervisor)?
    YES → Continuous polling (lower latency, dedicated worker process)
    NO → Scheduled polling (Laravel scheduler on same server as web requests)
    ↓
    Concurrency considerations:
    SINGLE WORKER → Ordered publishing, no conflicts, lower throughput
    MULTIPLE WORKERS → Use `lockForUpdate()` or atomic update to prevent duplicate publishing
    ↓
    Does the outbox need to preserve event ordering within aggregate streams?
    YES → Single worker or partition-aware multi-worker (order by aggregate_id + occurred_at)
    NO → Multiple workers, unordered (higher throughput, simpler)
    ↓
    Error handling during polling:
    TRANSIENT ERROR → Retry on next poll cycle (don't block other events)
    PERMANENT ERROR → Route to dead letter queue (don't retry infinitely)

---

## Rationale

Continuous polling provides lower latency but requires a long-running worker process. Scheduled polling uses existing cron infrastructure but introduces latency proportional to the schedule interval. The choice depends on the latency requirements and platform capabilities.

---

## Recommended Default

**Default:** Continuous polling with 500ms interval using a long-running worker (Laravel Horizon or Supervisor). Fall back to scheduled polling every minute if long-running workers aren't available.

**Reason:** 500ms latency is acceptable for most business events. Long-running workers are well-supported in Laravel (Horizon). Scheduled polling adds 60s of unnecessary latency.

---

## Risks Of Wrong Choice

Scheduled polling with high latency: events delayed by minutes, business SLAs missed, poor user experience. Continuous polling without locking: duplicate publishing, event order violations, database contention.

---

## Related Rules

- Rule 2: Do not send events synchronously—pick up from outbox with a separate publisher
- Rule 3: Process outbox messages in order within the same aggregate stream

---

## Related Skills

- Implement the Outbox Pattern
- Implement Event Bus Patterns

---

## Decision: Outbox Cleanup Strategy (Delete vs Mark vs Archive)

---

## Decision Context

Choose how to manage outbox table size after events have been published.

---

## Decision Criteria

* performance considerations: deleting old records keeps the table small for fast queries; marking preserves data for auditing
* architectural considerations: archiving supports audit requirements without impacting query performance
* security considerations: old outbox records may contain sensitive data — deletion may be required for compliance
* maintainability considerations: cleanup must be automated and monitored; manual cleanup is unreliable

---

## Decision Tree

Is audit or replay capability from the outbox required?
↓
YES → Mark as published (UPDATE published_at = NOW()) rather than DELETE
    ↓
    Is the outbox table growing faster than 1M rows per month?
    YES → Archive published records to a separate table or cold storage
        ↓
        Archive strategy:
        SAME DB, DIFFERENT TABLE → Move published records to outbox_archive (partition by month)
        COLD STORAGE → Export to CSV/JSON and push to S3 (retain for compliance)
        → DELETE from main outbox after archiving
    NO → Mark as published (keep in same table; set index on (published_at IS NULL) for polling)
NO → Delete published records (smallest table, fastest polling queries)
    ↓
    Retention policy for published records:
    KEEP FOR N DAYS → Implement cleanup job: DELETE WHERE published_at < NOW() - N days
    DELETE IMMEDIATELY → After successful broker acknowledgment, delete the record
    → Warning: immediate delete loses ability to audit or replay from outbox
    ↓
    Cleanup implementation:
    LARAVEL SCHEDULER → hourly or daily: OutboxMessage::published()->olderThanDays(30)->delete()
    CONTINUOUS → After marking, delete in the same worker process (if audit not needed)
    ↓
    Monitor: outbox table size, growth rate, oldest unpublished record age

---

## Rationale

The outbox table grows with every event published. Without a cleanup strategy, it will eventually impact query performance (even indexed queries slow down at millions of rows). The choice between marking, archiving, or deleting depends on audit requirements.

---

## Recommended Default

**Default:** Mark as published (UPDATE published_at). Archive to a separate table monthly. Keep archived records for 90 days, then delete.

**Reason:** Marking preserves the ability to republish events if needed. Archiving keeps the main outbox table small. 90-day retention provides audit trail without unbounded growth.

---

## Risks Of Wrong Choice

No cleanup: table grows unbounded, query performance degrades, disk fills. Immediate delete: no audit trail, no replay from outbox, can't verify delivery. Archive without retention: archive table also grows unbounded.

---

## Related Rules

- Rule 4: Implement idempotent outbox processing—at-least-once delivery with dedup
- Rule 5: Monitor outbox backlog and alert on growing delays

---

## Related Skills

- Implement the Outbox Pattern
- Implement Dead Letter Handling

---

## Decision: Dual-Write Consistency Approach

---

## Decision Context

Choose the approach for ensuring consistency between the database write and the event publication.

---

## Decision Criteria

* performance considerations: outbox pattern adds a DB write; distributed transactions add significant latency and complexity
* architectural considerations: outbox uses local transactions; 2PC requires all participants to support distributed transactions
* security considerations: outbox stores events in the same DB security context; 2PC spans multiple security domains
* maintainability considerations: outbox is simpler to implement and debug; 2PC is complex and error-prone

---

## Decision Tree

Is the event store and business data in the same database?
↓
YES → Can the outbox write be in the same database transaction as the business operation?
    YES → Outbox pattern (single DB transaction for business change + event storage)
    NO → Can the database schema be changed to support outbox?
        YES → Add outbox table to the same database
        NO → Evaluate alternative consistency mechanisms
NO → Are the business data and publishing target in different databases or services?
    YES → Can a saga pattern replace the need for atomic dual-write?
        YES → Saga with compensating transactions (eventual consistency; no 2PC)
        NO → Is exactly-once delivery required (not just at-least-once)?
            YES → Distributed transaction (2PC/XA) — high complexity, low throughput
                ↓
                Do both resource managers support XA (database + message broker)?
                YES → 2PC possible but rarely recommended
                NO → 2PC infeasible; use outbox pattern with idempotent consumers
            NO → Outbox pattern with at-least-once delivery and idempotent consumers
    ↓
    What if the outbox insert fails (DB error, constraint violation)?
    RETRY → Transaction will roll back the business operation (no partial state)
    → Outbox in same transaction ensures atomicity: all or nothing
    ↓
    What if the outbox publish fails (broker unavailable)?
    RETRY → Outbox worker will retry on next poll cycle
    → No data loss: outbox record persists in DB until successfully published

---

## Rationale

The outbox pattern in a local database transaction is the simplest and most reliable approach to dual-write consistency. Distributed transactions (2PC/XA) add significant complexity, latency, and failure modes. Sagas provide eventual consistency for multi-service operations. The outbox pattern with idempotent consumers covers most real-world scenarios.

---

## Recommended Default

**Default:** Outbox pattern with the outbox table in the same database and same transaction as the business operation. No distributed transactions.

**Reason:** The outbox pattern provides atomicity between business state and event storage using a local transaction. It's simple, reliable, and well-understood. Distributed transactions add complexity without proportional benefit.

---

## Risks Of Wrong Choice

No consistency mechanism: events lost on broker failure, silent data inconsistency. 2PC for simple scenarios: complex infrastructure, performance degradation, coordinator failures. Outbox without same transaction: window between business commit and outbox write risks event loss.

---

## Related Rules

- Rule 1: Always write events to the outbox in the same database transaction as the aggregate change
- Rule 4: Implement idempotent outbox processing—at-least-once delivery with dedup

---

## Related Skills

- Implement the Outbox Pattern
- Implement Event Bus Patterns
- Choose Between Choreography and Orchestration
