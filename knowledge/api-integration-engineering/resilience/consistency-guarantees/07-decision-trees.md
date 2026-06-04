# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** consistency-guarantees
**Generated:** 2026-06-03

---

# Decision Inventory

1. Consistency Level Selection (At-Most-Once vs At-Least-Once vs Exactly-Once)
2. Idempotency vs Locking Strategy
3. Eventual vs Strong Consistency Decision

---

# Architecture-Level Decision Trees

---

## Consistency Level Selection

---

## Decision Context

Choosing the appropriate consistency guarantee for the integration.

---

## Decision Criteria

* reliability
* architectural

---

## Decision Tree

Does the operation have financial or irreversible side effects?
↓
YES → Exactly-once semantics required (idempotency + locking + outbox/inbox)
  ↓
  Is the operation a payment or charge?
  ↓
  YES → Exactly-once is mandatory; duplicate charges = financial loss
  NO → Exactly-once recommended but idempotent processing may suffice
NO → Is data loss acceptable if the operation fails?
  ↓
  YES → At-most-once is sufficient (fastest, no coordination)
  NO → At-least-once (requires idempotent processing for safe retry)
  ↓
  Are concurrent requests expected for the same resource?
  ↓
  YES → Exactly-once with distributed locking is required
  NO → At-least-once with idempotency is sufficient

---

## Rationale

Financial operations require exactly-once with full coordination. Non-critical operations can use at-most-once for simplicity. Most integrations fall in between with at-least-once plus idempotent processing.

---

## Recommended Default

**Default:** At-least-once with idempotent processing for most operations; exactly-once for financial
**Reason:** Balances data integrity against coordination overhead

---

## Risks Of Wrong Choice

At-most-once for financial operations causes silent data loss. Exactly-once for trivial operations adds unnecessary cost. At-least-once without idempotency causes duplicate side effects.

---

## Related Rules

Right-Size Consistency: Not Every Operation Needs Exactly-Once

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Idempotency vs Locking Strategy

---

## Decision Context

Choosing between idempotency keys and distributed locking for consistency.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Are concurrent duplicate requests possible (same operation arriving twice)?
↓
YES → Combine idempotency keys with distributed locking
  ↓
  Is the operation idempotent by nature (PUT)?
  ↓
  YES → Idempotency key alone may suffice; locking optional
  NO → Both idempotency key and locking needed for safe concurrency
NO → Is the operation a non-idempotent write (POST)?
  ↓
  YES → Idempotency key required; locking protects during key check window
  NO → Read-only operation; no idempotency or locking needed
  ↓
  Lock timeout vs processing time?
  ↓
  YES → Lock timeout should exceed expected processing time + buffer
  NO → Premature lock release allows concurrent processing

---

## Rationale

Idempotency keys prevent duplicates across time; distributed locking prevents concurrent processing of the same key. Both are needed for robust exactly-once semantics.

---

## Recommended Default

**Default:** Idempotency key + distributed lock (30s timeout) for all mutating operations
**Reason:** Prevents both temporal duplicates and concurrent execution

---

## Risks Of Wrong Choice

Idempotency without locking allows concurrent requests to both see "key not found" and both process. Locking without idempotency keys doesn't prevent delayed duplicate requests.

---

## Related Rules

Combine Idempotency Keys with Transactional Outbox for Exactly-Once Delivery

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Eventual vs Strong Consistency Decision

---

## Decision Context

Choosing the consistency model for cross-service data synchronization.

---

## Decision Criteria

* architectural
* performance

---

## Decision Tree

Does the consumer require immediately consistent reads after writes?
↓
YES → Strong consistency required
  ↓
  Can the operation be contained in a single database transaction?
  ↓
  YES → Use database transactions for strong consistency
  NO → Consider distributed transaction or saga pattern
NO → Is temporary inconsistency acceptable for better availability?
  ↓
  YES → Eventual consistency (faster, more available)
  NO → Strong consistency needed for the specific operation
  ↓
  Need to detect and resolve conflicts during eventual consistency?
  ↓
  YES → Implement reconcilation job and conflict detection
  NO → Simple eventual consistency with no conflict handling

---

## Rationale

Strong consistency is simpler to reason about but limits availability. Eventual consistency provides better availability and performance but requires conflict handling.

---

## Recommended Default

**Default:** Strong consistency within a service boundary; eventual consistency across services
**Reason:** Follows the principle of bounded context — consistency within, eventual across

---

## Risks Of Wrong Choice

Strong consistency across services reduces availability and introduces distributed transaction complexity. Eventual consistency within a service adds unnecessary complexity for data that could be strongly consistent.

---

## Related Rules

Document the Chosen Guarantee Per Integration

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie
