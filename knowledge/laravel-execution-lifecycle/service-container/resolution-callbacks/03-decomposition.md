# Decomposition: Resolution Callbacks

## Boundary Analysis
This KU covers the three resolution callback hooks — `beforeResolving()`, `resolving()`, and `afterResolving()` — their execution order relative to extenders and caching, their storage structure, and their typical use cases. It does not cover extenders (Binding Extending), rebound callbacks (Rebound Callbacks), or the general resolution pipeline (Binding Resolution). The boundary is drawn at the observer/interceptor pattern provided by resolution lifecycle callbacks.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
```
Resolution Callbacks
├── Binding Resolution (callbacks fired during resolve())
├── Binding Extending (extenders run before resolving callbacks)
└── Rebound Callbacks (different lifecycle — rebind vs first resolution)
    └── depends on: Container Fundamentals, Binding Types
```

## Follow-up Opportunities
None — well-scoped to the three resolution lifecycle hooks.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization