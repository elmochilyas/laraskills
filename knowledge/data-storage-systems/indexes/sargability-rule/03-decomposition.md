# Decomposition: 3.28 Sargability rule: functions on indexed columns break index usage

## Topic Overview
Sargability (Search ARGument ABILITY) means the query condition can use an index. A condition is sargable when the indexed column appears alone (not wrapped in a function) on one side of the comparison. `WHERE DATE(created_at) = '2026-01-01'` is NOT sargable.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-28-sargability-rule/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.28 Sargability rule: functions on indexed columns break index usage
- **Purpose:** Sargability (Search ARGument ABILITY) means the query condition can use an index. A condition is sargable when the indexed column appears alone (not wrapped in a function) on one side of the comparison.
- **Difficulty:** Foundation
- **Dependencies:** 4.7 Sargable vs non-sargable query patterns, 4.8 whereDate sargability breakage, 4.10 Function wraps in WHERE

## Dependency Graph
**Depends on:** "4.7 Sargable vs non-sargable query patterns", "4.8 whereDate sargability breakage", "4.10 Function wraps in WHERE"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Non-sargable patterns**: `WHERE LOWER(email) = ?`, `WHERE YEAR(date) = 2026`, `WHERE CAST(id AS CHAR) = ?`, `WHERE DATE(col) = ?`.; - **Why it breaks indexes**: The index stores raw column values. To use the index with a function, the database would need to compute the function for every index entry and compare.; - **Fix**: Rewrite the condition without wrapping the column. Use range queries instead of function extraction..
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