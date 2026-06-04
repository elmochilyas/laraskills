# Topic Overview
Pagination metadata design covers the standard fields (`current_page`, `last_page`, `per_page`, `total`, `from`, `to`) and their structure in paginated API responses. It focuses on page-based pagination metadata.

## Decomposition Strategy
This topic is focused on page-based pagination metadata. It is a sister KU to cursor-pagination-metadata (which covers cursor-specific fields) and pagination-information-customization (which covers how to modify the metadata shape). All three are interdependent but independently teachable.

## Proposed Folder Structure
```
pagination-metadata-design/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** pagination-metadata-design  
**Purpose:** Pagination metadata fields structure, `LengthAwarePaginator` metadata shape  
**Difficulty:** Intermediate  
**Dependencies:** envelope-response-design

## Dependency Graph
envelope-response-design → pagination-metadata-design

## Boundary Analysis
**Belongs:** Page-based metadata fields, total/last_page semantics, from/to display fields, count query cost  
**Does NOT belong:** Cursor-specific fields (cursor-pagination-metadata), metadata customization (pagination-information-customization), links generation (top-level-meta-and-links)

## Future Expansion Opportunities
None — closely bounded with cursor variant.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization