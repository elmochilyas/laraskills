# Decomposition: Eloquent withSum/withAvg/withCount and Subquery Patterns

## Topic Overview
Eloquent's aggregate methods (`withSum`, `withAvg`, `withCount`, `withMin`, `withMax`) and subquery patterns (`addSelect` with closures, `joinSub`, `whereExists`) bridge the gap between ORM convenience and analytical query power. These methods allow attaching aggregated values from related tables as computed columns on the parent result — essentially creating denormalized read models on-the-fly without schema changes. The key engineering insight: these are not ORM conveniences — they are SQL optimizations that replace N+1 lazy-loaded relationship counts with a single SQL query using correlated subqueries or lateral joins.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k007-eloquent-aggregates/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Eloquent withSum/withAvg/withCount and Subquery Patterns
- **Purpose:** Eloquent's aggregate methods (`withSum`, `withAvg`, `withCount`, `withMin`, `withMax`) and subquery patterns (`addSelect` with closures, `joinSub`, `whereExists`) bridge the gap between ORM convenience and analytical query power.
- **Difficulty:** Intermediate
- **Dependencies:** K020 (JSON Aggregation Optimization): Advanced alternative to withCount for collecting, not counting, relations, K006 (Star Schema): Aggregate queries over star-schema facts/dimensions, K011 (Dashboard Widget Provider): Using aggregates in widget data providers

## Dependency Graph
**Depends on:**
- K020 (JSON Aggregation Optimization): Advanced alternative to withCount for collecting, not counting, relations
- K006 (Star Schema): Aggregate queries over star-schema facts/dimensions
- K011 (Dashboard Widget Provider): Using aggregates in widget data providers

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- `withCount()`:
- `withSum()`:
- `withAvg()`:
- `addSelect()` with subquery:
- `joinSub()`:
- Generated columns:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K020 (JSON Aggregation Optimization): Advanced alternative to withCount for collecting, not counting, relations, K006 (Star Schema): Aggregate queries over star-schema facts/dimensions, K011 (Dashboard Widget Provider): Using aggregates in widget data providers

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization