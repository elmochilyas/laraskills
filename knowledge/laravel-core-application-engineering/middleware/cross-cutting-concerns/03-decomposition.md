# Decomposition: Cross-Cutting Concerns

## Topic Overview
Identifying which concerns belong in middleware — the cross-cutting definition, middleware vs business logic boundary, three categories (infrastructure, security, observability), and the split concern pattern.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
cross-cutting-concerns/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Cross-Cutting Concerns
- **Purpose:** Identifying which concerns belong in middleware — the cross-cutting definition, middleware vs business logic boundary, and architectural decision framework.
- **Difficulty:** Expert
- **Dependencies:** All middleware KUs

## Dependency Graph
This KU depends on: All middleware KUs (Middleware Fundamentals, Middleware Lifecycle, Global/Route Group Middleware, Custom Middleware, Parameterized Middleware, Terminable Middleware, Middleware Ordering and Priority, Request Transformation, Response Transformation, Middleware Testing). It is the capstone KU for the middleware subdomain.

## Boundary Analysis
**In scope:** Cross-cutting concern definition (applies to multiple routes, HTTP level, no business logic, can short-circuit), middleware vs business logic boundary, three categories (infrastructure, security, observability), dedicated middleware per concern pattern, concern composition in route groups, split concern pattern (HTTP in middleware, domain in service), pull-don't-push pattern, what belongs in middleware (comprehensive table), what does NOT belong in middleware, when to move a concern out of middleware, middleware inventory documentation, bloat prevention.

**Out of scope:** Specific middleware implementation details (covered by individual middleware KUs), service layer business logic patterns (service-layer-pattern domain), specific security implementations (auth, CSRF, etc.).

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