# Controller Middleware Assignment

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Controller Middleware Assignment
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Middleware can be assigned to controller actions in two places: in the route registration file (`Route::get()->middleware(...)`) or inside the controller constructor (`$this->middleware(...)`). Laravel also supports per-method middleware via `only()` and `except()` arrays within the controller, and middleware parameter passing for role-based filtering.

The choice between route-level and controller-level middleware assignment affects readability, testability, and the separation of routing concerns from controller concerns. Route-level assignment keeps middleware visible in the route file where other routing metadata lives. Controller-level assignment groups middleware with the controller logic, which can be convenient but obscures the middleware stack from someone reading the routes.

---

## Core Concepts

- **Constructor Middleware**: `$this->middleware('auth')` in the controller constructor applies middleware to all methods.
- **Per-Method Middleware**: `$this->middleware('auth')->only(['store', 'update', 'destroy'])` targets specific actions.
- **Route-Level Middleware**: `Route::apiResource('photos', PhotoController::class)->middleware('auth')` applies to all resource routes.
- **Middleware Groups**: Controllers can implement `getMiddleware()` for dynamic middleware registration.
- **Middleware Parameters**: `$this->middleware('role:admin')` passes parameters to the middleware.

---

## Mental Models

- **Route as Configuration**: The route file is the configuration for the HTTP layer. Middleware is part of that configuration.
- **Controller as Implementation**: The controller implements the behavior. Middleware in the controller is self-documenting but harder to audit.
- **Group vs. Individual**: `only()` and `except()` let you apply middleware to a subset of actions without registering each route individually.

---

## Internal Mechanics

Controller middleware is registered in the constructor via the `Controller` base class's `middleware()` method, which extends the `HasMiddleware` trait (Laravel 11+) or the `Middleware` trait (Laravel 8–10). The middleware is stored in `$this->middleware` array and applied during route dispatching.

**Laravel 11+ approach:**
```php
class PhotoController extends Controller
{
    public static function middleware(): array
    {
        return [
            new Middleware('auth', only: ['store', 'update', 'destroy']),
            new Middleware('throttle:api'),
        ];
    }
}
```

**Laravel 8–10 approach:**
```php
class PhotoController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth')->only(['store', 'update', 'destroy']);
        $this->middleware('throttle:api');
    }
}
```

Route-level middleware is stored on the `Route` object itself and applied by the `Router` during dispatch. Controller middleware is applied by `ControllerDispatcher::dispatch()` after the route middleware but before the controller method is called.

The execution order is:
1. Global middleware (Kernel)
2. Route group middleware
3. Route-level middleware
4. Controller constructor middleware
5. Controller method middleware (via `only()`/`except()`)
6. Controller method executes

---

## Patterns

- **Route-Level Middleware (Recommended for APIs)**:
  ```php
  // routes/api.php
  Route::apiResource('photos', PhotoController::class)
      ->middleware(['auth:sanctum', 'throttle:60,1']);
  ```
- **Controller-Level Middleware (Per-Action)**:
  ```php
  class PhotoController extends Controller
  {
      public static function middleware(): array
      {
          return [
              new Middleware('auth:sanctum', only: ['store', 'update', 'destroy']),
              new Middleware('throttle:60,1', only: ['store']),
          ];
      }
  }
  ```
- **Middleware with Parameters**:
  ```php
  $this->middleware('role:admin,editor')->only(['destroy']);
  ```
- **Combined Approach**:
  ```php
  // routes/api.php — broad middleware
  Route::apiResource('photos', PhotoController::class)->middleware('auth:sanctum');

  // controller — fine-grained middleware
  class PhotoController extends Controller
  {
      public static function middleware(): array
      {
          return [
              new Middleware('throttle:store', only: ['store']),
              new Middleware('verify.ownership', only: ['update', 'destroy']),
          ];
      }
  }
  ```

---

## Architectural Decisions

- **Why route-level over constructor-level?** Route-level makes the middleware stack visible in the route file, which is the single source of truth for HTTP configuration. Constructor middleware is hidden from someone reading the routes.
- **Why constructor-level at all?** Constructor-level allows per-method middleware (`only()`/`except()`) when route-level middleware would require registering each route individually.
- **Why `static middleware()` in Laravel 11?** Static middleware avoids resolving the controller instance before middleware is known, enabling lazy controller resolution and route caching optimizations.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Route-level middleware is visible in the route file | Cannot easily apply different middleware per method without per-route registration | Use controller-level for per-method, route-level for broad strokes |
| Controller-level middleware is co-located with the controller | Hidden from route audit | Include middleware documentation in controller docblocks |
| Static middleware (Laravel 11+) is optimized | Requires migration from constructor-based middleware | Update guide for upgrading projects |

---

## Performance Considerations

- Middleware assignment method has negligible performance impact. The middleware stack is compiled during route dispatching.
- Static middleware (Laravel 11+) allows the framework to resolve middleware without instantiating the controller, saving a small amount of memory on non-matching routes.
- Route caching includes middleware; `php artisan route:cache` compiles both route-level and controller-level middleware.

---

## Production Considerations

- Prefer route-level middleware in API route files for visibility. Use controller-level only for per-method exceptions.
- Document middleware requirements in the controller class docblock for at-a-glance reference.
- Audit middleware with `php artisan route:list -v` to see applied middleware per route.
- In Laravel 11+, migrate from constructor-based middleware to the static `middleware()` method for caching optimization.
- Avoid duplicating middleware at both route and controller level — the middleware runs twice.

---

## Common Mistakes

- **Duplicate middleware at route and controller level**: `Route::apiResource(...)` has `auth:sanctum` and the controller constructor also applies `auth:sanctum`.
  - *Why it happens:* Forgetting which level already has the middleware.
  - *Why it's harmful:* Middleware runs twice, doubling auth overhead.
  - *Better approach:* Apply each middleware only once; prefer route-level.

- **Using `$this->middleware()` without `only()` or `except()` for API controllers**: Applying `auth` to `index` and `show` when those endpoints should be public.
  - *Why it happens:* Not considering which methods need protection.
  - *Why it's harmful:* Public read endpoints become authenticated unnecessarily.
  - *Better approach:* Use `only(['store', 'update', 'destroy'])` for write-only auth.

- **Forgetting middleware order matters for request modification**: Applying `throttle` after `auth` so unauthenticated requests are throttled before auth check.
  - *Why it happens:* Assuming middleware order is irrelevant.
  - *Why it's harmful:* Unauthenticated requests bypass throttle limits.
  - *Better approach:* Order middleware: `throttle` first, then `auth`.

---

## Failure Modes

- **Missing middleware on a new controller method**: Adding a new action but forgetting to apply authentication middleware. *Detection:* Unauthenticated access succeeds. *Mitigation:* Apply middleware at the route group level so all new routes inherit it.

- **Middleware applied to non-existent methods via `only()`**: `$this->middleware('auth')->only(['search'])` but `search` is not a resource action. *Detection:* No error — middleware is registered but never triggers. *Mitigation:* Verify `only()` arrays match actual controller methods.

- **Static middleware (Laravel 11) method not found**: A controller uses constructor-based middleware but the framework expects the static `middleware()` method. *Detection:* Middleware does not apply. *Mitigation:* Check Laravel version; migrate to static middleware for Laravel 11+.

---

## Ecosystem Usage

- **Laravel Fortify**: Uses constructor middleware with `only()` to apply authentication and rate-limiting to specific authentication actions.
- **Laravel Spark (API)**: Route-level middleware for subscription checks on billing controllers.
- **Laravel Nova**: Nova's resource controllers apply authorization middleware via constructor middleware with `only(['store', 'update', 'destroy'])`.

---

## Related Knowledge Units

### Prerequisites
- Middleware Basics
- Resource Controller Pattern

### Related Topics
- Controller Dependency Injection
- Controller Organization by Version

### Advanced Follow-up Topics
- Controller Testing Strategies
- Thin Controller Enforcement

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\Controller::middleware()` — middleware registration
- `Illuminate\Routing\ControllerMiddlewareOptions` — `only()`/`except()` fluent API
- `Illuminate\Routing\ControllerDispatcher::getMiddleware()` — middleware resolution
- `Illuminate\Routing\Router` — route-level middleware application

### Key Insight
Controller middleware runs *after* route-level middleware but *before* the controller method. The order is: global → route group → route → controller constructor → controller method.

### Version-Specific Notes
- Constructor-based middleware: Laravel 5.0–10.x.
- Static `middleware()` method: Introduced in Laravel 11 as the preferred approach.
- Both approaches work in Laravel 11; the static method is recommended for new code.
