# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Facade pattern risks at context boundaries
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

The Facade pattern provides a simplified interface to a complex subsystem. At context boundaries, facades are risky: they can evolve into god objects, obscure real coupling, and hide cross-context dependencies. A facade that exposes many methods from multiple internal services becomes a leaky abstraction. Developers working around the facade by importing internal classes directly. The alternative is to use explicit Bridge/Adapter contracts per capability, rather than a single unified facade per context.

---

# Core Concepts

**Facade:** A single class that delegates to multiple internal services, exposing a unified interface. In Laravel, `Facade` classes (the `Facade` pattern in Laravel's sense) and service facades (like `BillingFacade`) both centralize access.

**God facade anti-pattern:** A facade that grows to expose dozens of methods, each delegating to different services. Becomes a coupling point for the entire context.

**Leaky abstraction:** A facade that exposes methods which require knowledge of the underlying services' internals (e.g., calling `$facade->prepareInvoice()` which requires calling `$facade->validateAddress()` first).

---

# Internal Mechanics

```php
// Anti-pattern: God facade
class BillingFacade {
    public function charge(array $data): string { /* ... */ }
    public function refund(string $txnId): void { /* ... */ }
    public function generateInvoice(string $customerId): Invoice { /* ... */ }
    public function validateAddress(array $address): bool { /* ... */ }
    public function applyDiscount(string $customerId, float $pct): void { /* ... */ }
    public function calculateTax(string $zipCode): float { /* ... */ }
    public function exportToCsv(Carbon $from, Carbon $to): string { /* ... */ }
    public function retryFailedPayment(string $orderId): void { /* ... */ }
    // 20+ more methods
}

// Better: Small, focused contracts
interface PaymentProcessor {
    public function charge(Money $amount, PaymentMethod $method): PaymentResult;
    public function refund(string $transactionId): RefundResult;
}

interface InvoiceGenerator {
    public function generate(string $customerId, array $lineItems): Invoice;
}

interface TaxCalculator {
    public function calculate(string $zipCode, Money $amount): Tax;
}
```

---

# Patterns

**Facade for external libraries only:** Use facades for third-party services (stripe, twilio, mailchimp). The facade isolates the third-party API from the rest of the context.

**Capability-based interfaces instead of context facade:** Instead of one facade per context, define one interface per capability the context exposes.

**Granular facades:** If a facade is necessary (e.g., for a complex subsystem), keep it small and focused on a single concern. Split when it grows beyond 5-7 methods.

---

# Architectural Decisions

**Avoid context-level facades:** Do not create a single `BillingFacade`, `InventoryFacade`, etc. Create multiple small interfaces per capability.

**Use facades only when:** The subsystem is genuinely complex and the consumer needs a simplified interface. If the consumer needs multiple capabilities, provide multiple small facades.

---

# Tradeoffs

| Approach | Benefit | Cost |
|---|---|---|
| Single context facade | Simple first approach | Becomes god object over time |
| Multiple capability interfaces | Clear boundaries, explicit deps | More interfaces to manage |
| No facade | Direct dependency on services | More coupling for consumers |

---

# Common Mistakes

**God facade:** A facade with dozens of unrelated methods. Every cross-context call goes through this class. It becomes a bottleneck and a threat to context decoupling.

**Facade that uses internal types:** The facade exposes internal classes, value objects, or enums. Consumers now depend on the facade's internals.

**Facade as the only entry point:** Developers must use the facade even for simple operations. The facade adds no value for those operations but adds ceremony.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| CPC-07 Bridge/adapter pattern | CPC-01 Interface contracts | DBC-04 Anti-corruption layer |
| DBC-01 Bounded context basics | CPC-06 Circuit breaker | DBC-05 Context mapping |

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
