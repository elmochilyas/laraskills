# Decomposition: Container Fundamentals

## Boundary Analysis
This KU covers the foundational architecture of `Illuminate\Container\Container` — its core data structures, the ArrayAccess implementation, the Container vs Application relationship, and the basic bind/make/resolve contract. It explicitly excludes the specifics of individual binding types (bind vs singleton vs scoped), auto-resolution mechanics via reflection, contextual binding, and callback systems, which are decomposed into their own KUs. The boundary is drawn at the "what" and "why" of the container, leaving the "how" of specific features to downstream KUs.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
```
Container Fundamentals
├── Binding Types (depends on understanding bind/make contract)
├── Binding Resolution (depends on resolution chain)
├── Container Aliases (depends on ArrayAccess + key normalization)
├── Auto-Resolution via Reflection (depends on Resolution chain)
├── Contextual Binding (depends on Binding Types)
├── Tagged Bindings (depends on Binding Types)
├── Binding Extending (depends on Binding Types)
├── Resolution Callbacks (depends on Resolution chain)
├── Rebound Callbacks (depends on Binding Types)
├── Circular Dependency Detection (depends on Resolution chain)
└── Scoped Instance Management (depends on Binding Types + Resolution)
```

## Follow-up Opportunities
None — this KU is the root of the Service Container subdomain tree.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization