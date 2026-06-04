# Decomposition: Conditional Attributes

## Topic Overview
Runtime field inclusion/exclusion in resources using when/unless/whenNotNull/whenHas/whenCounted conditional methods.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
conditional-attributes/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Conditional Attributes
- **Purpose:** Runtime field inclusion/exclusion in resources
- **Difficulty:** Intermediate
- **Dependencies:** Resource Fundamentals

## Dependency Graph
This KU depends on: Resource Fundamentals. It serves as prerequisite for Conditional Relationships.

## Boundary Analysis
**In scope:** when() closure and value forms, unless(), whenNotNull(), whenHas(), whenCounted(), whenAggregated(), mergeWhen(), when based on relationship load state, higher-order conditional proxies, field exclusion, mergeWhen() for multiple fields.
**Out of scope:** Relationship-specific conditionals (conditional-relationships KU), sparse fieldsets driven by client request (sparse-fieldsets KU), authorization-based field filtering (Security domain).

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