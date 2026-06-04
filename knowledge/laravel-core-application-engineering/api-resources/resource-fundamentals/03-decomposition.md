# Decomposition: API Resource Fundamentals

## Topic Overview
Laravel's response transformation layer — `JsonResource` transforms an Eloquent model (or any data source) into a JSON-serializable array for HTTP responses.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
resource-fundamentals/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Resource Fundamentals
- **Purpose:** Response transformation via JsonResource
- **Difficulty:** Foundation
- **Dependencies:** Controllers, Eloquent

## Dependency Graph
This KU depends on: Controllers, Eloquent. It serves as prerequisite for all other API Resource KUs.

## Boundary Analysis
**In scope:** JsonResource class structure, ResourceContract, toArray() method, whenLoaded/whenCounted conditional methods, DelegateToResource pattern, anonymous resource collections, resource response status codes (->response(), CreatedResponse), Model::resolveRouteBinding) interaction, resource creation flow.
**Out of scope:** Resource collections (resource-collections KU), conditional attributes (conditional-attributes KU), conditional relationships (conditional-relationships KU), pagination metadata (pagination-metadata KU), data wrapping (data-wrapping KU), JSON:API format (json-api-resources KU), versioning (versioned-resources KU).

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization