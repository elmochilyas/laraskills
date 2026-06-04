# Decomposition: Accessor Patterns

## Boundary Analysis
Accessor patterns cover the read-side transformation of model attributes using `Attribute::make(get: ...)` and legacy `get{Attribute}Attribute()` methods. It includes the resolution mechanism, closure binding, value transformation, and interaction with casts. It does not cover write-side transformations (mutators), attribute storage, or serialization of accessor results.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

The read-side attribute transformation is a single concern: take a raw value, apply a closure, return a transformed value. The interaction with caching is an orthogonal concern handled by the attribute-caching KU.

## Dependency Graph
```
Accessor Patterns
  ├── depends on: Model __get() resolution chain
  ├── depends on: Cast system (casts run before accessors)
  ├── enabled by: Attribute Caching (optional performance layer)
  ├── related to: Mutator Patterns (symmetrical write-side)
  └── related to: Multi-Attribute Mutators (symmetrical write-side)
```

## Follow-up Opportunities
- **Type-safe accessor return values:** Explore generics-style patterns or static analysis tools to validate accessor return types.
- **Accessor composition:** A pattern for chaining multiple accessors on the same attribute (e.g., format decorator over a currency accessor).
- **Deferred accessor resolution:** Loading accessor closures from a registry or trait to reduce model class bloat.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization