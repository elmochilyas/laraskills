# Request Size Limits — Decomposition

## Boundary Analysis
| Boundary Type | Description |
|---|---|
| In-Scope | Body size limits, upload limits, query string limits, multi-layer enforcement (nginx/PHP/Laravel), 413 error responses, tiered limit configuration, endpoint-specific overrides |
| Out-of-Scope | Rate limiting mechanics, bulk operation batch sizes (covered by Bulk Operation Design), file storage backend |
| External Interfaces | nginx (gateway enforcement), PHP runtime (php.ini), Laravel Middleware (application enforcement), Monitoring System (413 tracking) |
| Constraints | nginx limit ≤ PHP limit ≤ Laravel limit; 10MB default body; 50MB default upload; limits must be documented in error responses |

## Atomicity Assessment
| Aspect | Verdict | Rationale |
|---|---|---|
| Can this be split into smaller KUs? | No | Request size enforcement is a single multi-layer concern — splitting would create coordination issues |
| Single-responsibility check | Pass | Focuses exclusively on request size governance across infrastructure and application layers |
| Overlap with adjacent KUs | Low | Shares consumer tier concept with Rate Limit Tier Design; upload concerns are in-scope |

## Dependency Graph
```
Rate Limit Tier Design ─────────┐
                                  ├──→ Request Size Limits ──→ Bulk Operation Design
CORS Policy Governance ─────────┘
```

## Follow-up
| Question | Source | Resolution |
|---|---|---|
| Should we allow consumers to request larger limits? | Product review | Yes — via support ticket with use case justification; applied per API key. |
| How do we handle large file uploads (video)? | Architecture review | Separate upload endpoint with streaming + resumable upload protocol (TUS). |
| Should we log the payload content of oversized requests? | Security review | No — log only size, endpoint, and consumer ID for privacy. |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization