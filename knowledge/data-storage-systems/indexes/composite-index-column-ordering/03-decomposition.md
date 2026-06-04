# Decomposition: 3.9 Composite index best practices: equality columns first, range columns after

## Topic Overview
The most important composite index design rule: place columns used in equality conditions (`=`, `IN`) before columns used in range conditions (`>`, `<`, `BETWEEN`, `ORDER BY`). This maximizes the portion of the index that can be efficiently searched.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-9-composite-index-column-ordering/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.9 Composite index best practices: equality columns first, range columns after
- **Purpose:** The most important composite index design rule: place columns used in equality conditions (`=`, `IN`) before columns used in range conditions (`>`, `<`, `BETWEEN`, `ORDER BY`). This maximizes the portion of the index that can be efficiently searched.
- **Difficulty:** Intermediate
- **Dependencies:** 3.1 B-Tree, 3.8 Composite/compound indexes, 3.10 Covering indexes, 4.4 Extra column flags

## Dependency Graph
**Depends on:** "3.1 B-Tree", "3.8 Composite/compound indexes", "3.10 Covering indexes", "4.4 Extra column flags"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Equality columns first**: The database can match exact values using the tree structure. Multiple equality columns can be matched exactly.; - **Range columns after**: The first range column ends the index's ability to support further columns. Subsequent columns beyond the first range column are not used for lookup.; - **ORDER BY alignment**: If the query has ORDER BY, that column should be last in the index (after all equality columns)..
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