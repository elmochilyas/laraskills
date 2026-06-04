# Decomposition — Partial Resource Routes

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Route action whitelisting via `only()`/`except()`, custom route registration alongside resource routes, route ordering concerns |
| **Boundaries** | Ends where the full resource route set is used; separate from the controller implementation details; distinct from route model binding |
| **Interfaces** | `->only([...])` and `->except([...])` on `PendingResourceRegistration` |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | One coherent idea: selectively including/excluding resource routes |
| Minimal overlap | ✅ Atomic | Overlaps with resource-controller-pattern by necessity of building on it, but the filtering mechanism is unique |
| Testable independently | ✅ Atomic | Can test that `only(['index'])` registers exactly 1 route |
| Splittable? | ❌ No | `only()` and `except()` are two sides of same coin; splitting would force duplication |

## Dependency Graph

```
Resource Controller Pattern ──► Partial Resource Routes ──► Single-Action Invokable Controllers
                                        │
                                        └──► Controller Code Limits
```

## Follow-up

| Action | Reason |
|--------|--------|
| Add explicit warning about route ordering in the Laravel style guide | Single most common bug with partial resource routes |
| Create a diagram showing route matching priority for resource + custom routes | Visual explanation of ordering dependency |
| Document a CI check that ensures `only()` matches controller method signatures | Avoids dead code from method-route mismatch |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization