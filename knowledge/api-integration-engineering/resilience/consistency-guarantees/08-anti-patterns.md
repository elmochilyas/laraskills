# Anti-Patterns — Consistency Guarantees

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | idempotency-data-consistency |
| Knowledge Unit | Consistency Guarantees |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. One-Size-Fits-All Consistency
2. Exactly-Once Without Locking
3. At-Least-Once Without Idempotent Processing
4. Inconsistent Webhook Delivery Guarantees
5. Undocumented Integration Guarantees

---

## 1. One-Size-Fits-All Consistency

### Category
Architecture

### Description
Applying the same consistency guarantee (usually exactly-once or at-most-once) to every integration regardless of business criticality, over-engineering trivial operations or under-engineering critical ones.

### Why It Happens
Developers default to one pattern for all integrations because it's simpler to implement a single approach. The overhead of choosing per-operation guarantees seems like premature optimization. Analytics events receive exactly-once with locking (wasting 10-50ms per event) while payment operations may use at-most-once with no deduplication (risking financial loss).

### Warning Signs
- All integrations use the same consistency approach
- Exactly-once implemented for analytics or logging endpoints
- At-most-once used for payment or account operations
- No per-operation consistency tier configuration

### Why Harmful
Exactly-once on trivial operations wastes resources (10-50ms overhead per operation) and reduces throughput without benefit. At-most-once on critical operations risks silent data loss — if a payment charge fails, it's simply lost with no retry. The one-size approach maximizes either waste or risk, never achieving the right balance.

### Consequences
- Wasted latency on operations that don't need strong guarantees
- Silent data loss on critical operations with weak guarantees
- Over-engineered infrastructure for non-critical paths
- Under-protected financial or irreversible operations

### Alternative
Tier consistency guarantees by operation criticality: exactly-once for financial, at-least-once for standard operations with idempotent processing, at-most-once for analytics.

### Refactoring Strategy
1. Classify each integration by business criticality (financial, standard, analytics)
2. Map criticality to consistency tier with clear justification
3. Implement per-operation configuration (e.g., `ConsistencyLevel::ExactlyOnce`)
4. Test each tier's behavior under failure scenarios
5. Document the tier per integration in service class docblocks

### Detection Checklist
- [ ] Consistency tier configured per operation
- [ ] Financial operations use exactly-once
- [ ] Analytics operations use at-most-once
- [ ] No over-engineering on trivial paths

### Related Rules
Right-Size Consistency Guarantee to Business Impact

### Related Skills
Ensure Consistency Guarantees with Idempotent Operations

### Related Decision Trees
Consistency Level Selection

---

## 2. Exactly-Once Without Locking

### Category
Reliability

### Description
Claiming exactly-once semantics while only using idempotency keys without distributed locking, allowing concurrent requests to both pass the idempotency check and process in parallel.

### Why It Happens
Idempotency keys and exactly-once appear synonymous to many developers. The idempotency key check works in single-threaded testing. The race condition window between the key existence check and the key storage is tiny and rarely triggers in development, creating false confidence.

### Warning Signs
- Exactly-once claimed but no distributed lock in processing pipeline
- Idempotency key check without lock acquisition
- Concurrent requests with the same key both process successfully
- Duplicate side effects in production under load

### Why Harmful
Exactly-once without locking means "exactly-one-or-more" — the guarantee is false. Two concurrent requests with the same idempotency key both see "key not found" and both process. The operation executes twice (or more) despite the idempotency key. For payment operations, this means double charges. The team believes they have exactly-once protection but they don't.

### Consequences
- False exactly-once guarantee violated on concurrent delivery
- Duplicate processing and side effects in production
- Financial loss from double charges
- False confidence in data integrity

### Alternative
Combine idempotency keys with distributed locking: acquire a lock on the key before checking existence, process within the lock scope, and release after storing the response.

### Refactoring Strategy
1. Add `Cache::lock("idempotency:$key", 30)` before key check
2. Wait for lock with timeout (e.g., `block(10)`)
3. Re-check idempotency key inside lock scope (double-check pattern)
4. Process and store response within lock scope
5. Release lock in finally block

### Detection Checklist
- [ ] Distributed lock acquired before idempotency check
- [ ] Lock timeout > expected processing time
- [ ] Concurrent requests with same key serialized
- [ ] Exactly-once verified under concurrent load testing

### Related Rules
Combine Idempotency Key with Lock for Exactly-Once

### Related Skills
Ensure Consistency Guarantees with Idempotent Operations

### Related Decision Trees
Idempotency vs Locking Strategy

---

## 3. At-Least-Once Without Idempotent Processing

### Category
Reliability

### Description
Using at-least-once delivery (automatic retry on failure) without ensuring the operation is idempotent, causing duplicate side effects on every retry.

### Why It Happens
The queue retry mechanism is straightforward to configure: `$job->onQueue('webhooks')->retry(3)`. Making the operation idempotent requires additional code, unique constraints, and idempotency key tracking. The retry logic is added as an afterthought without considering whether the operation can safely execute multiple times.

### Warning Signs
- Queue jobs configured with retry but operation is not idempotent
- Retry configuration without idempotency key or deduplication
- Duplicate records or side effects observed after retry
- No idempotency check before processing

### Why Harmful
At-least-once guarantees every message is delivered at least once. If the operation is not idempotent, each retry creates a new side effect: duplicate orders, duplicate charges, duplicate emails. The retry mechanism intended to improve reliability instead causes data corruption. The at-least-once guarantee becomes a data integrity liability.

### Consequences
- Duplicate side effects on every retry
- Data corruption from non-idempotent operations
- At-least-once becomes a reliability risk, not benefit
- Debugging and cleanup effort for duplicates

### Alternative
Make all operations idempotent before enabling at-least-once retry: use idempotency keys, unique constraints, or ensure same-payload re-execution is safe.

### Refactoring Strategy
1. Review all operations with at-least-once retry for idempotency
2. Add idempotency key support to non-idempotent operations
3. Implement deduplication with unique constraints or cache checks
4. Verify operation safety through repeated execution testing
5. Document idempotency properties per operation

### Detection Checklist
- [ ] All at-least-once operations are idempotent
- [ ] Idempotency key or unique constraint in place
- [ ] Repeated execution produces same result
- [ ] No duplicate side effects after retry

### Related Rules
Right-Size Consistency Guarantee to Business Impact

### Related Skills
Ensure Consistency Guarantees with Idempotent Operations

### Related Decision Trees
Consistency Level Selection

---

## 4. Inconsistent Webhook Delivery Guarantees

### Category
Reliability

### Description
Having different delivery guarantees for outgoing vs incoming webhooks without proper bridging patterns (outbox/inbox), causing data inconsistency between systems.

### Why It Happens
Outgoing and incoming webhooks are developed by different teams or at different times. The outgoing webhook uses at-most-once (fire and forget) while the incoming endpoint expects exactly-once. Or the outgoing uses transactional outbox (exactly-once) but the incoming endpoint doesn't implement idempotency. Each side optimizes independently without considering the end-to-end consistency model.

### Warning Signs
- Outgoing webhooks dispatch outside database transactions
- Incoming webhook processing without idempotency or inbox pattern
- Data inconsistencies between systems after webhook failures
- Webhooks sent for failed operations or lost for successful ones

### Why Harmful
The outgoing system may send a webhook for a business operation that failed (sending outside transaction) or fail to send for a successful operation. The incoming system may process the same webhook multiple times (no inbox/deduplication). The end-to-end consistency guarantee is weaker than either side assumes, leading to data corruption, duplicate orders, and reconciliation nightmares.

### Consequences
- Inconsistent state between integrated systems
- Webhooks sent for failed business operations
- Duplicate processing from at-least-once incoming delivery
- Reconciliation effort to fix data mismatches

### Alternative
Use transactional outbox for outgoing webhooks (exactly-once delivery) and inbox pattern with unique constraints for incoming webhooks (exactly-once processing).

### Refactoring Strategy
1. Implement transactional outbox: write webhook events in the same DB transaction as the business operation
2. Implement inbox pattern: persist event ID with unique constraint before processing incoming webhooks
3. Chain the patterns: outbox → at-least-once delivery → inbox → idempotent processing
4. Document the end-to-end consistency model
5. Test failure scenarios at each bridging point

### Detection Checklist
- [ ] Outgoing webhooks use transactional outbox pattern
- [ ] Incoming webhooks use inbox with unique constraint
- [ ] End-to-end consistency documented
- [ ] No data inconsistencies between systems

### Related Rules
Use Transactional Outbox for Exactly-Once Outgoing Delivery, Use Inbox with Unique Constraint for Exactly-Once Incoming Webhooks

### Related Skills
Ensure Consistency Guarantees with Idempotent Operations

### Related Decision Trees
Consistency Level Selection

---

## 5. Undocumented Integration Guarantees

### Category
Maintainability

### Description
Deploying integrations without documenting the consistency guarantee provided, forcing consumers to guess the delivery semantics and failure behavior.

### Why It Happens
Documentation is deprioritized during development. The consistency guarantee is obvious to the developer who wrote the code but invisible to future maintainers. The class docblock describes what the service does but not what delivery guarantees it provides, making consumers guess whether retry is safe.

### Warning Signs
- Service classes lack docblocks describing consistency guarantees
- Consumers implement their own retry logic guessing the guarantee
- Integration bugs caused by incorrect assumptions about guarantees
- No documentation of failure modes or expected behavior

### Why Harmful
A consumer treats an at-most-once integration as reliable and doesn't implement fallback for missing data. Or a consumer treats an at-least-once integration as at-most-once and doesn't implement idempotent processing, causing duplicate side effects. The undocumented guarantee creates a knowledge gap between the integration provider and consumer, leading to misalignment, bugs, and operational incidents.

### Consequences
- Consumers make wrong assumptions about delivery guarantees
- Integration bugs from guarantee mismatch
- Debugging time wasted understanding undocumented behavior
- Incident response delayed by knowledge gaps

### Alternative
Document the consistency guarantee (at-most-once / at-least-once / exactly-once) in every service class docblock with failure mode description.

### Refactoring Strategy
1. Add docblock to each integration service class documenting the guarantee
2. Include failure modes: what happens on timeout, retry, duplicate
3. Document expected idempotency behavior
4. Include examples of safe and unsafe consumer patterns
5. Review documentation during code review

### Detection Checklist
- [ ] Each integration service has documented guarantee
- [ ] Failure modes described
- [ ] Idempotency behavior documented
- [ ] Review process checks documentation accuracy

### Related Rules
Document Chosen Guarantee Per Integration

### Related Skills
Ensure Consistency Guarantees with Idempotent Operations

### Related Decision Trees
Consistency Level Selection
