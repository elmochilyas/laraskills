# Decomposition — Controller Organization by Version

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Version-specific controller directories, V1/V2 namespace separation, route prefix grouping, inheritance between versions, deprecation lifecycle |
| **Boundaries** | Ends where domain-organized grouping would be used instead; distinct from header-based or content-negotiation versioning; separate from the actual controller implementation details |
| **Interfaces** | Directory structure convention; `Route::prefix('v1')->namespace(...)` in route files |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Version-based organization is a single architectural dimension |
| Minimal overlap | ✅ Atomic | Independent from domain organization; both are directory patterns but orthogonal |
| Testable independently | ✅ Atomic | Can test that V1 and V2 responses differ as expected |
| Splittable? | ⚠️ Borderline | Could split "version inheritance" and "route registration" but they are tightly coupled |

## Dependency Graph

```
API Resource Controllers ──► Controller Organization by Version ──► Controller Testing Strategies
                                      │
                                      └──► Controller Middleware Assignment
```

## Follow-up

| Action | Reason |
|--------|--------|
| Document a deprecation checklist: when to archive a version directory | Operational guidance for API lifecycle management |
| Create a comparison table of versioning strategies (URL vs header vs content-type) | Decision support for architects |
| Provide a PHPStan rule that enforces V2 controllers exist for all V1 controllers | Prevents incomplete V2 migration |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization