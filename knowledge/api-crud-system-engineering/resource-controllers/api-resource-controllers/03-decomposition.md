# Decomposition — API Resource Controllers

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | The five-method API resource controller, `Route::apiResource()` registration, API-specific conventions |
| **Boundaries** | Ends at the point where create/edit routes would be needed; separate from full resource controllers; distinct from API resource route model binding customization |
| **Interfaces** | `Route::apiResource($name, $controller, $options)` — public API; `Route::apiResources([...])` — bulk registration |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Five-method API controller is a single coherent variant of the resource pattern |
| Minimal overlap | ⚠️ Partial | Shares route registration mechanics with resource-controller-pattern but the intent and application are distinct enough to warrant separation |
| Testable independently | ✅ Atomic | Can assert that `apiResource` registers exactly 5 routes |
| Splittable? | ❌ No | Would be a subset of resource-controller-pattern; splitting would create unnecessary dependencies |

## Dependency Graph

```
Resource Controller Pattern ──► API Resource Controllers ──► Controller Response Selection
                                      │
                                      ├──► Controller Form Request Integration
                                      └──► Controller Testing Strategies
```

## Follow-up

| Action | Reason |
|--------|--------|
| Document the exact `php artisan route:list` output for `apiResource` vs `resource` | Visual comparison aids understanding |
| Consider a hybrid-application pattern KU for projects using both `api.php` and `web.php` | Edge case not covered here |
| Link to response standardization patterns (API Resources, Fractal, etc.) | Complements the API endpoint discussion |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization