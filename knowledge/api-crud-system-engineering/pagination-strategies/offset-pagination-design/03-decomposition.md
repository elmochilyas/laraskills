# Decomposition: Offset Pagination Design

## Topic Overview
Design decisions for offset-based pagination in REST APIs: parameter naming (page/per_page vs offset/limit), response structure, defaults, validations, and Laravel's built-in support.

## Decomposition Strategy
This KU focuses on the API design surface of offset pagination. Performance characteristics and database-level concerns are separated into `offset-pagination-performance`.

## Proposed Folder Structure
```
offset-pagination-design/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Offset Pagination Design
- **Purpose:** Define the API contract and response format for offset pagination
- **Difficulty:** Foundation
- **Dependencies:** REST API Design Fundamentals

## Dependency Graph
This KU depends on: REST API Design Fundamentals, SQL Query Execution. It serves as prerequisite for: Pagination Strategy Selection, Pagination Link Headers.

## Boundary Analysis
**In scope:** Parameter naming conventions (page/per_page, offset/limit), response structure and metadata, default page sizes, maximum limit enforcement, empty page handling, Laravel `paginate()` and `simplePaginate()` usage.
**Out of scope:** Database-level count optimization (total-count-performance KU), cursor-based alternatives (cursor-pagination-design KU), Link header formatting (pagination-link-headers KU).

## Future Expansion Opportunities
None identified — design surface is stable across versions.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization