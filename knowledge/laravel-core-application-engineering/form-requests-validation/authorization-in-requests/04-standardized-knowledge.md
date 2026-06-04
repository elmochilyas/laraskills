# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | Authorization in Requests |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Form Request authorization via the `authorize()` method provides an HTTP-layer access control gate that runs BEFORE validation. It integrates with Laravel's Gate/Policy system and gives each action a dedicated authorization check without cluttering the controller. The `authorize()` method runs as the second step in the validation pipeline — after input preparation but before rule validation — ensuring unauthorized requests are rejected before any processing occurs.

---

## Core Concepts

- **Authorization timing**: Runs after `prepareForValidation()` but before any validation rules — unauthorized users never have their input validated
- **Return types**: `true` (authorized), `false` (denied → 403), or `Illuminate\Auth\Access\Response` for custom messages
- **Integration with Gates/Policies**: Standard delegation pattern: `$this->user()->can('create', Post::class)`
- **Route parameter access**: `$this->route('post')` to access route model binding results
- **Default behavior**: If `authorize()` is not defined, the request is authorized by default

---

## When To Use

- Any action where access varies by user (most update/delete actions)
- Actions where a user can only modify their own resources
- Admin-only or role-gated actions
- Any FormRequest where the authorization check differs per action

## When NOT To Use

- Public endpoints (registration, password reset) — no user-specific authorization
- Actions where authorization is identical for all users (e.g., index with no owner restriction)
- Business-rule authorization that belongs in domain services or policies

---

## Best Practices

- **Keep authorize() thin** — delegate to Policy/Gate methods rather than writing complex logic inline
- **Use `$this->user()->can()`** with the model/class as second argument for proper Policy integration
- **Return `Response::deny('Reason')`** instead of `false` for user-facing denial messages
- **Do NOT put domain logic in authorize()** — authorization in FormRequests is HTTP-layer access control, not business rule enforcement
- **Override `failedAuthorization()`** for custom 403 responses per request type

---

## Architecture Guidelines

- `authorize()` resolves through the container, enabling method injection
- Route parameters accessed via `$this->route('paramName')`
- Policy methods should contain the actual authorization logic
- `failedAuthorization()` throws `AuthorizationException` → maps to HTTP 403
- `AuthorizationException` is never logged (in `internalDontReport` list)
- Customize denial reason by passing message to `AuthorizationException` constructor

---

## Performance

Authorization checks add negligible overhead (~0.1ms for Gate resolution). Policy methods may involve database queries — ensure they are efficient (cached roles, eager-loaded relations). The check runs before validation, preventing wasteful validation of unauthorized requests.

---

## Security

Authorization in FormRequests is the FIRST security gate after input preparation. It prevents:
- Information leakage via validation error messages (unauthorized users see no validation feedback)
- Unauthorized data modification attempts
- Access to resources the user doesn't own

Authorization checks in FormRequests complement (not replace) Policy-based authorization in services.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Business logic in authorize() | Convenience | Request class becomes complex, hard to test | Delegate to Policy/Service |
| Missing authorize() | Defaults to true | No access control | Always implement authorize() |
| Using `$this->user()` without null check | Assuming user is authenticated | Error on unauthenticated routes | Use optional or middleware for auth |
| Returning false without message | boolean false | Generic 403, no user feedback | Return `Response::deny('Reason')` |
| Gate logic duplication | Same check in multiple requests | Inconsistent access control | Centralize in Policy class |

---

## Anti-Patterns

- **Complex if/else chains in authorize()**: `if ($this->user()->role === 'admin') { ... }` → belongs in Policy
- **Database queries in authorize()**: `User::find(...)` → delegate to Policy or Service
- **authorize() that always returns true**: No actual access control
- **FormRequest-level business rules**: "User can only update if they haven't exceeded quota" → belongs in Service

---

## Examples

**Basic authorization:**
```php
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'));
}
```

**Authorization with custom denial:**
```php
public function authorize(): Response
{
    if ($this->user()->cannot('update', $this->route('post'))) {
        return Response::deny('You do not own this post.');
    }
    return Response::allow();
}
```

**Custom failed authorization:**
```php
protected function failedAuthorization()
{
    throw new AuthorizationException('You do not own this post.');
}
```

**Container-resolved authorize with dependency:**
```php
public function authorize(SubscriptionService $subscriptions): bool
{
    return $this->user()->can('create', Post::class)
        && $subscriptions->hasActivePlan($this->user());
}
```

---

## Related Topics

- form-request-fundamentals — Overall FormRequest architecture
- input-preparation — Runs before authorization in the pipeline
- form-request-testing — Testing authorization failures
- after-validation-hooks — Post-validation hooks

---

## AI Agent Notes

- `authorize()` is resolved through the container, allowing dependency injection
- If not defined, the request is authorized by default
- `Response` instances are evaluated via `$response->authorize()` which throws on denial
- `AuthorizationException` maps to HTTP 403 via Laravel's exception handler
- `AuthorizationException::class` is in `internalDontReport` — never logged

---

## Verification

- [ ] `authorize()` implemented on each FormRequest
- [ ] Authorization check runs before validation
- [ ] Route parameters used correctly via `$this->route('param')`
- [ ] Policy/Gate used for logic (not inline in authorize())
- [ ] `authorize()` returns `Response::deny()` with message for user feedback
- [ ] Unauthorized requests return 403 with appropriate message
- [ ] Tests cover authorization failure scenarios
- [ ] No business logic mixed into authorization
