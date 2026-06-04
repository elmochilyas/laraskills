# Decomposition — Controller Dependency Injection

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Constructor-based DI in controllers, container auto-resolution, contextual binding, constructor parameter conventions |
| **Boundaries** | Ends where method injection begins (per-action parameters); distinct from service provider binding registration; separate from facade usage |
| **Interfaces** | `__construct(TypeHint $dependency)` — injection signature; `app()->when(C::class)->needs(I::class)->give(...)` — contextual binding |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Constructor DI is a specific injection mechanism at the controller boundary |
| Minimal overlap | ⚠️ Partial | Overlaps with controller-method-injection in being a DI mechanism, but lifetime and use-case differ |
| Testable independently | ✅ Atomic | Can test that constructor dependencies are properly resolved |
| Splittable? | ❌ No | Would be a subset of general Laravel DI; splitting is counterproductive |

## Dependency Graph

```
Service Container Fundamentals ──► Controller Dependency Injection ──► Controller Action Delegation
                                           │
                                           ├──► Controller Method Injection
                                           └──► Thin Controller Enforcement
```

## Follow-up

| Action | Reason |
|--------|--------|
| Add a maximum dependency count recommendation (3–4) as a code standard | Enforces SRP at the controller boundary |
| Create a contextual binding example for testing vs. production scenarios | Practical guidance for dependency replacement |
| Document the `scoped()` binding impact on controller DI in Laravel 11 | New binding type changes per-request semantics |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization