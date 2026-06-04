# Decomposition: Middleware Registration Order

## Boundary Analysis
**Scope:** The registration and execution order of middleware in the HTTP pipeline — global middleware registration, middleware group registration, route middleware registration, the priority override system, and how these categories merge into the final execution stack.

**Excluded:**
- Pipeline class internals (covered in Pipeline Pattern Fundamentals)
- Individual middleware implementations (auth, CSRF, throttle — covered in their respective domains)
- Terminable middleware behavior (covered in Terminable Middleware)
- Middleware configuration bootstrap API (covered in Middleware Configuration in Bootstrap)
- Middleware parameters and role-based middleware (covered in Middleware Parameters)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Middleware registration order is a single concept — the merging of three middleware categories (global, group, route) and the priority system that reorders across them. These elements together determine the execution order; none can be understood in isolation.

## Dependency Graph
```
Middleware Registration Order
  ├─ Global middleware ($middleware)
  ├─ Middleware groups ($middlewareGroups)
  │   ├─ web (default: EncryptCookies, StartSession, etc.)
  │   └─ api (default: ThrottleRequests)
  ├─ Route middleware ($routeMiddleware)
  └─ Priority reorder ($middlewarePriority)
      └─ Sorts across categories
```

## Follow-up Opportunities
- Build a visualization tool that shows the final middleware execution order for a given route, including priority reordering.
- Investigate how attribute-based middleware (Laravel 12+) changes registration order semantics.
- Analyze the performance cost of the sort operation for applications with 50+ middleware entries.
- Explore whether middleware groups could support nested groups for better organization.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
