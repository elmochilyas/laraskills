# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Message bus and pub/sub patterns
Knowledge Unit ID: CPC-05
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

A message bus provides a central channel for publishing and subscribing to events across bounded contexts. In Laravel, the event system acts as an in-process bus. For cross-context communication, a dedicated message bus (using RabbitMQ, Kafka, or Redis streams) decouples producers from consumers. The bus guarantees delivery, routing, and ordering semantics. Pub/sub (publish/subscribe) is the pattern where each event goes to all interested subscribers. Point-to-point is the pattern where each message goes to exactly one consumer.

---

# Core Concepts

- **Message bus:** A middleware that receives messages from producers and routes them to consumers. Decouples producers from knowing about consumers.
- **Pub/sub:** One event → multiple subscribers. Used for domain events where multiple contexts are interested in the same fact.
- **Point-to-point:** One message → one consumer. Used for commands or tasks where exactly one service should process the message.
- **Topic-based routing:** Events are published to topics. Subscribers subscribe to topics. Routing is based on topic matching, not event class.

---

# When To Use

- Cross-context event distribution.
- Decoupling producers from consumers.
- Multiple consumers need the same event.

---

# When NOT To Use

- Single-context internal events (use Laravel's built-in event system).
- Simple one-to-one communication (direct contract is simpler).

---

# Best Practices

- **Use the framework bus for in-process events.** WHY: Laravel's event system is sufficient for events within the same process. No need for a separate message bus when contexts share a process.
- **Use a dedicated bus for cross-process events.** WHY: When contexts run in separate processes or servers, use RabbitMQ, Kafka, or Redis streams for reliable delivery.
- **Explicit subscription registration.** WHY: Each context registers its subscriptions in a service provider. Makes dependencies explicit and visible.
- **Avoid a single bus for all contexts.** WHY: One event bus shared by all contexts becomes a bottleneck and a point of coupling. Use separate buses or topics per domain.

---

# Architecture Guidelines

- In-process: Laravel event system.
- Cross-process: RabbitMQ, Kafka, or Redis streams.
- Pub/sub for domain events (one event, many consumers).
- Point-to-point for commands (one message, one consumer).
- Dead letter queue for failed messages.

---

# Performance Considerations

- In-process bus: microseconds.
- Dedicated message bus: adds network latency (milliseconds).
- Pub/sub: event ordering is harder with many consumers.

---

# Security Considerations

- Bus access should be restricted. Only authorized contexts should publish/subscribe.

---

# Common Mistakes

1. **Bus as monolithic pipeline:** One event bus shared by all contexts. Cause: simplicity. Consequence: bus becomes a bottleneck and a point of coupling. Better: separate buses or topics per domain.

2. **Over-routing:** Publishing events to too many topics. Cause: over-engineering. Consequence: topology becomes hard to understand and debug. Better: minimal, well-named topics.

3. **No dead letter handling:** Messages that fail processing are lost. Cause: oversight. Consequence: silent failures. Better: the bus should route failed messages to a dead letter queue for inspection.

---

# Anti-Patterns

- **God bus**: One bus, one exchange, one queue for all events. Coupling and bottleneck.
- **Lost messages**: No dead letter queue. Failed messages disappear.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| CPC-04 Event design | CPC-06 Circuit breaker | CPC-10 Outbox pattern |
| CPC-03 Sync vs queued events | CPC-07 Bridge/adapter pattern | CPC-11 Distributed tracing |

---

# AI Agent Notes

- Default to in-process bus (Laravel events) for same-process events.
- Use dedicated bus (RabbitMQ, Kafka) for cross-process events.
- Always configure dead letter queues.
- Register subscriptions explicitly in service providers.

---

# Verification

- [ ] In-process events use Laravel's event system
- [ ] Cross-process events use a dedicated message bus
- [ ] Bus has dead letter queue configured
- [ ] Subscriptions registered explicitly in service providers
- [ ] No monolithic "god bus" shared by all contexts
