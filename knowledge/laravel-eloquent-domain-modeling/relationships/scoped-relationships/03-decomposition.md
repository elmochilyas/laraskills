# Decomposition: Scoped Relationships — Conditional Relation Constraints

## Boundary Analysis
This KU covers scoped relationships — defining constraints directly on the relationship method return value, including `ofMany()` for singular subquery-based relations. It excludes query-time constraint callbacks (`with(['relation' => fn($q) => ...])`) — that is runtime scoping, not definition-time. It also excludes global scopes on models (a different scope mechanism). The boundary is static, definition-time constraints applied to a relationship.

## Atomicity Assessment
**Status:** ✅ Atomic
Scoped relationships are a single concept: apply query builder constraints at definition time. The `ofMany()` variant is a specialized sub-pattern that shares the same "constrained relation" concept but uses a different SQL strategy. Splitting `ofMany()` into a separate KU would lose the unifying principle.

## Dependency Graph
- **Depends on:** HasOne / HasMany / MorphOne / MorphMany base definitions
- **Depends on:** Query builder chaining and constraint mechanics
- **Depends on:** Subquery understanding (for ofMany)
- **Referenced by:** Domain-driven relationship modeling
- **Referenced by:** has-one-of-many (specialized coverage of ofMany)

## Follow-up Opportunities
- Database-specific `ofMany` optimization (lateral joins, window functions)
- Multi-tenant scoped relationship patterns
- Macro-based DSL for declaring scoped relationships
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization