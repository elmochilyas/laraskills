# Decomposition: Controller Architecture

## Topic Overview
How controllers are dispatched, structured, and organized — the controller resolution pipeline, two dispatch paths, base Controller class, and the controller lifecycle.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
controller-architecture/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Controller Architecture
- **Purpose:** How controllers are dispatched, structured, and organized — resolution, dispatch paths, base Controller class, and lifecycle.
- **Difficulty:** Foundation
- **Dependencies:** Route Definition

## Dependency Graph
This KU depends on: Route Definition. It serves as prerequisite for all other controller KUs.

## Boundary Analysis
**In scope:** Controller resolution via Container::make(), two dispatch paths (callAction vs direct), base Controller class features, controller lifecycle, Route::getController() caching, ControllerDispatcher::dispatch() flow, method dependency injection via ResolvesRouteDependencies, RouteAction::parse() normalization.

**Out of scope:** Resource controller specifics (resource-controllers KU), single-action controller specifics (single-action-controllers KU), middleware assignment (controller-middleware KU), dependency injection details (dependency-injection KU), testing (controller-testing KU).

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