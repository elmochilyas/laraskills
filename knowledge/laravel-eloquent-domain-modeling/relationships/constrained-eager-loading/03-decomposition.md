# Decomposition: Constrained Eager Loading

## Boundary Analysis
This KU covers filtering, ordering, limiting, and column-reducing eager-loaded relationships using the closure-based `with()` syntax. It covers the constraint closure API, nested constraints, column selection, per-parent limiting, and common constraint types. It explicitly excludes the basic `with()`, `load()`, and `loadMissing()` mechanics (covered in eager-loading-fundamentals), and the `$with` property (covered in dollar-with-blast-radius). The boundary is specifically the application of query constraints within the eager loading pipeline.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The constrained loading pattern is a single coherent feature: passing closures to `with()` to modify the eager-loading query. Column reduction, per-parent limits, and where constraints all use the same closure mechanism. Splitting them would force repetition of the closure API explanation.

## Dependency Graph
- **Depends on:** eager-loading-fundamentals (must understand what `with()` does)
- **Depends on:** Query Builder (must understand `where`, `orderBy`, `limit`, `select`)
- **Referenced by:** lazy-eager-loading (constrained loading can be done via `load()` too)
- **Referenced by:** dollar-with-blast-radius (`$with` can't be constrained — relevant contrast)

## Follow-up Opportunities
- Per-parent limiting deep dive (window functions, `limitBy()` internals)
- Constrained loading on pivot columns in `belongsToMany`
- Dynamic constraint factories (constraints based on authenticated user or request context)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization