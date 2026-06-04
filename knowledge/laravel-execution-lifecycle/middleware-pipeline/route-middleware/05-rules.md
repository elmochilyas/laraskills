# Route Middleware — Rules

## Prefer Inline Middleware Over Controller Constructor Middleware
---
## Category
Code Organization
---
## Rule
Use inline `->middleware()` on route definitions rather than `$this->middleware()` in controller constructors for new code.
---
## Reason
Inline middleware is visible in route files — developers see the full middleware stack at a glance. Controller middleware is hidden in the controller class and is not visible when scanning route definitions, making it easy to overlook.
---
## Bad Example
```php
class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth'); // Hidden in constructor
    }
}

Route::get('/admin/dashboard', [AdminController::class, 'index']);
// route:list shows no auth middleware — misleading
```
---
## Good Example
```php
Route::middleware(['auth'])->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'index']);
});
// All middleware visible in route file
```
---
## Exceptions
Backward compatibility with existing codebases that use controller middleware; resource controllers with many methods where `only`/`except` filtering adds value.
---
## Consequences Of Violation
Hidden security middleware; reduced visibility in route files; developer surprises when middleware behavior changes unexpectedly.

---

## Use `only`/`except` Instead of Applying Middleware to Each Controller Method
---
## Category
Code Organization
---
## Rule
On resource controllers, use `only` and `except` to target specific controller methods rather than applying middleware to each route individually.
---
## Reason
Resource controllers have standard CRUD methods (index, create, store, show, edit, update, destroy). `only`/`except` avoids repetition and makes the intent clear — "apply auth to all methods except index and show."
---
## Bad Example
```php
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/create', [PostController::class, 'create'])->middleware('auth');
Route::post('/posts', [PostController::class, 'store'])->middleware('auth');
Route::get('/posts/{post}', [PostController::class, 'show']);
Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->middleware('auth');
Route::put('/posts/{post}', [PostController::class, 'update'])->middleware('auth');
Route::delete('/posts/{post}', [PostController::class, 'destroy'])->middleware('auth');
```
---
## Good Example
```php
class PostController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth')->except(['index', 'show']);
    }
}
```
---
## Exceptions
Non-standard controllers where routes do not follow CRUD naming conventions.
---
## Consequences Of Violation
Repetitive middleware assignment; increased risk of missing middleware on a new route; harder to see authorization intent.

---

## Avoid Closure Middleware on Production Routes
---
## Category
Performance
---
## Rule
Use class-based middleware for all production route middleware — never inline closures.
---
## Reason
Closure middleware cannot be serialized by `php artisan route:cache`. Routes using closure middleware bypass the route cache entirely, losing the performance benefits of cached route resolution.
---
## Bad Example
```php
Route::get('/dashboard', function () {
    // ...
})->middleware(function ($request, $next) {
    return $next($request);
}); // Closure — cannot be cached
```
---
## Good Example
```php
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(\App\Http\Middleware\LogAccess::class); // Class — cacheable
```
---
## Exceptions
Development-only routes; prototypes; routes that are intentionally excluded from route caching.
---
## Consequences Of Violation
Route caching effectively disabled for those routes; per-request middleware resolution overhead; inconsistent caching behavior.

---

## Verify the Full Resolved Middleware Stack with `route:list -v`
---
## Category
Testing
---
## Rule
Run `php artisan route:list -v` to audit the resolved middleware stack, including inherited group and controller middleware.
---
## Reason
Middleware inherits from multiple sources (route → group → global, plus controller constructor). The final merged list may contain duplicates, conflicts, or unexpected middleware that is invisible in route files alone.
---
## Bad Example
```php
// Route file only shows 'auth'
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware('auth');
// But route:list -v reveals: web,auth,verified
// Three middleware, not one — developer unaware of 'verified'
```
---
## Good Example
```php
// After making changes:
// php artisan route:list -v
// VERIFY middleware composition before deployment
```
---
## Exceptions
No common exceptions — always verify the resolved stack after middleware changes.
---
## Consequences Of Violation
Duplicate middleware running twice; missing expected middleware; unintended middleware on production routes.

---

## Do Not Duplicate Group Middleware on Individual Routes
---
## Category
Maintainability
---
## Rule
Do not add middleware at the route level that is already provided by the route's group.
---
## Reason
Laravel does not deduplicate middleware by default — if the same class appears in the group and the route definition, it runs twice. This doubles execution time and can cause side effects (double logging, double CSRF check, decryption errors).
---
## Bad Example
```php
// 'auth' is already in the 'admin' group — adds it again
Route::middleware('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('auth'); // Duplicate — auth runs twice
});
```
---
## Good Example
```php
Route::middleware('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    // 'auth' inherits from 'admin' group — no duplication
});
```
---
## Exceptions
Middleware that is idempotent (e.g., `TrimStrings` runs twice harmlessly), though still avoid for clarity.
---
## Consequences Of Violation
Double execution time; side effects from running middleware twice; hard-to-trace bugs.

---

## Use Route Groups for Middleware Shared Across Multiple Routes
---
## Category
Code Organization
---
## Rule
Extract shared middleware into route groups instead of repeating `->middleware()` on every route definition.
---
## Reason
Listing the same 3-4 middleware on every route creates noise, repetition, and maintenance burden. A group makes the intent explicit and ensures all routes share the same middleware — new routes added to the group inherit automatically.
---
## Bad Example
```php
Route::get('/admin/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'admin']);
Route::get('/admin/users', [UserController::class, 'index'])
    ->middleware(['auth', 'verified', 'admin']);
Route::post('/admin/users', [UserController::class, 'store'])
    ->middleware(['auth', 'verified', 'admin', 'throttle:10,1']);
```
---
## Good Example
```php
Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('/admin/dashboard', [DashboardController::class, 'index']);
    Route::get('/admin/users', [UserController::class, 'index']);
    Route::post('/admin/users', [UserController::class, 'store'])
        ->middleware('throttle:10,1'); // Additional route-specific middleware
});
```
---
## Exceptions
Routes that share no common middleware — each must be listed individually.
---
## Consequences Of Violation
Repetitive code; maintenance burden when middleware changes; risk of forgetting middleware on new routes.

---

## Do Not Add Infrastructure Middleware at the Route Level
---
## Category
Architecture
---
## Rule
Keep infrastructure middleware (CORS, trusted proxies, maintenance mode) in the global stack — do not assign them at the route level.
---
## Reason
Infrastructure middleware must apply to every request to ensure security and correctness. Route-level assignment is permissive — a forgotten `->middleware('cors')` on a new route creates a vulnerability. Global assignment is exhaustive by default.
---
## Bad Example
```php
// CORS applied per-route — easy to forget
Route::get('/api/data', [DataController::class, 'index'])
    ->middleware('cors');
// New API route without 'cors' — CORS error in browser
```
---
## Good Example
```php
// CORS in global stack — applies to every request
\Illuminate\Http\Middleware\HandleCors::class;
```
---
## Exceptions
Middleware that has route-specific behavior (e.g., different CORS config for different origins) — but prefer global default with route-level overrides.
---
## Consequences Of Violation
Cross-origin requests fail on routes missing the middleware; security inconsistency; increased load on developers to remember every assignment.
