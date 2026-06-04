# Decision Trees: Message Bus and Pub/Sub Patterns

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Message bus and pub/sub patterns
- **Knowledge Unit ID:** CPC-05
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | In-process bus (Laravel events) vs dedicated message bus | Architecture | Event distribution infrastructure |
| 2 | Pub/sub vs point-to-point | Architecture | Message routing pattern |
| 3 | Shared bus vs per-domain bus | Architecture | Bus topology |

---

## Decision 1: In-process bus vs dedicated message bus

### Context
Laravel's event system is an in-process bus — it dispatches events within the same PHP process. A dedicated message bus (RabbitMQ, Kafka, Redis Streams) provides persistence, delivery guarantees, and routing across processes. The choice depends on whether contexts share a process or run separately.

### Decision Tree

```
Do the communicating contexts run in the same application process?
├── YES → Use Laravel's event system (in-process bus)
│   Same request lifecycle, no serialization needed
│   Zero network latency, immediate delivery
│   Laravel's event system is optimized for this
│   Register listeners in service providers
└── NO (different processes, different servers)
    → Use dedicated message bus
    Do you need message persistence and guaranteed delivery?
    ├── YES → RabbitMQ or Kafka
    │   RabbitMQ: good for routing, exchanges, DLQ
    │   Kafka: good for event streaming, replay, high throughput
    └── NO (in-memory delivery is sufficient)
        → Redis Streams or simple queue
        Redis Streams provides persistence with minimal infrastructure
        Simpler than RabbitMQ, but less routing capability
```

### Rationale
Laravel's event system is the right choice for in-process events — it has zero overhead, no serialization, and direct listener resolution. Adding a dedicated bus for same-process events introduces unnecessary latency, infrastructure dependency, and debugging complexity. A dedicated bus becomes necessary when contexts run in separate processes and need reliable asynchronous delivery, persistence, or complex routing.

### Recommended Default
Laravel events for same-process; RabbitMQ or Kafka for cross-process

### Risks
- Dedicated bus for in-process: unnecessary network latency, infrastructure dependency
- Laravel events for cross-process: events lost across process boundaries, no persistence
- No dead letter queue: failed messages silently lost

### Related Rules
- Use Laravel events for in-process, dedicated bus for cross-process (CPC-05/05-rules.md)
- Configure dead letter queues for all message buses (CPC-05/05-rules.md)
- Restrict bus access by context (CPC-05/05-rules.md)

### Related Skills
- Implement Message Bus and Pub/Sub for Cross-Context Events (CPC-05/06-skills.md)
- Choose Sync vs Queued Events (CPC-03/06-skills.md)
- Implement Circuit Breaker (CPC-06/06-skills.md)

---

## Decision 2: Pub/sub vs point-to-point

### Decision Tree

```
How many consumers need to receive the message?
├── Multiple consumers (domain event scenario)
│   → Pub/sub — one message, many subscribers
│   Example: `OrderPlaced` event → Inventory deducts, Billing invoices,
│   Shipping prepares, Analytics records
│   Each subscriber receives the same message independently
│   Pros: decoupled, extensible, scalable
│   Cons: harder message ordering with many consumers
└── Exactly one consumer (command/task scenario)
    → Point-to-point — one message, one consumer
    Example: `ProcessPayment` command → one Payment service handles it
    Exactly one consumer processes the message
    Pros: simple semantics, easy ordering, load balancing
    Cons: not suitable for broadcast events
    Is there ever a case where multiple consumers should handle this?
    ├── YES → It's a domain event — use pub/sub
    └── NO → Point-to-point is correct
```

### Rationale
Pub/sub and point-to-point serve different purposes. Domain events (announcements that something happened) naturally fit pub/sub — multiple contexts need to react independently. Commands and tasks (requests that something be done) fit point-to-point — exactly one handler should process them. Mixing the two semantics causes unintended side effects (command accidentally getting multiple handlers) or missed events (domain event only reaching one consumer).

### Recommended Default
Pub/sub for domain events; point-to-point for commands

### Risks
- Pub/sub for commands: multiple unintended handlers process a command
- Point-to-point for events: only one consumer receives the event, others miss it
- Wrong routing: events accidentally sent to wrong queue/topic

### Related Rules
- Use pub/sub for domain events, point-to-point for commands (CPC-05/05-rules.md)
- Avoid a single shared bus for all contexts (CPC-05/05-rules.md)
- Register subscriptions explicitly in service providers (CPC-05/05-rules.md)

### Related Skills
- Implement Message Bus and Pub/Sub for Cross-Context Events (CPC-05/06-skills.md)
- Design Domain Events (CPC-02/06-skills.md)
- Design Event Payloads (CPC-04/06-skills.md)

---

## Decision 3: Shared bus vs per-domain bus

### Decision Tree

```
How many bounded contexts will publish to and consume from the bus?
├── 1-2 contexts → Shared bus is manageable
│   One bus/exchange, clear topology
│   Low risk of confusion or coupling
├── 3-5 contexts → Per-domain buses recommended
│   Separate bus/exchange per domain or bounded context
│   Each context has its own bus infrastructure
│   Pros: failure isolation, clear topology, bounded context ownership
│   Cons: more infrastructure to manage
└── 6+ contexts → Per-domain bus is REQUIRED
    A single shared bus for many contexts becomes:
    - A bottleneck (all events go through one system)
    - A coupling point (all contexts depend on the same bus)
    - Hard to understand (events from all domains mixed together)
```

### Rationale
A single shared bus for all contexts creates a "god bus" anti-pattern — one exchange or topic that carries all events from all contexts. This creates a bottleneck and a coupling point. Per-domain buses keep event traffic isolated, make topology understandable, and allow each context's bus to be tuned for its specific needs. The bus topology should mirror the context map: each domain or bounded context has its own bus infrastructure.

### Recommended Default
Per-domain buses for 3+ contexts; shared bus manageable for 1-2 contexts

### Risks
- God bus: single point of failure, coupling point, hard to understand
- Too many buses: infrastructure management overhead
- Per-domain buses without routing: events don't reach consumers across domains

### Related Rules
- Avoid a single shared bus for all contexts (CPC-05/05-rules.md)
- Register subscriptions explicitly in service providers (CPC-05/05-rules.md)
- Configure dead letter queues for all message buses (CPC-05/05-rules.md)

### Related Skills
- Implement Message Bus and Pub/Sub for Cross-Context Events (CPC-05/06-skills.md)
- Map Context Relationships (DBC-02/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)
