# Decomposition: 3.26 Index alignment with WHERE + JOIN + ORDER BY patterns

## Topic Overview
An index is optimal when it aligns with the full query access pattern: WHERE conditions, JOIN conditions, and ORDER BY direction. A composite index that matches all three eliminates both full table scans and explicit sort operations.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-26-index-alignment-with-query-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.26 Index alignment with WHERE + JOIN + ORDER BY patterns
- **Purpose:** An index is optimal when it aligns with the full query access pattern: WHERE conditions, JOIN conditions, and ORDER BY direction. A composite index that matches all three eliminates both full table scans and explicit sort operations.
- **Difficulty:** Intermediate
- **Dependencies:** 3.8 Composite indexes, 3.15 Descending indexes, 4.24 Join optimization

## Dependency Graph
**Depends on:** "3.8 Composite indexes", "3.15 Descending indexes", "4.24 Join optimization"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Index matching**: The index should cover WHERE columns (for filtering), JOIN columns (for lookups), and ORDER BY columns (for sorted output).; - **Filter + Sort alignment**: Best index: equality columns → range column → sort column. The index narrows the search and provides sorted results.; - **Join index**: The FK column in the JOIN condition must be indexed on the joined table..
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