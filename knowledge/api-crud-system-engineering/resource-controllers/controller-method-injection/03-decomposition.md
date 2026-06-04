# Decomposition — Controller Method Injection

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Per-method parameter injection via container, route parameter differentiation, form request injection pattern |
| **Boundaries** | Ends where constructor injection begins (different lifetime); distinct from explicit `app()->make()` calls in method bodies; separate from route model binding (which is a prerequisite feature) |
| **Interfaces** | `public function action(TypeHint $dependency, Model $routeParam)` — combined signature pattern |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Method-level injection is a distinct injection lifetime from constructor DI |
| Minimal overlap | ⚠️ Partial | Shares DI mechanism with controller-dependency-injection but differs in lifetime and use-case |
| Testable independently | ✅ Atomic | Can test that a service type-hinted in a method is resolved by the container |
| Splittable? | ❌ No | Would duplicate container resolution mechanics |

## Dependency Graph

```
Controller Dependency Injection ──► Controller Method Injection ──► Controller Form Request Integration
                                           │
                                           └──► Controller Action Delegation
```

## Follow-up

| Action | Reason |
|--------|--------|
| Document parameter collision cases (route param name = service type-hint) | Common debugging pain point |
| Add a style guide rule: "constructor for shared deps, method for action-specific deps" | Consistent pattern enforcement |
| Create an example showing PHP 8 attribute disambiguation for route parameters | Forward-looking best practice |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization