# Decomposition — Controller Response Selection

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | HTTP status code selection per action, response body construction, Eloquent API resources, response macros, web vs API response differences |
| **Boundaries** | Ends where request processing begins (validation, authorization); distinct from response formatting concerns (headers, CORS); separate from error handling (exception handler) |
| **Interfaces** | `response()->json()`, `response()->noContent()`, `new XxxResource(...)`, `XxxResource::collection(...)`, `Response::macro()` |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Response selection is a single concern within the controller action lifecycle |
| Minimal overlap | ✅ Atomic | Overlaps with API resource controllers in status code conventions but is a distinct concern |
| Testable independently | ✅ Atomic | Can test that a store action returns 201 with the expected body |
| Splittable? | ❌ No | Status codes, body construction, and macros are aspects of the same concern |

## Dependency Graph

```
API Resource Controllers ──► Controller Response Selection ──► Controller Testing Strategies
                                     │
                                     └──► Controller Action Delegation
```

## Follow-up

| Action | Reason |
|--------|--------|
| Create a quick-reference status code table for all resource controller actions | Single most useful reference for developers |
| Document the team-standard response envelope structure | Ensures all API endpoints return consistent JSON |
| Add an integration test template that asserts correct status codes for every action | Automates response correctness |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization