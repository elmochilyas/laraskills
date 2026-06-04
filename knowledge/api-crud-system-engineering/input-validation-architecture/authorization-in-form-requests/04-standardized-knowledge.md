# Authorization in Form Requests

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-authorization-in-form-requests |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Intermediate |
| Classification | Security Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

The `authorize()` method in Form Requests executes before validation rules, preventing unauthorized actors from triggering any validation overhead. It integrates with Laravel Gates and Policies to delegate access decisions, forming the security boundary of every API endpoint.

## Core Concepts

- **Authorization Before Validation**: `authorize()` runs before `rules()` — security-first design, no wasted validation.
- **Gate/Policy Integration**: Delegates access decisions to Policy classes via `$this->user()->can()` or `Gate::allows()`.
- **Early Exit on Failure**: Returns 403 Forbidden immediately if authorization fails.
- **Resource Ownership Checks**: Common pattern checking `$this->user()->id === $resource->user_id`.
- **Admin Bypass Pattern**: Admins bypass specific policy checks while regular users are validated.

## When To Use

- For every API endpoint that requires authenticated access
- When using Laravel Policies for resource-level authorization
- For endpoints with role-based or permission-based access control
- When authorization logic is tightly coupled to input validation (same endpoint)

## When NOT To Use

- For public/unauthenticated endpoints
- When authorization is performed at the controller level via `$this->authorize()`
- For simple role checks that can be handled by middleware
- When authorization requires data from the request body that hasn't been validated yet

## Best Practices (WHY)

- **Place authorize() in FormRequest, not Controller**: Centralized with validation, single override point.
- **Use Policy classes over manual checks**: Framework-integrated, testable, reusable across controllers.
- **Return bool, not throw**: Clean, declarative, testable pattern.
- **Use `$this->user()`, not `auth()->user()`**: Ensures testability — can mock authenticated user.
- **Ensure `auth` middleware runs before FormRequest**: Prevents `null` user in `authorize()`.
- **Use `$this->route('param')` for model access**: Accesses route model binding for resource checks.
- **Log authorization failures**: Capture user ID, resource type, and action for audit trails.

## Architecture Guidelines

- `authorize()` should be a single-line delegation to a Gate or Policy: `return $this->user()->can('create', Post::class)`.
- For complex logic (admin bypass, multi-role), keep it readable with early returns.
- Pass additional context to policies via array: `$this->user()->can('create', [Post::class, $teamId])`.
- Override `failedAuthorization()` in base `ApiRequest` for consistent 403 error shape.
- Use `can:ability,model` middleware for simple gates — keep FormRequest authorize() for complex logic only.
- Ensure route model binding resolves the model before `authorize()` runs.

## Performance Considerations

- `authorize()` runs on every request to a guarded endpoint — avoid unnecessary queries.
- Use route model binding to eager-load resources, avoiding a second query in `authorize()`.
- Avoid loading `$this->user()->load('roles.permissions')` inside `authorize()` — preload in middleware.
- Cache Policy instances; they are resolved per-request by the container.

## Security Considerations

- Never distinguish "resource not found" from "forbidden" in error responses — prevents enumeration.
- `authorize()` runs before validation — cannot use request body data for authorization decisions.
- Ensure `auth:api` middleware is applied to the route before the FormRequest resolves.
- `authorize()` defaults to `false` if no return statement — always return explicitly.
- Policy auto-discovery requires model naming convention.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| `null` user in authorize() | Auth middleware not yet run | Middleware ordering | All requests return 403 | Ensure auth middleware runs before controller |
| Using `$this->all()` in authorize() | Reading from consumed JSON stream | Not using `$this->json()` | Empty data | Use `$this->json()` or `$this->input()` |
| No return statement | `authorize()` defaults to `false` | Forgetting return | All requests denied | Always explicitly return true/false |
| Passing route key instead of model | `can('update', $request->route('post_id'))` | Not using route model binding | Policy receives ID not model | Use route model binding |
| Catching AuthorizationException in failedValidation | Swallows the exception | Over-broad error handling | 500 instead of 403 | Never catch AuthorizationException |

## Anti-Patterns

- **authorize() in Controller instead of FormRequest**: Duplicates authorization concern across controller methods.
- **Manual ownership checks in authorize() without Policy**: Not reusable across controllers.
- **authorize() that performs business logic**: Should only return boolean — no side effects.
- **Single authorize() for all actions**: Should be specific per action with proper Policy methods.
- **authorize() with DB queries that could fail**: Authorization should be simple and reliable.

## Examples

```php
public function authorize(): bool
{
    return $this->user()->can('create', Post::class);
}

// With resource ownership check:
public function authorize(): bool
{
    $post = $this->route('post');
    return $post && $this->user()->can('update', $post);
}

// Admin bypass:
public function authorize(): bool
{
    if ($this->user()->hasRole('admin')) {
        return true;
    }
    return $this->user()->can('update', $this->route('post'));
}
```

## Related Topics

- Form Request Design for APIs (structure hosting authorize())
- Laravel Gates and Policies (the authorization backend)
- Authentication Error Responses (401 vs 403 distinction)
- Conditional Validation Patterns (authorize() interaction with conditional rules)
- DTO Integration: payload() Method (authorized data flowing to DTOs)

## AI Agent Notes

- Always include `authorize()` in every FormRequest — it defaults to false.
- Delegate to Policies via `$this->user()->can()`, not manual checks.
- Ensure the `auth` middleware is applied to the route before the FormRequest.
- Use `$this->route('param')` to access route model binding results.
- Override `failedAuthorization()` in the base class for consistent 403 responses.

## Verification

- [ ] Every FormRequest has an explicit `authorize()` method
- [ ] `authorize()` delegates to Policy/Gate, not manual checks
- [ ] `$this->user()` is used instead of `auth()->user()`
- [ ] `auth` middleware is applied before controller resolution
- [ ] `failedAuthorization()` is overridden in base class for JSON response
- [ ] No `null` user scenarios exist in authorization logic
- [ ] Integration tests verify authorization failures return 403 with correct shape
