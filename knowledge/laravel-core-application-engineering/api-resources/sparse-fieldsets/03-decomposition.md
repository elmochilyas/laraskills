# Decomposition: Sparse Fieldsets

## Topic Overview
Client-driven field selection — allowing API consumers to request only specific resource fields via `fields[type]=field1,field2` query parameters.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
sparse-fieldsets/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Sparse Fieldsets
- **Purpose:** Client-driven field selection for reduced response size
- **Difficulty:** Advanced
- **Dependencies:** Resource Fundamentals

## Dependency Graph
This KU depends on: Resource Fundamentals. It serves as prerequisite for Versioned Resources.

## Boundary Analysis
**In scope:** fields[type] query parameter parsing, sparsification in toArray, fields map injection via request, attribute filtering by requested fields, relationship filtering by requested fields, JSON:API fields parameter implementation, custom Laravel-only fieldset implementation, eager loading optimization with fieldsets.
**Out of scope:** JSON:API resources (json-api-resources KU), conditional attributes (conditional-attributes KU), response caching strategies (Cache domain).

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