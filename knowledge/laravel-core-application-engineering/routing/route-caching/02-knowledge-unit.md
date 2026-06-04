# Route Caching

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** Route Caching
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

Route caching (`php artisan route:cache`) compiles all registered routes into a serialized, regex-optimized format that loads significantly faster than registering routes from route files on every request. The cached routes are stored in `bootstrap/cache/routes-v7.php` and use Symfony's `CompiledUrlMatcher` for efficient prefix-tree regex matching.

The engineering significance of route caching is that it transforms route matching from O(n) iteration (check each route's regex until a match) to O(log n) prefix-tree matching. Community benchmarks show approximately 5x improvement in route matching performance for applications with 100+ routes, scaling to 5x for 1000+ routes. The previously documented "100x" improvement has not been reproduced in community benchmarks.

Route caching imposes a critical constraint: all routes must use controller references (not closures). A single closure-based route blocks the entire caching operation. This is not a bug or limitation — it is a deliberate architectural constraint enforced because closure serialization cannot guarantee correct behavior across all closure types.

---

## Core Concepts

### Cached Route File
`php artisan route:cache` writes to `bootstrap/cache/routes-v7.php` (version 7, updated across Laravel versions). The file contains a serialized array with:
- Compiled route regex patterns (Symfony `CompiledUrlMatcher` format)
- Route attributes: methods, URI, action, fallback, defaults, wheres, bindingFields, lockSeconds, waitSeconds, withTrashed
- Serialized closures (for routes that use first-class callables)

### CompiledRouteCollection
When the cache file exists, `Router::setCompiledRoutes()` creates a `CompiledRouteCollection` instead of a regular `RouteCollection`. The `CompiledRouteCollection`:
- Loads the serialized compiled data
- Creates a Symfony `CompiledUrlMatcher` for prefix-tree regex matching
- Maintains an inner `RouteCollection` for dynamic (non-cached) routes
- Reconstructs `Route` objects lazily only for matched routes (not the entire collection)

### Matching Flow (Cached)

```
CompiledRouteCollection::match($request)
  ├── Create CompiledUrlMatcher with compiled regex data
  ├── match() on CompiledUrlMatcher
  │     ├── Tree-based regex matching (O(log n))
  │     ├── Returns route attributes array on match
  │     └── Returns null on no match
  ├── if match found:
  │     ├── newRoute() — reconstruct Route from cached attributes
  │     └── return reconstituted Route
  └── if no match:
        ├── Fall back to dynamic RouteCollection
        ├── Check dynamically added routes
        └── Return match or throw NotFoundHttpException
```

### Serialization Limitations
Routes using Closure-based actions cannot be cached. The framework uses `Laravel\SerializableClosure` (formerly `opis/closure`) to serialize closures, but:
- Closures with `use` bindings to non-serializable objects (resources, file handles, DB connections) fail
- Closure scopes cannot always be fully captured
- The framework throws `LogicException: Unable to prepare route [...] for serialization. Uses Closure.` to prevent silent cache corruption

First-class callables (PHP 8.1+, `SomeClass::method(...)`) ARE cacheable since Laravel 10 (PR #48680).

### Dynamic Route Fallback
`CompiledRouteCollection` maintains an inner `RouteCollection` that can hold non-cached routes. When a cached match fails, the collection falls back to the dynamic collection. This allows some routes to be cached while others (closure-based or dynamically registered) remain uncached. However, performance benefits are limited to the cached subset.

---

## Mental Models

### Caching as Compilation
Route caching is more accurately described as "compilation" than "caching." The framework:
1. Loads and executes all route files
2. Compiles regex patterns from route URIs
3. Serializes the entire route collection
4. Deserializes and uses the pre-compiled data on subsequent requests

Unlike cache-aside patterns, route caching is all-or-nothing — you cannot cache individual routes.

### Frozen vs Dynamic
A cached route collection is frozen — routes cannot be added or removed without clearing and regenerating the cache. Any route registered after cache generation (dynamic routes in service providers, conditional route registration) must be added to the dynamic fallback collection, bypassing the caching benefit.

### 5x Improvement, Not 100x
The documented "100x" improvement is not reproducible. Community benchmarks (Voltdage.com) consistently show approximately 5x improvement for 100+ routes. The 5x figure is more representative of real-world caching benefit.

---

## Internal Mechanics

### Cache Generation

```
RouteCacheCommand::handle()
  ├── Ensure no middleware dispatches (avoids side effects)
  ├── $this->call('route:clear') — delete old cache file
  ├── Load all route files via Router::getRoutes()
  │     └── This triggers RouteCollection population
  ├── RouteCollection::compile()
  │     ├── Create Symfony CompiledUrlMatcherDumper
  │     ├── Dumper generates compiled regex data
  │     └── Serialize route attributes
  ├── Route::prepareForSerialization() — serialize closures
  └── Write serialized data to bootstrap/cache/routes-v7.php
```

### Route Reconstruction

```
CompiledRouteCollection::newRoute($attributes)
  ├── Unserialize closure actions via SerializableClosure::unserialize()
  ├── Create new Route from methods, URI, action array
  ├── Restore bindingFields (for inline key syntax)
  ├── Restore default parameters
  ├── Restore where constraints
  ├── Restore withTrashed flag
  ├── Restore lockSeconds/waitSeconds (for rate limiting)
  ├── Restore fallback flag
  └── Return reconstituted Route
```

Route reconstruction only happens for routes that match the request, not for the entire collection. This lazy reconstruction saves memory and CPU.

### Prefix-Tree Regex Matching
Symfony's `CompiledUrlMatcherDumper` builds a prefix-tree regex from all route patterns. The tree groups routes by common prefixes (`/users`, `/users/{id}`, `/users/{id}/posts`). Matching traverses the tree, eliminating whole branches when prefixes don't match.

For 1000 routes with shared prefixes, matching traverses ~10 nodes instead of checking 1000 individual regexes.

### Fallback Route Handling in Cache
When a cached fallback route matches:
```
CompiledRouteCollection::match($request)
  ├── CompiledUrlMatcher matches — returns fallback route
  ├── Check: does matched route have isFallback?
  ├── if yes:
  │     ├── Check dynamic RouteCollection for non-fallback match
  │     ├── If dynamic match found: return it
  │     └── If no dynamic match: return fallback
  └── Return result
```

This ensures fallback routes don't shadow dynamically registered non-fallback routes.

---

## Patterns

### Production Deployment Caching
```bash
php artisan route:cache
php artisan config:cache
php artisan view:cache
php artisan event:cache
php artisan optimize
```
Run all cache commands in order during deployment. Route caching is part of the standard production optimization suite.

### Development Cache Clearing
```bash
php artisan route:clear
```
Run during development when route changes aren't reflected. Include in local development workflows or watchdog scripts.

### Route Cache Health Check
Production monitoring should verify the cache file exists:
```bash
test -f bootstrap/cache/routes-v7.php && echo "Route cache exists"
```

### Segregating Cachable and Non-Cachable Routes
```php
// routes/cachable_api.php — all controller-based, fully cacheable
Route::middleware('api')->prefix('v1')
    ->group(base_path('routes/cachable_api.php'));

// routes/non_cachable_api.php — closure routes, fallback handlers
Route::middleware('api')
    ->group(base_path('routes/non_cachable_api.php'));
```
The non-cachable routes are still registered via the dynamic fallback collection.

---

## Architectural Decisions

### Why Closures Block Caching
Closure serialization cannot be guaranteed reliable. A Closure captures its surrounding scope (variables from `use`, `$this` context), which may contain non-serializable objects. Rather than silently producing a corrupted cache, the framework throws an explicit error. This enforcement is a safety mechanism, not a feature limitation.

### Why Symfony CompiledUrlMatcher
Laravel delegates route matching to Symfony's URL matcher because:
1. Symfony provides a battle-tested prefix-tree regex matching algorithm
2. It handles UTF-8, host matching, and complex pattern constraints
3. It produces the most efficient regex matching for URL routing

The tradeoff is an additional abstraction layer between Laravel routes and the matching engine.

### Why Lazy Route Reconstruction
Reconstructing Route objects only for matched routes (not the entire collection) saves memory and CPU. For an application with 1000 cached routes, the cached data stores serialized attributes — Route objects are created only for the 1-2 routes that match each request.

---

## Tradeoffs

### Cached vs Uncached

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Cached: 5x faster matching for 100+ routes | No closure-based routes allowed | All routes must use controllers |
| Cached: Compile-time regex optimization | Deployment step required | Route changes require new cache generation |
| Cached: Consistent route state per deploy | Stale cache on rollback | Route cache may reference non-existent controllers |
| Uncached: Zero deployment steps | O(n) matching per request | 15x slower for 1000 routes |

### Full Cache vs Segregated Cache

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Full: Maximum performance, all routes optimized | All routes must be cacheable | Cannot use closures anywhere |
| Segregated: Some closure routes allowed | Only cached subset benefits | Non-cached routes still pay O(n) cost |

---

## Performance Considerations

### Benchmark Data (Voltdage.com)

| Routes | Uncached | Cached | Speed-up |
|--------|----------|--------|----------|
| 1 | 2.5ms | 1.9ms | 1.3x |
| 10 | 5.2ms | 2.6ms | 2.0x |
| 100 | 22.5ms | 4.3ms | 5.3x |
| 1,000 | 166ms | 32ms | 5.1x |
| 10,000 | 1,513ms | 334ms | 4.5x |

Key findings:
- Caching provides minimal benefit below ~10 routes
- The 5x improvement plateau is consistent from 100-10,000 routes
- Uncached matching scales linearly with route count
- Cached matching scales sub-linearly (prefix-tree effect)

### Memory Usage
Cached route files for 1000 routes are typically 50-200KB. The in-memory `CompiledRouteCollection` uses comparable memory to an uncached `RouteCollection` because route attributes are stored as arrays, not objects, until matched.

### Cache File Load Time
Reading `bootstrap/cache/routes-v7.php` is a single `require` with OpCache — ~0.5ms regardless of file size. This is included in the "cached" benchmark figures above.

---

## Production Considerations

### Deployment Cache Sequence
```bash
# 1. Clear old caches
php artisan route:clear
php artisan config:clear

# 2. Generate new caches
php artisan config:cache    # Must run before route:cache (config may affect routes)
php artisan route:cache     # Must run after config:cache
php artisan view:cache
php artisan event:cache

# 3. Verify caches exist
ls -la bootstrap/cache/routes-v7.php

# 4. Warm application
curl -s -o /dev/null https://example.com/health
```

### Rollback Cache
```bash
php artisan route:clear
php artisan config:clear
php artisan view:clear
php artisan optimize:clear
```
On rollback, clear all caches to prevent stale route references to reverted controllers.

### Vapor-Specific Issue
When using Laravel Vapor with Docker runtime, `php artisan optimize` in the `build` step caches routes with local machine paths instead of Lambda's `/var/task/` paths. Vapor auto-fixes config cache but NOT route cache and view cache. Solution: Move optimize commands to the `deploy` phase in `vapor.yml`.

### Route Cache Verification
After deployment, verify:
1. Cache file exists: `test -f bootstrap/cache/routes-v7.php`
2. Expected routes are present: `php artisan route:list --path=api`
3. A few key routes return 200: health check requests

---

## Common Mistakes

### Closure Routes Blocking Cache
Why it happens: Developer uses a Closure for a simple route. Why it's harmful: Blocks `route:cache` for the entire application. The error message is explicit: `LogicException: Unable to prepare route [...] for serialization. Uses Closure.` Better approach: Convert to invokable controller (single class, one method).

### Running route:cache During Development
Why it happens: Following production workflow in development. Why it's harmful: Frequent route changes require frequent cache regeneration, slowing the development cycle. Cache staleness leads to confusion when route changes don't take effect. Better approach: Only cache in production/staging.

### Not Verifying Cache Exists After Deployment
Why it happens: Deployment scripts cover the standard commands but don't verify. Why it's harmful: Silent failure — the application works without the cache, just slower. The 5x performance regression may go unnoticed until traffic spikes. Better approach: Verify cache file existence in deployment monitoring.

### Forgetting to Clear Cache on Rollback
Why it happens: Rollback scripts focus on code, not cache. Why it's harmful: The old code references new routes/controllers that no longer exist. Route matching fails with controller-not-found errors. Better approach: Include `optimize:clear` in rollback scripts.

### Dynamic Routes Breaking Cache Assumptions
Why it happens: Registering routes in service providers dynamically (based on config, database values, or env). Why it's harmful: Those routes may not be registered at cache-generation time if their conditions differ. The cached route collection doesn't include them. Better approach: Register all routes in route files, not in service providers.

---

## Failure Modes

### Stale Cache After Code Rollback
Deployment deploys new code, generates new cache, then rolls back to old code. The old code references controllers/methods that exist in the new code, but the new cache may reference controllers/methods that don't exist in the old code. Solution: Clear cache on any code change (forward or backward).

### Closure Serialization Failure
A Closure captures a non-serializable object: `Route::get('/example', function () use ($db) { ... })`. `route:cache` throws `LogicException`. The entire caching operation fails. Fix: Convert the route to a controller.

### Cache File Corruption
File write interrupted during deployment. `bootstrap/cache/routes-v7.php` contains partial/truncated data. PHP `require` fails with parse error. The application returns 500 errors. Mitigation: Atomic writes (write to temp file, rename) or cache existence check before serving.

### Vapor Path Mismatch
Routes cached with local paths during Docker build. `CompiledRouteCollection` references filesystem paths that don't exist in Lambda's `/var/task/`. Fix: Ensure route caching happens in the deploy phase, not the build phase.

---

## Ecosystem Usage

### Laravel Framework
The framework itself does not pre-cache its routes. Route caching is always application-level. First-party packages' routes are registered through package discovery and participate in the application's route cache.

### Spatie Packages
Spatie packages use controller references for all routes they register. No Spatie package uses closure-based routes that would block caching.

### Jetstream and Breeze
Both starter kits use controller-based routes exclusively. Their routes are fully cacheable.

---

## Related Knowledge Units

### Prerequisites
- Route Definition — Closures vs controllers, route file organization
- Route Groups — Group attribute inheritance in cached routes

### Related Topics
- Route Model Binding — How binding fields are serialized in cached routes
- Configuration Management — Config caching as complementary optimization

### Advanced Follow-up Topics
- Performance Optimization — Comprehensive caching strategy (routes + config + view + events)
- Deployment — CI/CD pipeline integration for cache generation
- Laravel Vapor — Serverless-specific caching considerations

---

## Research Notes

### Source Analysis
- `Illuminate\Foundation\Console\RouteCacheCommand.php` — `handle()` method, cache generation flow
- `Illuminate\Foundation\Console\RouteClearCommand.php` — Cache deletion
- `Illuminate\Routing\RouteCollection.php` — `compile()`, `setCompiledRoutes()`
- `Illuminate\Routing\CompiledRouteCollection.php` — `match()`, `newRoute()`, dynamic fallback
- `Illuminate\Routing\Route.php` — `prepareForSerialization()`, `prepareForCaching()`
- `Symfony\Component\Routing\Matcher\CompiledUrlMatcher` — Prefix-tree regex matching
- `Symfony\Component\Routing\Matcher\Dumper\CompiledUrlMatcherDumper` — Compilation

### Key Insight
The 5x speed improvement (not 100x as sometimes claimed) is the realistic production benefit of route caching. The improvement is most significant for applications with 100+ routes. For applications with fewer than 10 routes, the benefit is negligible. The primary value of route caching is consistent, predictable performance at scale rather than dramatic speedups.

### Version-Specific Notes
- Cache file versioning (routes-v7.php) changed across Laravel versions to prevent stale cache loading
- First-class callable caching supported since Laravel 10 (PR #48680)
- Fallback route handling in cache refined in Laravel 11
- Vapor Docker path issue reported in GitHub #59648 (2026)
