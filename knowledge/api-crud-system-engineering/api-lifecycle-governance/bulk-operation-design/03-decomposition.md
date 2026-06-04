# Bulk Operation Design — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | Bulk request/response format, partial failure handling, atomicity model, concurrency control, batch size limits, per-operation identifiers, chunked processing |
| Out-of-Scope | Idempotency key format (covered by Idempotency Key Design), request size limits at infrastructure level (covered by Request Size Limits), specific endpoint definitions |
| External Interfaces | API Gateway (request validation), Database (per-operation transactions), Queue System (async processing) |
| Constraints | Maximum 500 operations per request; response order must match request order; each operation must include a correlation identifier |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | Bulk operation design is a single coherent pattern — splitting would separate format from processing semantics |
| Single-responsibility check | Pass | Focuses exclusively on batch endpoint design patterns |
| Overlap with adjacent KUs | Low | Shares size limit concerns with Request Size Limits; shares idempotency concerns with Idempotency Key Design |

## Dependency Graph
```
Idempotency Key Design ─────────┐
                                  ├──→ Bulk Operation Design ──→ API Usage Tracking
Request Size Limits ────────────┘
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| Should bulk operations support mixed types in one request? | Architecture review | No — each bulk endpoint handles one resource type for simplicity. |
| How do we handle rate limits for bulk vs individual calls? | Policy review | Bulk calls count as 1 request against rate limit, not N operations. |
| Should we offer async bulk for batches > 500? | Product review | Yes — async bulk with a callback/webhook for result delivery. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization