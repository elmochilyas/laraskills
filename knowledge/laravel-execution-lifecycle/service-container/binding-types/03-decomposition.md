# Decomposition: Binding Types

## Boundary Analysis
This KU covers the four primary binding registration methods (`bind`, `singleton`, `scoped`, `instance`) and the extend decorator pattern. It covers when each is appropriate, how they differ in lifecycle management, and the internal storage format. It does not cover the resolution pipeline itself (that is Binding Resolution), contextual binding logic, tagged binding groups, or any callback-based hooks. This boundary ensures the KU focuses on the "what" of binding registration rather than the "how" of resolution or decoration.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
```
Binding Types
├── Binding Resolution (resolves bindings)
├── Scoped Instance Management (manages scoped lifecycle)
├── Binding Extending (wraps existing bindings)
├── Contextual Binding (adds context to bindings)
├── Tagged Bindings (groups bindings by tag)
└── Rebound Callbacks (triggered on binding update)
    └── depends on: Container Fundamentals
```

## Follow-up Opportunities
None — this is a core conceptual unit that is well-scoped.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization