# Route Caching

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Caching & Optimization |
| Knowledge Unit | Route Caching |
| Difficulty | Intermediate |
| Lifecycle Phase | Application Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Route caching compiles all application routes into a serialized file (`bootstrap/cache/routes.php`) containing a `CompiledUrlMatcher` and `CompiledUrlGenerator`. This eliminates route registration overhead on every request and speeds up URL matching by converting the route collection into an optimized prefix-compiled regex tree. Routes using Closures cannot be cached — all route handlers must be controller strings.

## Core Concepts
- **Compiled matcher**: `CompiledUrlMatcherDumper` (Symfony component) generates a prefix-compiled regex tree. Matching is O(log n) rather than O(n).
- **Serialization**: Routes are serialized via `serialize()`/`unserialize()` on Symfony Route objects. The compiled regex, defaults, requirements, and options are stored.
- **Closure limitation**: Route Closures cannot be serialized. `route:cache` throws `LogicException` if any route uses a Closure.
- **Cache file**: `bootstrap/cache/routes.php` returns `['compiled' => ..., 'generator' => ...]`.
- **Config dependency**: Route caching depends on resolved configuration. Always run `config:cache` before `route:cache`.

## When To Use
- Always in production for applications with 100+ routes — measurable bootstrap improvement.
- For applications with complex route groups and middleware chains.
- When deploying with Octane or Vapor where route registration cost is paid once per worker.

## When NOT To Use
- When routes use Closures — convert to controller classes first.
- In development — route changes require cache rebuild.
- For applications with dynamic route registration — cached routes are static.

## Best Practices (WHY)
- **Use controller strings for all routes**: Convert `Route::get('/', fn() => view('welcome'))` to controller classes. *Why: Closures cannot be serialized and block route caching entirely.*
- **Cache after config:cache**: Route loading depends on configuration values. *Why: Route caching reads config for URL defaults and middleware resolution.*
- **Validate routes before caching**: Run `php artisan route:list` to verify all routes resolve before caching. *Why: A broken route at cache time fails the entire cache build.*
- **Include in deployment**: Always run `route:cache` in deployment scripts. *Why: Production must use cached routes for optimal performance.*

## Architecture Guidelines
- Group routes by middleware and prefix to maximize compiled matcher efficiency.
- Avoid route patterns that change frequently — the cache must be rebuilt on any route change.
- For multi-tenant apps with dynamic routes, cache a base set and handle tenant routes via middleware.
- Route caching does NOT cache controller resolution or middleware execution — only the route matching layer.

## Performance
- Uncached: route registration overhead of 20-40ms for 200+ routes. URL matching ~10-20µs per route.
- Cached: registration overhead zero. URL matching ~1µs via compiled prefix tree.
- Cache file size: 200KB-1MB for 500 routes (includes compiled regex patterns).
- OpCache caches the `routes.php` file parse, but `unserialize()` still reconstructs objects.

## Security
- Cached routes preserve original route definitions — middleware and auth constraints remain intact.
- Route caching does not expose routes to unauthorized users — auth middleware still runs at request time.
- Ensure `route:cache` runs AFTER any conditional route registration depending on environment.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Closure routes | `Route::get('/', fn() => ...)` blocks caching | LogicException on route:cache | Use controller classes |
| Missing re-cache after route addition | New routes return 404 | Not rebuilding cache after changes | Include route:cache in deploy |
| Caching without config cache | Routes reference config values | Inconsistent route configuration | Always cache config first |
| Dynamic routes in cached app | Tenant-specific routes not registering | Tenant routes missing | Use middleware-based routing for dynamic parts |
| Stale cache after provider change | Route from new provider not available | Route not found errors | Clear and regenerate cache |

## Anti-Patterns
- **Mixed closure/controller routes**: Some routes use closures — still blocks caching for all routes.
- **Route cache in development**: Running route:cache and wondering why route changes don't take effect.
- **Ignoring route:list output**: Not verifying routes before caching — cache may capture incorrect state.

## Examples
```bash
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

## Related Topics
- **Prerequisites:** Config Caching — prerequisite for route caching.
- **Closely Related:** Events Caching, Optimize Command — related caching commands.
- **Advanced:** Cache Invalidation Deployment — route cache clearing strategies.
- **Cross-Domain:** Route Registration Order — how registration order affects the cached matcher.

## AI Agent Notes
- `RouteCacheCommand::handle()` bootstraps a fresh application to collect routes — this is why it reads all route files.
- The compiled matcher uses `Symfony\Component\Routing\Matcher\CompiledUrlMatcherDumper`.
- `Route::redirect()`, `Route::view()`, and `Route::permanentRedirect()` are converted to internal controller classes and ARE cacheable.
- After `route:cache`, inspect `bootstrap/cache/routes.php` to see the serialized compiled matcher.

## Verification
- [ ] `php artisan route:cache` runs without LogicException
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment
- [ ] `php artisan route:list` output matches expectations after caching
- [ ] New routes work correctly after deployment (cache was rebuilt)
