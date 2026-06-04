# Decomposition: Custom Pivot Models

## Boundary Analysis
This KU covers the definition, registration, and usage of custom pivot model classes that extend `Illuminate\Database\Eloquent\Relations\Pivot`. It covers accessors, mutators, casts, and methods on pivot models. It explicitly excludes the base table naming conventions (covered in pivot-table-conventions), the `withPivot` API (covered in pivot-attributes), and pivot lifecycle events (covered in pivot-events). The boundary is the pivot model class itself — its definition, instantiation, and behavioral features.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Custom pivot models are a single coherent concept: extending the default `Pivot` class to add behavior. The `->using()` registration, accessor definition, and casting configuration all belong together because they're all properties of the same class definition.

## Dependency Graph
- **Depends on:** pivot-table-conventions (must understand what a pivot table is and its structure)
- **Depends on:** Eloquent Model Fundamentals (must understand accessors, `$casts`, `$appends`)
- **Referenced by:** morph-pivot (builds on custom pivot for polymorphic contexts)
- **Referenced by:** pivot-events (pivot model lifecycle extends to custom pivots)

## Follow-up Opportunities
- Pivot model observer registration mechanics (observers on pivot classes)
- Composite key usage patterns in custom pivot models (overriding `getKey()`)
- Custom pivot collections (`newCollection()` overrides for aggregate queries)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization