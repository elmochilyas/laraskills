# Decomposition: Multi-Column Cursor Pagination

## Topic Overview
Extending cursor pagination to support multiple sort columns, including composite ORDER BY clauses, nested OR WHERE construction, tiebreaker columns, and composite index design.

## Decomposition Strategy
This KU is a specialized extension of `cursor-pagination-design` for non-trivial sort scenarios. It assumes basic cursor knowledge and focuses on the multi-column mechanics.

## Proposed Folder Structure
```
multi-column-cursor-pagination/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Multi-Column Cursor Pagination
- **Purpose:** Handle pagination with composite sort orders (multi-column ORDER BY)
- **Difficulty:** Advanced
- **Dependencies:** Cursor Pagination Design, Cursor Encoding Strategies, SQL Indexing Fundamentals

## Dependency Graph
This KU depends on: Cursor Pagination Design, Cursor Encoding Strategies, SQL Indexing Fundamentals. It serves as prerequisite for: Pagination with Complex Filters.

## Boundary Analysis
**In scope:** Multi-column ORDER BY design, nested OR WHERE clause construction, tiebreaker column requirement, composite index matching, row constructor syntax, NULL handling in multi-column sorts, generic cursor builder patterns.
**Out of scope:** Single-column cursor basics (cursor-pagination-design KU), cursor encoding formats (cursor-encoding-strategies KU), filter-based pagination (pagination-with-complex-filters KU).

## Future Expansion Opportunities
None — multi-column cursor patterns are well-established.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization