# Route Registration Order Rules

## Rule 1: Define Specific Routes Before Wildcard Routes
---
## Category
Reliability
---
## Rule
Place specific routes (e.g., `/users/create`) before wildcard routes (e.g., `/users/{user}`) in route files.
---
## Reason
The Router returns the first matching route. A wildcard `{user}` parameter matches any segment, including "create". If the wildcard is registered first, the specific `/users/create` route is never reached.
---
## Bad Example
```php
Route::get('/users/{user}', [UserController::class, 'show']);  // Matches "create" too
Route::get('/users/create', [UserController::class, 'create']); // Never reached
```
---
## Good Example
```php
Route::get('/users/create', [UserController::class, 'create']); // Specific first
Route::get('/users/{user}', [UserController::class, 'show']);   // Wildcard last
```
---
## Exceptions
Routes with distinct HTTP methods — `POST /users` and `GET /users/{user}` do not conflict.
---
## Consequences Of Violation
Specific routes return unexpected 404 or wrong handler. Users reach the "show" action when intending "create".
---

## Rule 2: Always Use Controller Classes, Not Closures, With Route Caching
---
## Category
Performance
---
## Rule
Use controller class strings for route handlers instead of closures when route caching is used in production.
---
## Reason
`php artisan route:cache` serializes the route collection. Closures cannot be serialized — `route:cache` throws a `LogicException` if any route uses a closure handler. Controller classes serialize to their class name string.
---
## Bad Example
```php
Route::get('/dashboard', function () {
    return view('dashboard');
}); // route:cache throws LogicException
```
---
## Good Example
```php
Route::get('/dashboard', [DashboardController::class, 'index']);
// route:cache works — controller classes are serializable
```
---
## Exceptions
Routes in development-only route files that are excluded from caching.
---
## Consequences Of Violation
`route:cache` command fails with `LogicException`. Production deployments cannot use route caching, resulting in 20-40ms extra route registration time per request.
---

## Rule 3: Register Fallback Routes Last
---
## Category
Reliability
---
## Rule
Always register `Route::fallback()` after all other routes, as the last route definition.
---
## Reason
`Route::fallback()` catches all requests that no other route matches. If any route is registered after it, that route is never tried — the fallback intercepts all unmatched requests first. Route order matters: fallback must be the final entry.
---
## Bad Example
```php
Route::fallback(function () {
    return response()->view('errors.404', [], 404);
});

Route::get('/about', [AboutController::class, 'show']);
// /about is never matched — fallback catches it first
```
---
## Good Example
```php
Route::get('/about', [AboutController::class, 'show']);
// ... all other routes ...

Route::fallback(function () {
    return response()->view('errors.404', [], 404);
});
// Fallback registered last — only catches truly unmatched routes
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Routes registered after fallback are unreachable. The fallback intercepts valid requests that should have matched later routes.
---

## Rule 4: Use Named Routes to Prevent URL Generation Collisions
---
## Category
Maintainability
---
## Rule
Always assign unique names to routes using `->name()` for URL generation with `route()`.
---
## Reason
Without named routes, URL generation relies on route signatures (method + URI). If a route's URI changes, all `route()` calls that reference it by action (`route('controller.method')`) break. Named routes decouple URL generation from route paths.
---
## Bad Example
```php
Route::get('/users/{user}', [UserController::class, 'show']);
// URL generation: route('users.show') — fails if no name assigned
```
---
## Good Example
```php
Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
// URL generation: route('users.show', $user) — works regardless of URI changes
```
---
## Exceptions
Routes that are never referenced via `route()` or `redirect()->route()`.
---
## Consequences Of Violation
Broken URL generation when route URIs change. `route()` calls that reference controller/action pairs are fragile and deprecated.
---

## Rule 5: Cache Routes in Production
---
## Category
Performance
---
## Rule
Always run `php artisan route:cache` as part of the production deployment process.
---
## Reason
Route caching serializes the fully-registered route collection into a compiled matcher, reducing route registration time from 20-40ms (for 500 routes) to effectively zero. The compiled matcher uses a prefix tree for O(log n) matching.
---
## Bad Example
```php
// Deploy script only runs migrations
git pull
php artisan migrate
// Missing: php artisan route:cache
```
---
## Good Example
```php
git pull
php artisan migrate
php artisan route:cache
// Compiled routes in bootstrap/cache/routes-v7.php
```
---
## Exceptions
Applications with closure-based routes that cannot be converted to controller classes. Development environments.
---
## Consequences Of Violation
20-40ms extra bootstrap time per request for route registration. Higher server costs under load.
---

## Rule 6: Load Routes in a Consistent, Documented Order
---
## Category
Code Organization
---
## Rule
Define a clear, documented order for loading multiple route files in `RouteServiceProvider::boot()`.
---
## Reason
Multiple route files must be loaded in a specific order to respect route priority. Undocumented loading order causes confusion when routes from different files conflict. The order should be: auth routes first, resource routes next, feature-specific routes, fallback last.
---
## Bad Example
```php
public function boot(): void
{
    $this->routes(function () {
        Route::middleware('api')->group(base_path('routes/api.php'));
        Route::middleware('web')->group(base_path('routes/web.php'));
        Route::middleware('web')->group(base_path('routes/admin.php'));
        Route::middleware('web')->group(base_path('routes/auth.php'));
        // No obvious ordering principle
    });
}
```
---
## Good Example
```php
public function boot(): void
{
    $this->routes(function () {
        // Auth routes first (highest priority)
        Route::middleware('web')->group(base_path('routes/auth.php'));
        // Feature routes
        Route::middleware('web')->group(base_path('routes/web.php'));
        Route::middleware('web')->group(base_path('routes/admin.php'));
        // API routes last
        Route::middleware('api')->group(base_path('routes/api.php'));
    });
}
```
---
## Exceptions
Single-route-file applications where order is defined within one file.
---
## Consequences Of Violation
Route priority is unclear. Adding new route files may accidentally shadow existing routes. Debugging route-matching issues is harder.
