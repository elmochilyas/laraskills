# Decomposition: Scoped Bindings for Octane

## Boundary Analysis
This KU covers the `scoped()` binding mechanism as the canonical replacement for singletons in Octane. It is a **solution-pattern** KU that teaches the primary fix for singleton state leaks.

**In-scope:**
- `scoped()` API and lifecycle semantics
- Comparison with `singleton()` and `bind()`
- Sandbox flush mechanism details
- `OctaneSandbox` contract and provider re-registration
- Migration patterns from singleton to scoped

**Out-of-scope:**
- General container architecture (covered in container subdomain)
- PHP-FPM binding behavior (not relevant to long-running processes)
- Queue worker binding scoping (covered in `queue-worker-lifecycle`)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Tightly focused on a single API and its implications. No natural split point.

## Dependency Graph
```
scoped-bindings-for-octane
├── Requires: octane-architecture-overview (sandbox)
├── Requires: singleton-state-leaks (motivation)
├── → service-binding-audit (tooling, downstream)
├── → octane-package-compatibility (evaluation, downstream)
└── Related: static-property-accumulation (different leak vector)
```

## Follow-up Opportunities
- Create a "Scoped vs Singleton Decision Matrix" KU with a comprehensive table for every common Laravel service type (cache, queue, auth, session, mail, etc.).
- Create a "Container Lifecycle Hooks" KU covering `resolving()`, `afterResolving()`, and `rebound()` in the context of long-running processes.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization