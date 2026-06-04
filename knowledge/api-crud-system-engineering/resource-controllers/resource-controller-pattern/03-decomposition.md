# Decomposition — Resource Controller Pattern

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | The seven-method RESTful controller convention, route registration via `Route::resource()`, implicit route model binding |
| **Boundaries** | Ends where custom non-resource routes begin; distinct from API resource controllers (no `create`/`edit`); separate from route model binding configuration |
| **Interfaces** | `Route::resource($name, $controller, $options)` — public API; `ResourceRegistrar` — internal engine |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | The seven-method resource convention is a single, teachable concept |
| Minimal overlap | ✅ Atomic | Overlaps with api-resource-controllers but that KU treats it as a variant, not a duplicate |
| Testable independently | ✅ Atomic | Can test route registration output without testing API-specific concerns |
| Splittable? | ❌ No | Breaking into sub-KUs (e.g., "route registration" vs "method conventions") would create artificial dependencies |

## Dependency Graph

```
Route Registration Basics ──► Resource Controller Pattern ──► API Resource Controllers
                                        │
                                        ├──► Partial Resource Routes
                                        ├──► Nested Resources & Shallow Nesting
                                        └──► Singleton Resource Controllers
```

## Follow-up

| Action | Reason |
|--------|--------|
| Validate that `Route::resource()` naming rules are documented alongside the method map | Developers need the full verb-to-URI-to-name mapping |
| Consider a quick-reference table showing all 7 methods with their URIs and names | Improves lookup speed vs. reading prose |
| Monitor for Laravel 12 changes to `ResourceRegistrar` | The registrar has remained stable for 5+ major versions |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization