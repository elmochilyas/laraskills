# Skill: Manage Idempotency Keys Across Distributed Systems

## Purpose
Implement distributed idempotency key management for safe retry across multiple services and requests, ensuring exactly-once processing semantics.

## When To Use
- Distributed systems with multiple processing steps
- Cross-service transactions with idempotency requirements
- Webhook processing with at-least-once delivery semantics
- Event-driven microservices

## When NOT To Use
- Single-service, single-database scenarios (simpler idempotency)
- Read-only operations

## Prerequisites
- Distributed cache (Redis) or database for key storage
- Consistent key generation across services

## Workflow
1. Generate globally unique idempotency keys (ULID, UUID v4)
2. Include key in request headers and propagated events
3. Store processed keys with TTL in distributed cache
4. Use optimistic locking for concurrent requests with same key
5. Handle key conflicts: same key, different payload → 409
6. Implement key expiry and cleanup based on business requirements
7. Log idempotency key lifecycle: generated, locked, completed
8. Test idempotency across service boundaries with integration tests

## Validation Checklist
- [ ] Globally unique key generation (ULID/UUID)
- [ ] Keys propagated across service boundaries
- [ ] Distributed cache for cross-service key storage
- [ ] Optimistic locking for concurrent duplicate keys
- [ ] Key conflict returns 409
- [ ] Key expiry configured and tested
- [ ] Key lifecycle logged
