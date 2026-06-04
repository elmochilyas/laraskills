# Decomposition: Pagination Metadata

## Topic Overview
Providing navigation information (links, meta, counts) in paginated resource responses via built-in pagination injection in ResourceCollection.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
pagination-metadata/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Pagination Metadata
- **Purpose:** Providing navigation information in paginated responses
- **Difficulty:** Intermediate
- **Dependencies:** Resource Collections

## Dependency Graph
This KU depends on: Resource Collections. It serves as prerequisite for Top-level Meta Data.

## Boundary Analysis
**In scope:** Pagination metadata in ResourceCollection construct, metadata by paginator type (LengthAwarePaginator -> links/meta, CursorPaginator -> meta/path, SimplePaginator -> links/meta limited), toResponse injection, custom metadata fields, cursor pagination metadata, JsonSerializable interface handling.
**Out of scope:** Top-level metadata beyond pagination (top-level-meta-data KU), custom paginator classes (Database domain), frontend pagination component patterns (Frontend domain).

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