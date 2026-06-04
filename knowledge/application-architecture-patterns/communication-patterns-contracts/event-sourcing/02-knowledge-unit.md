# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Event sourcing fundamentals
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Event sourcing stores state changes as a sequence of domain events, rather than a snapshot of current state. The current state is derived by replaying all events (or a snapshot + subsequent events). Every state change is an event appended to the event store. Events are immutable and append-only. The event store is the source of truth. Read models are projections built from events. Event sourcing enables complete audit trails, temporal queries (state at any point), and rebuilding projections from scratch.

---

# Core Concepts

**Event store:** An append-only log of events. Each event represents a state change. Events are stored in order. No deletes, no updates.

**Aggregate in event sourcing:** Each aggregate has a sequence of events. The aggregate's current state is reconstructed by replaying its events. The aggregate applies events to rebuild its state.

**Projection:** A read model built from events. Projections are updated by event handlers. They can be rebuilt from scratch by replaying all events.

---

# Internal Mechanics

```php
class Order extends AggregateRoot {
    public static function place(string $customerId, array $items): static {
        $order = new static();
        $order->recordThat(new OrderPlaced(
            orderId: $order->id(),
            customerId: $customerId,
            items: $items,
        ));
        return $order;
    }

    public function applyOrderPlaced(OrderPlaced $event): void {
        $this->customerId = $event->customerId;
        $this->items = $event->items;
        $this->status = 'placed';
    }

    public function ship(): void {
        $this->recordThat(new OrderShipped(
            orderId: $this->id(),
            shippedAt: now(),
        ));
    }

    public function applyOrderShipped(OrderShipped $event): void {
        $this->status = 'shipped';
        $this->shippedAt = $event->shippedAt;
    }
}
```

---

# Patterns

**Snapshot:** Periodically save the aggregate's current state to avoid replaying all events from the beginning. Snapshots are stored alongside the event stream.

**Projection rebuild:** Projections are idempotent. They can be dropped and rebuilt by replaying all events from the event store. Used for schema migrations or bug fixes in projection code.

**Event store implementations:** In Laravel, use `spatie/laravel-event-sourcing` or `lirex/laravel-event-sourcing`. Production event stores use PostgreSQL, MySQL (with event table), or dedicated stores like EventStoreDB.

---

# Architectural Decisions

**Use event sourcing when:** You need complete audit trails, temporal queries, or the ability to rebuild read models. Common in financial, compliance, or complex domain applications.

**Do not use event sourcing when:** Simple CRUD is sufficient. Event sourcing adds significant complexity. Not justified for basic applications.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Complete audit trail | Event store management overhead |
| Temporal queries (state at any time) | Current state reconstruction cost |
| Rebuildable projections | Schema evolution complexity |
| Event store is append-only (no data loss) | Learning curve |

---

# Common Mistakes

**Event sourcing without snapshots:** Replaying all events from the beginning on every aggregate load. Performance degrades as the event stream grows.

**Mutable events:** Allowing events to be modified or deleted. Breaks the append-only guarantee. Projections become inconsistent.

**Event sourcing for everything:** Applying event sourcing to entities that don't need audit trails or temporal queries. Unnecessary complexity.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| CPC-02 Domain events basics | MMD-15 Event sourcing CQRS | CPC-10 Outbox pattern |
| CPC-04 Event design | CPC-08 CQRS pattern | DBC-09 Temporal coupling |

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
