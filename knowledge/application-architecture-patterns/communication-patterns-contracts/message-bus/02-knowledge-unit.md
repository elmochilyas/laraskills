# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Message bus and pub/sub patterns
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

A message bus provides a central channel for publishing and subscribing to events across bounded contexts. In Laravel, the event system acts as an in-process bus. For cross-context communication, a dedicated message bus (using RabbitMQ, Kafka, or Redis streams) decouples producers from consumers. The bus guarantees delivery, routing, and ordering semantics. Pub/sub (publish/subscribe) is the pattern where each event goes to all interested subscribers. Point-to-point is the pattern where each message goes to exactly one consumer.

---

# Core Concepts

**Message bus:** A middleware that receives messages from producers and routes them to consumers. Decouples producers from knowing about consumers.

**Pub/sub:** One event → multiple subscribers. Used for domain events where multiple contexts are interested in the same fact.

**Point-to-point:** One message → one consumer. Used for commands or tasks where exactly one service should process the message.

---

# Internal Mechanics

```php
// Laravel's bus acts as in-process pub/sub
class MessageBus {
    public function publish(DomainEvent $event): void {
        $envelope = new EventEnvelope(
            eventId: Str::uuid(),
            eventType: get_class($event),
            data: $event->toPayload(),
            occurredAt: now(),
        );

        foreach ($this->subscribers as $subscriber) {
            $subscriber->handle($envelope);
        }
    }
}
```

---

# Patterns

**Explicit subscription registration:** Each context registers its subscriptions in a service provider:
```php
class BillingServiceProvider extends ServiceProvider {
    public function boot(): void {
        Event::listen(OrderPlaced::class, ProcessPaymentHandler::class);
        Event::listen(OrderCancelled::class, RefundPaymentHandler::class);
    }
}
```

**Topic-based routing:** Events are published to topics. Subscribers subscribe to topics. Routing is based on topic matching, not event class.

**Event bus as infrastructure:** In Laravel, the event system is used for internal events. For external, use a dedicated infrastructure bus (RabbitMQ topic exchange, Kafka topic).

---

# Architectural Decisions

**Use the framework bus for in-process events:** Laravel's event system is sufficient for events within the same process. No need for a separate message bus when contexts share a process.

**Use a dedicated bus for cross-process events:** When contexts run in separate processes or servers, use RabbitMQ, Kafka, or Redis streams.

---

# Tradeoffs

| Approach | Benefit | Cost |
|---|---|---|
| In-process bus | Simple, no infrastructure | Only for same process |
| Dedicated message bus | Cross-process, reliable delivery | Infrastructure complexity |
| Pub/sub | Many consumers per event | Event ordering harder |

---

# Common Mistakes

**Bus as monolithic pipeline:** One event bus shared by all contexts. Bus becomes a bottleneck and a point of coupling.

**Over-routing:** Publishing events to too many topics. Makes the topology hard to understand and debug.

**No dead letter handling:** Messages that fail processing are lost. The bus should route failed messages to a dead letter queue for inspection.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| CPC-04 Event design | CPC-06 Circuit breaker | CPC-10 Outbox pattern |
| CPC-03 Sync vs queued events | CPC-07 Bridge/adapter pattern | CPC-11 Distributed tracing |

---

## Mental Models

**The "Contract as API" model:** A contract between contexts is like a public API. The contract defines what you can do and what you get back. The implementation behind the contract can change as long as it satisfies the contract.

**The "Message as Document" model:** In event-driven communication, each event/message is a self-contained document that carries all necessary data. The consumer should not need to query the producer for additional context.

**The "Versioned Handshake" model:** Consumer and producer agree on a contract version. When the contract changes, both sides upgrade independently, with backward compatibility maintained during the transition.

---

## Performance Considerations

Communication pattern choice has significant performance implications. Synchronous in-process method calls between modules add microseconds. Synchronous HTTP calls between services add milliseconds (2-50ms). Queued event communication adds latency (milliseconds to seconds) but improves request-time performance by offloading work. The outbox pattern adds a database write per event but prevents duplicate processing. Circuit breakers add negligible overhead when healthy but protect system stability during failures.

---

## Production Considerations

In production, communication contracts must be discovered, versioned, and monitored. Use API documentation (OpenAPI/Swagger) for HTTP contracts. For event contracts, maintain a schema registry. Monitor dead-letter queues for failed message delivery. Implement circuit breakers for cross-service calls. Use health checks to detect contract violations. Alert on unusual patterns (high retry counts, increased latency). Contract testing in CI prevents incompatible changes from reaching production.

---

## Failure Modes

**Silent contract violation:** Producer changes a contract (adds a required field) without versioning. Consumers break silently. Mitigation: contract testing in CI.

**Event avalanche:** A single event triggers a cascade of downstream processing that overwhelms consumers. Mitigation: circuit breakers, rate limiting, async processing with backpressure.

**Lost events:** Events dispatched outside a transaction that are lost on crash. Mitigation: transactional outbox pattern ensures at-least-once delivery.

---

## Ecosystem Usage

Laravel built-in event system provides synchronous event handling. Laravel Queues (Redis, SQS, Database) provide async event handling. spatie/laravel-event-sourcing provides event sourcing infrastructure. dnakitare/laravel-outbox implements the transactional outbox pattern. RabbitMQ and Kafka adapters are available for Laravel. The Ecotone framework provides a full messaging layer with CQRS, event sourcing, and distributed bus capabilities.

---

## Research Notes

Research in 2025-2026 highlights the outbox pattern as the most reliable approach for event-driven communication in Laravel. The community increasingly recognizes that distributed system complexity is often underestimated. The Saga pattern for distributed transactions is gaining attention as an alternative to two-phase commit. Contract testing (consumer-driven contracts) is becoming standard practice for teams with multiple bounded contexts.
