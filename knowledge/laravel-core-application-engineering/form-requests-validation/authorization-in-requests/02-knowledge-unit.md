# Authorization in Requests

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** Authorization in Requests
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Form Request authorization via the `authorize()` method provides an HTTP-layer access control gate that runs BEFORE validation. It integrates with Laravel's Gate/Policy system and gives each action a dedicated authorization check without cluttering the controller. The `authorize()` method runs as the second step in the validation pipeline — after input preparation but before rule validation — ensuring unauthorized requests are rejected before any processing occurs.

The engineering significance is that authorization logic is co-located with the input it protects (the request), not scattered across controllers or duplicated in middleware. Each action's authorization requirement is discoverable in a single method on the request class.

---

## Core Concepts

### The Authorization Gate

`authorize()` returns a boolean or a `Illuminate\Auth\Access\Response` instance. The return value determines whether the request is allowed:

```php
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'));
}
```

### Timing in the Pipeline

Authorization fires at a specific point in `validateResolved()`:

```
prepareForValidation() → passesAuthorization() → [DENY] → failedAuthorization() → 403
```

Authorization runs BEFORE any validation rules. This is by design — an unauthorized user should never have their input validated, and validation errors should never leak information to unauthorized users.

### Return Types

`authorize()` supports three return types:
- `true` — authorized, pipeline continues to validation
- `false` — denied, throws `AuthorizationException` (403 response)
- `Illuminate\Auth\Access\Response` — allows Gate-style responses with custom messages via `Response::deny('Reason')`

---

## Mental Models

### The Bouncer

`authorize()` is the bouncer at the door. Before anyone enters (validation), the bouncer checks ID (authorization). The controller never sees an uninvited guest.

### The Pre-Filter

Authorization ensures that only permitted users reach the validation rules. This prevents information leakage — an unauthorized user cannot probe validation rules to infer data about resources they cannot access.

---

## Internal Mechanics

### passesAuthorization() Resolution

The method is resolved through the container, enabling dependency injection:

```php
protected function passesAuthorization()
{
    if (method_exists($this, 'authorize')) {
        $result = $this->container->call([$this, 'authorize']);

        return $result instanceof Response
            ? $result->authorize()
            : $result;
    }

    return true;  // Default: authorized
}
```

Key behavior:
- If `authorize()` is not defined, the request is authorized by default
- `Response` instances are evaluated via `$response->authorize()`, which throws on denial
- No-argument `authorize()` is called via container, enabling method injection

### failedAuthorization() Exception

```php
protected function failedAuthorization()
{
    throw new AuthorizationException;
}
```

`AuthorizationException` maps to an HTTP 403 response via Laravel's exception handler. The `internalDontReport` list includes `AuthorizationException::class` — it is never logged.

### Integration with Gates and Policies

Authorize commonly delegates to Laravel's authorization system:

```php
public function authorize(): bool
{
    return $this->user()->can('create', Post::class);
}
```

The `$this->user()` call returns the authenticated user from the underlying `Request` class. The second argument can be a model instance (for Policy checks) or a class name.

### Route Parameter Access

FormRequest has access to the current route via `$this->route()`:

```php
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'));
}
```

The route parameter name matches the route definition's `{post}` binding, resolved through implicit or explicit route model binding before the FormRequest is constructed.

### Overriding Failed Authorization

Override `failedAuthorization()` to customize the response:

```php
protected function failedAuthorization()
{
    throw new AuthorizationException('You do not own this post.');
}
```

The message can be customized per-request type, providing context-specific denial reasons without modifying the global exception handler.

---

## Patterns

### Policy Delegation

The standard pattern delegates to a Policy method:

```php
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'));
}
```

This keeps authorization logic in Policies (alongside business rules) and the FormRequest acts as a thin authorization proxy.

### Multi-Condition Authorization

For complex authorization that combines several checks:

```php
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'))
        && ! $this->route('post')->isLocked();
}
```

A Rule of thumb: if authorization logic exceeds 3-4 lines, extract it into the Policy method rather than the FormRequest.

### Guest-Accessible Endpoints

For endpoints that both guests and authenticated users can access:

```php
public function authorize(): bool
{
    return true;  // Anyone can submit a contact form
}
```

---

## Architectural Decisions

### authorize() vs Middleware Authorization

| Aspect | authorize() | Middleware |
|--------|------------|------------|
| Scope | Single action | Route group or controller |
| Rule access | Full request + route data | Request object only |
| Model binding | Available (route params) | Manual resolution |
| Code location | Per-request class | Centralized in kernel |
| Reusability | Per-action | Cross-action |

Use `authorize()` for action-specific permission checks (e.g., "can the current user update this specific Post?"). Use middleware for role-based gates (e.g., "is the user an admin?").

### authorize() vs Controller authorize()

```php
// FormRequest
public function authorize(): bool
{
    return $this->user()->can('update', $post);
}

// Controller
$this->authorize('update', $post);
```

The FormRequest version moves authorization to the request layer, keeping controllers focused on orchestration. The controller version is explicit but adds noise to every action. FormRequest authorization is preferred for consistency.

---

## Tradeoffs

### authorize() vs FormRequest with Separate Middleware

Keeping authorization in `authorize()` centralizes access logic with the request it protects. The tradeoff is that `authorize()` cannot be reused across different HTTP methods for the same resource — a `StorePostRequest` and `UpdatePostRequest` each define their own `authorize()` even if the underlying permission logic is identical. Middleware-based authorization, by contrast, applies a single gate across multiple routes.

### Early Exit vs Validation Leakage

Authorizing before validation prevents information leakage — an unauthorized user cannot probe validation rules to infer data. The tradeoff is performance: database queries for authorization run before validation runs. For endpoints where validation is cheap and authorization is expensive (e.g., multi-query policy checks), the authorization check runs even for trivially invalid requests. Consider warming authorization data or deferring expensive checks when the cost of early authorization outweighs the security benefit.

## Performance Considerations

### Authorization Query Timing

`authorize()` runs before validation. If the request body has validation errors, the authorization query was executed unnecessarily. For endpoints with complex authorization policies involving multiple database queries, this can add measurable latency to every rejected request. Profile authorization-heavy FormRequests to determine whether the pre-validation authorization cost is acceptable.

### Gate Caching

Laravel's Gate results are not cached by default. If `authorize()` calls `$this->user()->can()` multiple times within the same request lifecycle (e.g., the controller also calls `$this->authorize()`), the database queries repeat. Use `Gate::before()` with a memory cache in the same request to avoid redundant policy resolutions for the same permission check.

---

## Production Considerations

### Authorization Audit Trail

In production, failed authorization attempts should be logged for security monitoring. Override `failedAuthorization()` to emit structured audit events with user ID, IP address, requested action, and timestamp. This data is critical for detecting brute-force attempts or privilege escalation patterns.

### Custom 403 Response Format

API consumers expect consistent error shapes. Override `failedAuthorization()` to return a JSON response with a structured error code (e.g., `"unauthorized"` or `"forbidden"`) alongside the HTTP 403 status. Avoid leaking whether the user was unauthenticated (401) or unauthorized (403) in the response body when the distinction itself is a security concern.

### AuthorizationException Suppression

`AuthorizationException` is in Laravel's `internalDontReport` list, meaning it never appears in production logs. For compliance requirements, explicitly log authorization denials before throwing the exception. Ensure the logging call uses a channel that reports separately from the main exception log.

---

## Common Mistakes

### Database Queries in authorize()

Authorization that queries the database in `authorize()` runs BEFORE validation. If the request body is malformed, the query was wasted. For expensive auth checks, consider validating first, then authorizing, by moving authorization to a dedicated step after validation.

### Info Leakage via Custom Messages

Custom `failedAuthorization()` messages can reveal system state. A message like "User 42 cannot edit user 7's post" leaks the existence of user 42 and user 7. Use generic messages or log details but return a generic 403.

### Missing authorize() for Admin Actions

It's easy to forget `authorize()` on admin-only FormRequests since the developer "knows" only admins can reach the route. Always define an explicit `authorize()` — default behavior is `return true`, which grants access to everyone.

---

## Failure Modes

### AuthorizationException in Production

`AuthorizationException` is in Laravel's `internalDontReport` list — it will never appear in logs. For auditing purposes, override `failedAuthorization()` to log the denial:

```php
protected function failedAuthorization()
{
    Log::warning('Authorization denied', [
        'user_id' => $this->user()?->id,
        'action' => static::class,
    ]);
    throw new AuthorizationException;
}
```

### Route Parameter Resolution Failure

If the route parameter (`$this->route('post')`) is not resolved before the FormRequest validates, the authorization call will receive null. Ensure route model binding is configured to resolve the parameter before the controller dispatch step, which is the default behavior for implicit binding.

---

## Ecosystem Usage

### Laravel Nova

Nova uses FormRequest authorization extensively for resource management. Each Nova resource tool calls `authorize()` on the corresponding FormRequest to check `viewAny`, `view`, `create`, `update`, `delete`, and `restore` permissions. Nova's `Lens` and `Action` classes also implement the `authorize()` pattern, allowing custom authorization logic per action.

### Laravel Jetstream

Jetstream's team invitation flow uses `authorize()` to verify that the current user can invite new members to a team. The `TeamInvitationRequest` checks both the team membership and the role-based permission to send invitations, co-locating the invitation authorization with the invitation data validation.

### Laravel Spark

Spark's billing portal uses `authorize()` to ensure users can only access their own subscription data. The `SubscriptionRequest` checks that the authenticated user owns the subscription before allowing plan changes or cancellations, preventing cross-account billing manipulation.

---

## Related Knowledge Units

- **Form Request Fundamentals** (this subdomain) — the validation pipeline
- **Custom Validation Rules** (this subdomain) — rules that also enforce authorization
- **Middleware Cross-Cutting Concerns** (middleware subdomain) — middleware-level authorization
- **Route Model Binding — Implicit** (routing subdomain) — how route parameters are resolved

---

## Research Notes

### Container Resolution of authorize()

The `authorize()` method is resolved through the container (`$this->container->call([$this, 'authorize'])`), which means method injection works. This is less commonly known — developers typically use `$this->route()` or `$this->user()` inside `authorize()`, but constructor injection is also viable for shared dependencies.

### Future Direction — Attribute-Based Authorization

PHP 8 attributes could provide a declarative authorization syntax for FormRequests in future Laravel versions. An `#[Authorize('update', Post::class)]` attribute on the FormRequest class would eliminate the `authorize()` method boilerplate and make authorization requirements visible at a glance.

### Framework Source Reference
- `Illuminate\Foundation\Http\FormRequest::passesAuthorization()` — authorization resolution
- `Illuminate\Auth\Access\Response` — gate response object
- `Illuminate\Foundation\Http\FormRequest::failedAuthorization()` — default 403 handler
