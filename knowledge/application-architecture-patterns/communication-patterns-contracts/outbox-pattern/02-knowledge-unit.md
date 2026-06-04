# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Outbox pattern for reliable event delivery
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

The Outbox pattern guarantees that events are eventually dispatched by storing them in the same database transaction as the business operation. Instead of dispatching an event directly (which risks the event being lost if the dispatch fails after the DB commit, or the event being dispatched if the DB transaction rolls back), the event is written to an `outbox` table within the same transaction. A separate process (worker or DB trigger) reads from the outbox table and publishes the events. This ensures exactly-once (or at-least-once) delivery without distributed transactions.

---

# Core Concepts

**Transactional outbox:** An `outbox` table in the application's database. Events are inserted into this table within the same DB transaction as the business operation. If the transaction commits, the events are persisted. If it rolls back, the events are discarded.

**Outbox publisher:** A separate worker that polls the outbox table, publishes the events to the message bus, and marks them as published. If the publish fails, the worker retries.

**At-least-once delivery:** The outbox pattern guarantees events are published at least once. Consumers must be idempotent.

---

# Internal Mechanics

```php
// Within the same transaction
DB::transaction(function () use ($order) {
    // 1. Business operation
    $order->save();

    // 2. Write event to outbox (same transaction)
    OutboxMessage::create([
        'id' => Str::uuid(),
        'type' => 'OrderPlaced',
        'payload' => json_encode([
            'orderId' => $order->id,
            'customerId' => $order->customer_id,
        ]),
        'occurred_at' => now(),
    ]);
});

// Outbox publisher (queued command/worker)
$messages = OutboxMessage::whereNull('published_at')
    ->orderBy('occurred_at')
    ->limit(100)
    ->get();

foreach ($messages as $message) {
    try {
        Event::dispatch($message->toDomainEvent());
        $message->update(['published_at' => now()]);
    } catch (\Exception $e) {
        // Retry on next poll
        report($e);
    }
}
```

---

# Patterns

**Polling publisher:** A scheduled command (Laravel `schedule:run` every minute) polls the outbox table and publishes pending events. Simple and reliable:
```php
$schedule->command('events:process-outbox')
    ->everyMinute()
    ->withoutOverlapping();
```

**Transactional with `afterCommit` + outbox:** Use Laravel's `dispatchAfterCommit` as a lightweight outbox: events are dispatched after the transaction commits. The framework handles the outbox behavior internally. For guaranteed delivery at scale, use the explicit outbox table.

**Outbox cleanup:** Archive or delete published outbox records after a retention period to prevent table bloat.

---

# Architectural Decisions

**Use outbox when:** Event delivery must be guaranteed. The event must be published if and only if the transaction commits.

**Skip outbox for non-critical events:** Logging events, analytics events where temporary loss is acceptable. Direct dispatch is simpler.

**Use explicit outbox table over `afterCommit` when:** The event system could fail after the commit (queue down). The outbox table provides a persistent buffer.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Guaranteed at-least-once delivery | Additional infrastructure (outbox table, worker) |
| No distributed transactions | Polling latency (events not published immediately) |
| Recovery from failures | Outbox table maintenance and cleanup |

---

# Common Mistakes

**No outbox:** Dispatching events without transactional guarantee. If the event dispatch fails after the DB commit, the event is lost. If the event dispatches but the DB rolls back, the event is sent for a change that never happened.

**Outbox in a separate transaction:** Writing to the outbox in a separate transaction. The business transaction commits, but the outbox write fails. The event is lost.

**No idempotency in consumers:** Relying on exactly-once delivery from the outbox. Outbox provides at-least-once. Duplicates are possible. Consumers must handle duplicates.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| CPC-02 Domain events basics | CPC-03 Sync vs queued events | CPC-09 Event sourcing |
| DBC-12 Eventual consistency | CPC-05 Message bus | DBC-11 Multi-context transactions |

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
