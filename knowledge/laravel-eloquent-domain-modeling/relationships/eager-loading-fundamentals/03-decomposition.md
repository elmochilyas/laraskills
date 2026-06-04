# Decomposition: Eager Loading Fundamentals

## Boundary Analysis
This KU covers the core eager loading triad: `with()` (query-time), `load()` (post-retrieval), and `loadMissing()` (conditional). It explains the N+1 problem, the query construction for each relationship type, and the result mapping pipeline. It explicitly excludes constrained loading (covered in constrained-eager-loading), lazy loading on collections (covered in lazy-eager-loading), and the `$with` property (covered in dollar-with-blast-radius). The boundary is the fundamental "when and how to eager load" knowledge.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The three eager loading methods (`with`, `load`, `loadMissing`) are variations on the same mechanism. Understanding their differences requires knowing how eager loading works at the query level, which is a single concept. Splitting by method would force repetition of the core mechanics.

## Dependency Graph
- **Depends on:** Eloquent Relationship Definitions (must understand what relationships exist to eager-load them)
- **Depends on:** Query Builder Basics (must understand `get()`, `first()`, collection semantics)
- **Referenced by:** constrained-eager-loading (builds on the `with()` syntax)
- **Referenced by:** lazy-eager-loading (builds on `load()` mechanics)
- **Referenced by:** dollar-with-blast-radius (`$with` is automatic eager loading)

## Follow-up Opportunities
- Eager loading serialization and API resource patterns
- Eager loading in test factories (relationships in model factories)
- Preventing lazy loading in CI with `Model::preventLazyLoading()`
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization