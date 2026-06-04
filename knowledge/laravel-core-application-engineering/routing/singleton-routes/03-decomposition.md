# Decomposition: Singleton Routes

## Topic Overview
Single-instance resource routes using `Route::singleton()` for resources with exactly one instance — generating CRUD routes without an identifier parameter.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
singleton-routes/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Singleton Routes
- **Purpose:** Single-instance resource routes
- **Difficulty:** Intermediate
- **Dependencies:** Route Definition

## Dependency Graph
This KU depends on: Route Definition. It serves as prerequisite for Scoped Bindings (in nested singleton context) and API Versioning.

## Boundary Analysis
**In scope:** Default singleton actions (show/edit/update), creatable and destroyable singletons, nested singletons, apiSingleton, PendingSingletonResourceRegistration, no built-in model resolution, zero-or-one vs one-of-many semantics.
**Out of scope:** Standard resourceful routing with 7 routes (resourceful-routing KU), route model binding for parent parameters (route-model-binding-implicit KU), route group attribute inheritance (route-groups KU).

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