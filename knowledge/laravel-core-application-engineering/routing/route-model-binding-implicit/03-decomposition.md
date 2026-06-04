# Decomposition: Route Model Binding — Implicit

## Topic Overview
Auto-resolving Eloquent models from route parameters via type-hinted controller parameters matched by name convention.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
route-model-binding-implicit/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Route Model Binding Implicit
- **Purpose:** Auto-resolving models from route parameters
- **Difficulty:** Foundation
- **Dependencies:** Route Definition, Eloquent

## Dependency Graph
This KU depends on: Route Definition, Eloquent. It serves as prerequisite for Route Model Binding Explicit, Custom Route Keys, Scoped Bindings, and Enum Binding.

## Boundary Analysis
**In scope:** Convention-based resolution (name matching), UrlRoutable contract methods (getRouteKey, getRouteKeyName, resolveRouteBinding, resolveChildRouteBinding), resolution pass order (explicit before implicit, enums before models), two-pass internal resolution, soft delete handling, signature parameters reflection, fresh model instance creation.
**Out of scope:** Custom binding callbacks (explicit binding KU), inline binding field syntax {param:field} (custom-route-keys KU), scoped child-parent validation (scoped-bindings KU), backed enum resolution (enum-binding KU).

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