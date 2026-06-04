# Idempotency Key TTL Expiration — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | TTL duration definition, passive expiration (Redis EXPIRE), sliding TTL extension, soft-delete copy, hard deletion, expired key handling, store monitoring |
| Out-of-Scope | Idempotency key header format (covered by Idempotency Key Design), error responses for expired keys (covered by Idempotency Key Error Handling), consumer retry logic |
| External Interfaces | Redis Cache (key storage + TTL), Scheduler (cleanup jobs), Monitoring System (store metrics) |
| Constraints | Base TTL = 24 hours; sliding extension = 24 hours from last request; soft-delete window = 7 days; Redis eviction policy = volatile-ttl |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | TTL lifecycle from creation to deletion is a single coherent concern |
| Single-responsibility check | Pass | Focuses exclusively on data lifecycle management of idempotency keys |
| Overlap with adjacent KUs | High | Shares store with Idempotency Key Design; shares error scenarios with Idempotency Key Error Handling |

## Dependency Graph
```
Idempotency Key Design ─────────→ Idempotency Key TTL Expiration ──→ Idempotency Key Error Handling
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| Should we offer consumer-configurable TTLs? | Product review | No — fixed 24-hour TTL for simplicity; exceptions on request. |
| How do we handle idempotency store across data center failures? | Architecture review | Redis cross-region replication with active-passive failover. |
| What is the cost of storing 86M keys? | Infrastructure review | ~86 GB Redis memory; evaluate cost vs TTL reduction. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization