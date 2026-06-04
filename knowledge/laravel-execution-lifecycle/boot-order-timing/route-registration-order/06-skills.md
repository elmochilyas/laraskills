# Skill: Order Routes Correctly for First-Match Routing

## Purpose
Define routes in the correct registration order to ensure Laravel's first-match router returns the expected handler, with specific routes before wildcard routes and fallback routes last.

## When To Use
- Defining routes in `web.php`, `api.php`, or custom route files
- Adding new routes that may conflict with existing wildcard patterns
- Debugging routes that return 404 or hit the wrong controller
- Setting up route caching for production

## When NOT To Use
- RESTful API resources where each endpoint has a unique, unambiguous URL — order matters less
- For route naming — use `->name()` to decouple URL generation from route paths
- For routes with distinct HTTP methods on the same URI — they do not conflict

## Prerequisites
- Understanding that the Router returns the first matching route in registration order
- Knowledge of route groups, prefixes, and middleware inheritance
- Familiarity with `Route::fallback()` behavior

## Inputs
- Current route definitions in all route files
- Route loading order in `RouteServiceProvider::boot()`
- List of new routes to add

## Workflow
1. Review all route files and identify wildcard parameters (`{user}`, `{id}`, `{slug}`, `{any}`)
2. Ensure all specific routes are defined before their corresponding wildcard patterns (e.g., `/users/create` before `/users/{user}`)
3. Place `Route::fallback()` as the very last route definition — after all other routes
4. Order route file loading in `RouteServiceProvider::boot()` consistently: auth routes first, resource routes next, feature routes, then API routes
5. Use `Route::pattern()` or `whereNumber()` / `whereAlpha()` constraints on wildcard parameters to narrow matching
6. Replace all closure-based route handlers with controller classes for route cache compatibility
7. Assign unique names via `->name()` to every route that is referenced via `route()` or `redirect()->route()`
8. Run `php artisan route:cache` and verify it succeeds without `LogicException`
9. Run `php artisan route:list` to verify the resolved route order

## Validation Checklist
- [ ] Specific routes are defined before wildcard routes
- [ ] `Route::fallback()` is the last route definition
- [ ] All route handlers use controller classes (not closures) when route caching is used
- [ ] Every route referenced via `route()` has a unique `->name()`
- [ ] Route file loading order in `RouteServiceProvider` is documented and consistent
- [ ] `php artisan route:cache` succeeds without errors
- [ ] Route pattern constraints are applied where appropriate

## Common Failures
- Wildcard before specific — `/{any}` defined before `/{slug}` catches broader patterns first, making specific routes unreachable
- Closure route handlers — `route:cache` throws `LogicException` when any route uses a closure
- Fallback registered too early — routes defined after `Route::fallback()` are never matched
- Undocumented route file loading order — adding a new route file in the wrong position shadows existing routes
- Routes in `register()` — routes should be defined in `boot()` when all services are available

## Decision Points
- Use route groups for consistent prefixes and middleware; order groups carefully since group ordering also matters
- If a wildcard route must be flexible, use `where()` constraints to narrow what it matches
- If route caching is used, every handler must be a controller class string — no closures, no invokable objects with constructor dependencies that can't be serialized
- For large applications, split route files by feature and load them in a documented order in `RouteServiceProvider`

## Performance Considerations
- Route registration time: ~20-40ms uncached for 500 routes; zero after `route:cache`
- The compiled route matcher uses a prefix tree for O(log n) matching after caching
- Wildcard routes with regex constraints are slightly slower than literal routes in the compiled matcher
- Route caching freezes registration order — the order at cache time is the order forever

## Security Considerations
- Route order affects auth middleware coverage — authenticated routes must be registered before catch-all routes
- Fallback routes that log unmatched requests should register last to avoid intercepting valid routes
- Route pattern constraints (`whereNumber`, `whereAlpha`) prevent parameter injection on wildcard routes
- Ensure package routes don't shadow application routes by controlling registration order

## Related Rules
- Route Registration Order Rule 1: Define Specific Routes Before Wildcard Routes
- Route Registration Order Rule 3: Register Fallback Routes Last
- Route Registration Order Rule 5: Cache Routes in Production

## Related Skills
- Order Middleware for Correct Request Processing (ku-06-middleware-registration-order)
- Configure Event Listener Order and Registration (ku-08-event-listener-registration-order)
- Order Service Providers by Dependency (ku-02-provider-registration-order)

## Success Criteria
- Every specific route is reachable and not shadowed by a wildcard
- `Route::fallback()` is the last entry and catches only truly unmatched requests
- `php artisan route:cache` completes without error
- All routes referenced via `route()` have unique names
- Route file loading order is documented and produces the expected `route:list` output
