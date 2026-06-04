# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Circuit breaker pattern
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

A circuit breaker prevents cascading failures when a downstream service is unavailable. It monitors for failures. When failures cross a threshold, the circuit "opens" and subsequent calls fail immediately without attempting the actual request. After a timeout, the circuit enters "half-open" state to test if the downstream service has recovered. If the test call succeeds, the circuit closes. If it fails, the circuit reopens. In a modular monolith, circuit breakers protect cross-context synchronous calls.

---

# Core Concepts

**Closed state:** Normal operation. Requests pass through to the downstream service. Failures are counted.

**Open state:** Requests are rejected immediately (fail fast). No calls to the downstream service are attempted. A timer runs.

**Half-open state:** After the timer expires, a limited number of test requests are allowed through. If they succeed, the circuit closes. If they fail, the circuit reopens.

---

# Internal Mechanics

```php
class CircuitBreaker {
    public function __construct(
        private int $threshold = 5,
        private int $timeoutSeconds = 30,
    ) {}

    public function call(callable $operation): mixed {
        if ($this->isOpen()) {
            throw new CircuitOpenException('Circuit breaker is open');
        }

        try {
            $result = $operation();
            $this->recordSuccess();
            return $result;
        } catch (\Exception $e) {
            $this->recordFailure();
            throw $e;
        }
    }
}

class PaymentClient {
    public function __construct(
        private CircuitBreaker $breaker,
        private PaymentApi $api,
    ) {}

    public function processPayment(PaymentRequest $request): PaymentResult {
        return $this->breaker->call(fn() => $this->api->charge($request));
    }
}
```

---

# Patterns

**Fail-fast:** When the circuit is open, fail the request immediately rather than waiting for a timeout. The upstream service knows the downstream is unavailable.

**Fallback:** When the circuit is open, return a cached or default response:
```php
$result = $this->breaker->call(
    operation: fn() => $this->api->charge($request),
    fallback: fn() => PaymentResult::deferred('payment.gateway.unavailable'),
);
```

**State monitoring:** Log circuit state changes and expose via health check for alerting.

---

# Architectural Decisions

**Use circuit breakers for:** Synchronous cross-context calls where the downstream service could be unavailable.

**Do not use for:** Asynchronous message passing (already resilient via queues), local in-method calls (no network boundary), calls within the same process where timeout is sufficient.

---

# Tradeoffs

| Benefit | Cost |
|---|---|
| Prevents cascading failures | Added complexity |
| Fast failure instead of timeout | Need to handle circuit-open gracefully |
| Automatic recovery | Tuning threshold/timeout per service |

---

# Common Mistakes

**No circuit breaker:** All cross-context calls fail when one context goes down. Every request waits for the full timeout. The system degrades catastrophically.

**Threshold too low:** A transient spike in failures trips the circuit. Normal operation is disrupted unnecessarily.

**No half-open recovery:** The circuit opens but never tests for recovery. The service is effectively down permanently.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| CPC-03 Sync vs queued events | CPC-07 Bridge/adapter pattern | AEG-05 Circuit breaker testing |
| DBC-07 Cross-context queries | CPC-05 Message bus | AEG-04 Timeout and retry strategies |

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
