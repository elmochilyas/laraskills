# Decomposition: 4.3 Type column values: system, const, eq_ref, ref, range, index, ALL

## Topic Overview
The `type` column in EXPLAIN is the most important indicator of query efficiency. From best to worst: `system` (0 or 1 row), `const` (unique index lookup), `eq_ref` (unique index for each row in join), `ref` (non-unique index match), `range` (indexed range scan), `index` (full index scan), `ALL` (full table scan).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-3-type-column-values/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.3 Type column values: system, const, eq_ref, ref, range, index, ALL
- **Purpose:** The `type` column in EXPLAIN is the most important indicator of query efficiency. From best to worst: `system` (0 or 1 row), `const` (unique index lookup), `eq_ref` (unique index for each row in join), `ref` (non-unique index match), `range` (indexed range scan), `index` (full index scan), `ALL` (full table scan).
- **Difficulty:** Foundation
- **Dependencies:** 4.1 EXPLAIN output interpretation, 4.2 EXPLAIN ANALYZE

## Dependency Graph
**Depends on:** "4.1 EXPLAIN output interpretation", "4.2 EXPLAIN ANALYZE"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **const**: Primary key or unique index lookup. At most one row. Optimal.; - **eq_ref**: Each row from previous table matches exactly one row via unique index. Good for joins.; - **ref**: Non-unique index lookup. Multiple rows may match. Acceptable.; - **range**: Indexed range scan (>, <, BETWEEN, IN). Acceptable for moderate ranges.; - **index**: Full index scan (reads entire index). Better than ALL but still expensive..
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