# Topic Overview
Pagination information customization covers how to override `paginationInformation()` on ResourceCollection to rename, restructure, or omit pagination metadata fields.

## Decomposition Strategy
This KU is an implementation-specific customization of pagination metadata. It depends on understanding both page-based and cursor-based metadata structures. It is independently teachable but assumes knowledge of the base pagination metadata.

## Proposed Folder Structure
```
pagination-information-customization/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** pagination-information-customization  
**Purpose:** Customizing paginationInformation() in ResourceCollection  
**Difficulty:** Intermediate  
**Dependencies:** pagination-metadata-design, cursor-pagination-metadata

## Dependency Graph
pagination-metadata-design → pagination-information-customization  
cursor-pagination-metadata → pagination-information-customization

## Boundary Analysis
**Belongs:** Override `paginationInformation()`, field renaming, conditional metadata, version-aware metadata  
**Does NOT belong:** Default metadata structure (pagination-metadata-design), cursor specifics (cursor-pagination-metadata)

## Future Expansion Opportunities
None — implementation-specific customization.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization