# Decomposition — Single-Action Invokable Controllers

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | `__invoke` method, no-method route registration, single-responsibility controller, route caching with invokables |
| **Boundaries** | Ends where multi-action (resource) controllers begin; distinct from closure routes which are not cacheable; separate from action classes (which are not controllers) |
| **Interfaces** | `Route::get('/url', SomeController::class)` — no `@method` syntax; `php artisan make:controller --invokable` — generator |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | The invokable pattern is a single, well-defined variation of controller design |
| Minimal overlap | ✅ Atomic | Unique `__invoke` mechanism not present in other KUs |
| Testable independently | ✅ Atomic | Can test that a no-method route resolves to `__invoke` |
| Splittable? | ❌ No | Invokable is a monolithic concept; splitting would be artificial |

## Dependency Graph

```
Controller Fundamentals ──► Single-Action Invokable Controllers ──► Controller Action Delegation
                                      │
                                      ├──► Controller Dependency Injection
                                      └──► Partial Resource Routes
```

## Follow-up

| Action | Reason |
|--------|--------|
| Provide a checklist for "should this be invokable or a resource method?" | Helps developers decide between patterns |
| Compare invokable controllers vs. action classes vs. closures in a decision matrix | Framework-independent architectural guidance |
| Document the `php artisan route:list` output difference for invokable routes | Shows how invokable routes appear in the route listing |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization