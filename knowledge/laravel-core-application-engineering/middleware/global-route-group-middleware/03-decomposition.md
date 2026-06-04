# Decomposition: Global, Route Group, and Route Middleware

## Topic Overview
Registration scopes for middleware — the three tiers (global, route group, route-level), execution order within the route pipeline, default groups (web/api), and the additive-only constraint.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
global-route-group-middleware/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Global, Route Group, and Route Middleware
- **Purpose:** Registration scopes for middleware — the three tiers, additive-only constraint, default groups, and execution order.
- **Difficulty:** Intermediate
- **Dependencies:** Middleware Lifecycle

## Dependency Graph
This KU depends on: Middleware Lifecycle. It serves as prerequisite for middleware-ordering-priority, laravel-11-vs-10-registration.

## Boundary Analysis
**In scope:** Three tiers (global, group, route), default web and api groups, execution order within route pipeline (merged → aliases resolved → withoutMiddleware → sorted by priority), additive-only constraint, route group inheritance (nested groups), withoutMiddleware behavior (does not exclude global), group-as-domain pattern, group modification pattern (Laravel 11+).

**Out of scope:** Pipeline mechanics (middleware-fundamentals KU), controller middleware registration (controller-middleware KU), priority sorting internals (middleware-ordering-priority KU), version-specific registration APIs (laravel-11-vs-10-registration KU).

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