# Middleware Parameters

## Metadata
- **ID:** ku-07-route-middleware-groups
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
Middleware parameters allow passing configuration data to middleware directly from route definitions using colon-delimited syntax (e.g., `'auth:api'`, `'throttle:60,1'`). This enables parameterized middleware that can be reused across different routes with different configurations — the same `auth` middleware can protect different guards, and the same `throttle` middleware can apply different rate limits.

## Core Concepts
- **Colon Syntax**: `'role:admin,editor'` — part after colon is split by comma into parameter array.
- **Parameter Passing**: Parameters are passed as additional arguments to `handle()` after `$request` and `$next`: `handle($request, $next, $guard, ...$others)`.
- **Varargs Support**: PHP's variadic arguments (`...$roles`) allow flexible parameter counts.
- **All Strings**: Parameters are always strings — no type coercion. `'throttle:true'` passes the string `"true"`, not boolean `true`.
- **parsePipeString()**: Method in `Illuminate\Pipeline\Pipeline` that handles parameter parsing.

## When To Use
- **Auth guard specification**: `'auth:api'`, `'auth:web'` — different guards for different routes.
- **Rate limiting**: `'throttle:60,1'` — 60 requests per minute.
- **Role/permission checks**: `'role:admin,editor'` — check multiple roles.
- **Feature flags**: `'feature:beta'` — enable feature-specific middleware behavior.
- **Reusable middleware**: Parameterized middleware is more reusable than hardcoded behavior.

## When NOT To Use
- **Complex configuration**: Arrays, objects, or boolean values — use dedicated middleware classes with constructor injection.
- **Sensitive data**: Parameters are visible in route definitions and cache files — don't pass secrets.
- **Single-use configuration**: If a middleware is used with the same parameters everywhere, hardcode the parameters inside the middleware.
- **Many parameters**: More than 3-4 parameters becomes hard to read — consider a configuration class.

## Best Practices (WHY)
- **Document parameter order clearly**: Parameters are positional — changing order is a breaking change. *Why: No named parameters — middleware signature must match documented order exactly.*
- **Use variadic parameters for optional arguments**: `handle($request, $next, ...$options)` handles any number of parameters gracefully. *Why: Variadic handles missing parameters without breaking; explicit arguments throw TypeError if too few.*
- **Compare parameters with string literals**: `$guard === 'api'` not `$guard == true`. Parameters are always strings. *Why: No type coercion — comparing with truthy values can produce unexpected results.*
- **Prefer middleware class with constructor injection for complex config**: If configuration is a class, use constructor DI instead of inline parameters. *Why: Constructor injection supports proper types, validation, and autocomplete.*

## Architecture Guidelines
- **Colon-delimited syntax**: URL-safe — colons and commas don't require encoding in route definitions.
- **Individual arguments over array**: Follows PHP function signature conventions; enables type-hinting individual parameters.
- **Parsing in Pipeline**: `parsePipeString()` runs in the Pipeline, not the router — parameterized middleware works in any Pipeline context (jobs, mail).
- **Route caching**: Serializes parsed parameters — eliminates per-request parsing overhead.

## Performance
- **Parameter parsing**: Simple string split — negligible overhead (~0.001ms per parameterized middleware).
- **Route caching**: Parsed parameters are serialized — no per-request parsing for cached routes.
- **Varargs vs explicit parameters**: Varargs adds marginal overhead — negligible for typical parameter counts.

## Security
- **Visible in route cache**: Parameters stored in plain text in cached route files. Don't pass secrets.
- **Parameter parsing edge cases**: Colon in class namespace conflicts with parameter syntax — rare but possible.
- **Too few parameters**: Middleware expects 3 arguments but receives 2 — PHP TypeError if type-hinted.
- **String truthiness**: `'true'` is truthy in PHP but `'false'` is also truthy — careful with string-to-boolean interpretation.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Passing boolean values as strings | `'throttle:true'` | Middleware gets string "true", not boolean true | Compare with string literal `=== 'true'` |
| Too few parameters for middleware | Forgetting required arguments | TypeError or unexpected null | Use variadic parameters for optional args |
| Colon in namespace path | Rare class name collision | Parameter parsing misinterprets class name | Use full class string without alias |
| Assuming integer parameter type | `throttle:60` passes string "60" | Auto-cast to int works in PHP | Type-cast in middleware: `(int) $maxAttempts` |

## Anti-Patterns
- **Over-parameterization**: Passing 6+ comma-separated values — hard to read and maintain. Use a configuration object.
- **Sensitive data in parameters**: API keys, secrets, tokens visible in route files and route cache.
- **Parameters for conditionals that belong in middleware**: `'auth:web'` is fine; `'process:true,false,true,false'` is not.
- **Hidden defaults**: Middleware has default parameter values but route definitions don't pass them — invisible configuration.

## Examples

```php
// Route definitions with parameterized middleware
Route::get('/admin', function () {
    // ...
})->middleware('role:admin,editor,super-admin');

Route::get('/api/user', function () {
    // ...
})->middleware('auth:api');

Route::post('/contact', function () {
    // ...
})->middleware('throttle:5,10'); // 5 requests per 10 minutes

// Middleware receiving parameters
class CheckRole
{
    public function handle($request, $next, ...$roles)
    {
        $user = $request->user();
        
        if (!$user || !in_array($user->role, $roles)) {
            abort(403, 'Unauthorized role.');
        }
        
        return $next($request);
    }
}

// Explicit parameter types (not variadic)
class ThrottleRequests
{
    public function handle($request, $next, $maxAttempts = '60', $decayMinutes = '1')
    {
        $maxAttempts = (int) $maxAttempts;
        $decayMinutes = (int) $decayMinutes;
        // ...
    }
}
```

## Related Topics
- **Pipeline Pattern Fundamentals**: Pipe parameter passing mechanism.
- **Middleware Aliases**: Colon-delimited alias syntax.
- **Route Middleware**: Parameterized alias usage in route definitions.
- **Middleware Configuration in Bootstrap**: Alias parameter registration.
- **Application Bootstrap**: Parameter parsing in route caching.

## AI Agent Notes
- The parameter parsing happens in `Illuminate\Pipeline\Pipeline::parsePipeString()`, not the router. This means parameterized middleware works in any Pipeline context (jobs, mail).
- Parameter parsing behavior has been stable since Laravel 5.x.
- Route caching serializes parsed parameters, eliminating per-request parsing for cached routes.
- The colon-delimited syntax was chosen for HTTP-header compatibility — colons and commas are URL-safe.

## Verification
- [ ] Create a parameterized middleware with variadic `...$params`
- [ ] Define a route with `'middleware:param1,param2'` and verify parameters reach middleware
- [ ] Test with type-hinted parameters (int, string) — observe auto-casting behavior
- [ ] Test missing parameters — observe default values or errors
- [ ] Verify parameter parsing works in non-HTTP Pipeline contexts (queue jobs)
- [ ] Cache routes with parameterized middleware — verify parsed parameters survive caching
