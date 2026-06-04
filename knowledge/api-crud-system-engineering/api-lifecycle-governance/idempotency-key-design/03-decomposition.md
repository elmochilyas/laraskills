# Idempotency Key Design — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | Idempotency-Key header format, key storage (Redis), replay detection logic, concurrent request handling, response caching, exactly-once semantics |
| Out-of-Scope | TTL cleanup mechanics (covered by Idempotency Key TTL Expiration), error responses for conflicts (covered by Idempotency Key Error Handling), specific consumer key generation |
| External Interfaces | Redis Cache (key store), API Gateway (header extraction), Application Middleware (replay logic) |
| Constraints | Keys must be prefixed with consumer ID; TTL is 24 hours; full response is cached including status code and body |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | Core idempotency mechanics and replay detection are tightly coupled |
| Single-responsibility check | Pass | Focuses exclusively on idempotency key mechanism and replay detection |
| Overlap with adjacent KUs | High | TTL and error handling are split into dedicated KUs because they have distinct concerns (data lifecycle, user-facing errors) |

## Dependency Graph
```
Idempotency Key Design ─────────────────→ Idempotency Key TTL Expiration
         │
         └────────────────→ Idempotency Key Error Handling
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| Should idempotency keys be required or optional? | Policy decision | Required for all POST/PATCH/DELETE; optional for GET (already idempotent). |
| How do we handle idempotency across API versions? | Architecture review | Keys are scoped to consumer + endpoint path (not version) to allow retries across upgrades. |
| Should we expose idempotency key status to consumers? | Product review | Yes — `Idempotency-Key-Status` response header: `new` or `replay`. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization