# Skill: Define Application Routes

## Purpose

Map HTTP request patterns (method + URI) to controller handlers. Route definition is the application's public contract — URL structure, HTTP methods, and parameter conventions define how clients interact with the system. Proper route definition enables route caching, URL generation, and team-scalable organization.

## When To Use

- Adding a new HTTP endpoint to the application
- Organizing routes by feature/domain for applications with 50+ routes
- Registering routes for packages and modules

## When NOT To Use

- Business logic should never be placed in route files (use controllers/services/actions)
- Closure routes should never be used in production (blocks route:cache)
- Route::any() should be avoided — preempts more specific routes

## Prerequisites

- Laravel routing system knowledge
- Controller classes defined
- Service container configured for controller DI

## Inputs

- HTTP method (GET, POST, PUT, PATCH, DELETE)
- URI pattern (with optional parameters)
- Controller class and method reference
- Route name
- Optional: middleware list, prefix, or group configuration

## Workflow

1. Determine the HTTP method and URI for the endpoint
2. Create the controller method if it does not exist
3. Add the route using `Route::[method]()` with controller array syntax
4. Call `->name()` with a unique, descriptive route name
5. Add middleware via `->middleware()` if needed
6. Group related routes using `Route::group()` or prefix/name inheritance
7. Split route files by domain/feature when exceeding 50 routes per file
8. Run `php artisan route:list` to verify registration
9. Run `php artisan route:cache` to enable compiled matching

## Validation Checklist

- [ ] Controller array syntax used (`[Controller::class, 'method']`)
- [ ] Route has a unique name via `->name()`
- [ ] No Closure-based routes in production code
- [ ] Explicit HTTP verb methods used (no `any()`)
- [ ] Route files organized by domain if >50 routes
- [ ] Business logic is in controllers, not route files
- [ ] `php artisan route:list` shows the route
- [ ] `route()` helper generates the correct URL

## Common Failures

### Closure routes blocking cache
One Closure route blocks `route:cache` for the entire application. Always use invokable controllers or controller array syntax.

### Missing route names
Routes without names force hardcoded URIs in views and tests. Always call `->name()` on every route.

### Overusing any()
Route::any() allows unintended HTTP methods. Use specific verb methods or `match()`.

## Decision Points

### Closure vs Controller?
Closures block caching. Always use controller references in production.

### Single file vs Split files?
Split at 50+ routes by feature/domain to prevent merge conflicts and maintain clarity.

## Performance Considerations

- Route caching improves matching from 5-15ms to ~1-2ms (5x improvement)
- A single Closure route blocks caching for the entire application
- Route registration (~1-2ms/100 routes) always runs even with caching

## Security Considerations

- Every registered route is a potential attack surface — audit with `php artisan route:list`
- `Route::any()` exposes handlers to unintended HTTP methods
- Unloaded route files silently return 404 — verify all route files are loaded

## Related Rules

- Use Controller Array Syntax
- Ban Closure Routes in Production
- Name Every Route
- Use Explicit HTTP Verb Methods
- Split Route Files by Domain at Scale
- Keep Business Logic Out of Route Files

## Related Skills

- Implement Route Groups
- Define Resourceful Routes
- Configure Route Model Binding
- Optimize Route Caching

## Success Criteria

- All routes use controller array syntax
- All routes have unique names
- `php artisan route:cache` succeeds
- Route organization is navigable by domain/feature
- URL generation via `route()` works for all named routes
