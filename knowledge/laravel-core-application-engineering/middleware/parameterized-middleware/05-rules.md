# Phase 5: Rules — Parameterized Middleware

---

## Rule Name

Always Provide Default Values for Optional Middleware Parameters

---

## Category

Reliability

---

## Rule

When a middleware parameter is optional, the `handle()` method must declare a default value (`= null`, `= config(...)`). Never assume the parameter will always be provided in the middleware string.

---

## Reason

When middleware is used without a parameter string (e.g., `auth` instead of `auth:sanctum`), the Pipeline extracts no additional arguments. The `handle()` method receives only `$request` and `$next`. Without a default value, PHP throws a `TypeError` for missing arguments. This crash is silent from the caller's perspective — the route definition looks valid, but the middleware fails on every request.

---

## Bad Example

```php
class Authenticate
{
    public function handle(Request $request, Closure $next, string $guard): Response
    {
        if (! Auth::guard($guard)->check()) {
            throw new AuthenticationException;
        }
        return $next($request);
    }
}

// Route uses 'auth' without parameter — TypeError: too few arguments
Route::get('/dashboard', ...)->middleware('auth');
```

---

## Good Example

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

// Both work:
Route::get('/dashboard', ...)->middleware('auth');          // Uses default guard
Route::get('/api/user', ...)->middleware('auth:sanctum');   // Uses sanctum
```

---

## Exceptions

Middleware that is always used with parameters and has no meaningful default behavior may omit defaults, but should throw a clear `InvalidArgumentException` with a message explaining the required parameter.

---

## Consequences Of Violation

Reliability risks: fatal `TypeError` on every request when parameter is omitted. Debugging difficulty: the error may be attributed to the route rather than the middleware. Maintenance risks: adding a new route without the parameter causes a crash.

---

---

## Rule Name

Validate Middleware Parameters Early in handle()

---

## Category

Reliability

---

## Rule

Validate all parameters at the beginning of `handle()`. Reject invalid parameter values with a clear `InvalidArgumentException` or framework-specific exception. Never silently accept invalid parameters that produce incorrect behavior.

---

## Reason

Parameterized middleware accepts user-provided values from route definitions. An invalid guard name, role, or rate limit value causes the middleware to behave incorrectly — potentially bypassing security checks. Early validation provides immediate feedback during development (clear exception) and prevents silent security failures in production. Validation also documents the accepted parameter contract for future developers.

---

## Bad Example

```php
class CheckGuard
{
    public function handle(Request $request, Closure $next, string $guard = null): Response
    {
        // No validation — invalid guard name silently skips auth
        if (Auth::guard($guard)?->check()) {
            return $next($request);
        }
        abort(401);
    }
}

// Route with typo: 'sanktum' instead of 'sanctum' — silently uses null guard
Route::get('/api/user', ...)->middleware('auth:sanktum');
```

---

## Good Example

```php
class CheckGuard
{
    public function handle(Request $request, Closure $next, string $guard = null): Response
    {
        $guard = $guard ?? config('auth.defaults.guard');

        if (! in_array($guard, array_keys(config('auth.guards')))) {
            throw new InvalidArgumentException("Invalid auth guard: {$guard}");
        }

        if (! Auth::guard($guard)->check()) {
            throw new AuthenticationException;
        }

        return $next($request);
    }
}
```

---

## Exceptions

Middleware that delegates parameter validation to the consumed service (e.g., a RateLimiter that validates its own named limiters) may skip parameter validation in the middleware itself.

---

## Consequences Of Violation

Security risks: invalid parameters cause middleware to silently skip security checks. Debugging difficulty: a typo in a route definition produces no error — the route just has no protection. Maintenance risks: developers cannot determine valid parameter values from the middleware source.

---

---

## Rule Name

Use Named Limiters Instead of Numeric Parameters for Dynamic Rate Limits

---

## Category

Architecture

---

## Rule

For rate limits that depend on runtime state (user tier, subscription plan, IP reputation), use named limiters registered via `RateLimiter::for()`. Do not use numeric parameters in `throttle:60,1` for limits that vary per user or request.

---

## Reason

Numeric parameters (`throttle:60,1`) are static — they apply the same limit to every request using that route. For tier-based limits (free users: 10/min, premium users: 100/min), every route definition would need a different parameter, multiplied by the number of tiers. Named limiters centralize the tier-to-limit mapping in `RateLimiter::for('api', ...)`, where a closure can inspect the authenticated user and return the appropriate limit. This eliminates duplication and makes tier changes a single configuration update.

---

## Bad Example

```php
// Route definitions must be duplicated for each tier
Route::middleware('throttle:10,1')->group(function () {
    Route::get('/api/free/posts', [PostController::class, 'index']);
});

Route::middleware('throttle:100,1')->group(function () {
    Route::get('/api/premium/posts', [PostController::class, 'index']);
});
```

---

## Good Example

```php
// Single named limiter that inspects user tier
RateLimiter::for('api', fn (Request $request) =>
    Limit::perMinute(
        $request->user()?->isPremium() ? 100 : 10
    )->by($request->user()?->id ?: $request->ip())
);

// Single route — limit is resolved dynamically
Route::get('/api/posts', [PostController::class, 'index'])
    ->middleware('throttle:api');
```

---

## Exceptions

Rate limits that are genuinely universal (same limit for every request regardless of user) can use numeric parameters for simplicity.

---

## Consequences Of Violation

Maintenance risks: every tier change requires updating multiple route definitions. Scalability risks: route definition duplication increases with each tier. Configuration drift: different routes may accidentally use different limits for the same tier.

---

---

## Rule Name

Avoid Commas in Parameter Values

---

## Category

Reliability

---

## Rule

Never include commas in individual middleware parameter values. If a value naturally contains commas (structured data, multiple values), use semicolons, pipes, or JSON encoding as the delimiter instead.

---

## Reason

The Pipeline extracts parameters by splitting the parameter string on commas. A value containing a comma (e.g., `cache.headers:public,max_age=3600`) is split into two parameters (`public` and `max_age=3600`) instead of one (`public,max_age=3600`). This causes incorrect parameter binding and silent behavioral changes. The framework's `cache.headers` middleware uses semicolons as the delimiter within its parameter for this reason.

---

## Bad Example

```php
// Custom middleware expects a single parameter with comma-separated headers
// middleware handle(Request $request, Closure $next, string $headers): Response
// Route: 'custom:header1,header2,header3'
// Parameter string 'header1,header2,header3' is split by Pipeline into THREE parameters
```

---

## Good Example

```php
// Use semicolons as internal delimiter
// Route: 'custom:header1;header2;header3'
// Parameters: ['header1;header2;header3']

// In handle():
public function handle(Request $request, Closure $next, string $headerConfig): Response
{
    $headers = explode(';', $headerConfig);
    // ...
}
```

---

## Exceptions

No common exceptions. Middleware parameters must never contain unescaped commas.

---

## Consequences Of Violation

Reliability risks: parameter value is split incorrectly, causing middleware to receive wrong arguments. Debugging difficulty: the error is a parameter mismatch that may not produce an obvious error — values are just wrong.

---

---

## Rule Name

Rebuild Route Cache After Changing Middleware Parameters

---

## Category

Reliability

---

## Rule

After changing any middleware parameter in a route file (e.g., `throttle:60,1` to `throttle:120,1`), run `php artisan route:cache`. Never assume parameter changes take effect immediately when route caching is enabled.

---

## Reason

Route caching serializes the full middleware configuration, including parameter strings. At runtime, cached routes read the serialized string from the cache file, not the route file. Changing `throttle:60,1` to `throttle:120,1` in the route file without rebuilding the cache leaves the old `60,1` limit in effect. This is especially dangerous for security-sensitive parameters like rate limits, where the intended increase silently does not apply.

---

## Bad Example

```php
// Route file updated from throttle:60,1 to throttle:120,1
Route::post('/api/import', [ImportController::class, 'store'])
    ->middleware('throttle:120,1');

// route:cache was NOT rebuilt — old limit (60/min) still applies
```

---

## Good Example

```php
// 1. Update route file
Route::post('/api/import', [ImportController::class, 'store'])
    ->middleware('throttle:120,1');

// 2. Rebuild cache
// php artisan route:cache

// 3. Verify
```

---

## Exceptions

Development environments where route caching is not active do not require cache rebuilds. The rule applies to production, staging, and CI environments.

---

## Consequences Of Violation

Security risks: rate limit changes do not take effect. Reliability risks: intended parameter changes silently do not apply. Debugging difficulty: the discrepancy between the route file and cached behavior is not obvious.

---

---

## Rule Name

Use Variadic Parameters for Multiple Values Instead of Single Comma-Separated Parameters

---

## Category

Design

---

## Rule

When a middleware accepts a variable number of values of the same kind (multiple roles, multiple guards, multiple permissions), declare the parameter as variadic in the `handle()` signature: `string ...$values`. Do not accept a single comma-separated string and explode it in the method body.

---

## Reason

The Pipeline naturally passes each comma-separated value as a separate argument to `handle()`. A middleware route string `role:admin,editor,viewer` produces three arguments: `'admin'`, `'editor'`, `'viewer'`. Declaring the parameter as variadic (`string ...$roles`) collects all of them into an array automatically. Accepting a single string and using `explode(',', $param)` is redundant and loses the natural variadic behavior provided by the Pipeline.

---

## Bad Example

```php
class CheckRole
{
    // Single string parameter — developer must remember to explode
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $roles = explode(',', $roles);
        if (! in_array($request->user()?->role, $roles)) {
            abort(403);
        }
        return $next($request);
    }
}
```

---

## Good Example

```php
class CheckRole
{
    // Variadic — Pipeline passes each value as a separate argument
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! in_array($request->user()?->role, $roles)) {
            abort(403);
        }
        return $next($request);
    }
}

// Route: role:admin,editor,viewer
// $roles = ['admin', 'editor', 'viewer']
```

---

## Exceptions

Middleware that accepts structured parameter values (e.g., `cache.headers:public;max_age=3600`) where the entire string is a single value must use the single-string approach with manual parsing.

---

## Consequences Of Violation

Code redundancy: manual explode is unnecessary when the Pipeline already splits on commas. Maintenance risks: the explode pattern is inconsistent with how Laravel's own parameterized middleware works (e.g., `can:update,post` passes two arguments). Confusion: developers expect variadic parameters because that is the framework convention.
