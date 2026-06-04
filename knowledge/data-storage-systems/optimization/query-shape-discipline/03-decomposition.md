# Decomposition: 4.21 Query shape discipline: list views vs. detail views

## Topic Overview
List views (index, search results) and detail views (show page) have fundamentally different data requirements. List views need minimal columns and few relationships. Detail views need full data and deeper relationships.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-21-query-shape-discipline/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.21 Query shape discipline: list views vs. detail views
- **Purpose:** List views (index, search results) and detail views (show page) have fundamentally different data requirements. List views need minimal columns and few relationships.
- **Difficulty:** Intermediate
- **Dependencies:** 2.27 API resource classes, 4.14 Eager loading depth governance

## Dependency Graph
**Depends on:** "2.27 API resource classes", "4.14 Eager loading depth governance"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **List view**: 10-20 items, 1-3 columns per item, 1 eager loaded relationship, no large text fields.; - **Detail view**: 1 item, all columns, multiple relationships, computed attributes.; - **Anti-pattern**: Reusing a `Post::with('comments', 'author', 'tags', 'likes', 'metadata')` for both list and detail endpoints..
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