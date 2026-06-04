# Decomposition: Lazy Eager Loading

## Boundary Analysis
This KU covers `load()` and `loadMissing()` on models and collections — the post-retrieval eager loading pattern. It covers the timing distinction from `with()`, the internal delegation to `eagerLoadRelations()`, and the defensive loading pattern. It explicitly excludes the query-time `with()` method (covered in eager-loading-fundamentals), constrained loading (covered in constrained-eager-loading), and the `$with` property (covered in dollar-with-blast-radius). The boundary is specifically the deferred/lazy eager loading context.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
`load()` and `loadMissing()` are two variants of the same mechanism. `loadMissing()` is just `load()` with a guard check. Explaining them separately would require repeating the core mechanics. The timing decision (pre-query vs post-retrieval) is a single conceptual distinction.

## Dependency Graph
- **Depends on:** eager-loading-fundamentals (must understand how eager loading queries work)
- **Depends on:** Eloquent Collections (must understand collection iteration and manipulation)
- **Referenced by:** constrained-eager-loading (constraints apply equally to `load()`)
- **Referenced by:** dollar-with-blast-radius (`$with` is automatic, contrasting with explicit `load()`)

## Follow-up Opportunities
- Defensive eager loading patterns in API resource classes
- Lazy loading detection and prevention strategies
- Performance profiling of `load()` vs `with()` in complex request flows
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization