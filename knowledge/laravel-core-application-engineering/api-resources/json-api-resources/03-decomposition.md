# Decomposition: JSON:API Resources

## Topic Overview
Building JSON:API specification-compliant responses using `JsonApiResource` — with type/id, attributes, relationships, links, included, and top-level members.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
json-api-resources/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### JSON:API Resources
- **Purpose:** Building responses conforming to JSON:API spec
- **Difficulty:** Advanced
- **Dependencies:** Resource Fundamentals

## Dependency Graph
This KU depends on: Resource Fundamentals. It serves as prerequisite for Sparse Fieldsets and Versioned Resources.

## Boundary Analysis
**In scope:** JsonApiResource class, type and id resolution, attributes method, relationships method (HasMany/HasOne), links method, included section mechanics, relationship linkage, top-level members (meta, jsonapi, links), resource identifier objects, sparse fieldsets support, include parameter handling, document structure, 404 resource responses.
**Out of scope:** Sparse fieldsets implementation (sparse-fieldsets KU), top-level metadata (top-level-meta-data KU), JSON:API spec compliance beyond Laravel implementation, client-side consumption patterns.

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