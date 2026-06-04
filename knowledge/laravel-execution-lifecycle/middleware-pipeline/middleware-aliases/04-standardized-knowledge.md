# Middleware Aliases

## Metadata
- **ID:** ku-06-global-middleware
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
Middleware aliases provide a short, memorable name for middleware classes, allowing developers to reference middleware in route definitions using concise strings (e.g., `'auth'` instead of `\App\Http\Middleware\Authenticate::class`). Aliases are registered in the HTTP Kernel's `$routeMiddleware` property (or `bootstrap/app.php` in Laravel 11+) and serve as the primary way developers interact with middleware in route files. Combined with colon-delimited parameters, aliases also support parameterized middleware like `'throttle:60,1'`.

## Core Concepts
- **Alias Mapping**: A short string key maps to a fully qualified class name: `'auth' => \App\Http\Middleware\Authenticate::class`.
- **Resolution Flow**: During `gatherRouteMiddleware()`, the router looks up the alias and replaces it with the class string.
- **Parameterized Syntax**: String after colon becomes parameters: `'throttle:60,1'` → class `ThrottleRequests`, parameters `[60, 1]`.
- **Parameter Passing**: Parameters are passed as additional arguments to `handle()` after `$request` and `$next`.
- **Framework Defaults**: Laravel ships with aliases for `auth`, `guest`, `throttle`, `verified`, `password.confirm`, `can`, `signed`, `bindings`.

## When To Use
- **Route definitions**: Use aliases instead of full class names for readability: `->middleware('auth')` vs `->middleware(\App\Http\Middleware\Authenticate::class)`.
- **Custom middleware**: Register custom aliases for your application's middleware.
- **Parameterized middleware**: Use colon syntax for configurable middleware (auth guard, throttle limits, role checks).
- **Package middleware**: Packages register their own aliases for middleware they provide.

## When NOT To Use
- **Inline closures**: Closures in middleware don't need aliases.
- **Group definitions**: Group arrays can use full class names or aliases interchangeably.
- **One-off middleware**: If a middleware is used only once, the alias registration adds unnecessary boilerplate.
- **Over-abstraction**: Creating aliases for every middleware when the class name is equally short.

## Best Practices (WHY)
- **Register custom aliases for all application middleware**: Route files are cleaner when using `'auth'` instead of `\App\Http\Middleware\Authenticate::class`. *Why: Route readability — short aliases make route definitions scanable at a glance.*
- **Use consistent naming conventions**: Follow Laravel's convention — lowercase, single word or hyphenated: `'log-requests'`, `'verify-tenant'`. *Why: Consistency prevents confusion; developers expect lowercase alias naming.*
- **Document alias collision risks**: Two packages may register the same alias — one silently overrides the other. *Why: Silent overrides are hard to debug — knowing the collision risk helps trace middleware resolution issues.*
- **Test alias resolution after route caching**: Route caching serializes resolved class names. If an alias is not registered at cache time, cached routes may have stale or missing middleware. *Why: Route caching freezes alias resolution — adding a new alias requires re-caching.*

## Architecture Guidelines
- **Decouples routes from class locations**: Framework upgrades can change class locations without breaking route files.
- **Colon-based parameter syntax**: Chosen for URL-safety — colons and commas are safe in route definitions.
- **Resolution happens during route middleware gathering**: Before pipeline construction, not during.
- **Registered in Kernel or bootstrap/app.php**: Centralized registry that all routes reference.

## Performance
- **Alias resolution**: Simple array lookup — virtually zero cost (~0.001ms).
- **Route caching**: Serializes resolved middleware class names — alias resolution occurs only at cache time, not per-request.
- **Parameter parsing**: Simple string split — negligible overhead.
- **Compiled routes**: Cached routes store fully resolved middleware — no alias lookup needed.

## Security
- **Undefined alias**: Throws `InvalidArgumentException` with "Middleware 'xyz' not found" — prevents silent middleware bypass.
- **Alias collision**: Two packages register same alias — one silently overrides. May cause incorrect middleware to run or cause exceptions.
- **Parameter injection risk**: Colon in class name conflicts with parameter syntax — rare but possible.
- **Cached alias staleness**: After alias changes, route cache may still reference old class names — clear cache after alias changes.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using class short name instead of alias | `Authenticate` instead of `auth` | Middleware not found — InvalidArgumentException | Use registered alias or full class path |
| Forgetting to register alias | Defining custom middleware but not adding to $routeMiddleware | Alias not found at runtime | Register in bootstrap/app.php |
| Overriding framework alias unintentionally | Creating custom alias with same name as default | Framework behavior changes unexpectedly | Check existing aliases before registering |
| Assuming alias survives route cache | Adding alias after route cached | Stale alias reference — middleware missing | Re-cache routes after alias changes |

## Anti-Patterns
- **No custom aliases**: Using full class names everywhere in route files — reduces readability.
- **Alias for every class**: Creating aliases for middleware used only once — adds boilerplate without benefit.
- **Alias name collision with other packages**: Not checking existing aliases before registering custom ones.
- **Alias that doesn't convey purpose**: Cryptic alias names like `'m1'` instead of `'log-requests'`.

## Examples

```php
// Laravel 10: Kernel $routeMiddleware property
protected $routeMiddleware = [
    'auth' => \App\Http\Middleware\Authenticate::class,
    'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
    'bindings' => \Illuminate\Routing\Middleware\SubstituteBindings::class,
    'can' => \Illuminate\Auth\Middleware\Authorize::class,
    'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
    'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
    'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
];

// Laravel 11+: bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias('auth', \App\Http\Middleware\Authenticate::class);
    $middleware->alias('role', \App\Http\Middleware\CheckRole::class);
    $middleware->alias('team', \App\Http\Middleware\VerifyTeamMembership::class);
})

// Usage in routes
Route::middleware(['auth', 'role:admin,editor'])->group(function () {
    Route::get('/admin', [AdminController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store'])
        ->middleware('throttle:60,1');
});
```

## Related Topics
- **Pipeline Pattern Fundamentals**: Pipe resolution mechanics.
- **Route Middleware**: Alias usage in route definitions.
- **Middleware Parameters**: Colon-delimited parameter passing.
- **Middleware Configuration in Bootstrap**: Laravel 11+ alias registration.
- **Kernel Architecture**: $routeMiddleware property and resolution.

## AI Agent Notes
- The alias resolution happens during route middleware gathering, before the pipeline is constructed. It's a pure mapping layer.
- Laravel 11 uses `Middleware::alias()` method in `bootstrap/app.php` instead of the Kernel `$routeMiddleware` property.
- The `parsePipeString()` method in `Illuminate\Pipeline\Pipeline` handles colon-based parameter parsing.
- Route caching serializes the fully resolved middleware class names — aliases are resolved at cache time.

## Verification
- [ ] Register a custom middleware alias in `bootstrap/app.php`
- [ ] Use the alias in a route definition — verify it resolves correctly
- [ ] Test parameterized alias: `'throttle:10,1'` — verify parameters reach middleware
- [ ] Run `php artisan route:cache` and verify cached routes use resolved class names
- [ ] Test alias collision — register two aliases with the same name, observe override behavior
- [ ] Check `route:list -v` to see resolved class names vs aliases
