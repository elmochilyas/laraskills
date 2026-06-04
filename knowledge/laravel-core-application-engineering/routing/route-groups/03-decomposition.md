# Decomposition: Route Groups

## Topic Overview
Grouping routes with shared attributes (prefix, middleware, namespace, name prefix, domain, where constraints) via attribute inheritance and the group stack.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
route-groups/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Route Groups
- **Purpose:** Grouping routes with shared attributes
- **Difficulty:** Intermediate
- **Dependencies:** Route Definition

## Dependency Graph
This KU depends on: Route Definition. It serves as prerequisite for Rate Limiting, API Versioning, and Route Caching.

## Boundary Analysis
**In scope:** Group attribute stack (LIFO), RouteGroup::merge() semantics per attribute type (prefix concatenation, namespace concatenation, name prepending, domain replacement, middleware additive, where override), RouteRegistrar fluent builder, group nesting, subdomain routing, attribute application to routes.
**Out of scope:** Individual route definition (route-definition KU), rate limiter application within groups (rate-limiting KU), version prefix organization (api-versioning KU), middleware execution order (Middleware domain).

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