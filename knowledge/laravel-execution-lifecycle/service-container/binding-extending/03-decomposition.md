# Decomposition: Binding Extending

## Boundary Analysis
This KU covers the `extend()` mechanism — how decorator closures are registered, stored, and applied during resolution. It covers the extender stack, application ordering relative to caching and callbacks, and the interaction with rebound mechanics. It does not cover the general resolution pipeline (Binding Resolution), the resolution callback system (Resolution Callbacks), or contextual binding. The boundary is drawn specifically at the decorator/interception pattern provided by `extend()`.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
```
Binding Extending
├── Binding Types (extend() requires existing binding)
├── Binding Resolution (extenders applied during resolve())
└── Rebound Callbacks (extend() triggers rebound on cached singletons)
    └── depends on: Container Fundamentals
```

## Follow-up Opportunities
None — tightly scoped to the extender pattern.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization