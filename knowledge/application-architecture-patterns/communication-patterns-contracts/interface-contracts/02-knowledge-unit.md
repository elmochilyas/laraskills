# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Formalized contracts between contexts
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Formalized contracts are explicit, versioned interfaces that define how bounded contexts communicate. Each contract specifies data shapes, allowed operations, error contracts, and versioning policy. Contracts decouple contexts: a consumer depends on the contract, not on the producer's implementation. Changes to the producer that preserve the contract do not affect consumers. Breaking changes require a new contract version.

---

# Core Concepts

**Contract:** A data shape + set of allowed operations. In Laravel, a contract is often a Data Transfer Object (DTO) + an interface. The DTO defines the data shape. The interface defines allowed operations and error cases.

**Versioned contract:** A contract with an explicit version (v1, v2). Breaking changes increment the version. Multiple versions coexist during migration.

**Contract boundary:** The line where a contract applies. Within a context, contracts are not needed—you can change interfaces freely.

---

# Internal Mechanics

```php
// Contract definition
interface PaymentProcessingContract {
    public function processPayment(PaymentRequest $payment): PaymentResult;
}

class PaymentRequest {
    public function __construct(
        public readonly string $orderId,
        public readonly Money $amount,
        public readonly string $currency,
    ) {}
}

class PaymentResult {
    public function __construct(
        public readonly string $paymentId,
        public readonly string $status,
        public readonly ?string $errorMessage,
    ) {}
}
```

---

# Patterns

**Contract-first:** Define the contract before implementing either side. Both producer and consumer agree on the interface first.

**Semantic versioning for contracts:** Major version = breaking change, minor = additive, patch = bug fix. Consumers pin to a major version and upgrade when they choose.

**Contract testing:** Both producer and consumer test against the same contract. The producer verifies it satisfies the contract. The consumer verifies it can work with the contract:
```php
class PaymentContractTest extends TestCase {
    public function contract_is_satisfied(): void {
        $service = app(PaymentProcessingContract::class);
        $result = $service->processPayment(new PaymentRequest(/* ... */));
        $this->assertInstanceOf(PaymentResult::class, $result);
        $this->assertNotEmpty($result->paymentId);
    }
}
```

---

# Architectural Decisions

**Define contracts at context boundaries:** Every pair of communicating contexts needs a contract. Within a context, interfaces are internal and can change freely.

**Allow only readonly DTOs:** Contracts should be immutable. If the consumer modifies the DTO, it creates hidden coupling.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Context independence | Contract maintenance overhead |
| Version migration safety | Coordination for breaking changes |
| Clear boundaries | Serialization/deserialization cost |

---

# Common Mistakes

**No contract:** Communicating contexts without a defined contract. Changes in one context break the other.

**Contract = implementation:** Defining the contract in terms of the producer's internals (e.g., exposing Eloquent models). The contract should not reflect implementation details.

**Backward-incompatible changes without versioning:** Adding a required field to a DTO that consumers don't fill. The change breaks consumers.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-01 Bounded context basics | CPC-02 Domain events | CPC-05 Message bus |
| SLP-03 Contract interfaces | CPC-07 Bridge/adapter pattern | CPC-11 Distributed tracing |

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
