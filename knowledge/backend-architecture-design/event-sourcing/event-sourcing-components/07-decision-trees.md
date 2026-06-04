# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** Event sourcing components (event store, aggregates, projections, snapshots)
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Event sourcing vs traditional persistence for an aggregate
* Decision 2: Event store technology (purpose-built vs relational)
* Decision 3: Projection strategy (synchronous vs asynchronous)
* Decision 4: Snapshot frequency and trigger strategy

---

# Architecture-Level Decision Trees

---

## Decision: Event Sourcing vs Traditional Persistence for an Aggregate

---

## Decision Context

Determine whether a given aggregate should use event sourcing or traditional state persistence (Eloquent).

---

## Decision Criteria

* performance considerations: event sourcing adds write amplification; traditional persistence has lower latency
* architectural considerations: event sourcing provides full audit trail and temporal queries; traditional is simpler
* security considerations: event store contains all historical state — encrypt sensitive fields
* maintainability considerations: event sourcing adds significant complexity; traditional is well-understood by all Laravel developers

---

## Decision Tree

Is a full audit trail required for this aggregate (regulatory, compliance, or business requirement)?
↓
YES → Is temporal querying needed (state at any point in time)?
    YES → Event sourcing (only pattern that provides complete historical reconstruction)
    NO → Is the audit trail for read-only purposes (logs, reports)?
        YES → Event sourcing still recommended (audit trail is inherent, not bolted on)
        NO → Consider simpler audit logging (audit table or event log)
NO → Does the aggregate have complex business rules with multiple state transitions?
    YES → Are the state transitions themselves meaningful business events?
        YES → Event sourcing (events are first-class domain concepts, not just state diffs)
        NO → Traditional persistence with state machine (simpler for simple state tracking)
NO → Is the aggregate expected to have a long lifespan (> 100 state changes)?
    YES → Event sourcing benefits increase with lifespan (audit trail, debugging, replay)
    NO → Traditional persistence sufficient (short-lived entities don't need event sourcing)
    ↓
    Is the team experienced with event sourcing patterns?
    YES → Event sourcing is a viable choice (leverage team expertise)
    NO → Start with traditional persistence; migrate specific aggregates to event sourcing later
    ↓
    Is the aggregate a read-heavy, write-light entity?
    YES → Traditional persistence (event sourcing write-overhead not justified)
    NO → Evaluate cost: event sourcing complexity vs audit/rebuild benefits

---

## Rationale

Event sourcing is powerful but expensive. It should be used for aggregates where the event history itself provides business value — regulatory audit trails, complex state machines, long-lived entities. For simple CRUD aggregates, traditional persistence with an audit table is simpler and more performant.

---

## Recommended Default

**Default:** Traditional persistence with an audit table for most aggregates. Event sourcing only for aggregates where history is a business requirement.

**Reason:** Event sourcing multiplies complexity (event store, projections, snapshots, upcasting). Most aggregates don't benefit enough to justify the cost. Apply selectively.

---

## Risks Of Wrong Choice

Event sourcing for simple CRUD: unnecessary complexity, developer overhead, performance hit for no benefit. Traditional for audit-required: retrofitting event sourcing is painful, lost history during migration.

---

## Related Rules

- Rule 1: An event-sourced aggregate records domain events, not state snapshots
- Rule 2: Store the event stream in an append-only store—never update or delete past events

---

## Related Skills

- Design Event Sourcing Components
- Implement Read Model Strategies

---

## Decision: Event Store Technology

---

## Decision Context

Choose the storage technology for the append-only event store.

---

## Decision Criteria

* performance considerations: purpose-built stores are optimized for append-only patterns; relational stores add schema overhead
* architectural considerations: relational store integrates with existing DB ecosystem; purpose-built store is separate infrastructure
* security considerations: relational store inherits existing DB security; purpose-built store needs its own security model
* maintainability considerations: relational store reduces operational complexity (no new infrastructure); purpose-built store adds a new system to manage

---

## Decision Tree

Does the team already operate a relational database (PostgreSQL, MySQL)?
↓
YES → Are expected event volumes moderate (< 1M events/day)?
    YES → Relational event store (single table with JSONB column)
        ↓
        Do you need optimistic concurrency control (aggregate version checking)?
        YES → Implement with version column and conditional update (WHERE version = expected)
        NO → Simple append (INSERT only; no conflict checking)
    NO → Does the system need high-throughput event ingestion (> 10K writes/sec)?
        YES → Purpose-built event store (EventStoreDB, DynamoDB, Kafka-based)
        NO → Relational event store with partitioning (partition by aggregate or time)
NO → Is the team willing to operate additional infrastructure?
    YES → Is temporal query and subscription capability important?
        YES → EventStoreDB (built-in projections, subscriptions, temporal queries)
        NO → What's the primary concern?
            Scalability → Kafka-based event store (high throughput, partitioned)
            Simplicity → Relational event store (even without existing DB, PostgreSQL is easier to operate than EventStoreDB)
    NO → Relational event store (PostgreSQL/MySQL runs in existing infrastructure)
    ↓
    Is event store encryption required (PII, sensitive data)?
    YES → Relational: column-level encryption. Purpose-built: application-layer encryption.
    ↓
    Retention policy: keep events forever or archive?
    FOREVER → Relational with cold storage (partitioning + archive to S3)
    LIMITED → Both work; set TTL or archive policy

---

## Rationale

A relational database (PostgreSQL with JSONB) is the best starting point for most teams. It provides transactions, backups, access control, and is already understood. Purpose-built event stores (EventStoreDB) offer better temporal queries and subscriptions but add operational complexity.

---

## Recommended Default

**Default:** Relational event store (PostgreSQL JSONB column with event_id, aggregate_id, event_type, payload, metadata, version, created_at).

**Reason:** PostgreSQL is already in the stack. The relational event store handles most workloads. Purpose-built stores can be adopted when specific requirements (high throughput, built-in projections) emerge.

---

## Risks Of Wrong Choice

Purpose-built too early: operational overhead, team learning curve, no clear benefit. Relational at extreme scale: JSONB query performance degrades, partitioning complexity increases, might need migration.

---

## Related Rules

- Rule 3: Separate event store from read models — store once, project many times
- Rule 4: Use upcasters for event schema evolution, not migrations

---

## Related Skills

- Design Event Sourcing Components
- Implement Event Bus Patterns

---

## Decision: Projection Strategy (Synchronous vs Asynchronous)

---

## Decision Context

Choose whether projectors (read model builders) run synchronously within the event dispatch or asynchronously via a queue.

---

## Decision Criteria

* performance considerations: synchronous projections add latency to the command; asynchronous projections have eventual consistency
* architectural considerations: synchronous ensures read model is immediately consistent; async decouples write throughput from read
* security considerations: synchronous projections run in the same security context; async projections need their own auth
* maintainability considerations: synchronous projections are simpler to debug; async projections need monitoring and retry logic

---

## Decision Tree

Does the read model need to be immediately consistent after a write?
↓
YES → Is the projection fast (< 50ms) and reliable (no external calls)?
    YES → Synchronous projection (in-process, same transaction)
        ↓
        Does the projection failure need to roll back the write?
        YES → Synchronous in the same database transaction (atomic write + projection)
        NO → Synchronous but allow projection failure (log error, repair later)
    NO → Asynchronous projection with eventual consistency (command returns 202 Accepted)
        ↓
        Can the UI tolerate stale data for this read model?
        YES → Asynchronous (standard approach; seconds of staleness acceptable)
        NO → Read from event store directly (no read model for this query)
NO → Is the projection read-heavy and write-light?
    YES → Asynchronous projection (optimize for read performance; write consistency traded for throughput)
    NO → Is the projection expensive to compute (aggregations, joins)?
        YES → Asynchronous with caching (pre-compute; cache in Redis or similar)
    ↓
    Can projections be rebuilt from scratch if they fall behind?
    YES → Asynchronous with rebuild capability (safest: projectors can be re-run)
    NO → Synchronous (must always be correct; no rebuild safety net)
    ↓
    How many projectors exist for the same event stream?
    1-3 → Mix sync and async per projector requirements
    > 3 → Asynchronous for all (sync projection of many projectors blocks the write path)

---

## Rationale

Synchronous projections provide strong consistency but block the write path. Asynchronous projections decouple write throughput from read model updates but introduce eventual consistency. The choice depends on whether the read model must be immediately consistent or can tolerate seconds of staleness.

---

## Recommended Default

**Default:** Asynchronous projections with eventual consistency. Synchronous projections only for read models that require immediate consistency and are fast to compute.

**Reason:** Asynchronous projections protect write throughput, allow independent scaling, and provide natural retry. Most business read models can tolerate seconds of staleness.

---

## Risks Of Wrong Choice

Synchronous for slow projections: blocked writes, degraded command latency, cascade failures. Asynchronous for critical reads: stale data shown to users, business logic errors from outdated state.

---

## Related Rules

- Rule 3: Separate event store from read models — store once, project many times
- Rule 5: Implement snapshots for aggregates with long event streams (> 100 events)

---

## Related Skills

- Design Event Sourcing Components
- Implement Read Model Strategies

---

## Decision: Snapshot Frequency and Trigger Strategy

---

## Decision Context

Determine when and how often to take snapshots of aggregate state for performance optimization.

---

## Decision Criteria

* performance considerations: frequent snapshots add write overhead; infrequent snapshots increase replay time on aggregate load
* architectural considerations: snapshot storage duplicates some event store data; snapshot schema must evolve with aggregate
* security considerations: snapshots may contain sensitive state — encrypt snapshot data
* maintainability considerations: snapshot strategy must be documented and tuned; wrong frequency causes performance issues

---

## Decision Tree

Does the aggregate typically have more than 50 events?
↓
YES → How many events does the aggregate accumulate on average?
    50-100 → Snapshot every 50 events (moderate optimization)
    100-500 → Snapshot every 100 events (significant replay time savings)
    > 500 → Snapshot every 100-200 events (critical for performance)
    ↓
    Is the aggregate loaded frequently (every request)?
    YES → More aggressive snapshots (every 50 events; faster load at cost of more writes)
    NO → Is the aggregate loaded infrequently (background jobs, reports)?
        YES → Less frequent snapshots (every 100 events or no snapshots if load is rare)
NO → Does the aggregate have a long lifespan but few events?
    YES → Snapshot not needed for performance; implement if audit snapshot is required
    NO → No snapshot needed (aggregate is short-lived or read infrequently)
    ↓
    Snapshot trigger strategy:
    EVENT-COUNT → Snapshot every N events (predictable, simple to implement)
    TIME-BASED → Snapshot every N hours (useful for aggregates with variable event rates)
    HYBRID → Snapshot on either: event count threshold OR time threshold
    ↓
    Snapshot storage strategy:
    SAME DB → Store snapshot in same database as event store (simpler, transactional)
    SEPARATE → Store snapshot in dedicated cache (redis, faster reads, eventual consistency)

---

## Rationale

Snapshots trade write amplification for faster aggregate loading. The optimal frequency depends on aggregate event volume and load frequency. Too-frequent snapshots add unnecessary write overhead; too-infrequent snapshots make aggregate loading slow.

---

## Recommended Default

**Default:** Snapshot every 100 events for aggregates with > 50 events. No snapshot for aggregates with shorter streams.

**Reason:** 100 events provides a good balance — replaying 100 events is fast (< 50ms), and the snapshot write overhead is minimal (one DB write per 100 command executions).

---

## Risks Of Wrong Choice

No snapshots with long streams: 5+ second aggregate loading times, poor user experience. Snapshots too frequent: write overhead dominates, storage bloat, snapshot writes exceed event store writes. Snapshots not updated after aggregate schema change: incompatible snapshot format.

---

## Related Rules

- Rule 5: Implement snapshots for aggregates with long event streams (> 100 events)
- Rule 1: An event-sourced aggregate records domain events, not state snapshots

---

## Related Skills

- Design Event Sourcing Components
- Implement Event Versioning and Schema Evolution
