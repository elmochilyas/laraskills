| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Offset-to-Cursor Migration |
| **Metadata** | Difficulty | Advanced |
| **Metadata** | Dependencies | Offset Pagination Design, Cursor Pagination Design, Pagination Strategy Selection |
| **Metadata** | Standards | RFC 8594 (Sunset Header) |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Migrating an API from offset pagination to cursor pagination is a breaking change that requires careful planning. Clients relying on `total`, `last_page`, and random page access will break. The migration strategy involves: (1) supporting both pagination methods simultaneously during a transition period, (2) adding cursor parameters while deprecating offset parameters, (3) communicating the change through documentation and sunset headers, and (4) eventually removing offset support after the deprecation window.

## Core Concepts

- **Breaking Changes**: `total` and `last_page` are no longer available; random page access is removed; `page` parameter is replaced by `cursor`.
- **Coexistence Period**: Both pagination methods are supported simultaneously — clients choose which to use.
- **Deprecation Headers**: `Deprecation: true` and `Sunset: <date>` headers signal the timeline to clients.
- **Feature Flag Rollout**: Gradually enable cursor pagination for a percentage of requests to validate behavior before full migration.
- **Backward-Compatible Total Estimation**: During migration, optionally provide an estimated total for cursor responses if clients absolutely need it.

## When To Use

- Offsetting performance degradation (deep-offset queries timing out or becoming too slow).
- Phantom-read issues causing UX problems (duplicate or skipped records in feeds).
- Dataset has grown beyond the threshold where offset pagination is acceptable (>50K records).
- New client requirements for real-time consistency.
- API version upgrade (v1->v2) that includes pagination changes.

## When NOT To Use

- When all clients can be updated simultaneously (big bang switch) — less complex than gradual migration.
- When the API has no active clients or is being rebuilt from scratch — just use cursor pagination from the start.
- When the database lacks the composite indexes needed for cursor pagination — migrate indexes first.
- When legacy clients cannot be updated and must continue using offset indefinitely — maintain an LTS endpoint.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Support both methods during a 6-12 month transition | Clients migrate at their own pace; no forced breakage |
| Use `Deprecation` and `Sunset` HTTP headers | Industry-standard way to communicate API deprecation timeline |
| Verify cursor indexes exist before enabling cursor pagination | Without indexes, cursor pagination is slower than offset |
| Feature-flag rollout starting at 10% of traffic | Catches issues early before affecting all clients |
| Contact known API consumers directly | Email migration guides and code samples to active clients |
| Provide a sandbox endpoint for testing cursor pagination | Clients can validate their implementation without affecting production |

## Architecture Guidelines

- Implement a dual-controller pattern that detects `cursor` vs `page` parameters and dispatches to the appropriate pagination logic.
- Normalize both response structures where possible to minimize client changes.
- Keep offset pagination code available but disabled after migration; re-enable as rollback plan.
- Monitor the ratio of `page` vs `cursor` requests to track migration progress.
- Include a migration guide endpoint that documents the parameter changes and sunset date.

## Performance Considerations

- During coexistence, only one query type executes per request — no dual-query penalty.
- Before enabling cursor pagination, ensure the required composite indexes exist and are verified with EXPLAIN.
- Monitor cursor query performance after enabling — cursor pagination without proper indexes will be slower than offset.
- The dual-controller pattern adds negligible overhead (a single parameter check).

## Security Considerations

- Cursor tokens must be opaque and tamper-proof; offset parameters (`page`) do not have this requirement.
- Ensure cursor pagination validates cursor format and returns 400 for malformed tokens.
- During migration, maintain the same authorization checks for both pagination methods.
- Log cursor decode failures separately from offset parameter validation errors.
- If providing estimated totals in cursor responses, clearly label them as estimates.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Removing offset pagination too quickly | Developers want to clean up code | Clients that weren't updated break in production | Maintain minimum 6-month deprecation window |
| Not testing cursor pagination at scale | Tests use small datasets | Missing indexes cause production degradation immediately | Load-test with production-scale data before migration |
| Assuming all clients can switch | All clients seem capable | Legacy/partner integrations may not be maintained | Offer LTS endpoint for legacy clients |
| Not verifying indexes before deployment | Index migration not included in release plan | Cursor queries do full table scans; response times spike | Verify indexes exist in the deployment runbook |

## Anti-Patterns

- **Big bang switch without warning**: Highest risk of client breakage; never do this without direct control over all clients.
- **Silent deprecation**: Removing offset pagination without `Deprecation`/`Sunset` headers; clients discover breakage at runtime.
- **Inconsistent response formats**: Some endpoints return cursor format, others return offset format; confuses clients during migration.
- **Not providing migration guides**: Clients need clear instructions on how to adapt their code.
- **No rollback plan**: If cursor pagination has issues, offset code must be restorable quickly.

## Examples

- **Dual-controller pattern**: Check `$request->has('cursor')` to route to cursor pagination; check `$request->has('page')` for legacy offset pagination.
- **Deprecation header**: `response()->header('Deprecation', 'true')->header('Sunset', 'Sat, 01 Jun 2027 00:00:00 GMT')`
- **Feature flag rollout**: Gradual enablement based on `crc32(user_id) % 100 < rollout_percent`.
- **Migration documentation endpoint**: `GET /api/pagination-migration-guide` — returns old/new parameter mapping and sunset date.
- **LTS endpoint**: Maintain `api/v1/posts` with offset pagination indefinitely for legacy clients while `api/v2/posts` uses cursor.

## Related Topics

- Offset Pagination Design — The strategy being migrated from
- Cursor Pagination Design — The strategy being migrated to
- Pagination Strategy Selection — Why the migration is needed
- API Versioning Strategies — Versioning approaches for breaking changes
- Deprecation and Sunset Policies — Communication and timeline management

## AI Agent Notes

- When generating migration code, always include the index verification check before enabling cursor pagination.
- The dual-controller pattern should be the initial implementation; simplify to single-controller after sunset.
- Monitor the ratio of cursor vs offset requests; sunset offset when cursor usage exceeds 95% for 3+ months.
- Always provide a rollback toggle to re-enable offset pagination if cursor has issues.
- Document the migration plan including announcement dates, testing period, and sunset date.

## Verification

- [ ] Required composite indexes exist and are verified with EXPLAIN before cursor deployment
- [ ] Dual-controller pattern implemented: both `cursor` and `page` parameters accepted
- [ ] `Deprecation: true` and `Sunset` headers are added to all offset pagination responses
- [ ] Migration documentation endpoint is available for clients
- [ ] Feature flag for gradual rollout is implemented and tested
- [ ] LTS endpoint strategy is defined for legacy clients that cannot migrate
- [ ] Client communication plan is executed (email, changelog, blog post)
- [ ] Rollback plan exists: offset pagination code is restorable with a configuration toggle
- [ ] Response format is normalized across both pagination strategies where possible
- [ ] Monitoring is in place to track cursor vs offset usage ratio and query performance
