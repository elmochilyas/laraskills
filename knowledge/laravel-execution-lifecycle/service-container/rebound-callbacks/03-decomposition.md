# Decomposition: Rebound Callbacks

## Boundary Analysis
This KU covers the rebound callback system — `rebinding()` for registering interest, `rebound()` for triggering re-resolution and notification, and the resolved-state guard. It covers the lifecycle of rebinding relative to first resolution and re-registration. It does not cover resolution callbacks (which fire on every resolution, not only rebind), binding extending (which wraps instances, not rebinds), or the general resolution pipeline. The boundary is drawn at the "binding changed" notification mechanism.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
```
Rebound Callbacks
├── Binding Types (rebound triggered by re-bind())
├── Binding Resolution (rebound() calls make() for re-resolution)
└── Container Fundamentals (resolved tracking, callback storage)
```

## Follow-up Opportunities
None — tightly scoped to the rebinding lifecycle mechanism.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization