# ECC Standardized Knowledge — Parameterized Middleware

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Parameterized Middleware |
| **Difficulty** | Advanced |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

Parameterized middleware extends the standard middleware pattern by accepting configuration parameters through the middleware string specification. Instead of hardcoding guard names, rate limits, or authorization abilities, parameterized middleware reads these from the route definition — `auth:sanctum`, `throttle:60,1`, `can:update,post` — enabling a single middleware class to serve multiple configurations across different routes.

The engineering significance of parameterized middleware is that it eliminates configuration duplication. Without parameters, every unique middleware configuration requires a new route registration. The parameter extraction mechanism (colon-delimited syntax parsed by the Pipeline) is the same mechanism used by Laravel's own middleware, providing a consistent pattern for custom implementations.

---

## Core Concepts

### Colon-Separated Parameter Syntax

Middleware parameters are specified after a colon in the middleware string: `middlewareName:param1,param2,param3`. Examples: `auth:sanctum` (one parameter: guard name), `throttle:60,1` (two parameters: max attempts, decay minutes), `can:update,App\Models\Post` (two parameters: ability, model class).

### Parameter Extraction in the Pipeline

The `Pipeline::carry()` method extracts parameters: split on the first colon (`explode(':', $pipe, 2)`), everything after the colon is the parameter string, split on commas. Extracted parameters are appended to `handle()`'s argument list after `$request` and `$next`.

### The handle() Signature with Parameters

The middleware's `handle()` method declares parameters as additional arguments: `public function handle(Request $request, Closure $next, string $guard = null): Response`. Parameters are positional — the first parameter after the colon maps to the third argument of `handle()`.

### Default Values for Optional Parameters

If a middleware is used without parameters (e.g., `auth` instead of `auth:sanctum`), the `handle()` method receives no additional arguments. The middleware must declare default values for optional parameters to avoid TypeError.

---

## When To Use

- **Guard selection pattern** (`auth:sanctum`, `auth:web`) when a single middleware class must support multiple authentication guards.
- **Rate limit configuration pattern** (`throttle:60,1`) when different endpoints require different rate limits.
- **Authorization ability pattern** (`can:update,post`) when fine-grained policy authorization is configured per route.
- **Cache header pattern** (`cache.headers:public;max_age=3600;etag`) when caching behavior varies per route.
- **Custom parameterized middleware** when a middleware's behavior differs only in configuration values, not in logic.

---

## When NOT To Use

- Do NOT use parameters for complex configuration that would create unreadable route definitions — use named limiters, service provider configuration, or separate middleware classes.
- Do NOT use parameters when the configuration value depends on runtime state (user tier, subscription plan) — use named resolvers or dynamic configuration.
- Do NOT use parameters when the middleware logic differs fundamentally per configuration — create separate middleware classes for fundamentally different behaviors.
- Do NOT assume parameters are always present — always provide default values or null fallbacks for optional parameters.

---

## Best Practices (WHY)

- **Validate parameters early in handle().** Invalid parameters cause runtime errors. Validate them immediately to provide clear error messages: `if (! in_array($guard, ['web', 'api'])) { throw new InvalidArgumentException(...); }`.
- **Document the parameter contract.** Every parameterized middleware should document: the parameter syntax, accepted values, and default behavior when no parameters are provided. This is essential for team onboarding.
- **Use named limiters for dynamic rate limits.** Numeric parameters (`throttle:60,1`) are static. For user-tier-based limits, register a named limiter via `RateLimiter::for('api', ...)` and use `throttle:api`.
- **Use variadic parameters for multiple values.** For middleware that accepts multiple values (multiple guards, multiple roles), use `string ...$guards` in the handle() signature.
- **Re-run `route:cache` after parameter changes.** Cached routes use parameter values from the last cache build. Changing parameter values requires a cache rebuild.

---

## Architecture Guidelines

- **Parameter parsing:** Split on first colon only (`explode(':', $pipe, 2)`). Everything after is the parameter string. Split on commas for individual parameters. Multiple colons: `middleware:param1:param2` → second colon is part of the value.
- **Optional parameters:** `public function handle(Request $request, Closure $next, string $guard = null): Response`. Default values prevent TypeError when the middleware is used without parameters.
- **Variadic parameters:** `public function handle(Request $request, Closure $next, string ...$guards): Response`. Useful for multiple guards or multiple roles.
- **Route caching:** Parameters are serialized as part of the route configuration. `auth:sanctum` is stored as the string `'auth:sanctum'` in the cached route's middleware array.
- **Alias resolution:** Middleware aliases are resolved to FQCNs before parameter extraction. Parameters after the alias are passed to the resolved class.
- **Parameters vs separate classes:** Parameterized middleware is almost always the right choice for concerns that differ only in configuration values (guard names, rate limits, permissions).

---

## Performance

Parameter extraction (splitting on `:` and `,`) adds negligible overhead (~0.001ms per middleware). For route-cached applications, parameters are pre-parsed at cache build time. Named limiter resolution adds ~0.01ms per call via `RateLimiter::for()`. Variadic parameters create a variable-length array (~0.001ms allocation). None of these are performance concerns.

---

## Security

Parameterized middleware must validate parameters to prevent injection or misuse. A middleware that accepts a guard name must verify the guard is valid — an invalid guard could bypass authentication or expose data. Validate parameters against a whitelist of accepted values. Parameter values that affect security (throttle limits, authorization abilities) should be reviewed as part of the route definition. Route caching stores parameter values — ensure they are not environment-specific.

---

## Common Mistakes

- **Comma in parameter value.** If a parameter value contains a comma, the pipeline splits it into multiple parameters. Use alternative delimiters (semicolons) for structured values: `cache.headers:public;max_age=3600` is a single parameter.
- **Missing default values.** A middleware that accepts an optional parameter without a default value throws a `TypeError` when the parameter is omitted. Always provide defaults for optional parameters.
- **Assuming parameter is always present.** Middleware code accessing parameters without checking for null or providing fallback logic errors when the middleware is used without parameters.
- **Overloading parameters with too much data.** Passing JSON, long strings, or multiple values through the colon-delimited syntax creates unreadable route definitions. Use named limiters or separate middleware classes.
- **Changing parameters without rebuilding route cache.** After changing a parameter in a route file, the old value persists in the route cache. Must re-run `route:cache`.

---

## Anti-Patterns

- **Using environment variables in route definitions.** Route files are static — `throttle:${MAX_ATTEMPTS},1` does not read from `.env`. Parameter values are fixed at route definition time.
- **Middleware class name containing a colon.** If the middleware class name contains a colon (namespaced middleware in some conventions), the Pipeline splits the class name erroneously. Register an alias that avoids colons.
- **Numeric parameters for user-tier-based limits.** `throttle:10,1` applies the same 10-request limit to all users. For tier-based limits (free users: 10/hr, premium users: 100/hr), use named limiters.
- **Route parameter mismatch with `can:` middleware.** The second parameter of `can:update,post` must match the route parameter name (e.g., `{post}`), not the model class name.

---

## Examples

### Guard Selection Pattern
```php
class Authenticate
{
    public function handle(Request $request, Closure $next, string $guard = null): Response
    {
        $guard = $guard ?? config('auth.defaults.guard');
        if (! Auth::guard($guard)->check()) {
            throw new AuthenticationException;
        }
        return $next($request);
    }
}

// Usage
Route::get('/api/user', ...)->middleware('auth:sanctum');
Route::get('/login', ...)->middleware('auth:web');
```

### Rate Limit Configuration Pattern
```php
// Usage
Route::post('/login', ...)->middleware('throttle:10,1');     // 10 per minute
Route::post('/api/posts', ...)->middleware('throttle:60,1'); // 60 per minute
```

### Named Limiter Pattern (Alternative)
```php
RateLimiter::for('api', fn (Request $request) =>
    Limit::perMinute(60)->by($request->user()?->id ?: $request->ip())
);

Route::middleware('throttle:api')->group(function () {
    // All API routes use the 'api' named limiter
});
```

### Custom Parameterized Middleware
```php
class CheckRoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user() || ! in_array($request->user()->role, $roles)) {
            abort(403);
        }
        return $next($request);
    }
}

// Usage in route
Route::get('/admin', ...)->middleware('role:admin,super-admin');
```

---

## Related Topics

- **Custom Middleware** (prerequisite) — creating middleware that uses parameters.
- **Middleware Fundamentals** (prerequisite) — the Pipeline pattern and handle() contract.
- **Middleware Ordering and Priority** — how parameterized middleware fits into the execution order.
- **Global, Route Group, and Route Middleware** — where parameterized middleware is registered.
- **Rate Limiting** — named limiters as an alternative to numeric parameters.
- **Request Transformation** — middleware that uses parameters to configure request modification.
- **Response Transformation** — middleware that uses parameters to configure response decoration.
- **Middleware Testing** — testing parameterized middleware with different parameter values.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Custom Middleware (prerequisite). Serves as prerequisite for middleware-testing.
- **Colon-delimited syntax:** Split on first colon (`explode(':', $pipe, 2)`), everything after is parameters, split on commas.
- **Third argument and beyond:** Parameters are appended to `handle()`'s argument list after `$request` and `$next`.
- **Default values:** Always provide defaults for optional parameters to prevent TypeError.
- **Route caching:** Parameters are pre-parsed at cache build time. Changing parameters requires `route:cache` rebuild.
- **Named limiters** (`throttle:api`) are preferred over numeric parameters for dynamic limits.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Colon-delimited syntax documented | ✓ |
| Parameter extraction mechanics explained | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Optional parameter handling | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples | ✓ |
| Related topics mapped | ✓ |
