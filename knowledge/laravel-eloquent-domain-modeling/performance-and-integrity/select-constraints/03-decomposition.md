# Decomposition: Select Constraints — Column Reduction & Constrained Eager Loading

## Boundary Analysis
This KU covers column-level selection in Eloquent queries: `select()`, `addSelect()`, constrained eager loading selects, and the model serialization properties (`$hidden`, `$visible`, `$appends`). It excludes general eager loading strategy (`prevention-strategies`), index optimization for selected columns (`index-aware-queries`), and database-level column permissions (outside Eloquent scope).

## Atomicity Assessment
**Status:** ✅ Atomic
Select constraints are a single technique for reducing query payloads. The various mechanisms (explicit select, constrained eager loading, serialization controls) all serve the same goal of limiting what data is fetched or exposed.

## Dependency Graph
- **Depends on:** Eloquent query builder fundamentals
- **Depends on:** Model serialization understanding
- **Referenced by:** `prevention-strategies` (constrained eager loading for N+1 prevention)
- **Referenced by:** `index-aware-queries` (covering indexes with selected columns)
- **Referenced by:** API resource optimization patterns

## Follow-up Opportunities
- Automatic column selection based on API resource definitions
- Static analysis for detecting `SELECT *` in hot paths
- Generated column integration for pre-computed select values
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization