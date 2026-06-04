# Decomposition — Controller Form Request Integration

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Form request type-hinting in controller methods, authorization + validation in form requests, `$request->validated()`, pre-controller validation lifecycle |
| **Boundaries** | Ends where inline `$request->validate()` would be used instead; distinct from policy classes (authorization is a subset of form request responsibility); separate from Eloquent model validation |
| **Interfaces** | `class StoreXxxRequest extends FormRequest`; `public function rules(): array`; `public function authorize(): bool`; `$request->validated()` |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Form request integration is a single coherent pattern for validation isolation |
| Minimal overlap | ⚠️ Partial | Overlaps with controller-method-injection (same mechanism), but the purpose (validation) is unique |
| Testable independently | ✅ Atomic | Can test a form request's rules and authorization without the controller |
| Splittable? | ❌ No | Rules, authorization, and validated() are inseparable parts of the same concept |

## Dependency Graph

```
Controller Method Injection ──► Controller Form Request Integration ──► Controller Action Delegation
                                       │
                                       └──► Controller Testing Strategies
```

## Follow-up

| Action | Reason |
|--------|--------|
| Create a template form request pair (Store/Update) for common resource patterns | Reduces boilerplate for team adoption |
| Add a PHPStan rule that enforces `store` and `update` methods use form requests | Prevents validation leakage into controllers |
| Document the `prepareForValidation()` pattern for request normalization | Covers common real-world requirement (sanitizing input) |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization