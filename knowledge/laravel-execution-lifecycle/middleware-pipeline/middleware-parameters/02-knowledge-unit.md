# Middleware Parameters
## Metadata (Domain: Laravel Execution Lifecycle & Framework Internals, Subdomain: Middleware Pipeline, Last Updated: 2026-06-02)
## Executive Summary
Middleware parameters allow passing configuration data to middleware directly from route definitions using colon-delimited syntax (e.g., `'auth:api'`, `'throttle:60,1'`). This enables parameterized middleware that can be reused across different routes with different configurations — the same `auth` middleware can protect different guards, and the same `throttle` middleware can apply different rate limits.

## Core Concepts
When a middleware alias string contains a colon (e.g., `'role:admin,editor'`), the part after the colon is split by comma into an array of parameters. These parameters are passed as additional arguments to the middleware's `handle()` method after `$request` and `$next`. Middleware methods receive parameters as individual arguments: `handle($request, $next, $guard, ...$others)`. Parameters are always strings.

## Mental Models
**Function Arguments:** Middleware parameters work like function arguments. `middleware('auth:api')` calls the auth middleware with the argument `'api'` — like calling `auth('api')`.

**Dining Menu:** The middleware is a dish, and parameters are customizations. `throttle:60,1` is like ordering a steak: medium-rare, with a side of fries.

## Internal Mechanics
In `Illuminate\Pipeline\Pipeline::carry()`, when a pipe is a class string with parameters, the pipeline parses the parameters from the string. The `parsePipeString()` method in `Illuminate\Routing\Pipeline` (a subclass) splits the string by `:` to get the class and parameter portion, then splits parameters by `,`. These parameters are merged with `[$passable, $stack]` before being passed to the middleware's `handle()` method via `call_user_func_array()`.

```php
// Route definition with parameters
Route::get('/admin', function () {
    // ...
})->middleware('role:admin,editor,super-admin');

// Middleware receives individual parameters
public function handle($request, $next, ...$roles)
{
    if (!in_array($request->user()->role, $roles)) {
        abort(403);
    }
    return $next($request);
}
```

## Patterns
- **Parameterized Factory:** A single middleware class produces different behavior based on parameters.
- **Varargs Pattern:** PHP's variadic arguments (`...$roles`) allow flexible parameter counts.
- **Delimiter-Based Parsing:** Colon separates middleware name from parameters; comma separates individual parameters.

## Architectural Decisions
Laravel chose colon-delimited parameter syntax for its compatibility with HTTP headers and URL encoding — colons and commas are URL-safe and do not require encoding in route definitions. The decision to pass parameters as individual arguments (rather than an array) follows PHP function signature conventions and enables type-hinting individual parameters.

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Concise parameter passing inline | Limited to string parameters only | Cannot pass arrays, objects, or boolean values directly |
| Flexible variadic support | No named parameters — positional only | Parameter order is fixed and must be documented |
| URL-safe delimiters | Colon conflicts with class namespace colons | Alias:class syntax uses `:` for both — must be parsed carefully |

## Performance Considerations
Parameter parsing is a simple string split — negligible overhead. The `parsePipeString()` method runs once per middleware per request. Route caching serializes the parsed parameters, eliminating per-request parsing.

## Production Considerations
Parameter ordering matters. Changing the order of parameters in a middleware signature is a breaking change. Document parameter expectations clearly. For complex configuration, consider using middleware classes with constructor injection instead of inline parameters.

## Common Mistakes
**Why it happens:** Developers forget that middleware parameters are strings. Passing `'throttle:true'` for a boolean flag. **Why it's harmful:** The middleware receives the string `"true"`, which is truthy in PHP but can cause confusion. **Better approach:** Compare parameters with string literals (`'true'`, `'false'`) or use middleware classes with proper configuration.

## Failure Modes
- **Too few parameters:** Middleware expects 3 arguments but receives 2 — PHP TypeError if type-hinted, or unexpected null.
- **Too many parameters:** Middleware doesn't use variadic — extra parameters are silently ignored.
- **Colon in class name:** Rare, but namespace with colon (`App\Middleware\Something:Middleware`) conflicts with parameter syntax.

## Ecosystem Usage
- **Laravel Auth:** `auth:api`, `auth:web` — specifies which guard to use.
- **Laravel Throttle:** `throttle:60,1` — 60 requests per minute.
- **Laravel Sanctum:** `abilities:read,write` — checks token abilities.
- **Spatie Permission:** `role:admin,editor` — checks user roles.

## Related Knowledge Units
### Prerequisites
- Pipeline Pattern Fundamentals (pipe parameter passing mechanism)
- Middleware Aliases (colon-delimited alias syntax)
- Service Container (parameter binding resolution)

### Related Topics
- Route Middleware (parameterized alias usage in route definitions)
- Middleware Aliases (alias-to-class resolution with parameter extraction)

### Advanced Follow-up Topics
- Middleware Configuration in Bootstrap (alias parameter registration)
- Application Bootstrap (parameter parsing in route caching)

## Research Notes
**Source Analysis:** `Illuminate\Pipeline\Pipeline::parsePipeString()` (vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php).
**Key Insight:** The parameter parsing happens in the Pipeline, not the router. This means parameterized middleware works in any Pipeline context (jobs, mail).
**Version-Specific Notes:** Parameter parsing behavior has been stable since Laravel 5.x.
