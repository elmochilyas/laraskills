# Decomposition: Custom Route Keys

## Topic Overview
Non-ID route parameter resolution using slugs, UUIDs, ULIDs via inline syntax (`{post:slug}`) or model-level `getRouteKeyName()` override.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
custom-route-keys/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Custom Route Keys
- **Purpose:** Non-ID route parameter resolution (slug, UUID)
- **Difficulty:** Intermediate
- **Dependencies:** Route Model Binding Implicit

## Dependency Graph
This KU depends on: Route Model Binding Implicit. It serves as prerequisite for Scoped Bindings (auto-enablement with custom keys).

## Boundary Analysis
**In scope:** Inline binding field syntax ({param:field}), model-level getRouteKeyName() override, per-route vs model-level priority, RouteUri parsing, binding field storage in Route::$bindingFields, URL generation with binding fields, auto-increment vs UUID vs slug tradeoffs, UUID query performance, index requirements.
**Out of scope:** Explicit binding callbacks (explicit binding KU), scoped parent-child validation (scoped-bindings KU), database indexing strategies (Database domain), Eloquent model UUID/ULID traits (Eloquent domain).

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