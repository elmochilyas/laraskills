# Skill: Optimize Route Matching with Route Caching

## Purpose

Generate a compiled route cache via `php artisan route:cache` to reduce route matching from iterative O(n) checking to near-constant prefix-tree matching (~1-2ms per request), and integrate cache generation into the deployment pipeline for consistent production performance.

## When To Use

- ALL production deployments with controller-based routes
- Applications with 50+ routes (caching benefit is proportional to route count)
- API-heavy applications where route matching is a measurable portion of request time
- Deployments where optimization is prioritized

## When NOT To Use

- Development environments (cache masks route file changes)
- Applications with Closure-based routes that cannot be converted
- Dynamic routes that change at runtime

## Prerequisites

- All route handlers use controller array syntax (no Closure routes)
- Route files are deployed before cache generation
- Deployment script has write access to `bootstrap/cache/`

## Inputs

- Deployment pipeline configuration
- Route files with controller-based handlers

## Workflow

1. Ensure zero Closure routes exist in production route files (use controllers or invokable classes)
2. Verify all routes use controller array syntax by running `php artisan route:list`
3. Add `php artisan route:cache` to the deployment script after all files are deployed
4. Run `php artisan route:list` immediately after caching to verify all routes are present
5. Test a subset of routes to confirm they respond correctly
6. In development, run `php artisan route:clear` before modifying route files
7. Never run `route:cache` in development — clear cache instead

## Validation Checklist

- [ ] `route:cache` runs successfully without `LogicException`
- [ ] `route:list` after caching shows ALL expected routes
- [ ] No Closure routes in production route files
- [ ] Deployment script includes `route:cache`
- [ ] Development workflow uses `route:clear` (not cache)
- [ ] Cache file at `bootstrap/cache/routes-v7.php` is not publicly writable

## Common Failures

### Closure routes blocking cache
A single Closure route blocks `route:cache` for the entire application, producing `LogicException`. Convert all Closure routes to controller references.

### Forgetting to cache after route changes
Adding routes without running `route:cache` in deployment causes 404 errors for new routes. Always run cache as the last deployment step.

### Debugging with stale cache
Changing route files in development while cache is active causes phantom 404s. Use `route:clear` in development environments.

## Decision Points

### Cache in CI/CD or post-deploy?
Cache in the deployment pipeline after files are on the server, before the application serves traffic.

### Conditional route registration?
Avoid — conditional routes are captured at cache generation time and may not reflect runtime conditions. Use middleware for feature toggling instead.

## Performance Considerations

- Uncached: O(n) iteration, 5-15ms for 100 routes
- Cached: O(log n) or near-constant, ~1-2ms regardless of route count
- Cache generation takes ~2-5 seconds for 500 routes — run during deployment, not development
- A single Closure route blocks caching for the entire application

## Security Considerations

- Stale cache may expose old routes or miss new security middleware — always regenerate after route changes
- The cached route file (`routes-v7.php`) is a PHP file executed by the framework — ensure it is not publicly writable
- Cache poisoning: if an attacker modifies the cache file, they can change routing behavior

## Related Rules

- Ban Closure Routes in Production
- Run route:cache on Every Deployment
- Verify After Caching
- Clear Cache Before Route Modifications in Development
- Do Not Use Conditional Route Registration

## Related Skills

- Migrate Closure Routes to Cache-Compatible Controllers
- Define Application Routes
- Implement Route Groups

## Success Criteria

- `php artisan route:cache` succeeds without errors
- Route matching time is ~1-2ms per request
- All routes are present after cache generation
- Deployment pipeline includes `route:cache` and `route:list` verification
- Development workflow never uses `route:cache`

---

# Skill: Migrate Closure Routes to Cache-Compatible Controllers

## Purpose

Convert Closure-based route handlers to controller array syntax or invokable controllers so that `route:cache` can serialize all routes, enabling the 5x route matching performance improvement across the entire application.

## When To Use

- Existing codebase with Closure routes blocking route caching
- Simple route handlers (health checks, redirects, view responses)
- Any production route that currently uses `fn()`, `function()`, or `Closure`

## When NOT To Use

- Development-only routes (Closures are acceptable in development since cache is not used)
- Routes that genuinely need Closure-specific behavior (very rare — consider refactoring)

## Prerequisites

- Existing Closure-based routes identified
- Controller directory structure available

## Inputs

- List of Closure-based routes with their URIs, methods, and logic
- Existing route files

## Workflow

1. Identify all Closure routes in production route files: `Route::get('/health', fn() => ...)`
2. For simple response routes, create an invokable controller: `php artisan make:controller HealthController --invokable`
3. Move the Closure logic into the controller's `__invoke()` method
4. Replace the route handler: `Route::get('/health', HealthController::class)`
5. For routes with dependencies, inject via the controller constructor
6. For redirect routes, use `Route::redirect()` instead of Closure-based redirects
7. For view routes, use `Route::view()` instead of Closure-based view rendering
8. Run `php artisan route:cache` to verify no Closure routes block caching
9. Run `php artisan route:list` to verify all routes are present in cache

## Validation Checklist

- [ ] Every production route uses controller array syntax or invokable controller
- [ ] Zero Closure routes in production route files
- [ ] `php artisan route:cache` succeeds
- [ ] `php artisan route:list` shows all routes after caching
- [ ] Simple response routes use invokable controllers
- [ ] Redirect routes use `Route::redirect()`
- [ ] View routes use `Route::view()`

## Common Failures

### Missing one Closure route
A single overlooked Closure route blocks caching for ALL routes. Run `php artisan route:cache` and fix any `LogicException` until it succeeds.

### Over-engineering simple handlers
Creating full controllers for trivial health-check responses wastes effort. Use invokable controllers — they require only one file and one method.

## Decision Points

### Invokable Controller vs Full Controller?
Use invokable for single-action routes (health check, simple redirect). Use full controller with methods for multi-action routes.

### Route::redirect() vs Closure?
Use `Route::redirect()` for simple redirects — it is cache-compatible and requires no controller.

## Performance Considerations

- Converting Closures to controllers enables route caching (5x matching improvement)
- Invokable controllers have identical runtime performance to Closures
- Controller DI is resolved once per request — same as Closure-based DI

## Security Considerations

- Closure routes are impossible to audit via route listing — controllers are traceable
- Controller methods can be tested independently of routing
- Type hints and return types in controllers provide better static analysis

## Related Rules

- Ban Closure Routes in Production
- Run route:cache on Every Deployment
- Verify After Caching

## Related Skills

- Optimize Route Matching with Route Caching
- Define Application Routes
- Implement Named Rate Limiters

## Success Criteria

- Zero Closure routes in production route files
- `php artisan route:cache` succeeds on the first attempt
- Simple handlers use invokable controllers, `Route::redirect()`, or `Route::view()`
- Route matching is cached and performs at ~1-2ms per request
