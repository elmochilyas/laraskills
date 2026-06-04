# Topic Overview
Cursor pagination metadata covers cursor-specific fields (`next_cursor`, `prev_cursor`, `has_more`, `path`) and the structural differences from page-based pagination.

## Decomposition Strategy
This topic is the cursor-based counterpart to pagination-metadata-design. It is atomic and independently teachable but benefits from understanding the general pagination metadata concepts first.

## Proposed Folder Structure
```
cursor-pagination-metadata/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** cursor-pagination-metadata  
**Purpose:** Cursor-specific pagination metadata, CursorPaginator output shape  
**Difficulty:** Intermediate  
**Dependencies:** pagination-metadata-design

## Dependency Graph
pagination-metadata-design → cursor-pagination-metadata

## Boundary Analysis
**Belongs:** Cursor fields, cursor encoding, has_more semantics, cursor stability, CursorPaginator behavior  
**Does NOT belong:** Page-based fields (total, last_page), customization of metadata (pagination-information-customization)

## Future Expansion Opportunities
None — atomic topic.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization