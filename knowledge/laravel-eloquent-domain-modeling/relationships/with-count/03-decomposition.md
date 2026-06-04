# Decomposition: withCount / loadCount — Scalar Aggregate Loading

## Boundary Analysis
This KU covers the scalar aggregate loading pattern `withCount()` and `loadCount()`. It focuses on `COUNT(*)` subqueries appended to the SELECT clause via `addSelect()`. It excludes full aggregate methods (withSum, withAvg, etc. — separate KU), raw subquery columns (outside scope), and the existence-check variant (withExists — separate KU). The boundary is: any pattern that appends a `COUNT` subquery to the parent query as an attribute, not a relation.

## Atomicity Assessment
**Status:** ✅ Atomic
The concept of counting-related models via subquery is a single, cohesive technique. Distinguishing between eager (`withCount`) and lazy (`loadCount`) is a surface API difference, not a conceptual split. The subquery mechanics are identical.

## Dependency Graph
- **Depends on:** Basic relationship definitions (belongsTo, hasMany, morphMany)
- **Depends on:** Eager loading (with, load) fundamentals
- **Depends on:** Query builder subquery support
- **Referenced by:** with-sum-avg-min-max (same subquery mechanics, different aggregates)
- **Referenced by:** with-exists (boolean variant)
- **Referenced by:** Performance optimization patterns (caching counts)

## Follow-up Opportunities
- Custom aggregate macros that follow the same subquery pattern
- Hybrid approach: pre-computed count columns for ultra-high-traffic
- Database-specific subquery optimization (PostgreSQL vs MySQL vs SQLite)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization