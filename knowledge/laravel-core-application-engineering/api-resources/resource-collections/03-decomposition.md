# Decomposition: Resource Collections

## Topic Overview
`ResourceCollection` transforms a collection of models (paginated or not) into a JSON array response with built-in pagination metadata when using `Paginator` or `CursorPaginator`.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
resource-collections/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Resource Collections
- **Purpose:** Transform model collections into JSON array responses
- **Difficulty:** Foundation
- **Dependencies:** Resource Fundamentals

## Dependency Graph
This KU depends on: Resource Fundamentals. It serves as prerequisite for Pagination Metadata and Top-level Meta Data.

## Boundary Analysis
**In scope:** ResourceCollection class, anonymous collection via ::collection(), pagination detection in construct, paginated vs unpaginated response shape, pagination key in construct, pagination information injection, custom pagination adapters, length-aware vs cursor paginator detection.
**Out of scope:** JSON:API collection format (json-api-resources KU), sparse fieldsets on collections (sparse-fieldsets KU), resource collections for non-Eloquent data (Eloquent domain), custom paginator classes (Database domain).

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