# Decomposition: Route Definition

## Topic Overview
Mapping HTTP requests to handlers. Every incoming request passes through the router, which matches against registered routes and dispatches the matched route's handler.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
route-definition/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Route Definition
- **Purpose:** Mapping HTTP requests to handlers
- **Difficulty:** Foundation
- **Dependencies:** Application Architecture

## Dependency Graph
This KU depends on: Application Architecture. It serves as prerequisite for Resourceful Routing, Route Groups, Route Name Generation, Signed Routes, Route Model Binding Implicit, Enum Binding, and Route Caching.

## Boundary Analysis
**In scope:** HTTP verb routing, route files (web/api/console/channels), route action resolution (closures vs controllers), fallback routes, route registration and matching flow, route collection structure, regex compilation deferral.
**Out of scope:** Resource route registration (resourceful-routing KU), route groups (route-groups KU), route model binding (route-model-binding KU), rate limiting (rate-limiting KU), signed URLs (signed-routes KU).

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