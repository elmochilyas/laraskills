# Decomposition: Mutator Patterns

## Boundary Analysis
Mutator patterns cover the write-side transformation of model attributes via `Attribute::make(set: ...)` and legacy `set{Attribute}Attribute()` methods. It includes closure binding, input normalization, return-value handling, and interaction with casts on set. It does not cover validation (Form Requests), read-side transformations (accessors), or attribute persistence (Model::save).

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

The set-side attribute transformation is a single responsibility: intercept assignment, transform input, store result. It pairs with accessors symmetrically but is independently atomic.

## Dependency Graph
```
Mutator Patterns
  ├── depends on: Model __set() resolution chain
  ├── depends on: Cast system (casts run after mutators on set)
  ├── related to: Accessor Patterns (symmetrical read-side)
  ├── related to: Multi-Attribute Mutators (extended set behavior)
  └── overlaps: Hashed Cast (specialized mutator for passwords)
```

## Follow-up Opportunities
- **Mutator composition/chaining:** Stacking multiple set closures on the same attribute (e.g., trim then lowercase then hash).
- **Context-aware mutators:** Leveraging the `$attributes` second parameter for cross-attribute validation on set.
- **Strict typed mutators with validation:** Combining a mutator with a type assertion that throws descriptive exceptions on invalid input.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization