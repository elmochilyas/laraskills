# Decomposition: Global Middleware Stack
## Boundary Analysis
This KU covers the definition, purpose, and mechanics of middleware that runs on every request. It crosses into Middleware Configuration in Bootstrap (how they're registered) and Default Middleware Members (what the defaults are). The boundary is drawn at the *global* aspect — group-specific and route-specific middleware are separate KUs.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

## Dependency Graph
- **Required By:** Middleware Groups, Route Middleware, Middleware vs Route Binding Ordering
- **Depends On:** Pipeline Pattern Fundamentals
- **Related To:** Default Middleware Members, Middleware Configuration in Bootstrap

## Follow-up Opportunities
- Deep-dive KU on individual global middleware (TrustProxies internals, CORS handling)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization