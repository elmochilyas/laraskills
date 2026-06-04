# Decomposition — Controller Organization by Domain

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Domain-based directory structure, PSR-4 namespace mapping, domain-specific route files, team ownership boundaries |
| **Boundaries** | Ends where version-based organization is used instead; distinct from flat- or module-based structures; separate from microservice extraction |
| **Interfaces** | Directory structure convention; `Route::namespace('DomainName')` in route registration |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Domain organization is one architectural approach to controller placement |
| Minimal overlap | ✅ Atomic | Orthogonal to version organization; both solve different organizational problems |
| Testable independently | ✅ Atomic | Can test that controllers exist in the expected domain directories |
| Splittable? | ❌ No | Would be meaningless when separated from the controller existence |

## Dependency Graph

```
Resource Controller Pattern ──► Controller Organization by Domain ──► Controller Code Limits
                                        │
                                        └──► Thin Controller Enforcement
```

## Follow-up

| Action | Reason |
|--------|--------|
| Establish a cross-domain dependency CI check as a recommended practice | Prevents domain coupling from the start |
| Document the migration path from flat to domain-organized controllers | Practical guide for existing projects |
| Create a template for domain route files to standardize the pattern | Reduces setup friction for new domains |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization