# Decomposition — Controller Code Limits

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Line limits, method count limits, method length limits, complexity limits, enforcement tooling (PHPStan, PhpMetrics, CI) |
| **Boundaries** | Ends where specific extraction patterns begin (action delegation, form requests); distinct from architecture-level rules (Deptrac); separate from general PHP code quality metrics |
| **Interfaces** | PHPStan configuration, PhpMetrics config, custom CI scripts, `CONTRIBUTING.md` policy |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Code limits are a single approach to enforcing controller discipline |
| Minimal overlap | ⚠️ Partial | Overlaps with thin-controller-enforcement in goals but differs in mechanism (metric-based vs dependency-based) |
| Testable independently | ✅ Atomic | Can test that a controller exceeding limits triggers a CI failure |
| Splittable? | ❌ No | Line limits and method limits are two dimensions of the same concept |

## Dependency Graph

```
Resource Controller Pattern ──► Controller Code Limits ──► Thin Controller Enforcement
                                       │
                                       ├──► Controller Action Delegation
                                       └──► Controller Form Request Integration
```

## Follow-up

| Action | Reason |
|--------|--------|
| Recommend specific PhpMetrics configuration values for Laravel controllers | Concrete guidance for teams adopting limits |
| Create a GitHub Actions workflow for controller size checking | Reduces setup friction |
| Document the @no-limit exception process (approval, documentation) | Prevents abuse of exceptions |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization