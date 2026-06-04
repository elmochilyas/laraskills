# Decomposition: Controller Middleware

## Topic Overview
Assigning middleware from controllers — three registration mechanisms (constructor, HasMiddleware, #[Middleware]), per-method filtering with only/except, and middleware resolution at dispatch time.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
controller-middleware/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Controller Middleware
- **Purpose:** Assigning middleware from controllers — three mechanisms (constructor, HasMiddleware, #[Middleware]), per-method filtering, and dispatch-time resolution.
- **Difficulty:** Intermediate
- **Dependencies:** Controller Architecture, Middleware Fundamentals

## Dependency Graph
This KU depends on: Controller Architecture, Middleware Fundamentals. It serves as prerequisite for controller-testing.

## Boundary Analysis
**In scope:** Three registration mechanisms (constructor $this->middleware(), HasMiddleware static interface, #[Middleware] attribute), per-method filtering with only/except, ControllerMiddlewareOptions fluent builder, FiltersControllerMiddleware trait, Route::controllerMiddleware() three-path resolver, middleware gathering flow, constructor-before-middleware timing, withoutMiddleware limitations.

**Out of scope:** Middleware pipeline fundamentals (middleware-fundamentals KU), global/group/route registration tiers (global-route-group-middleware KU), custom middleware creation (custom-middleware KU), testing middleware behavior (middleware-testing KU).

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