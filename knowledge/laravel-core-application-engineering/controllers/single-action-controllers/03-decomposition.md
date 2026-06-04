# Decomposition: Single-Action Controllers

## Topic Overview
Invokable controllers for single-route actions — __invoke() normalization, route caching compatibility, naming conventions, and the tradeoffs vs multi-action controllers.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
single-action-controllers/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Single-Action Controllers
- **Purpose:** Invokable controllers for single-route actions — __invoke() normalization, route caching compatibility, and naming conventions.
- **Difficulty:** Intermediate
- **Dependencies:** Controller Architecture

## Dependency Graph
This KU depends on: Controller Architecture. It serves as prerequisite for controller-organization, controller-testing.

## Boundary Analysis
**In scope:** __invoke() magic method, RouteAction::makeInvokable() normalization, route caching compatibility, naming conventions (VerbNoun Controller), simple delegation pattern, complex orchestration pattern, single-action vs multi-action tradeoffs, single-action vs resource controller tradeoffs, file organization for single-action controllers.

**Out of scope:** Resource controller CRUD clustering (resource-controllers KU), action class design (action-class-design KU), general controller dispatch mechanics (controller-architecture KU).

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