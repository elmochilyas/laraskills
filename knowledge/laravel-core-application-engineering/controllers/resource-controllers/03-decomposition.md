# Decomposition: Resource Controllers

## Topic Overview
The 7-method resource controller pattern — index/create/store/show/edit/update/destroy, ResourceRegistrar route generation, apiResource, singleton resources, and partial resources.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
resource-controllers/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Resource Controllers
- **Purpose:** The 7-method resource controller pattern — how ResourceRegistrar generates routes and the standard RESTful action set.
- **Difficulty:** Foundation
- **Dependencies:** Controller Architecture, Resourceful Routing

## Dependency Graph
This KU depends on: Controller Architecture, Resourceful Routing. It serves as prerequisite for controller-organization, controller-testing.

## Boundary Analysis
**In scope:** 7 standard methods, apiResource (5 methods), singleton resources (3-6 methods), partial resources via only/except, ResourceRegistrar route generation mechanics, PendingResourceRegistration deferred pattern, no-special-dispatch-path design, missing method detection, custom method addition.

**Out of scope:** Controller dispatch internals (controller-architecture KU), single-action controller pattern (single-action-controllers KU), route model binding for resource parameters (Route Model Binding KU).

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