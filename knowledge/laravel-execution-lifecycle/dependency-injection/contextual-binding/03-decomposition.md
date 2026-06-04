# Decomposition: Contextual Binding

## Boundary Analysis
**Scope:** The contextual binding mechanism — how `when()->needs()->give()` registers consumer-specific bindings, storage in `$contextual` array, precedence over global bindings, and primitive contextual binding support.

**Excluded:**
- Global binding mechanics (covered in Interface Binding ku-08)
- Primitive aliasing beyond contextual binding (covered in Aliasing Primitives ku-07)
- Container build() resolution flow (covered in DI Container Basics ku-01)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Contextual binding is a single feature with a clear API. The KU covers registration, storage, precedence, and use cases — all tightly coupled.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│              Contextual Binding (ku-05)                   │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   └── DI Container Basics (ku-01) — binding storage     │
│       and resolution flow                                 │
│                                                          │
│ Prerequisite for:                                         │
│   └── Aliasing Primitives (ku-07) — builds on the       │
│       contextual binding mechanism for primitives        │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Contextual binding visualizer:** Tool to map which consumers get which implementations for each abstract.
- **Contextual vs global binding conflict detector:** Static analysis to find contextual bindings that override global bindings without documentation.
- **Factory-to-contextual-binding migration guide:** Patterns for replacing conditional factories with contextual bindings.
- **Contextual binding sprawl threshold:** Architecture guidelines for when contextual binding count signals design issues.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
