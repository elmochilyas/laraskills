# Decomposition: Total Count Performance

## Topic Overview
Performance optimization of COUNT(*) queries for pagination: exact vs approximate counts, cached counts, materialized counts, and the elimination of counts via simplePaginate/cursorPaginate.

## Decomposition Strategy
This KU focuses exclusively on the count query aspect of pagination. It touches both offset pagination (where counts are needed) and cursor pagination (where counts are eliminated).

## Proposed Folder Structure
```
total-count-performance/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Total Count Performance
- **Purpose:** Optimize or eliminate the total count query for paginated endpoints
- **Difficulty:** Intermediate
- **Dependencies:** Offset Pagination Design, SQL Query Execution

## Dependency Graph
This KU depends on: Offset Pagination Design, SQL Query Execution. It is related to: Pagination Strategy Selection, Pagination with Complex Filters.

## Boundary Analysis
**In scope:** COUNT(*) execution mechanics (InnoDB, PostgreSQL, MyISAM), exact vs approximate count strategies, cached total count, materialized count tables, covering indexes for count queries, simplePaginate and cursorPaginate as count-free alternatives.
**Out of scope:** Cursor/keyset pagination implementation (dedicated KUs), general pagination design (offset-pagination-design KU), filter design (pagination-with-complex-filters KU).

## Future Expansion Opportunities
None — count optimization techniques are well-established.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization