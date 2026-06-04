# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Domain events within and across contexts
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Domain events capture something meaningful that happened in the domain. They are immutable records of past facts. Within a context, events enable internal decoupling. Across contexts, events enable asynchronous integration. A domain event is always named in the past tense (`OrderPlaced`, `PaymentReceived`), contains the data relevant to the event, and is dispatched after the change is committed.

---

# Core Concepts

**Domain event:** "Something happened that matters to the business." Not technical—not a "database row inserted" event. A domain event like `OrderShipped` captures business meaning.

**Internal event:** Dispatched and handled within the same context. Used for side effects within a bounded context.

**Integration event:** Dispatched to other contexts. Used for cross-context communication. Must include enough data for the consuming context.

---

# Internal Mechanics

```php
class Order {
    public function ship(): void {
        $this->status = 'shipped';
        $this->recordThat(new OrderShipped(
            orderId: $this->id,
            shippedAt: now(),
        ));
    }
}

class OrderShipped {
    public function __construct(
        public readonly string $orderId,
        public readonly Carbon $shippedAt,
    ) {}
}
```

---

# Patterns

**Dispatch after commit:** Use Laravel's `AfterCommit` to dispatch events after the database transaction commits. Prevents events from being dispatched for rolled-back changes:
```php
OrderShipped::dispatchAfterCommit($orderId, $shippedAt);
```

**Event with context ID:** Always include the ID of the aggregate that produced the event. Consumers use this to correlate events to aggregates.

**Internal vs integration event separation:** Use different event classes for internal vs integration events. Internal events can carry internal data. Integration events should carry only data that is part of the contract.

---

# Architectural Decisions

**Use events for:** Decoupling side effects from the primary operation, cross-context communication, triggering follow-up processes.

**Do not use events for:** Request-response flows, operations that require immediate consistency.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Decoupled producers/consumers | Eventual consistency |
| Extensible (new handlers without changing producer) | Flow is harder to trace |
| Reliable via queue | Event schema management |

---

# Common Mistakes

**Technical events instead of domain events:** Firing `ModelSaved` instead of `OrderShipped`. Consumers couple to technical details.

**Too many fields:** Including unnecessary data in the event. Consumers depend on these fields, making future changes harder.

**Dispatching before commit:** Dispatching events inside a transaction. If the transaction rolls back, the event has already been sent.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-01 Bounded context basics | CPC-03 Sync vs queued events | CPC-09 Event sourcing |
| DBC-12 Eventual consistency | CPC-04 Event design | CPC-10 Outbox pattern |

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
