# Decomposition: 2.7 Relationship counting (withCount, withMin, withMax, withSum, withAvg, withExists)

## Topic Overview
Relationship aggregate methods load computed values (count, sum, avg, min, max, exists) as attributes on the parent model without hydrating the related models. This is the most impactful memory optimization in Eloquent — it replaces loading entire collections (thousands of models) with a single scalar value per parent.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-7-relationship-counting/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.7 Relationship counting (withCount, withMin, withMax, withSum, withAvg, withExists)
- **Purpose:** Relationship aggregate methods load computed values (count, sum, avg, min, max, exists) as attributes on the parent model without hydrating the related models. This is the most impactful memory optimization in Eloquent — it replaces loading entire collections (thousands of models) with a single scalar value per parent.
- **Difficulty:** Intermediate
- **Dependencies:** 2.3 Eager loading, 4.15 SQL-side vs collection-side aggregation, 2.5 Constrained eager loading

## Dependency Graph
**Depends on:** "2.3 Eager loading", "4.15 SQL-side vs collection-side aggregation", "2.5 Constrained eager loading"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **withCount('relation')**: Adds `{relation}_count` attribute. SQL: `SELECT parent.*, (SELECT COUNT(*) FROM related WHERE ...) AS comments_count`.; - **withSum/Max/Min/Avg**: Same pattern, different aggregate functions. Adds `{relation}_sum_{column}` attribute.; - **withExists**: Adds `{relation}_exists` boolean. SQL: `EXISTS (SELECT 1 FROM ...)`.; - **Closure constraints**: All methods accept closures for filtered aggregates: `withCount(['comments' => fn($q) => $q->where('approved', true)])`..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization