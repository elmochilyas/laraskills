# ku-02: Route Caching

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **KU:** ku-02-route-caching
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Route caching compiles all application routes into a serialized file (`bootstrap/cache/routes.php`) containing a `CompiledUrlMatcher` and `CompiledUrlGenerator`. This eliminates route registration overhead and speeds up URL matching. Routes using Closures cannot be cached — all route handlers must be controller strings.

## Core Concepts
- **Compiled matcher**: `CompiledUrlMatcherDumper` (Symfony component) generates a prefix-compiled regex tree from the route collection. Matching is O(log n).
- **Serialization**: Routes are serialized via `serialize()`/`unserialize()` on Symfony Route objects. The compiled regex, defaults, requirements, and options are stored.
- **Closure limitation**: Route Closures cannot be serialized. `route:cache` throws `LogicException` if any route uses a Closure.
- **Cache file**: `bootstrap/cache/routes.php` returns `['compiled' => ..., 'generator' => ...]`.
- **Config dependency**: Route caching depends on configuration being resolved first. Always run `config:cache` before `route:cache`.

## When To Use
- **Always in production for applications with 100+ routes** — measurable bootstrap improvement.
- For applications with complex route groups and middleware chains.
- When deploying with Octane or Vapor where route registration cost is paid once per worker.

## When NOT To Use
- When routes use Closures — convert to controller classes first.
- In development — route changes would require cache rebuild.
- For applications with dynamic route registration (e.g., multi-tenant route injection) — cached routes are static.

## Best Practices (WHY)
- **Use controller strings for all routes**: Convert `Route::get('/', fn() => view('welcome'))` to `Route::get('/', [WelcomeController::class, '__invoke'])`.
- **Cache after config:cache**: Route loading depends on configuration values (URL defaults, etc.).
- **Validate routes before caching**: Run `php artisan route:list` to verify all routes resolve before caching.
- **Include in deployment**: Always run `route:cache` in deployment scripts after file changes.

## Architecture Guidelines
- Group routes by middleware and prefix to maximize compiled matcher efficiency.
- Avoid route patterns that change frequently — the cache must be rebuilt on any route change.
- For multi-tenant apps with dynamic routes, consider caching a base set of routes and handling tenant routes via middleware.
- Route caching does NOT cache controller resolution or middleware execution — only the route matching layer.

## Performance
- Uncached: route registration overhead of 20-40ms for 200+ routes. URL matching ~10-20µs per route.
- Cached: registration overhead zero. URL matching ~1µs via compiled prefix tree.
- Cache file size: 200KB-1MB for 500 routes (includes compiled regex patterns).
- OpCache caches the `routes.php` file parse, but `unserialize()` still reconstructs objects.

## Security
- Cached routes use the original route definitions — middleware and auth constraints are preserved.
- Route caching does NOT expose routes to unauthorized users — auth middleware still runs at request time.
- Ensure `route:cache` runs AFTER any conditional route registration that depends on environment.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Closure routes | `Route::get('/', fn() => ...)` blocks caching | Developer convenience | LogicException on route:cache | Use controller classes |
| Missing re-cache after route addition | New routes return 404 | Not rebuilding cache after changes | Users can't access new pages | Include route:cache in deploy |
| Caching without config cache | Routes reference config values | Running route:cache before config:cache | Inconsistent route configuration | Always cache config first |
| Dynamic routes in cached app | Tenant-specific routes not registering | Cache freezes all routes at build time | Tenant routes missing | Use middleware-based routing for dynamic parts |
| Stale cache after provider change | Route from new provider not available | Provider added but cache not rebuilt | Route not found errors | Clear and regenerate cache |

## Anti-Patterns
- **Mixed closure/controller routes**: Only some routes use controllers — still blocks caching for all routes.
- **Route cache in development**: Running route:cache locally and wondering why route changes don't take effect.
- **Ignoring route:list output**: Not verifying routes before caching — cache may capture incorrect state.

## Examples
```bash
# Deployment sequence
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

## Related Topics
- Config Caching (ku-01) — prerequisite for route caching
- Route Registration Order (ku-07) — how registration order affects the cached matcher
- Optimize Command (ku-09) — route:cache as part of php artisan optimize
- Cache Invalidation (ku-08) — deployment strategies for route cache clearing

## AI Agent Notes
- `RouteCacheCommand::handle()` bootstraps a fresh application to collect routes — this is why it reads all route files.
- The compiled matcher uses `Symfony\Component\Routing\Matcher\CompiledUrlMatcherDumper` which creates a prefix tree.
- `Route::redirect()`, `Route::view()`, and `Route::permanentRedirect()` are converted to internal controller classes and ARE cacheable.
- After `route:cache`, inspect `bootstrap/cache/routes.php` to see the serialized compiled matcher.

## Verification
- [ ] `php artisan route:cache` runs without LogicException
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment
- [ ] `php artisan route:list` output matches expectations after caching
- [ ] New routes work correctly after deployment (cache was rebuilt)
