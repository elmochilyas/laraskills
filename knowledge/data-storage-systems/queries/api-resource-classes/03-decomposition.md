# Decomposition: 2.27 API resource classes and data shaping

## Topic Overview
API Resource classes provide a dedicated transformation layer between Eloquent models and JSON responses. They enable per-endpoint data shaping, conditional attribute inclusion, relationship loading, and pagination wrapping. Resources prevent the "one model serialization fits all endpoints" anti-pattern.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-27-api-resource-classes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.27 API resource classes and data shaping
- **Purpose:** API Resource classes provide a dedicated transformation layer between Eloquent models and JSON responses. They enable per-endpoint data shaping, conditional attribute inclusion, relationship loading, and pagination wrapping.
- **Difficulty:** Intermediate
- **Dependencies:** 2.18 Model serialization, 2.3 Eager loading

## Dependency Graph
**Depends on:** "2.18 Model serialization", "2.3 Eager loading"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Resource class**: Extends `JsonResource`. Defines `toArray($request)` returning the data structure for the endpoint.; - **Resource collection**: `ResourceCollection` for paginated/sparse collections.; - **Conditional attributes**: `when($condition, $value)`, `whenLoaded('relation')`, `whenHas('column')`.; - **Pagination wrapping**: `PostResource::collection($posts)` wraps paginated results with meta information..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization