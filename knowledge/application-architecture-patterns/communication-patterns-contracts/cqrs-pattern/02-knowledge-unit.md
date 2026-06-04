# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: CQRS pattern
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Command Query Responsibility Segregation (CQRS) separates read operations from write operations into different models. Writes go through Commands (mutations). Reads go through Queries (no side effects). In a modular monolith, CQRS is often applied at the module level: write models use the domain model with business rules; read models are optimized for specific queries with denormalized data. Full CQRS (separate databases) is rarely justified. Segregated models within the same database is the pragmatic default.

---

# Core Concepts

**Command:** A mutation that changes state. Named in imperative mood (`PlaceOrder`, `CancelInvoice`). Returns no data (or only success/failure). Validates business rules. Dispatched to a command handler.

**Query:** A read that returns data. No side effects. Returns DTOs or read models, never domain objects. Queries can bypass the domain model for performance.

**Segregated model:** The write model uses aggregates, entities, value objects. The read model uses flat DTOs or denormalized projections.

---

# Internal Mechanics

```php
// Command
class PlaceOrder {
    public function __construct(
        public readonly string $customerId,
        public readonly array $items,
    ) {}
}

class PlaceOrderHandler {
    public function __construct(
        private OrderRepository $orders,
        private ProductRepository $products,
    ) {}

    public function handle(PlaceOrder $command): void {
        $items = array_map(
            fn($item) => new OrderItem(
                product: $this->products->find($item['productId']),
                quantity: $item['quantity'],
            ),
            $command->items,
        );
        $order = Order::place($command->customerId, $items);
        $this->orders->save($order);
    }
}

// Query
class OrderQuery {
    public function findForCustomer(string $customerId): array {
        return DB::table('order_read_model')
            ->where('customer_id', $customerId)
            ->get()
            ->toArray();
    }
}
```

---

# Patterns

**Command bus:** Dispatch commands to handlers. Laravel's command bus supports queues, middleware, and pipelines. Commands can be queued for async processing.

**Read models maintained by projectors:** Projectors listen to events and update read models. The read model is a denormalized copy optimized for queries.

**Query objects:** Each query is a dedicated class with a `handle()` method. Queries are injectable and testable.

---

# Architectural Decisions

**Full CQRS (separate databases):** Only when read and write performance requirements diverge significantly. In a monolith, use the same database.

**Segregated models (same database):** Default approach. Write models use ORM/domain objects. Read models use raw queries or query builders for performance.

**Commands via queue:** Commands that don't need immediate effect can be queued. Commands that the user waits for should be synchronous.

---

# Tradeoffs

| Approach | Benefit | Cost |
|---|---|---|
| Segregated models | Optimized reads, clean writes | Two model sets to maintain |
| Full CQRS | Independent scaling | Eventual consistency, infrastructure |
| Command bus | Middleware, queuing | Indirection over direct calls |

---

# Common Mistakes

**CQRS for simple CRUD:** Separating commands and queries when reads and writes are nearly identical. Adds complexity without benefit.

**Domain objects in queries:** Returning entities to the presentation layer. The query should return a DTO or array.

**CQRS without command bus:** Using service methods directly without encapsulation. Commands should be explicit objects.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| CPC-02 Domain events basics | MMD-15 Event sourcing CQRS | CPC-09 Event sourcing |
| SLP-04 Command patterns | CPC-10 Outbox pattern | MMD-14 Read model optimization |

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
