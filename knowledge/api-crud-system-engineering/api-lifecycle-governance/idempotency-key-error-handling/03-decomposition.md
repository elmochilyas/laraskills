# Idempotency Key Error Handling — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | Error code definitions (missing, invalid, conflict, expired, concurrent, store down), HTTP status mapping, error response JSON schema, Retry-After header, Warning header (near-expiry) |
| Out-of-Scope | Idempotency key storage mechanics (covered by Idempotency Key Design), TTL management (covered by Idempotency Key TTL Expiration) |
| External Interfaces | API Consumer (error responses), Developer Portal (error documentation), Monitoring System (error rate tracking) |
| Constraints | All idempotency errors must return structured JSON with `error.code`, `error.message`, `error.resolution`; sensitive data must never be included in error responses |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | Error handling is a single coherent concern across all idempotency failure modes |
| Single-responsibility check | Pass | Focuses exclusively on error communication for idempotency operations |
| Overlap with adjacent KUs | High | Shares error scenarios with Idempotency Key Design; error codes integrate with API Style Guide error format |

## Dependency Graph
```
Idempotency Key Design ─────────┐
                                  ├──→ Idempotency Key Error Handling
Idempotency Key TTL Expiration ──┘
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| Should we expose the original request timestamp in conflict errors? | Security review | No — could be used for timing attacks. Only expose "different payload than original." |
| How long should we retain conflict information for debugging? | Operations review | 30 days in the error log, separate from the idempotency store. |
| Should error responses be localized? | Product review | No — English only; error codes are language-agnostic. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization