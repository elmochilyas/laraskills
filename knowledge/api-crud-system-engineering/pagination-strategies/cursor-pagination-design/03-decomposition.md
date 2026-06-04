# Decomposition: Cursor Pagination Design

## Topic Overview
Design and API contract for cursor-based pagination: cursor format, query parameters, response structure, bidirectional navigation, and Laravel's cursorPaginate() support.

## Decomposition Strategy
This KU focuses on the API design and conceptual model of cursor pagination. Cursor encoding specifics are split into `cursor-encoding-strategies`; performance analysis is in `cursor-pagination-performance`.

## Proposed Folder Structure
```
cursor-pagination-design/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Cursor Pagination Design
- **Purpose:** Define the API contract and conceptual model for cursor-based pagination
- **Difficulty:** Intermediate
- **Dependencies:** Offset Pagination Design, SQL Indexing Fundamentals

## Dependency Graph
This KU depends on: Offset Pagination Design, SQL Indexing Fundamentals. It serves as prerequisite for: Cursor Encoding Strategies, Multi-Column Cursor Pagination, Offset-to-Cursor Migration.

## Boundary Analysis
**In scope:** Cursor concept and opaque token design, query parameter naming (cursor/limit vs starting_after), response meta structure (next_cursor, has_more), bidirectional pagination, tiebreaker columns, cursor stability considerations, Laravel cursorPaginate().
**Out of scope:** Cursor encoding details (cursor-encoding-strategies KU), performance comparison (cursor-pagination-performance KU), keyset SQL mechanics (keyset-pagination-design KU).

## Future Expansion Opportunities
None identified — cursor pagination patterns are stable across implementations.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization