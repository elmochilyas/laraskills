# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Event design patterns
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Event design determines whether events are easy to evolve, debug, and consume. Three core dimensions: schema design (what data the event carries), granularity (one event per type of occurrence vs. generic events), and envelope structure (metadata vs payload separation). Well-designed events carry all data the consumer needs (not just an ID to fetch). Events are immutable; once published, they never change.

---

# Core Concepts

**Fat events vs. thin events:** A fat event carries all data the consumer might need (`OrderPlaced` with product names, prices, addresses). A thin event carries only an ID and type. Fat events reduce coupling to the source data store but create larger event schemas.

**Event envelope:** The outer structure of an event message containing metadata (event ID, type, timestamp, version, correlation ID) separate from the payload (domain data).

**Event granularity:** Fine-grained events (one per field change) vs. coarse events (one per aggregate change). Coarse events are easier to consume. Fine-grained events give more control.

---

# Internal Mechanics

```php
class EventEnvelope {
    public function __construct(
        // metadata
        public readonly string $eventId,
        public readonly string $eventType,
        public readonly string $version,
        public readonly Carbon $occurredAt,
        public readonly ?string $correlationId,
        public readonly ?string $causationId,

        // payload
        public readonly array $data,
    ) {}
}
```

---

# Patterns

**Fat events:** Include the data the consumer needs to act without querying the source. Example: `OrderShipped` includes shipping address and tracking number directly.

**Versioned event schema:** Events carry a version label. Consumers can handle multiple versions simultaneously:
```php
class OrderPlacedV1 { /* 2 fields */ }
class OrderPlacedV2 { /* 3 fields, v1 fields kept */ }
```

**Correlation and causation IDs:** Every event carries a correlation ID (tracing the original operation) and a causation ID (tracing the immediate parent event). Enables tracing across context boundaries.

---

# Architectural Decisions

**Default to fat events:** Include relevant data the consumer likely needs. Saves round-trips and reduces coupling to source data. Accept that schema migration requires care.

**Default to coarse granularity:** One event per meaningful state change, not one per field change. Avoids event noise.

---

# Tradeoffs

| Approach | Benefit | Cost |
|---|---|---|
| Fat events | Self-contained, no extra queries | Larger payload, schema change cost |
| Thin events | Minimal schema, flexible | Consumer must query source |
| Coarse granularity | Simple to consume | Less detail for some consumers |

---

# Common Mistakes

**Thin events that require fetching:** `OrderPlaced` with only `orderId`. Consumers must query the order service to get the data. Creates temporal coupling—what if the order is deleted later?

**No correlation ID:** Events cannot be traced across contexts. Debugging is extremely difficult.

**Mutable events:** Allowing events to be updated after publication. Consumers assume immutability. If the event can change, consumers get inconsistent behavior.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| CPC-02 Domain events basics | CPC-01 Interface contracts | CPC-09 Event sourcing |
| CPC-03 Sync vs queued events | CPC-10 Outbox pattern | CPC-11 Distributed tracing |

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
