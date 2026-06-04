# Decomposition: Binding Resolution

## Boundary Analysis
This KU covers the resolution pipeline — how `make()`, `makeWith()`, and `build()` transform abstract names into concrete instances. It covers the resolution chain order, the internal resolve() method, parameter passing, and the instances cache. It explicitly excludes the binding registration process (covered by Binding Types), the reflection internals (covered by Auto-Resolution via Reflection), callback hooks (covered by Resolution Callbacks and Rebound Callbacks), and contextual binding logic (covered by Contextual Binding). This boundary keeps focus on the execution path of resolution rather than peripheral features.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
```
Binding Resolution
├── Auto-Resolution via Reflection (build() uses ReflectionClass)
├── Contextual Binding (context checked during resolution)
├── Circular Dependency Detection (build stack tracked during resolution)
├── Resolution Callbacks (fired during resolve())
└── Binding Extending (extenders applied during resolve())
    └── depends on: Container Fundamentals, Binding Types
```

## Follow-up Opportunities
None — well-scoped core resolution topic.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization