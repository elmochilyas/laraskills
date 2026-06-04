# Decomposition: 4.15 SQL-side aggregation (withCount, raw aggregates) vs. collection-side

## Topic Overview
SQL-side aggregation (using `withCount`, `withSum`, `DB::raw(SUM(...))`) is always more efficient than loading full collections into PHP and aggregating in memory. The rule: if you only need a count, sum, avg, min, max, or boolean — use SQL.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-15-sql-side-vs-collection-side-aggregation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.15 SQL-side aggregation (withCount, raw aggregates) vs. collection-side
- **Purpose:** SQL-side aggregation (using `withCount`, `withSum`, `DB::raw(SUM(...))`) is always more efficient than loading full collections into PHP and aggregating in memory. The rule: if you only need a count, sum, avg, min, max, or boolean — use SQL.
- **Difficulty:** Intermediate
- **Dependencies:** 2.7 Relationship counting, 2.8 Subquery selects

## Dependency Graph
**Depends on:** "2.7 Relationship counting", "2.8 Subquery selects"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **SQL aggregation**: `Post::withCount('comments')` — one query, one integer per parent row.; - **Collection aggregation**: `Post::with('comments')->get()->each(fn($p) => $p->comments->count())` — loads ALL comments into memory, then counts in PHP.; - **Memory waste**: Loading 10,000 comments to count 5 per post is memory-inefficient..
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