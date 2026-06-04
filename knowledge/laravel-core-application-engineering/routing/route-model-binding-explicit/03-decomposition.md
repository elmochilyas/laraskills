# Decomposition: Route Model Binding — Explicit

## Topic Overview
Manual binding configuration via `Route::model()` and `Route::bind()` for custom resolution logic beyond convention-based implicit binding.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
route-model-binding-explicit/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Route Model Binding Explicit
- **Purpose:** Manual binding configuration via Route::model and Route::bind
- **Difficulty:** Advanced
- **Dependencies:** Route Model Binding Implicit

## Dependency Graph
This KU depends on: Route Model Binding Implicit. It serves as prerequisite for Scoped Bindings and advanced route caching considerations.

## Boundary Analysis
**In scope:** Route::model() global parameter binding, Route::bind() custom callback binding, model-level resolveRouteBinding/resolveChildRouteBinding overrides, SubstituteBindings middleware execution order, performBinding implementation, global vs scoped registration, Class@method binder pattern.
**Out of scope:** Convention-based auto-resolution (implicit binding KU), inline binding field syntax (custom-route-keys KU), parent-child scoping logic (scoped-bindings KU), backed enum resolution (enum-binding KU).

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