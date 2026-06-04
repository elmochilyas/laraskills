# Decomposition: HTTP Status Code Selection

## Topic Overview
Guidelines for selecting appropriate HTTP status codes (2xx, 3xx, 4xx, 5xx) for REST API responses, covering the most common codes and their semantics, Laravel response helpers, and error response consistency.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a well-defined set of status codes with clear usage rules. No further decomposition is needed.

## Proposed Folder Structure
```
http-status-code-selection/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### HTTP Status Code Selection
- **Purpose:** Guide correct status code selection for API responses
- **Difficulty:** Foundation
- **Dependencies:** HTTP Method Semantics

## Dependency Graph
This KU depends on: HTTP Method Semantics. It serves as prerequisite for Error Handling Design, API Lifecycle Governance.

## Boundary Analysis
**In scope:** Status code class hierarchy (2xx/3xx/4xx/5xx), common REST codes (200-500+, including 422, 429), Laravel response helpers and abort functions, error response structure, status code selection by method and outcome.
**Out of scope:** HATEOAS link headers (hateoas-hypermedia-controls KU), rate limiting configuration (Laravel throttle middleware), validation error detail format (input-validation-architecture KU).

## Future Expansion Opportunities
None identified — status code selection is well-bounded.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization