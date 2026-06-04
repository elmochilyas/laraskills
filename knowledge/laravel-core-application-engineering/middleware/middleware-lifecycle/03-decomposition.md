# Decomposition: Middleware Lifecycle

## Topic Overview
Pre/post processing lifecycle — the complete request flow from public/index.php through global pipeline, routing, route pipeline, controller dispatch, response unwinding, and terminate phase.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
middleware-lifecycle/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Middleware Lifecycle
- **Purpose:** Pre/post processing lifecycle — the complete request flow through global and route-specific pipelines, including terminate phase.
- **Difficulty:** Foundation
- **Dependencies:** Middleware Fundamentals

## Dependency Graph
This KU depends on: Middleware Fundamentals. It serves as prerequisite for global-route-group-middleware, terminable-middleware.

## Boundary Analysis
**In scope:** Complete request flow (index.php → Kernel::handle → global pipeline → router dispatch → route pipeline → controller → response unwinding → terminate), two distinct pipelines (global before routing, route after routing), pre vs post middleware within handle(), short-circuit behavior, global pipeline construction, route middleware gathering, middleware name resolution, controller instantiation timing (before middleware), terminate phase mechanics.

**Out of scope:** Pipeline pattern mechanics (middleware-fundamentals KU), middleware registration tiers (global-route-group-middleware KU), terminable middleware singleton semantics (terminable-middleware KU), Octane-specific lifecycle differences.

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