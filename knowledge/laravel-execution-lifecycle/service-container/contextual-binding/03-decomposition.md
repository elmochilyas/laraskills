# Decomposition: Contextual Binding

## Boundary Analysis
This KU covers the contextual binding system — the `when()->needs()->give()` fluent API, the `$contextual` internal storage, attribute-based contextual binding with `#[Context]`, and primitive injection via named parameters. It explicitly excludes the general binding system (covered by Binding Types), the resolution pipeline (Binding Resolution), and tagged binding groups (Tagged Bindings), though it references them for comparison. The boundary is drawn at the context-specific override layer of resolution.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
```
Contextual Binding
├── Binding Types (contextual overrides bindings)
├── Binding Resolution (context checked during resolve())
└── Auto-Resolution via Reflection (attributes parsed during build())
    └── depends on: Container Fundamentals
```

## Follow-up Opportunities
None — well-scoped to the contextual override mechanism.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization