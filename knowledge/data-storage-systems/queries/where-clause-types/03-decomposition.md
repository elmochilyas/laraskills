# Decomposition: 2.11 Where clause types (where, orWhere, whereIn, whereBetween, whereNull, whereDate, whereColumn, whereExists)

## Topic Overview
Laravel's `where` method family generates different SQL expression patterns. Each type affects sargability (index usage) differently. `whereDate` and related date functions break sargability by wrapping columns in functions.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-11-where-clause-types/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.11 Where clause types (where, orWhere, whereIn, whereBetween, whereNull, whereDate, whereColumn, whereExists)
- **Purpose:** Laravel's `where` method family generates different SQL expression patterns. Each type affects sargability (index usage) differently.
- **Difficulty:** Foundation
- **Dependencies:** 2.10 Query builder methods, 4.7 Sargable vs non-sargable query patterns, 4.8 whereDate sargability breakage

## Dependency Graph
**Depends on:** "2.10 Query builder methods", "4.7 Sargable vs non-sargable query patterns", "4.8 whereDate sargability breakage"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **where('col', 'val')**: Plain equality. Uses index. SQL: `WHERE col = ?`.; - **whereIn('col', [1,2,3])**: Multiple equality. Uses index. SQL: `WHERE col IN (?, ?, ?)`.; - **whereBetween('col', [$a, $b])**: Range. Uses index. SQL: `WHERE col BETWEEN ? AND ?`.; - **whereNull('col')**: IS NULL check. Uses B-tree index. SQL: `WHERE col IS NULL`.; - **whereDate('col', $date)**: Function wrap. BREAKS index. SQL: `WHERE DATE(col) = ?`..
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