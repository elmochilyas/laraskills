# Decomposition: Middleware Ordering and Priority

## Topic Overview
Middleware execution order control — the merging problem, SortedMiddleware algorithm, priority array, custom priority insertion, and safety guarantees for critical middleware ordering.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
middleware-ordering-priority/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Middleware Ordering and Priority
- **Purpose:** Middleware execution order control — SortedMiddleware algorithm, priority array, and the safety guarantees for critical middleware ordering.
- **Difficulty:** Advanced
- **Dependencies:** Global/Route Group Middleware

## Dependency Graph
This KU depends on: Global/Route Group Middleware. It serves as prerequisite for cross-cutting-concerns.

## Boundary Analysis
**In scope:** The merging problem (controller + route + group middleware), SortedMiddleware algorithm, priority array structure, stable sort for non-priority items, priority chain pattern (Cookies → Session → CSRF → Throttle → Auth → Authorize → SubstituteBindings), custom priority insertion (prependToPriorityList, appendToPriorityList), complete priority override, priority vs registration order, alias resolution before sorting, class name matching.

**Out of scope:** Registration tiers (global-route-group-middleware KU), specific middleware implementations, Laravel 10 vs 11 priority API differences (laravel-11-vs-10-registration KU), pipeline construction mechanics (middleware-fundamentals KU).

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