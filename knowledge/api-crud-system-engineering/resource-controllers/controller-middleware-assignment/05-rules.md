## Prefer Route-Level Middleware For Broad Auth
---
## Category
Architecture
---
## Rule
Always apply broad middleware (auth, throttle, rate-limit) at the route group level in route files; avoid hiding essential HTTP configuration inside controllers.
---
## Reason
Route-level middleware is visible in route files and php artisan route:list -v, providing a single source of truth for the HTTP middleware stack. Controller-level middleware is hidden inside the class.
---
## Bad Example
`php
class PhotoController extends Controller { public function __construct() { ->middleware('auth:sanctum'); } }
`
---
## Good Example
`php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () { Route::apiResource('photos', PhotoController::class); });
`
---
## Exceptions
When different actions within the same controller require different middleware (e.g., public index but authenticated store/update/destroy).
---
## Consequences Of Violation
Hidden middleware configuration; oute:list -v does not show middleware stack; audit trail incomplete; risk of forgetting middleware on newly added routes.

## Use Static middleware() Method In Laravel 11+
---
## Category
Framework Usage
---
## Rule
Always use the static middleware() method for controller-level middleware in Laravel 11+ projects; never use constructor-based $this->middleware().
---
## Reason
The static method enables lazy controller resolution — the controller is not instantiated unless middleware passes. Constructor-based middleware forces controller instantiation on every request.
---
## Bad Example
`php
class PhotoController extends Controller { public function __construct() { ->middleware('auth:sanctum')->only(['store', 'update', 'destroy']); } }
`
---
## Good Example
`php
class PhotoController extends Controller { public static function middleware(): array { return [new Middleware('auth:sanctum', only: ['store', 'update', 'destroy'])]; } }
`
---
## Exceptions
Laravel 8–10 projects must use constructor-based middleware. Migrate to static method when upgrading to 11+.
---
## Consequences Of Violation
Performance penalty from unnecessary controller instantiation; inability to optimize route caching; deprecated pattern in Laravel 11+.

## Never Duplicate Middleware At Both Levels
---
## Category
Performance
---
## Rule
Never apply the same middleware at both the route level and the controller level; each middleware should be declared exactly once.
---
## Reason
Middleware declared at both levels runs twice, doubling execution time for each duplicate. This also creates confusion about which level "owns" the middleware.
---
## Bad Example
`php
// routes/api.php — auth:sanctum already applied at route group level
// PhotoController.php
public static function middleware(): array { return [new Middleware('auth:sanctum')]; }
`
---
## Good Example
`php
// routes/api.php — Single declaration at route group level
Route::middleware('auth:sanctum')->group(function () { Route::apiResource('photos', PhotoController::class); });
// Controller has NO middleware declaration
`
---
## Exceptions
When you intentionally want middleware to run at different points in the pipeline (e.g., throttling before logging), use different middleware classes.
---
## Consequences Of Violation
Middleware runs twice; doubled overhead; confusing oute:list -v output; difficult debugging when middleware has side effects.

## Order Middleware Correctly
---
## Category
Security
---
## Rule
Always order middleware with throttling/rate-limiting before authentication; never place auth before throttle.
---
## Reason
Unauthenticated requests should be throttled before reaching the auth middleware. If auth runs first, unauthenticated requests consume auth resources (database queries, external calls) before being throttled.
---
## Bad Example
`php
public static function middleware(): array { return [new Middleware('auth:sanctum'), new Middleware('throttle:60,1')]; }
`
---
## Good Example
`php
public static function middleware(): array { return [new Middleware('throttle:60,1'), new Middleware('auth:sanctum')]; }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unauthenticated requests bypass throttling; auth endpoint vulnerable to brute-force; resource waste on auth lookups for rate-limited requests.

## Use only() For Per-Method Middleware Targeting
---
## Category
Design
---
## Rule
Always use only() or except() when applying middleware at the controller level; never apply middleware to all actions when only some need protection.
---
## Reason
API resource controllers typically need authentication only on mutating actions (store, update, destroy). Applying auth to all actions forces clients to authenticate for public read endpoints.
---
## Bad Example
`php
public static function middleware(): array { return [new Middleware('auth:sanctum')]; } // Blocks index and show
`
---
## Good Example
`php
public static function middleware(): array { return [new Middleware('auth:sanctum', only: ['store', 'update', 'destroy'])]; }
`
---
## Exceptions
When all controller actions require authentication (admin-only APIs, internal microservices).
---
## Consequences Of Violation
Unauthenticated users blocked from public read endpoints; unnecessary authentication on index/show; poor developer experience for public API consumers.
