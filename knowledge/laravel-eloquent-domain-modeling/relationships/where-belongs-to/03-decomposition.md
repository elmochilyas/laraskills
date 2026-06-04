# Decomposition: whereBelongsTo — Convenience Method for Foreign Key Matching

## Boundary Analysis
This KU covers the `whereBelongsTo()` convenience method. It excludes broader `whereRelation`/`whereHas` patterns (filtering by related attributes), relationship existence checks (withExists), and raw FK conditions. The boundary is specifically the pattern of filtering a parent query by a related model instance through automatic FK resolution.

## Atomicity Assessment
**Status:** ✅ Atomic
`whereBelongsTo()` is a single method with a single purpose: eliminate hard-coded FK column names. The collection (IN clause) variant is a natural extension, not a separate concept. The method's internals, tradeoffs, and use cases fit cohesively in one KU.

## Dependency Graph
- **Depends on:** BelongsTo relationship understanding
- **Depends on:** Eloquent naming conventions
- **Referenced by:** Controller query patterns
- **Referenced by:** Multi-tenant scoping implementations

## Follow-up Opportunities
- Generic `whereRelation` pattern for non-BelongsTo relationships
- Macro for `whereMorphTo` convenience method
- Repository-level query encapsulation to replace scattered `whereBelongsTo` calls
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization