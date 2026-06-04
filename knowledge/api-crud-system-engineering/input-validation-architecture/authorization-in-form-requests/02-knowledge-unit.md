# Authorization in Form Requests

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** authorization, form-request, gates, policies, laravel

## Executive Summary
Phase 2 covers the `authorize()` method mechanics, policy integration, gate resolution, and the interaction between authorization and validation in the FormRequest lifecycle. Understanding the execution order and failure modes of authorization is critical to building secure API endpoints.

## Mental Models

- **authorize() as a Gatekeeper** — `authorize()` is a gatekeeper that runs before validation, preventing unauthorized actors from triggering any validation overhead.
- **Authorization as an Early Exit** — Authorization failures short-circuit the pipeline before any rules execute, following security-first design.
- **The Request as Security Boundary** — The FormRequest is the security boundary of the endpoint; `authorize()` enforces the "who" while `rules()` enforces the "what".
- **Policy as Delegated Authority** — `authorize()` delegates access decisions to Policy classes, separating access logic from request handling.

## Core Concepts

### Authorization Before Validation
`authorize()` executes **before** `rules()`. This is a security-first design — there is no point validating input from an unauthorized actor. A failed authorization short-circuits the entire validation pipeline and returns `403 Forbidden`.

### The authorize() Contract
```php
public function authorize(): bool
{
    return $this->user()->can('create', Post::class);
}
```

Return `true` to allow, `false` (or throw) to deny. The method receives the fully-resolved request, including authenticated user via `$this->user()`.

## Internal Mechanics

### Execution Flow
```
Request arrives
    → Middleware (auth:api)
    → Controller resolved → FormRequest auto-resolved
        → authorize() called
            → If false → HttpResponseException thrown → 403 response
            → If true → proceed to rules()
        → rules() resolved
        → Validator::make()
        → passes()/fails()
    → Controller method receives validated request
```

### Policy Resolution in authorize()
```php
public function authorize(): bool
{
    // Gate facade resolves the policy automatically
    return Gate::allows('update', $this->route('post'));
}
```

The `Gate` facade uses the model class to locate the corresponding `PostPolicy`. The route parameter (`$this->route('post')`) resolves the model via implicit or explicit route model binding.

### Throwing Authorization Exceptions
```php
public function authorize(): void
{
    $this->user()->can('create', Post::class)
        ?: throw new AuthorizationException('You are not an author.');
}
```

Throwing `AuthorizationException` directly allows custom messages. The exception is caught by `FormRequest` and converted to a 403 response.

## Patterns

### Resource Ownership Check
```php
public function authorize(): bool
{
    $post = $this->route('post');

    return $post && $this->user()->id === $post->user_id;
}
```

### Policy with Additional Context
```php
public function authorize(): bool
{
    return $this->user()->can('create', [
        Post::class,
        $this->input('data.attributes.team_id'),
    ]);
}
```

Pass additional context to the policy's `create` method as an array after the model class.

### Admin Bypass Pattern
```php
public function authorize(): bool
{
    if ($this->user()->hasRole('admin')) {
        return true;
    }

    return $this->user()->can('update', $this->route('post'));
}
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| authorize() in FormRequest vs Controller | Centralized with validation, single override point | Controller authorize() — duplicates concern across methods |
| Policy via Gate vs manual check | Framework-integrated, testable, reusable | Manual ownership check — not reusable across controllers |
| Return bool vs throw exception | Clean, declarative, testable | Throw AuthorizationException — requires try/catch in tests |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| authorize() before rules() | Prevents wasted validation on unauthorized requests | Cannot use input to determine authorization context |
| Route model binding in authorize() | Access to the resource being acted upon | Query runs even if authorization fails; consider lazy loading |
| Gate::allows() vs $user->can() | Both equivalent; Gate is explicit about the ability | One more facade import |

## Performance Considerations
- `authorize()` runs on every request to a guarded endpoint — ensure it does not make unnecessary queries.
- Use `Route::model()` binding to eager-load the resource in the route definition, avoiding a second query in `authorize()`.
- Avoid calling `$this->user()->load('roles.permissions')` inside `authorize()` — preload in middleware if needed.
- Cache policy instances; they are resolved per-request by the container.

## Production Considerations
- Log authorization failures with user ID, resource type, and action for audit trails.
- Do **not** distinguish between "resource not found" and "forbidden" in error responses to prevent information leakage.
- Override `failedAuthorization()` to return a consistent JSON error structure.
- Use `can:ability,model` middleware for simple gates to keep FormRequest authorization only for complex logic.

## Common Mistakes
- Using `$this->all()` in `authorize()` when the request body is JSON-encoded — use `$this->json()` or `$this->input()`.
- Calling `$this->user()` in `authorize()` before `auth` middleware runs — user is `null`.
- Forgetting to return a boolean — `authorize()` defaults to `false` if no return statement.
- Passing route key name instead of model instance to `can()`.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| authorize() null user | 403 Forbidden on authenticated routes | Ensure `auth:api` middleware is applied before controller |
| N+1 queries in authorize() | Slow endpoint under load | Eager load relationship in route binding or middleware |
| Policy not registered | `403` with `Action not allowed` | Register policy in `AuthServiceProvider` |
| Thrown exception swallowed | Silent 500 instead of 403 | Never catch `AuthorizationException` in custom failedValidation |

## Ecosystem Usage

### Laravel Policies
```php
class PostPolicy
{
    public function create(User $user, ?int $teamId = null): bool
    {
        return $user->teams()->where('id', $teamId)->exists();
    }
}
```

### Laravel Gates
```php
Gate::define('update-post', function (User $user, Post $post) {
    return $user->id === $post->user_id || $user->isAdmin();
});
```

### Spatie Laravel Permission
```php
public function authorize(): bool
{
    return $this->user()->hasAnyPermission(['create post', 'edit post']);
}
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — the request class structure that authorize() lives in.

### Related Topics
- **form-request-organization** — where authorize() interactions fit in resource-specific requests.
- **conditional-validation-patterns** — authorize() coupled with conditional rules.

### Advanced Follow-up Topics
- **dto-integration-payload-method** — authorized data flowing to DTOs.
- **after-validation-hooks** — post-validation processing after authorization has passed.

## Research Notes

### Source Analysis
Laravel's `ValidatesWhenResolvedTrait` calls `authorize()` before `rules()` in the `validateResolved()` method. If `authorize()` returns `false`, it throws `HttpResponseException` wrapping a 403 response created by `failedAuthorization()`.

### Key Insight
Placing authorization in the FormRequest makes it part of the **validation concern**, not the controller concern. This is architecturally pure — the request class owns both "who can do this" and "what data is valid" — but it can obscure authorization logic from developers who expect it in controllers.

### Version-Specific Notes
- Laravel 10: `authorize()` can return `boolean` or throw `AuthorizationException`.
- Laravel 11: No changes to authorize() behavior.
- PHP 8.2+: Union types allow `authorize(): bool|never` with throw pattern.
