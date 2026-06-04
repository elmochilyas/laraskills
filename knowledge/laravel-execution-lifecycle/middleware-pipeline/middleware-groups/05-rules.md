# Middleware Groups — Rules

## Keep Routes in Their Correct File Based on Group Mapping
---
## Category
Architecture
---
## Rule
Place web routes in `routes/web.php` and API routes in `routes/api.php` — never mix them.
---
## Reason
The file-to-group mapping is convention-based. API routes in `routes/web.php` inherit the `web` group with session, cookie, and CSRF middleware — causing 419 errors on POST requests and unnecessary session I/O on stateless endpoints.
---
## Bad Example
```php
// routes/web.php — API routes get CSRF + session overhead
Route::post('/api/login', [AuthController::class, 'login']);
// Every POST returns 419 — CSRF token required
```
---
## Good Example
```php
// routes/api.php — API routes get only api group (throttle + bindings)
Route::post('/login', [AuthController::class, 'login']);
```
---
## Exceptions
Single-page applications that share the same middleware requirements across all routes.
---
## Consequences Of Violation
CSRF 419 errors on API endpoints; unnecessary session I/O; confused developers; time wasted debugging middleware issues.

---

## Create Custom Groups for Distinct Route Types Instead of Modifying Defaults
---
## Category
Architecture
---
## Rule
Define custom middleware groups for application-specific route types (admin, tenant, SPA) rather than appending to `web` or `api`.
---
## Reason
Modifying default groups affects every route in that group, including routes added by packages, future developers, or scaffolding. Custom groups contain the blast radius and make the middleware intent explicit for each route type.
---
## Bad Example
```php
// Admin middleware added to ALL web routes — affects public pages too
$middleware->web(append: [
    \App\Http\Middleware\VerifyAdmin::class,
]);
```
---
## Good Example
```php
// Custom admin group — only routes that opt in get admin middleware
$middleware->group('admin', [
    'auth',
    'verified',
    \App\Http\Middleware\VerifyAdmin::class,
]);

Route::middleware('admin')->group(function () {
    Route::get('/admin/dashboard', [DashboardController::class, 'index']);
});
```
---
## Exceptions
Middleware that genuinely applies to every web route (e.g., localization, maintenance mode).
---
## Consequences Of Violation
Middleware on unintended routes; broken public pages; difficult debugging; degraded performance.

---

## Verify Group Middleware Expansion with `route:list -v`
---
## Category
Testing
---
## Rule
Run `php artisan route:list -v` to see the expanded, flat list of middleware from group definitions.
---
## Reason
Groups hide middleware behind a name — developers may not realize which specific middleware classes run on a route. `route:list -v` reveals the full resolved list, catching duplicate, conflicting, or unintended middleware from group expansion.
---
## Bad Example
```php
// Developer sees "web" group and assumes it's minimal
// Actually runs: EncryptCookies, AddQueuedCookies, StartSession, ShareErrorsFromSession, VerifyCsrfToken, SubstituteBindings
// Without route:list -v, the full list is invisible
```
---
## Good Example
```php
// php artisan route:list -v
// GET|HEAD | /dashboard | App\Http\Controllers\DashboardController@index | web,auth,verified
// Reveals: group "web" expands to 6 middleware, plus route-level auth and verified
```
---
## Exceptions
No common exceptions — always verify group expansion before and after changes.
---
## Consequences Of Violation
Hidden middleware on routes; duplicate middleware from nested groups; unexpected behavior from group expansion.

---

## Do Not Deeply Nest Groups Within Groups
---
## Category
Maintainability
---
## Rule
Limit group nesting to one level — avoid groups that reference other groups that reference other groups.
---
## Reason
Each nesting level obscures the actual middleware list and makes execution order unpredictable. Deep nesting creates a chain of dependencies that is hard to trace and easy to break when a middle group changes.
---
## Bad Example
```php
$middleware->group('base', ['auth', 'verified']);
$middleware->group('admin', ['base', \App\Http\Middleware\CheckAdmin::class]);
$middleware->group('super-admin', ['admin', \App\Http\Middleware\CheckSuperAdmin::class]);
// Expanded order is non-obvious; changing 'base' affects both 'admin' and 'super-admin'
```
---
## Good Example
```php
$middleware->group('admin', [
    'auth',
    'verified',
    \App\Http\Middleware\CheckAdmin::class,
]);
// Flat, explicit, easy to trace
```
---
## Exceptions
When using the framework's built-in two-group system (`web` and `api`) which reference nothing else.
---
## Consequences Of Violation
Unpredictable middleware expansion order; fragile group hierarchy; difficult debugging.

---

## Never Add Route-Specific Middleware to a Group Definition
---
## Category
Architecture
---
## Rule
Use route-level `->middleware()` for middleware that applies only to specific routes within a group — do not add it to the group definition.
---
## Reason
Group middleware applies to every route in the group. Adding route-specific middleware to the group forces all routes to carry unnecessary overhead, even those that don't need it.
---
## Bad Example
```php
// All routes in 'admin' group get throttle — even GET routes that don't need it
$middleware->group('admin', [
    'auth',
    'throttle:100,1', // Only POST routes need this
]);
```
---
## Good Example
```php
$middleware->group('admin', [
    'auth',
]);

// Individual routes apply throttle only where needed
Route::post('/admin/posts', [PostController::class, 'store'])
    ->middleware('throttle:100,1');
```
---
## Exceptions
Middleware that genuinely applies to every route in the group (e.g., auth on all admin routes).
---
## Consequences Of Violation
Unnecessary middleware overhead; rate limiting on GET routes; degraded performance.

---

## Do Not Use the Same Middleware in Multiple Groups Without Coordination
---
## Category
Reliability
---
## Rule
If a middleware class appears in multiple groups, verify it does not cause duplication when groups are combined on a route.
---
## Reason
A route can inherit middleware from its group and from parent groups. If the same middleware class appears in multiple sources, it runs multiple times — doubling execution time and potentially causing side effects (e.g., logging twice, decryption errors).
---
## Bad Example
```php
$middleware->group('api', [
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
]);
$middleware->group('v2', [
    \Illuminate\Routing\Middleware\SubstituteBindings::class, // Duplicate
]);

Route::middleware(['api', 'v2'])->group(function () {  // SubstituteBindings runs twice!
    Route::get('/users', ...);
});
```
---
## Good Example
```php
$middleware->group('v2', [
    // No duplicate — api group already provides SubstituteBindings
    \App\Http\Middleware\VersionCheck::class,
]);
```
---
## Exceptions
Middleware that is idempotent (e.g., `TrimStrings` — trimming twice is harmless).
---
## Consequences Of Violation
Middleware runs multiple times; doubled execution time; unexpected side effects from duplicate processing.
