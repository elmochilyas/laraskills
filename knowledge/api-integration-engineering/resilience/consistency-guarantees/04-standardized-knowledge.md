# ECC Standardized Knowledge — Consistency Guarantees

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | idempotency-data-consistency |
| Knowledge Unit ID | ku-03 |
| Knowledge Unit | Consistency Guarantees |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K006, K015, K018, K034 |

## Overview (Engineering Value)
Consistency guarantees define the data integrity properties of API integration operations, especially regarding how concurrent operations and failures affect data state. The three key guarantees are: at-most-once (operation executed 0 or 1 times), at-least-once (operation executed 1+ times), and exactly-once (guaranteed 1 execution). For API integrations, achieving exactly-once semantics requires combining idempotency keys (preventing duplicates), distributed locking (serializing concurrent requests), and transaction-safe outbox/inbox patterns. Understanding and choosing the right consistency guarantee for each integration is critical for data integrity without over-engineering.

## Core Concepts
- **At-Most-Once**: Operation executed zero or one time; duplicates are impossible, but failures may lose the operation
- **At-Least-Once**: Operation executed one or more times; duplicates possible, no data loss
- **Exactly-Once**: Operation executed exactly one time; no duplicates, no data loss (requires coordination)
- **Transactional Guarantees**: Both business operation and integration side effects committed atomically
- **Eventual Consistency**: State converges over time; temporary inconsistencies are acceptable
- **Strong Consistency**: State is immediately consistent after operation completes

## When To Use
- Payment and financial operations: exactly-once via idempotency + locking
- Webhook delivery: at-least-once via outbox pattern; exactly-once via inbox + idempotency
- Non-critical notifications: at-most-once is acceptable
- Audit logging: exactly-once via transactional outbox

## When NOT To Use
- Exactly-once for idempotent side effects (wasted coordination overhead)
- Strong consistency for cross-service operations where eventual consistency is acceptable

## Best Practices
- Right-size consistency: not every operation needs exactly-once; choose based on business impact of duplicates vs data loss
- Combine idempotency keys with transactional outbox for exactly-once delivery
- Use inbox pattern with unique constraints for exactly-once webhook processing
- Document the chosen guarantee per integration for consumer awareness

## Architecture Guidelines
- Idempotency keys + distributed locking → at-most-once for incoming API requests
- Transactional outbox + deduplication → at-least-once → exactly-once for outgoing webhooks
- Inbox table with unique constraint → exactly-once for incoming webhook processing
- Eventual consistency acceptable for cross-service read model updates

## Performance Considerations
- Exactly-once adds 10-50ms overhead per operation (locking + storage checks)
- At-most-once is fastest (no coordination) but risks data loss on failure
- At-least-once is medium cost but requires idempotent processing

## Common Mistakes
- Over-engineering: requiring exactly-once for operations where idempotent processing handles duplicates
- Under-engineering: using at-most-once for financial operations where data loss is unacceptable
- Assuming exactly-once without distributed locking (concurrent requests violate the guarantee)

## Related Topics
- **Prerequisites**: Idempotency keys, database transactions
- **Closely Related**: Outbox pattern, inbox pattern, optimistic locking
- **Advanced**: Distributed consensus, two-phase commit
- **Cross-Domain**: CAP theorem, distributed systems

## Verification
- [ ] Consistency guarantee documented per integration
- [ ] Exactly-once operations have idempotency + locking
- [ ] At-least-once operations have idempotent processing logic
- [ ] Transactional boundaries correctly defined for operations spanning DB + HTTP
