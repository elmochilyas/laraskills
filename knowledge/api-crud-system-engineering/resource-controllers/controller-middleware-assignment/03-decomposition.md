# Decomposition — Controller Middleware Assignment

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Route-level vs controller-level middleware assignment, per-method middleware (`only()`/`except()`), middleware parameters, static middleware (Laravel 11+), execution order |
| **Boundaries** | Ends where middleware *implementation* begins (writing custom middleware); distinct from global kernel middleware; separate from authorization policies |
| **Interfaces** | `Route::...->middleware(...)` — route level; `Controller::middleware()` — constructor level; `Controller::middleware()` static — Laravel 11+; `->only()` / `->except()` — method filtering |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Middleware assignment within the controller context is one coherent topic |
| Minimal overlap | ✅ Atomic | Uniquely focuses on *where* middleware is assigned, not *how* middleware works |
| Testable independently | ✅ Atomic | Can test that a middleware is applied to the correct subset of actions |
| Splittable? | ❌ No | Route-level vs controller-level assignment are two sides of the same decision |

## Dependency Graph

```
Middleware Basics ──► Controller Middleware Assignment ──► Controller Testing Strategies
                              │
                              └──► Controller Organization by Version
```

## Follow-up

| Action | Reason |
|--------|--------|
| Create a decision matrix for route-level vs controller-level middleware assignment | Simplifies the choice for developers |
| Document the middleware execution order with a diagram | Most common source of confusion |
| Add a CI check that prevents middleware duplication across route and controller levels | Avoids double execution |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization