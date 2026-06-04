# Decomposition: Auto-Resolution via Reflection

## Boundary Analysis
This KU covers the mechanics of how `Container::build()` uses PHP's Reflection API to inspect constructors and resolve dependencies. It covers the `ReflectionClass`, `ReflectionParameter`, type resolution, primitive handling, and the recursion mechanism. It does not cover the resolution chain that leads to auto-resolution (Binding Resolution), the registration of explicit bindings (Binding Types), or the management of circular dependencies (Circular Dependency Detection). The boundary is drawn at the reflection-specific implementation rather than the broader resolution workflow.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
```
Auto-Resolution via Reflection
├── Binding Resolution (calls build() during resolution)
├── Circular Dependency Detection (build stack monitored during reflection)
└── Binding Types (bindings override auto-resolution)
    └── depends on: Container Fundamentals
```

## Follow-up Opportunities
None — tightly scoped to the reflection implementation.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization