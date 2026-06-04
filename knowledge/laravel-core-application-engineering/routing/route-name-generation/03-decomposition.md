# Decomposition: Route Name Generation

## Topic Overview
Generating URLs from named routes via `route()` and `action()` helpers, maintaining nameList and actionList hash tables for O(1) lookup.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
route-name-generation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Route Name Generation
- **Purpose:** Generating URLs from named routes
- **Difficulty:** Foundation
- **Dependencies:** Route Definition

## Dependency Graph
This KU depends on: Route Definition. It serves as prerequisite for Signed Routes and API Versioning (versioned name prefixes).

## Boundary Analysis
**In scope:** route() helper mechanics, action() helper, nameList and actionList hash tables, name prefix inheritance, parameter substitution (Eloquent models, BackedEnum, scalars), default parameter values (URL::defaults()), getRouteKey() resolution, name uniqueness enforcement, resource naming convention, versioned name prefix strategy.
**Out of scope:** Signed URL generation (signed-routes KU), route definition basics (route-definition KU), resource route naming (resourceful-routing KU), Blade template URL generation (Blade domain).

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