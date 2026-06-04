# Decomposition: Scoped Bindings

## Topic Overview
Child-resource scoping for nested bindings — automatically validates child belongs to parent via Eloquent relationship resolution.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
scoped-bindings/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Scoped Bindings
- **Purpose:** Child-resource scoping for nested bindings
- **Difficulty:** Advanced
- **Dependencies:** Route Model Binding Implicit, Resourceful Routing

## Dependency Graph
This KU depends on: Route Model Binding Implicit, Resourceful Routing. It serves as prerequisite for advanced security patterns in multi-tenant applications.

## Boundary Analysis
**In scope:** Scope binding flag (scopeBindings/withoutScopedBindings), automatic scoping with custom keys, resource scoping via ->scoped(), parent detection by parameter order, resolveChildRouteBinding mechanics, childRouteBindingRelationshipName override, soft-delete scoped resolution, multi-tenant security implications.
**Out of scope:** Individual model resolution (implicit/explicit binding KUs), resource route registration (resourceful-routing KU), inline binding field syntax (custom-route-keys KU), authorization policies (Security domain).

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