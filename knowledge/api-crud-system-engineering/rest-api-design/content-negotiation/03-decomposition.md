# Decomposition: Content Negotiation

## Topic Overview
HTTP content negotiation mechanism for format selection and API versioning via Accept/Content-Type headers, including vendor media types and Laravel's expectsJson() detection.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single HTTP mechanism with clear header semantics and implementation patterns. No further decomposition is needed.

## Proposed Folder Structure
```
content-negotiation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Content Negotiation
- **Purpose:** Enable client-server format agreement and version selection
- **Difficulty:** Intermediate
- **Dependencies:** REST Architectural Constraints, URL Structure Design

## Dependency Graph
This KU depends on: REST Architectural Constraints, URL Structure Design. It serves as prerequisite for API Versioning, Hypermedia Formats, CORS Design.

## Boundary Analysis
**In scope:** Accept, Content-Type, Accept-Language, Accept-Encoding headers; server-driven vs agent-driven negotiation; vendor media types; Laravel expectsJson() and format detection; response Content-Type setting; URL extension format selection.
**Out of scope:** Detailed versioning strategy (api-versioning KU), CORS header configuration (cors-design KU), hypermedia format details (hateoas-hypermedia-controls KU).

## Future Expansion Opportunities
None identified — content negotiation is a stable HTTP mechanism.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization