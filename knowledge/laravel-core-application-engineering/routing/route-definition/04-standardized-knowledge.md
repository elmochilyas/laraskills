# ECC Standardized Knowledge — Route Definition

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Route Definition |
| **Difficulty** | Foundation |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Route definition is the process of mapping HTTP request patterns (method + URI) to application response handlers (controllers, closures, or views). Every incoming request passes through the router, which matches against registered routes and dispatches the matched route's handler. The routing layer is the application's public contract — the URL structure, HTTP methods, and parameter conventions define how clients interact with the system.

The most critical engineering decision is the choice of handler type: Closures vs Controllers. A single Closure-based route blocks `route:cache` for the entire application. The second critical decision is route file organization — the default `routes/web.php` works for ~50 routes, beyond which organization strategy impacts navigation and team ownership.

---

## Core Concepts

### HTTP Verb Routing
`get()`, `post()`, `put()`, `patch()`, `delete()`, `options()` register routes per verb. `match()` accepts multiple verbs. `any()` accepts all verbs.

### Route Files
`routes/web.php` (web middleware), `routes/api.php` (api middleware), `routes/console.php`, `routes/channels.php`. Configured in `bootstrap/app.php` (Laravel 11+) or `RouteServiceProvider` (Laravel 10-).

### Route Action
Every route has an action — Closure or controller reference. Controller actions are stored as `['uses' => 'Controller@method']`. Closures block route caching.

### Route Registration Flow
`Router::get/post/etc()` → `Router::addRoute()` → `Router::createRoute()` → `RouteCollection::add($route)`. Happens at bootstrap time, not request time.

### Route Matching
`RouteCollection::match($request)` iterates routes by method group, checks 4 validators (URI, method, scheme, host), returns first match or throws `NotFoundHttpException`. Regex compilation is deferred to first match.

### Fallback Routes
`Router::fallback()` creates a special route deferred to last priority — only activates when no explicit route matches.

---

## When To Use

- Every HTTP endpoint in the application
- Defining the application's public URL contract
- Organizing routes by feature/domain for applications with 50+ routes
- Registering routes for packages and modules

---

## When NOT To Use

- Closures should never be used for routes in production (blocks caching)
- `any()` should be avoided — it preempts more specific routes
- Routes should not contain business logic (that belongs in controllers/services/actions)

---

## Best Practices

### Always Use Controller Array Syntax
Use `[Controller::class, 'method']` instead of `'Controller@method'`.

**Why:** Array syntax enables IDE "Go to Definition" and refactoring tools. String syntax is opaque to static analysis.

### Never Use Closure Routes in Production
All routes must reference controllers for cacheability.

**Why:** A single Closure route blocks `route:cache` for the entire application, degrading matching performance by up to 5x.

### Always Name Routes
Call `->name()` on every route.

**Why:** Named routes enable `route()` URL generation, prevent hardcoded URLs in tests and views, and allow URI changes without breaking references.

### Split by Domain at Scale
Split `web.php` into feature-based files when exceeding 50 routes.

**Why:** Single-file navigation becomes impractical beyond 50 routes. Feature-based files provide team ownership boundaries and reduce merge conflicts.

---

## Architecture Guidelines

### Route File Loading (Laravel 11+)
```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    api: __DIR__.'/../routes/api.php',
)
```

### Registration vs Dispatch
Registration (loading files, building RouteCollection) happens at bootstrap. Dispatch (matching, running middleware, calling handler) happens at runtime.

### Route Collection Structure
`$routes[method]` — routes grouped by HTTP method
`$nameList[name]` — hash table for named lookup (O(1))

---

## Performance Considerations

### Route Registration Cost
~1-2ms per 100 routes. Not optimized by caching — registration always runs.

### Uncached Matching
Iterates routes in registration order. 5-15ms per 100 routes on first request, 2-5ms on subsequent (OpCache).

### Cached Matching
Uses Symfony `CompiledUrlMatcher` with prefix-tree regex. ~1-2ms regardless of route count. O(log n) or near-constant.

### Closure Blocking
One Closure route blocks caching entirely. All routes lose 5x performance benefit.

---

## Security Considerations

### Route Exposure
Every registered route is a potential attack surface. Audit with `php artisan route:list` regularly.

### Method Confusion
Using `any()` lets unintended HTTP methods reach handlers that expect specific methods. Use explicit verb methods or `match()`.

### Hidden Routes
Routes in files not loaded (misspelled path, missing `require`) silently don't exist. The application returns 404 without indication that a route was intended.

---

## Common Mistakes

### Closure Routes in Production
Desc: Using Closure-based route handlers.
Cause: Developer convenience — faster to write.
Consequence: Blocks `route:cache` for the entire application.
Better: Use invokable single-action controllers.

### Not Naming Routes
Desc: Routes defined without `->name()`.
Cause: The route works without a name.
Consequence: `route()` helper cannot generate URLs; changing URI breaks all references.
Better: Always call `->name()` on every route.

### String Controller Syntax
Desc: `'Controller@method'` instead of `[Controller::class, 'method']`.
Cause: Legacy examples use string syntax.
Consequence: IDE cannot resolve class references.
Better: Use array syntax for IDE support.

### Overusing any()
Desc: `Route::any()` accepting all HTTP methods.
Cause: Convenience — don't want to specify methods.
Consequence: Preempts more specific routes; violates HTTP semantics.
Better: Use `match(['GET', 'POST'], ...)` for known methods.

---

## Anti-Patterns

### Business Logic in Route Files
Defining complex logic directly in route files instead of controllers. Route files should be thin — just URI → handler mappings.

### One Giant Route File
All routes in a single file for applications with 200+ routes. Causes merge conflicts, slow navigation, and unclear ownership.

### Mixed Closure and Controller Routes
Using both styles in the same application. Inconsistent, confusing, and if any closure exists, caching is blocked for all routes.

---

## Examples

### Basic Verb Routing
```php
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);
```

### Named Route
```php
Route::get('/users/{id}', [UserController::class, 'show'])->name('users.show');
```

### Fallback Route
```php
Route::fallback(function () {
    return response()->json(['message' => 'Not Found'], 404);
});
```

### Feature-Based Route Files
```php
// routes/admin.php
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::resource('users', Admin\UserController::class);
    Route::resource('settings', Admin\SettingController::class);
});
```

---

## Related Topics

### Prerequisites
- **Service Container Basics** — Controller resolution during dispatch
- **Application Architecture** — Bootstrap/app.php route configuration

### Closely Related
- **Resourceful Routing** — Pattern-based CRUD route generation
- **Route Groups** — Prefix, middleware, and name inheritance
- **Route Name Generation** — URL generation via named routes
- **Route Caching** — Performance optimization that forbids closures

### Advanced
- **Route Model Binding** — Automatic model resolution from parameters
- **API Versioning** — Route organization for versioned APIs

### Cross-Domain
- **API & CRUD System Engineering** — API route design principles

---

## AI Agent Notes

### Important Decisions
- Closure routes block `route:cache` — this is a framework enforcement, not a recommendation
- Regex compilation is deferred to first match — never paid for routes that don't match
- Laravel 11+ uses `bootstrap/app.php` with `->withRouting()` instead of `RouteServiceProvider`

### Important Constraints
- Route names must be globally unique — duplicate names silently overwrite
- Route registration order determines matching priority
- Fallback routes always defer to explicit routes regardless of registration order

### Rules Generation Hints
- Enforce controller array syntax over string syntax
- Ban Closure-based routes in production code
- Require `->name()` on every route

---

## Verification

This document has been validated against:
- `Illuminate\Routing\Router.php` — `addRoute()`, `createRoute()`, `loadRoutes()`, `fallback()`
- `Illuminate\Routing\Route.php` — Action storage, `matches()`, `compileRoute()`
- `Illuminate\Routing\RouteCollection.php` — Route storage and lookups
- `Illuminate\Routing\RouteFileRegistrar.php` — Route file loading via `require`
