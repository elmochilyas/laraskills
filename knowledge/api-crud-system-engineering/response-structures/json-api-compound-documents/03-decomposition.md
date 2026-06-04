# Topic Overview
JSON:API compound documents deliver primary resources along with related resources in the `included` top-level key, enabling complete resource graphs in a single response.

## Decomposition Strategy
This KU extends json-api-resource-structure with the compound document concept. It is independently teachable but requires thorough understanding of the base resource structure. It is a direct application of whenLoaded()/conditional-relationship-inclusion at the JSON:API specification level.

## Proposed Folder Structure
```
json-api-compound-documents/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** json-api-compound-documents  
**Purpose:** Compound documents with included resources, resource linkage, deduplication  
**Difficulty:** Advanced  
**Dependencies:** json-api-resource-structure, conditional-relationship-inclusion

## Dependency Graph
json-api-resource-structure → json-api-compound-documents  
conditional-relationship-inclusion → json-api-compound-documents

## Boundary Analysis
**Belongs:** Included key, resource linkage, deduplication, include parameter parsing, depth limiting, circular reference handling  
**Does NOT belong:** Sparse fieldsets (sparse-fieldset-design), resource structure basics (json-api-resource-structure)

## Future Expansion Opportunities
None — well-bounded within the JSON:API compound document spec.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization