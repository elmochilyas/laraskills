# Decomposition: Multi-Attribute Mutators

## Boundary Analysis
Multi-attribute mutators cover set closures that return an associative array to modify multiple model attributes in a single assignment. It includes the array return contract, interaction with `$fillable`/`$guarded`, cast processing on returned values, and denormalization patterns. It does not cover single-attribute mutators, accessors, or event-driven alternatives to denormalization.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

The concept is a direct extension of the mutator closure contract — returning an array instead of a scalar. The implementation is a simple branch in `Model::setAttribute()` and cannot be subdivided into independent sub-units.

## Dependency Graph
```
Multi-Attribute Mutators
  ├── extends: Mutator Patterns (array return branch)
  ├── depends on: Cast system (casts process returned values)
  ├── depends on: Mass Assignment (fillable/guarded keys)
  ├── related to: Accessor Patterns (no multi-attribute read equivalent)
  └── overlaps: Attribute Caching (caching denormalized column reads)
```

## Follow-up Opportunities
- **Read-side synthetic attributes:** A multi-attribute accessor pattern that composes a single read value from multiple stored columns.
- **Declarative denormalization:** A DSL or configuration array to define multi-attribute mutations without writing closure logic.
- **Multi-attribute cast:** A custom cast that transforms the model's entire attribute set on read/write (similar to Eloquent's array/object casts but for custom value objects).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization