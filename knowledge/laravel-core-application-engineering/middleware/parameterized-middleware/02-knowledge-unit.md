# Parameterized Middleware

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Parameterized Middleware
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Parameterized middleware extends the standard middleware pattern by accepting configuration parameters through the middleware string specification. Instead of hardcoding guard names, rate limits, or authorization abilities, parameterized middleware reads these from the route definition — `auth:sanctum`, `throttle:60,1`, `can:update,post` — enabling a single middleware class to serve multiple configurations across different routes.

The engineering significance of parameterized middleware is that it eliminates configuration duplication. Without parameters, every unique middleware configuration requires a new route registration — a separate middleware class for `auth:sanctum`, `auth:web`, `throttle:60,1`, and `throttle:200,1`. With parameters, one middleware class handles all variants. The parameter extraction mechanism (colon-delimited syntax parsed by the Pipeline) is the same mechanism used by Laravel's own middleware, providing a consistent pattern for custom implementations.

---

## Core Concepts

### The Colon-Separated Parameter Syntax
Middleware parameters are specified after a colon in the middleware string:

```
middlewareName:param1,param2,param3
```

Examples:
- `auth:sanctum` — one parameter: guard name
- `auth:web,api` — two parameters: guard names
- `throttle:60,1` — two parameters: max attempts, decay minutes
- `can:update,App\Models\Post` — two parameters: ability, model class
- `cache.headers:public;max_age=3600;etag` — semicolons within a single parameter

### Parameter Extraction in the Pipeline
The `Pipeline::carry()` method extracts parameters when resolving the middleware:

```php
// From Pipeline.php (simplified)
if (str_contains($pipe, ':')) {
    [$class, $parameterString] = explode(':', $pipe, 2);
    $parameters = explode(',', $parameterString);
} else {
    $class = $pipe;
    $parameters = [];
}

$pipeInstance = Container::getInstance()->make($class);
$allParameters = [$passable, $stack, ...$parameters];
return $pipeInstance->handle(...$allParameters);
```

The extracted parameters are appended to the `handle()` method's argument list after `$request` and `$next`.

### The handle() Signature with Parameters
The middleware's `handle()` method declares parameters as additional arguments:

```php
public function handle(Request $request, Closure $next, string $guard = null): Response
{
    // $guard is the first parameter after the colon
}
```

Parameters are positional — the first parameter after the colon maps to the third argument of `handle()`.

---

## Mental Models

### Middleware as Configurable Gate
A parameterized middleware is a configurable gate. The gate checks a condition (auth, role, throttle), and the parameters tell it which guard, which role, or which limit to apply. Without parameters, you would need a separate gate for each configuration.

### String Parameters as DSL
The colon-delimited syntax is a mini-DSL (domain-specific language) embedded in the route definition. The DSL expresses: "run this middleware class with these parameters." The route definition becomes self-documenting — `throttle:60,1` communicates "limit to 60 attempts per minute" without reading the middleware source.

### Parameters as Compile-Time Configuration
Middleware parameters are resolved at route compilation time (for route caching) or at request time (for uncached routes). They are not dynamic — they cannot be changed per-request based on runtime conditions. If a parameter value varies per request, use a named limiter or a custom resolver instead of middleware parameters.

---

## Internal Mechanics

### Parameter Parsing Details
The parsing follows these rules:
1. The middleware string is split on the FIRST colon only (`explode(':', $pipe, 2)`).
2. Everything after the colon is the parameter string.
3. The parameter string is split on commas to produce individual parameters.
4. Parameters are passed as additional arguments to `handle()`.

Multiple colons: `middleware:param1:param2` splits into `['middleware', 'param1:param2']` — the second colon is part of the parameter value.

### Default Values for Optional Parameters
If a middleware is used without parameters (e.g., `auth` instead of `auth:sanctum`), the `handle()` method receives no additional arguments. The middleware must declare default values for optional parameters:

```php
public function handle(Request $request, Closure $next, string $guard = null): Response
{
    $guard = $guard ?? config('auth.defaults.guard'); // Fallback to default
}
```

### Multiple Guards Syntax
Multiple guards are passed as comma-separated parameters:

```
auth:web,api
```

The handle method receives two parameters: `'web'` and `'api'`. These can be variadic:

```php
public function handle(Request $request, Closure $next, string ...$guards): Response
{
    foreach ($guards as $guard) {
        if (Auth::guard($guard)->check()) {
            Auth::shouldUse($guard);
            return $next($request);
        }
    }
    // None of the guards authenticated the user
    $this->unauthenticated($request, $guards);
}
```

### Route Caching and Parameters
When routes are cached via `route:cache`, middleware parameters are serialized as part of the route configuration. `auth:sanctum` is stored as the string `'auth:sanctum'` in the cached route's middleware array. No additional resolution is needed at request time — parameters are pre-parsed.

---

## Patterns

### Guard Selection Pattern
Select which authentication guard to use:

```php
Route::get('/api/user', ...)->middleware('auth:sanctum');
Route::get('/login', ...)->middleware('auth:web');
```

- **Purpose**: Support multiple auth guards with a single middleware class.
- **Benefits**: One `Authenticate` middleware handles all guards — no separate middleware per guard.
- **Tradeoffs**: Guard name is hardcoded in the route definition — changing guard names requires route updates.

### Rate Limit Configuration Pattern
Set per-route rate limits:

```php
Route::post('/login', ...)->middleware('throttle:10,1');     // 10 per minute
Route::post('/api/posts', ...)->middleware('throttle:60,1');  // 60 per minute
Route::post('/api/webhook', ...)->middleware('throttle:200,1'); // 200 per minute
```

- **Purpose**: Different endpoints have different rate limit requirements.
- **Benefits**: One `ThrottleRequests` middleware handles all limits.
- **Tradeoffs**: Numeric limits are static — for user-tier-based limits, use named limiters.

### Named Limiter Pattern (Rate Limiting Alternative)
Replace numeric parameters with a named limiter:

```php
RateLimiter::for('api', fn (Request $request) =>
    Limit::perMinute(60)->by($request->user()?->id ?: $request->ip())
);

Route::middleware('throttle:api')->group(function () {
    // All API routes use the 'api' named limiter
});
```

- **Purpose**: Centralize rate limit logic with dynamic limits based on user, tier, or IP.
- **Benefits**: Limits are computed at runtime, not hardcoded in route definitions.
- **Tradeoffs**: Named limiters must be registered before they are used — usually in `AppServiceProvider` or `RouteServiceProvider`.

### Authorization Ability Pattern
Pass the authorization ability and model:

```php
Route::put('/posts/{post}', ...)->middleware('can:update,post');
Route::delete('/posts/{post}', ...)->middleware('can:delete,post');
```

- **Purpose**: Gate access based on policies with per-route ability specification.
- **Benefits**: Policy methods are resolved dynamically — no hardcoded ability-to-route mapping.
- **Tradeoffs**: The route parameter name (`post`) must match the controller method parameter or the route binding key.

### Cache Header Pattern
Configure cache behavior with semicolon-delimited directives:

```php
Route::get('/posts', ...)->middleware('cache.headers:public;max_age=3600;etag');
```

- **Purpose**: Set `Cache-Control` headers with configurable directives.
- **Benefits**: Cache configuration lives with the route, not in middleware code.
- **Tradeoffs**: Semicolons within a single parameter (not comma-delimited — the entire `public;max_age=3600;etag` is one parameter).

---

## Architectural Decisions

### Parameters vs Separate Middleware Classes
The decision to use parameters versus creating separate middleware classes:

| Approach | When to Use |
|----------|-------------|
| Parameterized (one class, many configs) | The middleware logic is identical; only configuration differs. Guard selection, rate limits, permissions. |
| Multiple classes (one per config) | The middleware logic differs per configuration. Different checks, different short-circuit behavior, different response handling. |

Parameterized middleware is almost always the right choice for concerns that differ only in configuration values. Creating separate middleware classes for `AuthSanctum` and `AuthWeb` duplicates logic unnecessarily.

### Parameters vs Named Resolvers
For rate limiting, Laravel provides both parameterized (`throttle:60,1`) and named (`throttle:api`) approaches. Named resolvers are preferred when:
- The limit value depends on runtime state (user tier, team size, subscription plan).
- The limit should be centralized in one location, not scattered across route definitions.
- The limit configuration changes frequently and should not require route file updates.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| One middleware class handles many configurations | Parameters are strings — no type safety | Validate parameters in the middleware constructor or handle() first lines |
| Route definitions are self-documenting | Parameters are hardcoded in route files | Changing a limit requires updating all route definitions with that parameter |
| Route-cache compatible — parameters are serialized | Parameters are static per route definition | Use named resolvers for dynamic parameters |
| Comma-delimited syntax is simple and familiar | Commas within parameter values cause unwanted splits | Use alternative delimiters (semicolons) for structured parameter values |

---

## Performance Considerations

### Parameter Parsing Overhead
Parameter extraction (splitting on `:` and `,`) adds negligible overhead — ~0.001ms per middleware. For route-cached applications, parameters are pre-parsed at cache build time, not at request time.

### Named Limiter Resolution
Named limiters require a service provider registration and runtime resolution via `RateLimiter::for()`. The resolution adds ~0.01ms per call. This is still negligible but slightly more expensive than static numeric parameters.

### Variadic Parameters
Middleware that uses variadic parameters (`string ...$guards`) creates a variable-length array. The array allocation adds ~0.001ms per middleware call. Not a performance concern.

---

## Production Considerations

### Parameter Validation
Middleware that accepts parameters should validate them early in `handle()`:

```php
public function handle(Request $request, Closure $next, string $guard): Response
{
    if (! in_array($guard, ['web', 'api', 'sanctum'])) {
        throw new InvalidArgumentException("Invalid guard: {$guard}");
    }
    // ...
}
```

Invalid parameters cause runtime errors — validate them immediately to provide clear error messages.

### Documenting Parameter Contracts
Every parameterized middleware should document:
1. The parameter syntax (e.g., `throttle:max_attempts,decay_minutes`).
2. Accepted values for each parameter (e.g., `web`, `api`, `sanctum` for auth).
3. Default behavior when no parameters are provided.

### Route Caching and Parameter Changes
When parameters are changed in route definitions, `route:cache` must be re-run. Cached routes use the parameter values from the last cache build. This is standard route caching behavior, but teams should be aware that middleware parameter changes (like rate limit numbers) require a cache rebuild.

---

## Common Mistakes

### Comma in Parameter Value
If a parameter value contains a comma (e.g., a description string), the pipeline splits it into multiple parameters. Workaround: use a different delimiter or encode commas:

```php
// Wrong: param1,param2 splits on comma
'middleware:value with, comma,another'

// Fix: use URL encoding or semicolons
'middleware:public;max_age=3600'  // Single parameter: "public;max_age=3600"
```

### Missing Default Values
A middleware that accepts an optional parameter without a default value throws a `TypeError` when the parameter is omitted:

```php
// Wrong: no default, fails when used as 'auth' without ':guard'
public function handle(Request $request, Closure $next, string $guard): Response

// Correct: default null for optional parameter
public function handle(Request $request, Closure $next, string $guard = null): Response
```

### Assuming Parameter Is Always Present
Middleware code that accesses parameters without checking for null or providing fallback logic will error when the middleware is used without parameters. Always handle the no-parameter case.

### Overloading Parameters with Too Much Data
Passing complex configuration (JSON, long strings, multiple values) through the colon-delimited syntax creates unreadable route definitions. For complex configuration, use named limiters, service provider configuration, or separate middleware classes.

---

## Failure Modes

### Parameter Parsing Mismatch Between Environments
A middleware that relies on environment-specific parameters (e.g., `throttle:${MAX_ATTEMPTS},${DECAY_MINUTES}`) cannot use environment variables in the route definition because route files are static. The parameter value is fixed at route definition time.

### Route Cache Stale Parameters
After changing a middleware parameter in a route file, the old parameter value persists in the route cache. The developer must re-run `route:cache`. If forgotten, the old parameter value continues to be used silently.

### Middleware Class Not Found After Parameter Extraction
If the middleware class name contains a colon (namespaced middleware in some conventions), the Pipeline splits the class name erroneously. Use fully qualified class names without colons, or register an alias that avoids colons.

---

## Ecosystem Usage

### Laravel Framework Built-in
Several built-in middleware use parameters:

| Middleware | Syntax | Parameters |
|-----------|--------|------------|
| Authenticate | `auth:guard` | Guard name (optional, defaults to config) |
| ThrottleRequests | `throttle:attempts,decay` or `limiter` | Attempts and decay minutes, or named limiter |
| Authorize (can) | `can:ability,model` | Policy ability and route parameter name |
| SetCacheHeaders | `cache.headers:directives` | Cache control directives (semicolon-delimited) |
| AuthenticateSession | `auth.session` | No parameters (confirms password) |
| ValidateSignature | `signed` | No parameters (validates URL signature) |

### Spatie Laravel Permission
Provides parameterized middleware for roles and permissions:
- `role:admin,super-admin` — check user has any of the specified roles
- `permission:edit articles` — check user has the specified permission
- `role_or_permission:admin,edit articles` — check user has either role or permission

Parameters are role/permission names passed as comma-separated values.

---

## Related Knowledge Units

### Prerequisites
- Custom Middleware — creating middleware that uses parameters
- Middleware Fundamentals — the Pipeline pattern and handle() contract

### Related Topics
- Middleware Ordering and Priority — how parameterized middleware fits into the execution order
- Global, Route Group, and Route Middleware — where parameterized middleware is registered

### Advanced Follow-up Topics
- Rate Limiting — named limiters as an alternative to numeric parameters
- Request Transformation — middleware that uses parameters to configure request modification
- Response Transformation — middleware that uses parameters to configure response decoration

---

## Research Notes

- The colon-delimited parameter syntax originated with Symfony's firewall configuration and was adopted by Laravel for middleware. It is the only parameter passing mechanism for middleware — there is no alternative syntax.
- The `explode(':', $pipe, 2)` with the third parameter (limit) is critical — without the limit, middleware strings like `cache.headers:public;max_age=3600` would split into three parts instead of two. The limit ensures only the first colon is the delimiter.
- Named limiters (`throttle:api`) were added in Laravel 8 as an alternative to numeric parameters. They address the limitation that numeric parameters cannot express user-specific or tier-specific limits.
- The `can:update,post` middleware uses route parameter binding to resolve the model. The second parameter (`post`) must match the route parameter name, not the model class name. This is a common source of confusion — developers expect `can:update,App\Models\Post` to work, but the parameter is the route binding key.