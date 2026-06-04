# Consistency Guarantees — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Idempotency
- **Knowledge Unit:** Consistency Guarantees
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand idempotency keys and database transactions
- [ ] Familiarity with outbox pattern, inbox pattern, optimistic locking
- [ ] Knowledge of CAP theorem and distributed systems basics

## Implementation Checklist
- [ ] Consistency guarantee documented per integration
- [ ] Exactly-once operations have idempotency + locking
- [ ] At-least-once operations have idempotent processing logic
- [ ] Transactional boundaries correctly defined for operations spanning DB + HTTP
- [ ] Payment/financial operations: exactly-once via idempotency + locking
- [ ] Webhook delivery: at-least-once via outbox pattern

## Verification Checklist
- [ ] Right-size consistency: not every operation needs exactly-once
- [ ] Idempotency keys combined with transactional outbox for exactly-once delivery
- [ ] Inbox pattern with unique constraints for exactly-once webhook processing

## Security Checklist
- [ ] At-most-once used for non-critical operations where data loss is acceptable
- [ ] At-least-once used with idempotent processing to handle duplicates
- [ ] Exactly-once used for payment/financial operations only when necessary

## Performance Checklist
- [ ] Exactly-once adds 10-50ms overhead per operation (locking + storage checks)
- [ ] At-most-once is fastest (no coordination) but risks data loss
- [ ] At-least-once medium cost but requires idempotent processing

## Production Readiness Checklist
- [ ] Idempotency keys + distributed locking → at-most-once for incoming API
- [ ] Transactional outbox + deduplication → at-least-once → exactly-once for outgoing
- [ ] Inbox table with unique constraint → exactly-once for incoming webhooks
- [ ] Eventual consistency acceptable for cross-service read model updates

## Common Mistakes to Avoid
- [ ] Avoid over-engineering: requiring exactly-once where idempotent handling suffices
- [ ] Avoid under-engineering: using at-most-once for financial operations
- [ ] Avoid assuming exactly-once without distributed locking
