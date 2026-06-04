# Route Caching

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
Route caching compiles all application routes into a serialized file (`bootstrap/cache/routes.php`) containing a `CompiledUrlMatcher` and `CompiledUrlGenerator`. This eliminates route registration overhead and speeds up URL matching. Routes using Closures cannot be cached — all route handlers must be controller strings. Route caching is the second most impactful optimization after config caching, reducing route registration from 20-40ms to near zero.

## Core Concepts

### Compiled Matcher
`CompiledUrlMatcherDumper` (Symfony component) generates a prefix-compiled regex tree from the route collection. Matching is O(log n).

### Serialization
Routes are serialized via `serialize()`/`unserialize()` on Symfony Route objects. The compiled regex, defaults, requirements, and options are stored.

### Closure Limitation
Route Closures cannot be serialized. `route:cache` throws `LogicException` if any route uses a Closure. All handlers must be controller class strings.

### Cache File Structure
`bootstrap/cache/routes.php` returns `['compiled' => ..., 'generator' => ...]` — two key pieces: the compiled matcher and the URL generator.

### Config Dependency
Route caching depends on configuration being resolved first. Always run `config:cache` before `route:cache`.

## Mental Models

### The Frozen Recipe Book
Think of route registration as a chef preparing ingredients. Without caching, the chef reads the recipe from scratch for every dish (request). Route caching is a frozen, pre-prepared meal — the cooking is done, just reheat and serve.

### The Map in a New Language
Without caching, the router uses a list of addresses (route list) and checks each one sequentially. With caching, the router has a GPS with a prefix tree — it knows the fastest path to any destination.

### The Phone Book
Imagine a phone book with 500 names. Finding someone by reading the entire book (O(n)) takes time. Route caching creates an index — you jump directly to the right page.

## Internal Mechanics

### Cache Build Flow
```
php artisan route:cache
  1. Bootstraps a fresh Laravel application instance
  2. All service providers boot, registering routes
  3. RouteCollection is fully populated
  4. RouteCollection is serialized via serialize()
  5. CompiledUrlMatcherDumper generates prefix-compiled regex
  6. Written to bootstrap/cache/routes-v3.php
```

### Compiled Matcher Structure
```php
// CompiledUrlMatcher uses a prefix tree:
// /users          → literal match
// /users/{id}     → regex: /users/(\d+)
// /users/{name}   → regex: /users/([a-z]+)
// /posts/{slug}   → regex: /posts/(.+)
//
// Prefix tree groups common prefixes:
// /users → matches /users, /users/{id}, /users/{name}
// /posts → matches /posts/{slug}
```

### Route Types and Cacheability
- Controller routes (`[Controller::class, 'action']`) — cacheable
- Closure routes (`fn() => ...`) — NOT cacheable (LogicException)
- `Route::view()`, `Route::redirect()` — cacheable (internal controllers)
- `Route::permanentRedirect()` — cacheable

## Patterns

### Controller-Based Routes Pattern
Define all routes using controller arrays: `Route::get('/', [HomeController::class, 'index'])` instead of closures. This enables route caching.

### Cache-Before-Deploy Pattern
Run `route:cache` as a deployment step, never during development. The cache file is a deployment artifact.

### Config-First Pattern
Always run `config:cache` before `route:cache` — routes depend on resolved configuration values (URL defaults, etc.).

## Architectural Decisions

### Why Closure routes can't be cached?
Closures are PHP callable objects that cannot be reliably serialized. They may reference scope variables, `$this`, or use features that aren't serializable. Symfony's route serializer requires serializable route handlers.

### Why CompiledUrlMatcherDumper instead of storing the RouteCollection?
The compiled matcher is faster — it uses a prefix-compiled regex tree for O(log n) matching instead of O(n) linear iteration. It's an optimization, not just a serialization.

### Why a separate cache file from config?
Routes change more frequently than config. A separate file means adding one route only requires `route:cache`, not a full `optimize`.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| O(log n) matching instead of O(n) | All routes must use controller classes | Forces architectural discipline |
| Route registration cost eliminated | Cache must be rebuilt on any route change | Deployment must include route:cache |
| Consistent URL generation | Closure routes not allowed | Some flexibility sacrificed |
| 20-40ms bootstrap reduction per request | Cache file must be deployed with app | Larger deployment artifact |

## Performance Considerations

- **Uncached:** route registration of 20-40ms for 200+ routes. URL matching ~10-20µs per route.
- **Cached:** registration overhead zero. URL matching ~1µs via compiled prefix tree.
- **Cache file size:** 200KB-1MB for 500 routes (includes compiled regex patterns).
- **OpCache interaction:** OpCache caches the `routes.php` file parse, but `unserialize()` still reconstructs objects.

## Production Considerations

- **Always cache in production:** For applications with 100+ routes, route caching is essential for optimal performance.
- **Validate before caching:** Run `php artisan route:list` to verify all routes resolve before caching.
- **Deployment script order:** `config:cache` → `route:cache` → `event:cache`.
- **Verify on deploy:** After deployment, test that cached routes resolve correctly.
- **Named routes for stability:** Use `->name()` on all routes to ensure URL generation works consistently across cache rebuilds.

## Common Mistakes

- **Closure routes block caching:** `Route::get('/', fn() => view('welcome'))` — entire route cache fails.
- **Missing re-cache after route addition:** New routes return 404 after deployment.
- **Caching without config cache:** Routes reference config values that aren't yet resolved.
- **Dynamic routes in cached app:** Tenant-specific routes not registering — cache freezes all routes at build time.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Route cache error | `LogicException: Route cache not supported` | Closure used in route handler | Convert to controller class |
| Routes returning 404 | New routes not found | Cache not rebuilt after adding routes | Include route:cache in deploy |
| Mixed up route order | Routes work locally, not on production | Registration order differs between envs | Verify route:list output |
| Stale cache after provider change | Route from new provider not available | Provider added but cache not rebuilt | Clear and regenerate cache |

## Ecosystem Usage

- **Laravel Nova:** Uses controller classes for all routes — compatible with route caching.
- **Laravel Horizon:** Dashboard routes use controller classes, enabling route caching in production.
- **Laravel Spark:** All billing routes use controller classes — cached in production deployment.
- **Laravel Cashier:** Route definitions in its service provider use controller strings, compatible with caching.

## Related Knowledge Units

### Prerequisites
- [Config Caching (ku-01)](../config-caching/02-knowledge-unit.md) — prerequisite for route caching.
- [Route Registration Order (ku-07)](../../boot-order-timing/ku-07-route-registration-order/02-knowledge-unit.md) — how registration order affects the cached matcher.

### Related Topics
- [Optimize Command (ku-09)](../optimize-command/02-knowledge-unit.md) — route:cache as part of optimize.
- [Cache Invalidation (ku-08)](../cache-invalidation-deployment/02-knowledge-unit.md) — deployment strategies for route cache clearing.

## Research Notes
- `RouteCacheCommand::handle()` bootstraps a fresh application to collect routes — this is why it reads all route files.
- The compiled matcher uses `Symfony\Component\Routing\Matcher\CompiledUrlMatcherDumper` which creates a prefix tree.
- `Route::redirect()`, `Route::view()`, and `Route::permanentRedirect()` are converted to internal controller classes and ARE cacheable.
- After `route:cache`, inspect `bootstrap/cache/routes.php` to see the serialized compiled matcher.
