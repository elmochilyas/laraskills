# Topic Overview
JSON:API resource structure defines the strict resource object format with `type`, `id`, `attributes`, `relationships`, `links`, and `meta`. This KU covers the specification's resource representation rules.

## Decomposition Strategy
This is a specification-driven KU that is the parent of json-api-compound-documents. It is independently teachable as a specification overview but benefits from understanding general envelope-response-design. It serves as the foundation for JSON:API-specific implementation.

## Proposed Folder Structure
```
json-api-resource-structure/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** json-api-resource-structure  
**Purpose:** JSON:API format specification (type, id, attributes, relationships, links, included)  
**Difficulty:** Advanced  
**Dependencies:** envelope-response-design, data-wrapping-configuration

## Dependency Graph
envelope-response-design → json-api-resource-structure  
data-wrapping-configuration → json-api-resource-structure

## Boundary Analysis
**Belongs:** Resource object format, type/id requirements, attributes vs relationships separation, resource linkage, self links, member name rules  
**Does NOT belong:** Compound documents (json-api-compound-documents), sparse fieldsets (sparse-fieldset-design), error format (rfc-9457-problem-details)

## Future Expansion Opportunities
May need to track JSON:API specification version changes as separate sub-topics.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization