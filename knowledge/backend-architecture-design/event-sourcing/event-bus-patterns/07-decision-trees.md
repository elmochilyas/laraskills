# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** Event bus patterns (in-process vs message broker)
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: In-process vs message broker for event dispatch
* Decision 2: Event bus topology (topic exchange vs direct exchange)
* Decision 3: Delivery guarantee (at-most-once vs at-least-once vs exactly-once)
* Decision 4: Event bus abstraction strategy

---

# Architecture-Level Decision Trees

---

## Decision: In-Process vs Message Broker for Event Dispatch

---

## Decision Context

Choose the transport mechanism for delivering events from producers to consumers.

---

## Decision Criteria

* performance considerations: in-process events have ~1ms latency; message broker adds 50-500ms
* architectural considerations: in-process is simpler and consistent; message broker provides durability and decoupling
* security considerations: message broker events cross process boundaries — need TLS and auth
* maintainability considerations: message broker adds operational burden (broker management, monitoring); in-process has zero infrastructure

---

## Decision Tree

Does the event need to survive a process crash?
↓
YES → Is the event consumed across bounded contexts or services?
    YES → Message broker (durable, async, cross-process delivery)
    NO → Is the event handler slow (> 500ms) or doing I/O?
        YES → Message broker with queue (don't block the request-response cycle)
        NO → In-process event dispatch plus outbox pattern (combine durability with simplicity)
NO → Is the event consumed within the same process and request lifecycle?
    YES → In-process event dispatch (Laravel events, Symfony EventDispatcher)
        ↓
        Is the event handler's failure acceptable (non-critical side effect)?
        YES → In-process synchronous (simplest; failure propagates to caller)
        NO → In-process with try-catch and logging (handler failure doesn't crash request)
    NO → Can the consumer tolerate eventual consistency?
        YES → Message broker (events may arrive later, but system remains correct)
    ↓
    Does the event need to fan out to multiple heterogeneous consumers?
    YES → Message broker (pub/sub semantics, independent consumer scaling)
    NO → Does the event need retry with backoff on failure?
        YES → Message broker (built-in retry mechanisms, dead letter queues)
        NO → In-process event dispatch (simpler for 1-2 synchronous handlers)

---

## Rationale

In-process dispatch is simpler, faster, and consistent but lacks durability and cross-process capability. Message brokers provide durability, retry, dead letter handling, and decoupling at the cost of latency and operational complexity. The default for domain events (within a context) should be in-process; for integration events (across contexts), use a message broker.

---

## Recommended Default

**Default:** In-process for domain events (Laravel events). Message broker for integration events (RabbitMQ/SQS/Kafka). Use outbox pattern for critical events that must survive crashes.

**Reason:** In-process dispatch is sufficient for internal side effects. Message brokers are necessary for cross-context communication and durable delivery. The outbox pattern bridges the gap for critical in-process events.

---

## Risks Of Wrong Choice

Message broker for everything: unnecessary latency, operational overhead, debugging complexity for local events. In-process for everything: event loss on crash, blocked request handlers for slow consumers, no cross-process delivery.

---

## Related Rules

- Rule 1: Use queues (message broker) for async integration events; use in-memory dispatch for domain events
- Rule 5: Never couple event bus topology to domain classes

---

## Related Skills

- Implement Event Bus Patterns
- Implement Outbox Pattern

---

## Decision: Event Bus Topology (Topic Exchange vs Direct Exchange)

---

## Decision Context

Choose the message broker routing topology based on consumer patterns and event types.

---

## Decision Criteria

* performance considerations: topic exchanges have slightly higher routing overhead; direct exchanges are simpler and faster
* architectural considerations: topic exchanges support flexible routing; direct exchanges are point-to-point
* security considerations: topic exchanges need careful routing key management to prevent unauthorized event consumption
* maintainability considerations: topic exchanges scale better with many consumers; direct exchanges become unmanageable at scale

---

## Decision Tree

Does the event need to be consumed by multiple independent consumers?
↓
YES → Will new consumers be added over time without modifying producers?
    YES → Topic exchange (pub/sub: producers publish once, consumers subscribe independently)
    NO → How many consumers are there?
        2-5 → Topic exchange still recommended (future-proof)
        > 5 → Topic exchange (direct exchange would need 5+ bindings per event type)
NO → Is the event a command (point-to-point, single consumer)?
    YES → Direct exchange (point-to-point routing; one producer, one consumer)
    NO → Is the event a notification that multiple services independently process?
        YES → Topic exchange (notification events naturally fan out)
    ↓
    Are routing rules based on event attributes (routing keys with wildcards)?
    YES → Topic exchange with pattern-based routing (e.g., "order.*" matches all order events)
    NO → Are consumers known and fixed at deployment time?
        YES → Direct exchange sufficient (bind at deployment; no dynamic routing needed)
        NO → Topic exchange (flexible routing accommodates changing consumer sets)
    ↓
    Document the routing strategy: exchange type, binding keys, routing key conventions
    NO → Direct exchange with documented routing key conventions

---

## Rationale

Topic exchanges are the most flexible topology for event-driven systems — they support pub/sub, pattern-based routing, and independent consumer scaling. Direct exchanges are simpler but become unmanageable when many consumers bind to the same event type. Use topic exchanges as the default; reserve direct exchanges for point-to-point commands.

---

## Recommended Default

**Default:** Topic exchange for all events. Direct exchange only for point-to-point commands (single producer, single consumer).

**Reason:** Topic exchanges accommodate future consumers without producer changes. The routing overhead is negligible compared to the cost of migrating from direct to topic later.

---

## Risks Of Wrong Choice

Direct exchange for broadcast events: N bindings per event type, unmanageable at scale, every new consumer requires producer changes. Topic exchange for commands: routing key complexity where simple point-to-point would suffice.

---

## Related Rules

- Rule 2: Choose event bus topology (topic exchange vs. direct exchange) based on consumer types
- Rule 5: Never couple event bus topology to domain classes

---

## Related Skills

- Implement Event Bus Patterns
- Implement Event Versioning and Schema Evolution

---

## Decision: Delivery Guarantee Strategy

---

## Decision Context

Choose the event delivery guarantee level balancing consistency, performance, and complexity.

---

## Decision Criteria

* performance considerations: exactly-once adds significant complexity and latency; at-most-once is fastest; at-least-once is moderate
* architectural considerations: exactly-once is very hard in distributed systems; at-least-once with idempotency is practical
* security considerations: at-most-once may lose security-critical events; at-least-once with dedup is safer
* maintainability considerations: idempotent consumers are the key enabler of simpler delivery guarantees

---

## Decision Tree

Are consumers idempotent (processing same event twice produces same result)?
↓
YES → Can the system tolerate duplicate events (no side effects from duplicates)?
    YES → At-least-once delivery (practical sweet spot — simple, durable)
    NO → At-least-once delivery with idempotency still works (duplicates are harmless)
NO → Can consumers be made idempotent?
    YES → Make consumers idempotent first; then use at-least-once delivery (always the recommended path)
    NO → Is the event a pure notification with zero side effects (cache invalidation)?
        YES → At-most-once (fastest; occasional loss is acceptable)
        NO → Is the event critical and must not be lost or duplicated?
            YES → Exactly-once delivery (very hard — requires distributed transactions or idempotent consumers with dedup)
                ↓
                Is the infrastructure supporting exactly-once (Kafka transactional, Pulsar)?
                YES → Exactly-once possible but complex; at-least-once with idempotency is easier
                NO → Exactly-once infeasible; implement idempotent consumers and use at-least-once
            NO → At-least-once with dedup (consumer tracks processed event IDs)

---

## Rationale

At-least-once delivery with idempotent consumers is the practical sweet spot for most systems. Exactly-once is theoretically ideal but extremely hard to achieve in distributed systems. At-most-once should be reserved for non-critical notifications where occasional loss is acceptable.

---

## Recommended Default

**Default:** At-least-once delivery with idempotent consumers (process event ID deduplication in each consumer).

**Reason:** At-least-once is durable and relatively simple to implement. Idempotent consumers handle duplicates safely, making the system robust to retries and replays.

---

## Risks Of Wrong Choice

At-most-once for critical events: silent data loss, missing side effects. Exactly-once attempt without infrastructure support: false confidence, inconsistent state, debuggability nightmare. At-least-once without idempotency: duplicate data, double processing, state corruption.

---

## Related Rules

- Rule 3: Implement at-least-once delivery with idempotent consumers
- Rule 4: Monitor event bus latency and backlog as key health metrics

---

## Related Skills

- Implement Event Bus Patterns
- Implement Dead Letter Handling

---

## Decision: Event Bus Abstraction Strategy

---

## Decision Context

Choose the level of abstraction between domain code and the event bus infrastructure.

---

## Decision Criteria

* performance considerations: abstraction layers add minimal overhead but prevent infrastructure-specific optimizations
* architectural considerations: abstraction decouples domain from infrastructure; direct coupling makes bus migration expensive
* security considerations: abstraction layer can enforce consistent security policies (auth, encryption)
* maintainability considerations: abstraction simplifies testing and bus migration; direct coupling reduces indirection

---

## Decision Tree

Will the event bus implementation change during the system's lifetime?
↓
YES → Is there a plan to migrate (e.g., from Laravel events to Kafka)?
    YES → Abstract the bus behind an interface (EventBusInterface with publish/subscribe methods)
    NO → Could the bus change due to scaling requirements or vendor decision?
        YES → Abstract behind an interface (preparation for unknown future)
        NO → Direct coupling acceptable (single bus for lifetime of system)
NO → Are there multiple event bus implementations in use (in-process + broker)?
    YES → Abstract behind a unified interface (same API for in-process and broker dispatch)
    NO → How many consumers exist?
        < 5 → Direct coupling acceptable (low migration cost)
        > 5 → Abstract the bus (migration becomes expensive with many consumers)
    ↓
    Do domain events contain routing or bus-specific annotations?
    YES → Remove coupling (domain events should be pure data — no routing keys, no serialization hints)
    NO → Abstraction level is appropriate
    ↓
    Abstract bus interface should expose:
    - EventBus::dispatch(object $event): void
    - EventBus::publish(string $eventName, array $payload): void
    - Subscriber configuration in infrastructure layer

---

## Rationale

Domain code should not know about event bus infrastructure. An abstraction layer (EventBusInterface) allows changing between bus implementations without touching domain code. The domain event class itself should be pure data with no routing or serialization annotations.

---

## Recommended Default

**Default:** Abstract the event bus behind a domain-level `EventBus` interface. Implementations live in the infrastructure layer.

**Reason:** Bus technology decisions may change (start with Laravel queues, migrate to Kafka later). The abstraction cost is minimal — one interface and an implementation class.

---

## Risks Of Wrong Choice

No abstraction: migration requires changing every event dispatch call site, domain classes coupled to infrastructure. Over-abstraction: generic bus interface loses broker-specific capabilities (ordering guarantees, transactional outbox).

---

## Related Rules

- Rule 5: Never couple event bus topology to domain classes
- Rule 1: Use queues (message broker) for async integration events; use in-memory dispatch for domain events

---

## Related Skills

- Implement Event Bus Patterns
- Implement Outbox Pattern
