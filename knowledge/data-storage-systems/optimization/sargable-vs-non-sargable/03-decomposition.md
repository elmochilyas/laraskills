# Decomposition: 4.7 Sargable vs. non-sargable query patterns

## Topic Overview
Sargable conditions allow index usage. Non-sargable conditions force full table scans. The rule: the indexed column must appear alone (no function wrapping) on one side of the comparison operator.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-7-sargable-vs-non-sargable/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.7 Sargable vs. non-sargable query patterns
- **Purpose:** Sargable conditions allow index usage. Non-sargable conditions force full table scans.
- **Difficulty:** Intermediate
- **Dependencies:** 3.28 Sargability rule, 4.8 whereDate sargability, 4.9 LIKE leading wildcard, 4.10 Function wraps

## Dependency Graph
**Depends on:** "3.28 Sargability rule", "4.8 whereDate sargability", "4.9 LIKE leading wildcard", "4.10 Function wraps"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Sargable**: `WHERE col = ?`, `WHERE col > ?`, `WHERE col IN (?)`, `WHERE col LIKE 'prefix%'`.; - **Non-sargable**: `WHERE LOWER(col) = ?`, `WHERE DATE(col) = ?`, `WHERE CAST(col AS CHAR) = ?`, `WHERE col LIKE '%suffix'`..
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