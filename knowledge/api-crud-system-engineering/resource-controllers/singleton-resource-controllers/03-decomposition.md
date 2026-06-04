# Decomposition — Singleton Resource Controllers

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Singleton route registration, reduced method set, creatable option, scoped instance resolution without an ID parameter |
| **Boundaries** | Ends where standard resource controllers (with collections) begin; distinct from nested resources which still carry an `{id}` for the child |
| **Interfaces** | `Route::singleton($name, $controller)` — public API; `->creatable()` — fluent option |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | One-to-one resource routing is a distinct, bounded concept |
| Minimal overlap | ✅ Atomic | Overlaps with resource-controller-pattern in method naming but URL structure and registration differ fundamentally |
| Testable independently | ✅ Atomic | Can assert singleton routes lack `{resource}` parameter |
| Splittable? | ❌ No | Would be meaningless without the parent resource controller pattern |

## Dependency Graph

```
Resource Controller Pattern ──► Singleton Resource Controllers ──► Nested Resources & Shallow Nesting
                                        │
                                        └──► Controller Dependency Injection
```

## Follow-up

| Action | Reason |
|--------|--------|
| Clarify relationship method naming convention in examples | Most common support issue with singleton resources |
| Add a real-world domain example where `creatable` is critical vs. where it is not | Helps developers decide when to use the option |
| Document the exact `php artisan route:list` output difference | Visual proof of missing `{resource}` parameter |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization