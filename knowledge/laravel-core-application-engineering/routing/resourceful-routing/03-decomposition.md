# Decomposition: Resourceful Routing

## Topic Overview
Automatic 7-method route registration via `Route::resource()`, generating RESTful CRUD routes from a single declaration.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
resourceful-routing/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Resourceful Routing
- **Purpose:** Automatic 7-method route registration
- **Difficulty:** Foundation
- **Dependencies:** Route Definition

## Dependency Graph
This KU depends on: Route Definition. It serves as prerequisite for Singleton Routes, Scoped Bindings, and Route Name Generation.

## Boundary Analysis
**In scope:** The seven standard routes, apiResource vs resource, partial resources (only/except), nested resources, shallow nesting, custom resource verbs, ResourceRegistrar mechanics, PendingResourceRegistration deferred pattern.
**Out of scope:** Individual route definition (route-definition KU), singleton route pattern (singleton-routes KU), scoped bindings on nested resources (scoped-bindings KU), route groups for resource prefixing (route-groups KU).

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