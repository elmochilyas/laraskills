# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Synchronous vs queued event handling
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Synchronous event handlers execute in the same request lifecycle. Queued handlers are deferred to a worker process. Choosing between them depends on whether the handler's success is required for the primary operation. Synchronous handlers block the response. Queued handlers improve response time but introduce eventual consistency. A single event can have both synchronous and queued handlers.

---

# Core Concepts

**Synchronous handling:** All listeners run sequentially before the response is sent. If a listener fails, the request fails. The listener has access to the same database transaction.

**Queued handling:** Listeners are pushed to a queue and processed by a worker. The response is sent immediately. If a listener fails, it can be retried.

**Mixed handling:** Some listeners are synchronous (critical side effects), some are queued (non-critical or expensive side effects).

---

# Internal Mechanics

```php
class OrderEventServiceProvider extends ServiceProvider {
    public function boot(): void {
        Event::listen(
            OrderPlaced::class,
            UpdateInventoryHandler::class, // sync
        );
        Event::listen(
            OrderPlaced::class,
            SendConfirmationEmailHandler::class, // queue
        );
    }
}

// sync handler
class UpdateInventoryHandler {
    public function handle(OrderPlaced $event): void {
        DB::transaction(function () use ($event) {
            Inventory::decrement($event->productId, $event->quantity);
        });
    }
}

// queued handler
class SendConfirmationEmailHandler implements ShouldQueue {
    public $afterCommit = true;

    public function handle(OrderPlaced $event): void {
        Mail::to($event->email)->send(new OrderConfirmation($event));
    }
}
```

---

# Patterns

**Sync for consistency:** If an operation across services must be consistent within the same transaction, use synchronous handling. Sacrifices response time for consistency.

**Queue for resilience:** If a handler can fail independently, use a queue. The primary operation succeeds, and the handler is retried later.

**Queue for non-critical:** Logging, email, analytics, notification. These should never block the primary operation.

---

# Architectural Decisions

**Default to sync within a context:** Within a bounded context, events are often handled synchronously because they are part of the same transactional boundary.

**Default to queue across contexts:** Cross-context integration events should be queued to decouple availability. Context B being down should not block Context A.

---

# Tradeoffs

| Approach | Benefit | Cost |
|---|---|---|
| Sync | Consistent, simple | Response time increases |
| Queue | Fast response, resilience | Eventual consistency, complexity |
| Mixed | Flexibility | Need to decide per handler |

---

# Common Mistakes

**Queuing everything:** Every event is queued. Even critical side effects are deferred. If the worker is down, the system is in an inconsistent state.

**Sync for expensive operations:** Processing a report or sending email synchronously. The user waits unnecessarily.

**Not configuring `afterCommit` for queued events:** Queued events dispatched in a transaction. If the transaction rolls back, the event is already on the queue.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| CPC-02 Domain events basics | CPC-04 Event design | CPC-10 Outbox pattern |
| DBC-12 Eventual consistency | CPC-05 Message bus | CPC-12 Facade pattern risks |

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
