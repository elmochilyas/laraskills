# Skill: Ensure Consistency Guarantees with Idempotent Operations

## Purpose
Design API integration operations with consistency guarantees through idempotency, ensuring exactly-once or at-least-once semantics depending on business requirements.

## When To Use
- Designing integration semantics for financial or critical operations
- Defining consistency models for API integrations
- Webhook processing with different delivery guarantees

## When NOT To Use
- Best-effort delivery scenarios
- Non-critical, log-only integrations

## Prerequisites
- Understanding of delivery semantics (at-most-once, at-least-once, exactly-once)
- Idempotency key or deduplication mechanism

## Workflow
1. Define required delivery semantics per operation
2. For exactly-once: idempotency keys + deduplication + idempotent processing
3. For at-least-once: idempotent processing (duplicates are safe)
4. For at-most-once: no retry (duplicates not allowed, missing data acceptable)
5. Implement deduplication using idempotency keys stored in cache/DB
6. Ensure processing logic is idempotent: same result regardless of execution count
7. Test consistency under failure scenarios (duplicate delivery, partial processing)
8. Document consistency guarantees for each integration

## Validation Checklist
- [ ] Delivery semantics defined per operation
- [ ] Idempotency key mechanism in place for exactly-once
- [ ] Processing logic verified as idempotent
- [ ] Deduplication tested under failure scenarios
- [ ] Consistency guarantees documented per integration
