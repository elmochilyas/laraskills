# Decomposition: Scoped Instance Management

## Boundary Analysis
This KU covers the scoped instance subsystem — the `scoped()` binding method, the `$scopedInstances` array, the `flushScoped()` lifecycle, and the Octane integration for per-request state isolation. It covers the dual-cache resolution (process instances → scoped instances), the definition-level scoped flag, and selective flush patterns. It does not cover the general binding system (Binding Types) or other binding types (bind, singleton, instance), though it references them for comparison. The boundary is drawn at the scope-lifetime management aspect of the container.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
```
Scoped Instance Management
├── Binding Types (scoped() is a binding registration method)
├── Binding Resolution (scoped cache checked during resolve())
└── Container Fundamentals (instances cache architecture)
```

## Follow-up Opportunities
None — well-scoped to the scope lifecycle management.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization