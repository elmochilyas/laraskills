# Decomposition: 4.11 orWhere on composite index without grouping

## Topic Overview
`orWhere` on a composite index can cause a full table scan because the OR condition references a different part of the index. MySQL often decides a full scan is cheaper than merging two index scans. Group OR conditions explicitly or use UNION instead.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-11-or-where-composite-index/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.11 orWhere on composite index without grouping
- **Purpose:** `orWhere` on a composite index can cause a full table scan because the OR condition references a different part of the index. MySQL often decides a full scan is cheaper than merging two index scans.
- **Difficulty:** Intermediate
- **Dependencies:** 2.14 Unions, 4.24 Join optimization

## Dependency Graph
**Depends on:** "2.14 Unions", "4.24 Join optimization"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Problem**: `WHERE user_id = ? OR status = 'urgent'` — the composite index on `(user_id, status)` covers the first condition but not the second without `user_id`. MySQL scans the table.; - **Fix 1 — Group ORs**: `where(fn($q) => $q->where('user_id', X)->orWhere('status', 'urgent'))` — tells MySQL the OR scope is limited.; - **Fix 2 — UNION**: Two separate queries, each using its own index. UNION merges results..
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