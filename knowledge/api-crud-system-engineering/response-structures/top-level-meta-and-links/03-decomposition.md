# Topic Overview
Top-level meta and links covers adding additional metadata objects and hypermedia links to the response envelope using `with()`, `additional()`, and resource-level link generation.

## Decomposition Strategy
This KU extends envelope-response-design by covering the `meta` and `links` keys specifically. It is independently teachable but requires understanding of the envelope structure. It bridges to conditional inclusion KUs.

## Proposed Folder Structure
```
top-level-meta-and-links/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** top-level-meta-and-links  
**Purpose:** Additional top-level metadata and link objects in resource responses  
**Difficulty:** Intermediate  
**Dependencies:** envelope-response-design

## Dependency Graph
envelope-response-design → top-level-meta-and-links

## Boundary Analysis
**Belongs:** `with()` method, `additional()` method, self links, related links, meta key assembly, merge order  
**Does NOT belong:** Conditional inclusion (conditional-field-inclusion), pagination metadata specifics (pagination-metadata-design)

## Future Expansion Opportunities
None — well-bounded topic.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization