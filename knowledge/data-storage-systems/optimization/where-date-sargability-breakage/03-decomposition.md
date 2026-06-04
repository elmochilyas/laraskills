# Decomposition: 4.8 whereDate/whereMonth/whereYear/whereDay/whereTime sargability breakage

## Topic Overview
Laravel's `whereDate`, `whereMonth`, `whereYear`, `whereDay`, and `whereTime` methods wrap columns in functions, breaking index usage. `Post::whereDate('created_at', today())` generates `WHERE DATE(created_at) = ?`. Fix by using half-open range comparisons: `whereBetween('created_at', [$start, $end])`.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-8-where-date-sargability-breakage/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.8 whereDate/whereMonth/whereYear/whereDay/whereTime sargability breakage
- **Purpose:** Laravel's `whereDate`, `whereMonth`, `whereYear`, `whereDay`, and `whereTime` methods wrap columns in functions, breaking index usage. `Post::whereDate('created_at', today())` generates `WHERE DATE(created_at) = ?`.
- **Difficulty:** Intermediate
- **Dependencies:** 3.28 Sargability rule, 4.7 Sargable vs non-sargable

## Dependency Graph
**Depends on:** "3.28 Sargability rule", "4.7 Sargable vs non-sargable"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Generated SQL**: `whereDate('col', $d)` → `DATE(col) = ?`. `whereMonth('col', 1)` → `MONTH(col) = 1`.; - **Index bypass**: The function wrap prevents B-Tree index usage on `col`.; - **Fix**: `where('created_at', '>=', $date->startOfDay())->where('created_at', '<', $date->startOfNextDay())`..
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