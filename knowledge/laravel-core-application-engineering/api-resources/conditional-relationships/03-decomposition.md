# Decomposition: Conditional Relationships

## Topic Overview
Runtime nested relation inclusion via whenLoaded/unlessLoaded/ whenCounted/whenHas/whenHasAggregated based on eager loading state.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
conditional-relationships/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Conditional Relationships
- **Purpose:** Runtime nested relation inclusion based on load state
- **Difficulty:** Intermediate
- **Dependencies:** Resource Fundamentals, Conditional Attributes

## Dependency Graph
This KU depends on: Resource Fundamentals, Conditional Attributes. It serves as prerequisite for Sparse Fieldsets and Versioned Resources.

## Boundary Analysis
**In scope:** whenLoaded() for relationship load state, unlessLoaded(), whenCounted() for aggregate counts, whenHasAggregated() for custom aggregates, whenNotNull() for nullable relations, higher-order conditional proxies, eager loading coupling, N+1 prevention with ->whenLoaded(), mergeWhen() for relationship groups.
**Out of scope:** Attribute-level conditionals (conditional-attributes KU), sparse fieldsets client-side filtering (sparse-fieldsets KU), relationship eager loading strategies (Eloquent domain).

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