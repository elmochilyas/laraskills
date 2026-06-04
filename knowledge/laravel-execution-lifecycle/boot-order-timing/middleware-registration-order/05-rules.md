# Middleware Registration Order Rules

## Rule 1: Place Global Middleware Minimally
---
## Category
Performance
---
## Rule
Only register middleware globally when it must execute on every single route. Prefer group or route middleware for all other cases.
---
## Reason
Global middleware runs on every request, including 404 routes, asset requests, and health checks. Each global middleware adds ~10-50µs per request. Route-specific middleware only runs on matched routes, reducing unnecessary overhead.
---
## Bad Example
```php
// Laravel 11+ bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(LogRequestDuration::class);     // Global — runs on all routes
    $middleware->append(VerifyApiVersion::class);        // Global — runs on all routes
    $middleware->append(CheckUserStatus::class);         // Global — runs on all routes
})
```
---
## Good Example
```php
->withMiddleware(function (Middleware $middleware) {
    // Only truly global middleware
    $middleware->append(TrustProxies::class);

    // Group-specific middleware
    $middleware->web(append: [
        LogRequestDuration::class,
        CheckUserStatus::class,
    ]);

    $middleware->api(append: [
        VerifyApiVersion::class,
    ]);
})
```
---
## Exceptions
Security middleware (auth, CORS, CSRF, rate limiting) that must be enforced on every route.
---
## Consequences Of Violation
Every request pays overhead for middleware that only serves a subset of routes. Asset and health-check responses are slower than necessary.
---

## Rule 2: Order Middleware by Dependency Direction
---
## Category
Reliability
---
## Rule
Place middleware that modifies the request before middleware that reads the modified request, in the pipeline order.
---
## Reason
Middleware executes in array order for global middleware and group middleware. If middleware A modifies the request (e.g., decrypts cookies, sets locale) and middleware B reads the modification (e.g., routes requests based on locale), A must appear before B in the middleware list.
---
## Bad Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        SetAppLocale::class,              // Reads locale from session
        StartSession::class,              // Session not yet started when SetAppLocale runs
    ]);
})
```
---
## Good Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        StartSession::class,              // Session started first
        SetAppLocale::class,              // Can now read locale from session
    ]);
})
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Middleware reads stale or default values because the middleware that sets them hasn't run yet. Order-dependent bugs that are hard to reproduce.
---

## Rule 3: Keep SubstituteBindings Before Middleware That Uses Models
---
## Category
Reliability
---
## Rule
Ensure `SubstituteBindings` middleware runs before any custom middleware that accesses route model binding results.
---
## Reason
Route model binding is performed by `SubstituteBindings`. Custom middleware running before it receives route parameter IDs (strings/ints), not resolved model instances. Accessing `$request->route('user')` before `SubstituteBindings` runs returns the raw ID.
---
## Bad Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        LogUserActivity::class, // Accesses $request->route('user')->id — fails because SubstituteBindings hasn't run
    ]);
})
```
---
## Good Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        SubstituteBindings::class, // Runs before custom middleware
        LogUserActivity::class,    // Safe — model binding already resolved
    ]);
})
```
---
## Exceptions
Middleware that intentionally works with raw route parameters.
---
## Consequences Of Violation
Trying to access model properties on route parameters returns null or errors. Middleware silently receives raw IDs instead of models.
---

## Rule 4: Use Middleware Aliases for Clean Route Definitions
---
## Category
Code Organization
---
## Rule
Define short, descriptive middleware aliases and use them in route definitions rather than referencing the full class name.
---
## Reason
Middleware aliases make route files cleaner, reduce repetition, and allow changing the middleware implementation later without updating every route that references it. Long class names in route definitions obscure the route's intent.
---
## Bad Example
```php
Route::get('/admin', [DashboardController::class, 'index'])
    ->middleware(App\Http\Middleware\CheckUserRole::class . ':admin');
```
---
## Good Example
```php
// bootstrap/app.php
$middleware->alias([
    'role' => CheckUserRole::class,
]);

// routes/web.php
Route::get('/admin', [DashboardController::class, 'index'])
    ->middleware('role:admin');
```
---
## Exceptions
One-off middleware used in a single route definition.
---
## Consequences Of Violation
Verbose route definitions that are hard to read. Inconsistent middleware naming when different routes use different naming conventions.
---

## Rule 5: Avoid Monolithic Global Middleware Lists
---
## Category
Maintainability
---
## Rule
Keep the global middleware list under 10 entries. As your application grows, move middleware to groups or route-specific assignments.
---
## Reason
A monolithic global middleware list is hard to audit, understand, and optimize. Each entry runs on every request, making it difficult to determine which middleware is actually necessary for which routes. Group and route middleware provide purpose-built scoping.
---
## Bad Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(MiddlewareA::class);
    $middleware->append(MiddlewareB::class);
    $middleware->append(MiddlewareC::class);
    $middleware->append(MiddlewareD::class);
    $middleware->append(MiddlewareE::class);
    $middleware->append(MiddlewareF::class);
    // 20+ global middleware — impossible to know which are truly "global"
})
```
---
## Good Example
```php
->withMiddleware(function (Middleware $middleware) {
    // Only truly necessary middleware
    $middleware->append(TrustProxies::class);
    $middleware->append(PreventRequestsDuringMaintenance::class);

    $middleware->web(append: [GroupSpecificMiddleware::class]);
    $middleware->api(append: [ApiSpecificMiddleware::class]);
})
```
---
## Exceptions
Framework-required global middleware (TrustProxies, PreventRequestsDuringMaintenance, etc.).
---
## Consequences Of Violation
Route performance degradation from unnecessary middleware. Hard to identify which middleware is essential vs. legacy.
---

## Rule 6: Validate CORS Middleware Position
---
## Category
Security
---
## Rule
Ensure CORS middleware runs before authentication middleware to handle preflight OPTIONS requests correctly.
---
## Reason
Browsers send an OPTIONS preflight request before cross-origin requests. If CORS middleware runs after auth middleware, the preflight request is rejected before CORS headers are set, breaking cross-origin functionality.
---
## Bad Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(append: [
        'auth:api',     // Auth runs first — rejects OPTIONS preflight
        HandleCors::class,
    ]);
})
```
---
## Good Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(append: [
        HandleCors::class,  // CORS runs first — handles OPTIONS preflight
        'auth:api',
    ]);
})
```
---
## Exceptions
When CORS is handled at the web server level (Nginx, Apache) and the application does not need CORS middleware.
---
## Consequences Of Violation
Cross-origin requests from SPAs, mobile apps, or third-party clients fail. Browser console shows CORS errors. API unusable from non-origin clients.
