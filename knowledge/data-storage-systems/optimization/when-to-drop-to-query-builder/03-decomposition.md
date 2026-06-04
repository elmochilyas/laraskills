# Decomposition: 4.23 When to drop to query builder or raw SQL (reporting, complex aggregation)

## Topic Overview
Eloquent hydrates full model objects, which is unnecessary for reporting and aggregation. When the result doesn't need model methods, relationships, or events, use the query builder. Raw SQL is appropriate for database-specific features (window functions, recursive CTEs, JSON operators).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-23-when-to-drop-to-query-builder/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.23 When to drop to query builder or raw SQL (reporting, complex aggregation)
- **Purpose:** Eloquent hydrates full model objects, which is unnecessary for reporting and aggregation. When the result doesn't need model methods, relationships, or events, use the query builder.
- **Difficulty:** Intermediate
- **Dependencies:** 2.10 Query builder methods, 4.15 SQL-side aggregation

## Dependency Graph
**Depends on:** "2.10 Query builder methods", "4.15 SQL-side aggregation"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Query builder**: `DB::table('orders')->select(...)->get()` — returns stdClass objects, no hydration overhead.; - **Raw SQL**: `DB::select('SELECT ...')` — for complex queries the query builder can't express.; - **Decision rule**: Need model methods? Use Eloquent. Need just data? Use query builder. Need database-specific feature? Use raw SQL..
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