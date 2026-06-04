| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Controller Middleware Assignment |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Middleware Basics, Resource Controller Pattern |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Middleware can be assigned to controller actions in two places: in the route registration file (`Route::get()->middleware(...)`) or inside the controller constructor (`$this->middleware(...)`). The choice between route-level and controller-level middleware assignment affects readability, testability, and the separation of routing concerns from controller concerns. Laravel 11+ introduces a static `middleware()` method as the preferred approach.

## Core Concepts

- **Route-Level Middleware**: Applied in route files — visible in the route listing.
- **Controller-Level Middleware**: Applied via constructor (Laravel 8-10) or static `middleware()` method (Laravel 11+).
- **Per-Method Filtering**: `only()` and `except()` target specific actions within a controller.
- **Middleware Parameters**: `$this->middleware('role:admin')` passes parameters to the middleware.
- **Execution Order**: Global → route group → route → controller constructor → controller method.

## When To Use

- **Route-level middleware**: For broad middleware applied to all actions (auth, throttle) — preferred for APIs.
- **Controller-level middleware**: For per-method middleware that differs across actions.
- **Static middleware (Laravel 11+)**: When optimizations from lazy controller resolution are desired.

## When NOT To Use

- Duplicate middleware at both route and controller levels — it runs twice.
- Middleware applied to non-existent methods via `only()`.
- Constructor-based middleware in Laravel 11+ (use static method instead for new projects).

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Prefer route-level for broad middleware (auth, throttle) | Visible in route file; single source of truth for HTTP config |
| Use controller-level only for per-method exceptions | When different actions need different middleware |
| Never duplicate middleware at both levels | Middleware runs twice, doubling overhead |
| Order middleware: throttle first, then auth | Unauthenticated requests should be throttled before auth check |
| In Laravel 11+, use static `middleware()` method | Enables lazy controller resolution and route caching optimizations |

## Architecture Guidelines

- For API controllers, apply `auth:sanctum` at the route group level — all routes inherit it.
- Use `only(['store', 'update', 'destroy'])` for write-only auth when read endpoints are public.
- Audit middleware with `php artisan route:list -v` to see the full middleware stack per route.
- Document middleware requirements in the controller class docblock.
- Migrate from constructor-based middleware to static middleware in Laravel 11+.

## Performance Considerations

- Middleware assignment method has negligible impact — the stack is compiled during dispatch.
- Static middleware (Laravel 11+) allows resolving middleware without instantiating the controller.
- Route caching includes both route-level and controller-level middleware.

## Security Considerations

- Middleware order matters: authentication before authorization, throttle before auth.
- Forgetting middleware on a new controller method can expose unauthenticated endpoints.
- Route-level middleware at the group level catches newly added routes; constructor-level does not.
- Using `except(['destroy'])` as a security measure is insufficient — use authorization policies.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Duplicate middleware at route and controller level | Forgetting which level has it | Middleware runs twice | Apply each middleware once; prefer route-level |
| Using middleware() without only()/except() for API controllers | Not considering which methods need protection | Public read endpoints become authenticated | Use `only(['store', 'update', 'destroy'])` |
| Wrong middleware order (auth before throttle) | Assuming order is irrelevant | Unauthenticated requests bypass throttle | Order: throttle first, then auth |

## Anti-Patterns

- **Middleware duplication**: Applying the same middleware at both route and controller levels.
- **Constructor middleware in Laravel 11+**: Static method is preferred for new projects.
- **Using `except()` for security**: Route exclusion is not a substitute for authorization.
- **Hiding all middleware inside controllers**: Reduces visibility of the HTTP configuration.

## Examples

- **Route-level**: `Route::apiResource('photos', PhotoController::class)->middleware('auth:sanctum')`
- **Controller-level (Laravel 11+)**: `public static function middleware(): array { return [new Middleware('auth', only: ['store', 'update', 'destroy'])]; }`
- **Controller-level (Laravel 8-10)**: `$this->middleware('auth')->only(['store', 'update', 'destroy'])`
- **Middleware with params**: `$this->middleware('role:admin,editor')->only(['destroy'])`

## Related Topics

- Controller Dependency Injection — Injecting middleware classes
- Controller Organization by Version — Version-specific middleware assignment
- Controller Testing Strategies — Testing middleware behavior in HTTP tests

## AI Agent Notes

- Default to route-level middleware for API controllers.
- Use static `middleware()` method for Laravel 11+ projects.
- Always include `only()` / `except()` when applying middleware to API resource controllers.
- Audit middleware stack with `php artisan route:list -v` after changes.

## Verification

- [ ] No middleware is duplicated at route and controller level
- [ ] Route-level middleware is preferred for broad middleware (auth, throttle)
- [ ] Controller-level middleware uses `only()`/`except()` for per-method targeting
- [ ] Middleware order is correct: throttle before auth
- [ ] Laravel 11+ uses static `middleware()` method (not constructor-based)
- [ ] `php artisan route:list -v` confirms the expected middleware stack per route
