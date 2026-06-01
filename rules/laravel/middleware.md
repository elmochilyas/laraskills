---
paths:
  - "**/*.php"
---

# Laravel 13 Middleware Rules

> This file extends [common/patterns.md](../common/patterns.md) with Middleware-specific rules.

## Single Responsibility

Each middleware performs exactly one task:

```php
// GOOD
class Authenticate
class LoadTenant
class CheckSubscription

// BAD — does everything
class UserMiddleware
```

## Global vs Route Middleware

- **Global** — cross-cutting infrastructure (CORS, security headers, maintenance mode, trusted proxies)
- **Route** — domain-specific concerns (auth, authorization, rate limiting, tenant loading, feature flags)

## Middleware Ordering

Order matters. Incorrect ordering causes security issues:

```text
CORRECT:
1. Authenticate
2. LoadTenant
3. CheckPermissions
4. CheckSubscription

INCORRECT:
1. CheckSubscription  ← runs before auth? Security hole
2. Authenticate
3. LoadTenant
```

## Pipeline Mechanics

Middleware can:
- Pass request deeper (`return $next($request)`)
- Modify request before passing
- Return response early (short-circuit)
- Modify response after it returns

## Thin Controllers

Controllers only: receive request, validate, authorize, call action, return response.

**No business logic in controllers.**

## Route Model Binding

Always prefer implicit or explicit route model binding over manual `findOrFail`:

```php
// GOOD
Route::get('/users/{user}', function (User $user) { ... });

// BAD
public function show(string $id) {
    return User::findOrFail($id);
}
```

## See Also

- Skill: `laravel-core-internals` for request lifecycle
- Skill: `laravel-patterns` for controller patterns
- Rule: `rules/laravel/architecture.md` for full architecture flow
