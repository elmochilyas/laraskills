## Use Controller Strings Instead of Closures for All Routes
---
## Framework Usage
---
## Always use controller class strings for route handlers; never use Closure-based routes in applications that require route caching.
---
## `route:cache` serializes route definitions via PHP `serialize()`. Closures cannot be serialized and cause a `LogicException` that blocks the entire cache build.
---
```php
Route::get('/dashboard', function () {
    return view('dashboard');
});
```
---
```php
Route::get('/dashboard', [DashboardController::class, '__invoke']);
```
---
## Routes that must remain uncached for dynamic behavior — declare them in a separate file and document they bypass caching.
---
## Route caching is blocked entirely; all routes (including controller-based ones) run uncached, adding 20-40ms overhead per request.
---
## Cache Config Before Caching Routes
---
## Framework Usage
---
## Always run `php artisan config:cache` before `php artisan route:cache` in deployment scripts.
---
## Route loading depends on resolved configuration — URL defaults, middleware parameters, and route group settings may read config values. Caching routes before config produces inconsistent cached artifacts.
---
```bash
php artisan route:cache
php artisan config:cache
```
---
```bash
php artisan config:cache
php artisan route:cache
```
---
## No common exceptions.
---
## Cached route matcher contains incorrect URL defaults; middleware resolution may fail at runtime.
---
## Validate All Routes Before Caching
---
## Testing
---
## Run `php artisan route:list` to verify all routes resolve correctly before running `route:cache`.
---
## `route:cache` bootstraps a fresh application instance to collect routes. If any route definition references a missing class or method, the cache build fails with no partial recovery.
---
```bash
php artisan route:cache
```
---
```bash
php artisan route:list
php artisan route:cache
```
---
## No common exceptions.
---
## Failed cache build halts deployment; emergency fix requires identifying which route is broken under time pressure.
---
## Run route:cache in Every Production Deployment
---
## Performance
---
## Always include `php artisan route:cache` in production deployment scripts for applications with 100+ routes.
---
## Uncached route registration iterates all route files, resolves middleware chains, and builds the route collection on every request — 20-40ms overhead. Cached routes use a compiled prefix-tree matcher (<1ms).
---
```bash
php artisan migrate --force
# Missing: route:cache
```
---
```bash
php artisan config:cache
php artisan route:cache
```
---
## Applications with fewer than 50 routes where the caching benefit is marginal.
---
## 20-40ms unnecessary bootstrap overhead per request; under load, this compounds into measurable throughput degradation.
---
## Avoid Dynamic Route Registration in Cached Applications
---
## Architecture
---
## Prefer fully static route definitions; handle tenant-specific or dynamic routing through middleware rather than conditional route registration.
---
## Cached routes are an immutable snapshot of all routes registered at cache-build time. Routes registered conditionally based on runtime state (tenant, feature flags) are frozen at build time and ignore runtime conditions.
---
```php
if (tenant()->isEnterprise()) {
    Route::get('/enterprise', ...);
}
```
---
```php
Route::get('/dashboard', [DashboardController::class, '__invoke'])
    ->middleware(EnterpriseFeatureMiddleware::class);
```
---
## Feature-flag-based routes deployed via separate pipeline that regenerates the cache on flag changes.
---
## Missing routes for certain tenants; unexpected 404 errors that only affect a subset of users.
---
## Rebuild Route Cache After Provider or Middleware Changes
---
## Maintainability
---
## Always regenerate the route cache after adding, removing, or modifying service providers or middleware that affect route definitions.
---
## Service providers may register routes in their `boot()` method. Middleware classes referenced by routes change their behavior. The cached route collection does not automatically detect these changes.
---
Adding a new API route provider without re-caching.
---
```bash
php artisan optimize:clear
composer install --no-dev
php artisan optimize
php artisan route:cache
```
---
## No common exceptions.
---
## New routes return 404; middleware fails to execute because the cached matcher references old classes.
---
## Use Route::view() and Route::redirect() Instead of Closures
---
## Framework Usage
---
## Prefer `Route::view()` and `Route::redirect()` for simple routes that return views or redirects instead of Closure-based handlers.
---
## `Route::view()` and `Route::redirect()` are internally converted to controller classes (specified in the route cache) and are fully cacheable. They also make route intent explicit.
---
```php
Route::get('/welcome', function () {
    return view('welcome');
});
Route::get('/old-page', function () {
    return redirect('/new-page');
});
```
---
```php
Route::view('/welcome', 'welcome');
Route::redirect('/old-page', '/new-page');
```
---
## Routes that require logic beyond a simple view or redirect (e.g., passing computed data to the view).
---
## Unnecessary Closure usage blocks route caching and makes route definitions less readable.
---
## Do Not Use Route Cache in Development
---
## Maintainability
---
## Never run `route:cache` in local development environments; use `php artisan optimize:clear` instead.
---
## Route caching freezes all route definitions. Any route changes in development require cache rebuild, creating friction and confusion when routes appear not to work after editing.
---
```bash
php artisan route:cache
```
---
```bash
php artisan optimize:clear
```
---
## No common exceptions.
---
## Developer confusion, wasted debugging time, accidental commits of environment-specific cached route files.
