# Middleware Parameters — Rules

## Document the Parameter Order and Types in the Middleware Docblock
---
## Category
Maintainability
---
## Rule
Document every middleware parameter's position, type, and purpose in the `handle()` docblock.
---
## Reason
Parameters are positional — there are no named parameters. Changing the order is a breaking change that silently passes the wrong values. Clear documentation prevents misuse and makes the middleware's API discoverable.
---
## Bad Example
```php
class CheckRole
{
    public function handle($request, $next, ...$roles)
    {
        // No documentation — developers must read the body to understand parameters
    }
}
```
---
## Good Example
```php
class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  string  ...$roles  One or more role names to check (e.g., admin, editor)
     */
    public function handle($request, $next, ...$roles)
    {
        // ...
    }
}
```
---
## Exceptions
Self-explanatory middleware whose parameter list matches well-known conventions (e.g., `throttle:maxAttempts,decayMinutes`).
---
## Consequences Of Violation
Parameter misordering causing authorization bugs; developer confusion; time wasted reading middleware source.

---

## Use Variadic Parameters for Optional Arguments
---
## Category
Reliability
---
## Rule
Declare middleware parameters with `...$params` (variadic) when the parameter count is flexible or optional.
---
## Reason
Explicit individual parameters with defaults still throw `TypeError` if too few are provided. Variadic parameters handle any number of parameters gracefully, allowing default behavior when no parameters are passed.
---
## Bad Example
```php
public function handle($request, $next, $guard = 'web', $param2 = null)
{
    // TypeError if route only passes one parameter — expects 2
}
```
---
## Good Example
```php
public function handle($request, $next, ...$params)
{
    $guard = $params[0] ?? 'web';
    $param2 = $params[1] ?? null;
    // Handles 0, 1, 2, ... parameters gracefully
}
```
---
## Exceptions
Middleware with a fixed, required parameter count (e.g., `throttle` always needs `maxAttempts`).
---
## Consequences Of Violation
TypeError exceptions when route definitions pass fewer parameters than expected; production outages from parameter count mismatches.

---

## Compare Parameter Values with String Literals, Not Truthy Checks
---
## Category
Reliability
---
## Rule
Compare parameter strings using `=== 'value'` — never use truthy/falsy checks (`== true`, `if ($param)`).
---
## Reason
All parameters are strings. The string `"false"` is truthy in PHP; `"0"` is falsy. Using truthy comparison on string parameters produces unexpected behavior — `if ($enabled)` returns true for both `'true'` and `'false'`.
---
## Bad Example
```php
public function handle($request, $next, $enabled)
{
    if ($enabled) { // Always true — 'true' and 'false' are both truthy strings
        // ...
    }
}
```
---
## Good Example
```php
public function handle($request, $next, $enabled)
{
    if ($enabled === 'true') { // Correct string comparison
        // ...
    }
}
```
---
## Exceptions
When the parameter is type-cast before comparison (e.g., `(int) $maxAttempts > 0`).
---
## Consequences Of Violation
Middleware behavior is always opposite of what the route definition specifies; feature flags always on; rate limits always applied.

---

## Do Not Pass Sensitive Data as Middleware Parameters
---
## Category
Security
---
## Rule
Never pass secrets, API keys, or tokens as middleware parameters in route definitions.
---
## Reason
Parameters are visible in route files, route cache files, version control history, and `route:list` output. Anyone with file system access or repository access can read them.
---
## Bad Example
```php
Route::post('/admin', [AdminController::class, 'index'])
    ->middleware('verify-token:sk_live_abc123def456'); // Secret in route definition
```
---
## Good Example
```php
// Token stored in config/services.php
Route::post('/admin', [AdminController::class, 'index'])
    ->middleware('verify-token');

// Middleware reads from config
class VerifyToken
{
    public function handle($request, $next)
    {
        $token = config('services.admin.token');
        // ...
    }
}
```
---
## Exceptions
Non-secret configuration values that are safe in version control (e.g., rate limit counts, guard names).
---
## Consequences Of Violation
Credential exposure in source control; secrets visible in route cache files; compliance violation (PCI-DSS, SOC2).

---

## Limit Parameterized Middleware to 3-4 Parameters Maximum
---
## Category
Maintainability
---
## Rule
Keep the number of colon-delimited parameters to 3-4 or fewer. Beyond that, use constructor injection or a configuration object.
---
## Reason
Long parameter strings (`'middleware:a,b,c,d,e,f'`) are hard to read, easy to misorder, and impossible to validate at the route level. Complex configuration belongs in a dedicated class with proper typing and validation.
---
## Bad Example
```php
Route::get('/reports', [ReportController::class, 'index'])
    ->middleware('filter:user,date_range,status,sort_by,order,page,limit');
// 7 positional parameters — impossible to read or maintain
```
---
## Good Example
```php
Route::get('/reports', [ReportController::class, 'index'])
    ->middleware('filter');

// Middleware reads structured config from request or service
class FilterMiddleware
{
    public function handle($request, $next)
    {
        $filters = app(ReportFilter::class)->fromRequest($request);
        $request->attributes->set('filters', $filters);
        return $next($request);
    }
}
```
---
## Exceptions
Middleware with well-known, widely-used parameter lists (e.g., `throttle:maxAttempts,decayMinutes`).
---
## Consequences Of Violation
Hard-to-read route definitions; parameter misordering bugs; maintenance burden when parameter lists grow.

---

## Type-Cast String Parameters Explicitly at the Top of `handle()`
---
## Category
Reliability
---
## Rule
Type-cast middleware parameters to the expected type (int, bool) as the first operation in `handle()`.
---
## Reason
All parameters arrive as strings — `'60'`, `'true'`, `'api'`. PHP's loose comparison may auto-cast in some contexts but not others. Explicit casting ensures deterministic behavior regardless of how the parameter is used later.
---
## Bad Example
```php
public function handle($request, $next, $maxAttempts)
{
    // $maxAttempts is the string "60" — may cause type-juggling bugs
    cache(["attempts" => $maxAttempts]); // stores string, not int
}
```
---
## Good Example
```php
public function handle($request, $next, $maxAttempts)
{
    $maxAttempts = (int) $maxAttempts; // Explicit cast
    cache(["attempts" => $maxAttempts]); // stores int, consistent
}
```
---
## Exceptions
Parameters used exclusively in string contexts (e.g., guard name `'api'` passed to `Auth::guard()`).
---
## Consequences Of Violation
Inconsistent data types; unexpected behavior with strict types; silent data corruption in cache or storage.

---

## Prefer Constructor Injection Over Parameters for Complex Middleware Configuration
---
## Category
Architecture
---
## Rule
Use constructor injection for complex configuration objects; reserve colon-delimited parameters for simple scalar values (strings, integers).
---
## Reason
Constructor injection supports proper type hints, validation, IDE autocomplete, and testability. Colon-delimited parameters are positional, untyped strings that cannot be validated at registration time.
---
## Bad Example
```php
class ComplexMiddleware
{
    // 5+ parameters passed as colon-delimited strings — no type safety
    public function handle($request, $next, $a, $b, $c, $d, $e)
    {
        // ...
    }
}
```
---
## Good Example
```php
class ComplexMiddleware
{
    public function __construct(
        protected ReportConfig $config // Properly typed, validated, testable
    ) {}

    public function handle($request, $next)
    {
        // $this->config->filters() ...
    }
}
```
---
## Exceptions
Simple scalar configuration that is never reused outside the middleware (guard names, throttle limits).
---
## Consequences Of Violation
Untyped string parameters; runtime type errors; difficult refactoring; verbose route definitions.
