# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Security
**Knowledge Unit:** Message Persistence & Guaranteed Delivery Constraints
**Generated:** 2026-06-03

---

# Decision Inventory

* Delivery Guarantee Level: Fire-and-Forget vs At-Least-Once vs Exactly-Once
* Event ID Strategy: UUID vs Monotonic vs None
* Event History Strategy: Database vs Redis vs No Storage

---

# Architecture-Level Decision Trees

---

## Delivery Guarantee Level: Fire-and-Forget vs At-Least-Once vs Exactly-Once

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Laravel's default broadcasting is fire-and-forget: events are lost if the client is disconnected or the WebSocket server drops the message. For some use cases this is acceptable; for others, guaranteed delivery is required.

---

## Decision Criteria

* performance considerations — fire-and-forget adds 5-20ms; guaranteed delivery adds 50-100ms+
* architectural considerations — additional infrastructure for message persistence and replay
* security considerations — compliance requirements for data delivery
* maintainability considerations — complexity of retry, dedup, and replay systems

---

## Decision Tree

What delivery guarantee level is needed?
↓
Does the application handle financial, compliance, or audit-critical data?
YES → [At-least-once delivery with Ably or custom event history + replay]
NO → Is the feature a chat or notification system?
    YES → [At-least-once delivery with "fetch missed events" API on reconnect]
    NO → Is the feature a dashboard, typing indicator, or ephemeral display?
        YES → [Fire-and-forget — loss is acceptable]
        NO → [Fire-and-forget with "fetch missed events" fallback]

---

## Rationale

Fire-and-forget is the simplest and fastest delivery model, appropriate for dashboards, typing indicators, and non-critical notifications where occasional message loss is acceptable. At-least-once delivery is needed for chat, financial updates, and compliance-critical data—this requires event history storage and a "fetch missed events" API on client reconnection. Exactly-once delivery (offered by Ably at premium pricing) requires idempotent consumers and ordering guarantees, which most applications don't truly need.

---

## Recommended Default

**Default:** Fire-and-forget for most use cases; at-least-once with REST fallback for critical data
**Reason:** Simpler architecture for 80% of use cases; targeted investment in guaranteed delivery where it matters

---

## Risks Of Wrong Choice

Assuming reliable delivery leads to silent data loss for critical features. Implementing full guaranteed delivery for all events adds unnecessary complexity and cost.

---

## Related Rules

Never Assume Broadcast Delivery Is Reliable (05-rules.md)

---

## Related Skills

Handle Broadcast Message Persistence and Delivery Constraints (06-skills.md)

---

## Event ID Strategy: UUID vs Monotonic vs None

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Unique event IDs enable client-side deduplication and missed-event replay. Without them, clients cannot distinguish new events from replayed events, and implementing at-least-once delivery is dangerous.

---

## Decision Criteria

* performance considerations — generation overhead of UUID vs auto-increment
* architectural considerations — distributed system compatibility
* security considerations — predictability of monotonic IDs
* maintainability considerations — debugging with human-readable IDs

---

## Decision Tree

What event ID strategy should be used?
↓
Is the system distributed across multiple servers?
YES → [UUID — globally unique without coordination]
NO → Is ordered replay important (events must be replayed in order)?
    YES → [Monotonically incrementing integer — natural ordering for replay]
    NO → [UUID — simpler, globally unique]
↓
Is at-least-once delivery needed at all?
YES → [Event IDs required for deduplication]
NO → [No event ID needed — fire-and-forget only]

---

## Rationale

UUIDs are the simplest choice for most applications: they require no coordination between servers, are globally unique, and generation is fast (nanoseconds with `Str::uuid()`). Monotonically incrementing integers (auto-increment ID or timestamp-based) provide natural ordering for replay—the client can request "events since ID 54321." However, they require a centralized counter in distributed systems. If at-least-once delivery is not needed, event IDs add unnecessary payload size.

---

## Recommended Default

**Default:** UUID event IDs (via `Str::uuid()` or `Ramsey\Uuid`)
**Reason:** Globally unique without coordination; simple to generate; sufficient for deduplication

---

## Risks Of Wrong Choice

No event IDs prevent implementing at-least-once delivery. Monotonic IDs in distributed systems may conflict or produce gaps.

---

## Related Rules

Always Use Unique Event IDs for Client-Side Deduplication (05-rules.md)

---

## Related Skills

Handle Broadcast Message Persistence and Delivery Constraints (06-skills.md)

---

## Event History Strategy: Database vs Redis vs No Storage

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

For at-least-once delivery, events must be stored for replay when clients reconnect. The engineer must choose where to store event history and for how long.

---

## Decision Criteria

* performance considerations — storage latency vs replay query performance
* architectural considerations — TTL-based pruning vs manual cleanup
* security considerations — access control on event history
* maintainability considerations — storage growth management

---

## Decision Tree

How should event history be stored?
↓
Is at-least-once delivery needed?
YES → Is the replay window short (< 5 minutes)?
    YES → [Redis with TTL — automatic expiration, fast reads]
    NO → Is the replay window medium (5-60 minutes)?
        YES → [Database with TTL-based cleanup — queryable history]
        NO → [Dedicated event store or Ably for long-term history]
NO → [No event history needed — fire-and-forget only]

---

## Rationale

Redis with TTL is ideal for short replay windows because events expire automatically and reads are sub-millisecond. The database is better for longer windows where SQL querying (by channel, event type, user) is needed. TTL-based pruning (`WHERE created_at < now() - 5 minutes`) prevents unbounded storage growth. For long-term compliance or audit requirements, a dedicated event store or Ably's built-in message history is more appropriate.

---

## Recommended Default

**Default:** Redis with 5-minute TTL for event history; database with TTL cleanup for longer windows
**Reason:** Redis provides automatic expiration and fast reads for the common short replay window

---

## Risks Of Wrong Choice

No event history makes at-least-once delivery impossible. Infinite retention causes unbounded storage growth and escalating costs.

---

## Related Rules

Always Set TTL on Event History (05-rules.md)

---

## Related Skills

Handle Broadcast Message Persistence and Delivery Constraints (06-skills.md)
