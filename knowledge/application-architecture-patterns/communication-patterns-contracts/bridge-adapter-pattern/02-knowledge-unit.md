# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Bridge/adapter pattern for context boundaries
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The Bridge pattern separates abstraction (the contract) from implementation (the concrete service). At context boundaries, this means the consuming context depends on an interface (the bridge), not the concrete implementation. The adapter pattern translates between interfaces: the adapter wraps the concrete context's implementation and adapts it to the contract expected by the consumer. Together, Bridge + Adapter allow Context A to call Context B without knowing Context B exists.

---

# Core Concepts

**Bridge:** An interface that both contexts agree on. The contract is defined in a shared location (or duplicated per context). Each context implements the bridge independently.

**Adapter:** A wrapper that converts one interface to another. When the producer's interface doesn't match the consumer's expected contract, the adapter does the conversion.

---

# Internal Mechanics

```php
// Bridge contract
interface PaymentBridge {
    public function charge(Money $amount, CreditCard $card): PaymentResult;
}

// Concrete implementation in Billing context
class BillingPaymentAdapter implements PaymentBridge {
    public function __construct(
        private BillingService $billing,
    ) {}

    public function charge(Money $amount, CreditCard $card): PaymentResult {
        // Adapter: converts bridge contract to billing-specific calls
        $request = new BillingChargeRequest(
            $amount->inCents(),
            $amount->currency(),
            $card->token,
        );
        $response = $this->billing->charge($request);
        return new PaymentResult(
            id: $response->transactionId,
            status: $response->success ? 'completed' : 'failed',
        );
    }
}

// Consumer in Checkout context
class CheckoutService {
    public function __construct(
        private PaymentBridge $payment,
    ) {}
}
```

---

# Patterns

**Bridge defined in shared kernel:** The bridge contract lives in a shared kernel package. Both contexts depend on the shared kernel (not on each other).

**Laravel contract + binding:** Define the bridge as a Laravel `Contract`. Bind the adapter in the service provider:
```php
// In BillingServiceProvider
$this->app->bind(PaymentBridge::class, BillingPaymentAdapter::class);
```

**Tiered adapters:** Multiple adapters for different implementations. Development uses `FakePaymentAdapter`. Production uses `BillingPaymentAdapter`.

---

# Architectural Decisions

**Bridge every cross-context call:** Directly instantiating a service from another context creates tight coupling. Always use a bridge/adapter pair.

**Adapter lives in the producer context:** The adapter that implements the bridge should live in the context that provides the functionality. The consumer depends only on the bridge.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Consuming context doesn't know the producer | Extra indirection |
| Swap implementations without consumer changes | Adapter maintenance |
| Testable (inject mock bridge) | Boilerplate for each cross-context call |

---

# Common Mistakes

**Skipping the bridge:** Importing and directly using another context's classes. The dependency is now explicit and tight.

**Adapter in the consumer context:** The consumer creates the adapter. Now the consumer knows both the bridge and the producer's API. The point of the adapter is defeated.

**Bridge = data transfer object only:** Defining the bridge as only a data contract (DTO) without any operation contract. The consumer still couples to the producer's implementation.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| CPC-01 Interface contracts | CPC-05 Message bus | CPC-12 Facade pattern risks |
| SLP-03 Contract interfaces | DBC-04 Anti-corruption layer | AEG-07 Dependency rules enforcement |

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
