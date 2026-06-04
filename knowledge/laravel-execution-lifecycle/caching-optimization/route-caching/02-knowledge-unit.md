# Route Caching

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
Route caching compiles all application routes into a single serialized file (`bootstrap/cache/routes.php`) containing a `CompiledUrlMatcher` and `CompiledUrlGenerator`. This eliminates the need to register, group, and match routes from route files on every request. The cache is most effective for applications with large numbers of routes (100+), where route registration overhead becomes significant.

## Core Concepts
- **CompiledUrlMatcher:** The cached file replaces the regex-based route matching with a compiled matcher that uses a flat array of route patterns and pre-computed regexes.
- **Route Serialization:** Routes are serialized using `serialize()` / `unserialize()` on `Symfony\Component\Routing\Route` objects. Each route's compiled regex, defaults, requirements, and options are stored.
- **Closure Limitation:** Route definitions using closures instead of controller strings **cannot be cached**. Closures are PHP objects that cannot be serialized. Attempting `route:cache` with closure routes throws a `LogicException`.
- **Cache File Location:** `bootstrap/cache/routes.php` — returns an array with two keys: `'compiled'` (the matcher) and `'generator'` (the URL generator).
- **Clear Command:** `php artisan route:clear` removes the cached file.

## Mental Models
- **Compilation Model:** Route caching is like compiling source code to bytecode. The human-readable route definitions (`Route::get(...)`) are transformed into an optimized machine-friendly format.
- **Decision Tree Model:** Routes are organized into a decision tree by HTTP method and URL pattern. The compiled matcher walks this tree with pre-computed regexes, rather than testing every route sequentially.
- **Freeze Model:** The route collection is frozen at cache time — no routes can be added or modified after caching. Any dynamic route registration must happen before caching or be structured differently.

## Internal Mechanics
1. **`\Illuminate\Foundation\Console\RouteCacheCommand::handle()`** is the entry point.
2. It loads all routes via `$this->getFreshApplicationRoutes()` — bootstraps a fresh app instance to collect routes.
3. If any route uses a closure, the command throws a `LogicException`.
4. The `RouteCollection` is passed to `\Illuminate\Routing\CompiledRouteCollectionBuilder` which produces:
   - A `CompiledUrlMatcher` (extends `Symfony\Component\Routing\Matcher\CompiledUrlMatcher`) with compiled routing tables.
   - A `CompiledUrlGenerator` (extends `Symfony\Component\Routing\Generator\CompiledUrlGenerator`).
5. The compiled data is serialized to `bootstrap/cache/routes.php` using `<?php return serialize([...]);`.
6. On subsequent requests, `\Illuminate\Foundation\Bootstrap\SetRequestForConsole` is bypassed, and the route cache is loaded in `\Illuminate\Foundation\Application::boot()`. The `Router` class detects the cached file and unserializes it instead of loading route files.

## Patterns
- **Compile-Once, Execute-Many:** The expensive work of regex compilation, route sorting, and pattern matching is done once at cache time.
- **Serialization Gateway:** Routes are serialized to a portable format. Any unserializable component (closures, resources) blocks the entire cache.
- **Static Factory:** The `CompiledRouteCollection` is a specialized factory that produces matcher/generator pairs from serialized data.

## Architectural Decisions
- **Decision:** Use `serialize()`/`unserialize()` instead of `var_export()`.
  - **Rationale:** Route objects are complex with nested objects and compiled regex internals. `serialize()` handles object graphs naturally; `var_export()` would require recursive transformation.
- **Decision:** Require controller strings instead of closures.
  - **Rationale:** Closures cannot be serialized. Enforcing string-based route handlers ensures cacheability and forces a clean architecture.
- **Decision:** Cache routes separately from config (separate file).
  - **Rationale:** Route caching has different invalidation frequency and serialization format. Combining them would create unnecessary coupling.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| ~20-50ms reduction in route registration time per request | Closures in routes block caching entirely | Forces use of controller classes for all routes |
| ~5-10ms faster URL matching via compiled regex table | Cache must be rebuilt on every route change | Adds deployment complexity; development requires route:clear on changes |
| Lower memory usage (compiled regexes shared in OpCache) | Serialized file is not human-readable | Debugging route issues requires checking route files, not cache |
| Consistent route behavior across requests | No support for dynamic route registration after caching | Applications must register all routes before cache build |

## Performance Considerations
- **Route Registration Time:** In uncached mode, each `Route::get()` call registers a route object, applies middleware, and merges groups. With 200+ routes, this adds 20-40ms to bootstrap. Caching eliminates this entirely.
- **URL Matching:** The compiled matcher uses `Symfony\Component\Routing\Matcher\CompiledUrlMatcherDumper` to create a prefix-compiled regex tree. Matching a URL against 500 routes takes ~1μs with cache vs ~10-20μs without.
- **Cache File Size:** Typically 200KB-1MB for 500 routes. The serialized format includes compiled regex patterns which are verbose but fast to parse.
- **OpCache:** The `routes.php` file containing a serialized string is parsed by PHP's opcode cache, but the `unserialize()` call still reconstructs objects. Only the file loading benefits from OpCache, not the deserialization.

## Production Considerations
- **Always cache in production for 100+ routes.** Below 50 routes, the performance gain is marginal but still recommended.
- **Explicitly list your routes** using controller strings to avoid the closure limitation. Convert `Route::get('/', fn() => view('welcome'))` to `Route::get('/', [WelcomeController::class, '__invoke'])`.
- **Run `route:cache` after `config:cache`** in deployment scripts. Route loading depends on configuration (e.g., URL defaults in `config/app.php`).
- **Never run `route:cache` in a development environment** where routes change frequently. Use `route:clear` instead.
- **CI/CD pipeline:** Build the route cache after all route files are in place. Consider running `route:list` before caching to verify all routes.
- **Group-based middleware registration:** Middleware referenced in routes must exist in `$routeMiddleware` or `$middlewareGroups` in `app/Http/Kernel.php` at cache time.

## Common Mistakes
- **Using route closures** (`Route::get('/', fn() => ...)`) and attempting `route:cache`. The command fails with `Unable to prepare route ... for serialization. Uses Closure.`
- **Forgetting to re-cache after adding new routes.** Old routes continue to work in cache, but new routes 404 until cache is rebuilt.
- **Caching with missing service providers.** If a service provider registers routes conditionally (e.g., based on environment), the cache captures only the current environment's routes.
- **Running `route:cache` without `config:cache` first.** Route caching depends on application configuration; caching routes without cached config can produce inconsistent results.
- **Route model binding from serialized routes.** Cached routes use the original route definitions; model binding patterns are preserved in the cache.

## Failure Modes
- **Serialization Failure:** If a route definition contains any unserializable object (closure, file handle, resource), `route:cache` throws a `LogicException`. Fix by converting to controller strings.
- **Stale Route Cache After Update:** If `route:cache` is not re-run after adding/modifying routes, the application serves the old route set. New URLs 404, modified behavior reverts.
- **Partial Cache Write:** Disk failure during write produces a truncated caches file. Mitigation: atomic write pattern (write to temp file, rename).
- **Route Binding Errors:** If a route uses implicit model binding and the model class changes between deployments, the cached route references the old class.

## Ecosystem Usage
- **Laravel Octane:** Route caching is strongly recommended. Octane workers load routes once on startup; the cache eliminates route registration from the hot path.
- **Laravel Vapor:** Routes are cached during the build phase. Cold starts benefit from reduced bootstrap time.
- **Forge/Envoyer:** Default deployment scripts include `route:cache` after `config:cache`.
- **Laravel Nova:** Nova registers its own routes during service provider boot. These are included in the route cache after `NovaServiceProvider` runs.
- **Stancl/Tenancy multi-tenancy:** Dynamic route registration for tenants conflicts with route caching. Tenant routes must be registered in a way that survives caching or use a separate approach.

## Related Knowledge Units

### Prerequisites
- [Config Caching](./config-caching/02-knowledge-unit.md) — prerequisite step; route caching depends on config being resolved first.
- [Bootstrapper Sequence](../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md) — how route registration flows through the boot phase.

### Related Topics
- [Services Cache](./services-cache/02-knowledge-unit.md) — deferred provider manifest affects which routes are available at cache time.
- [Optimize Command](./optimize-command/02-knowledge-unit.md) — `php artisan optimize` includes route cache.
- [Events Caching](./events-caching/02-knowledge-unit.md) — complementary caching for event-to-listener mappings.

### Advanced Follow-up Topics
- [OpCache Configuration](./opcache-configuration/02-knowledge-unit.md) — OpCache caches the routes PHP file.
- [Bootstrap Warmup in CI/CD](./bootstrap-warmup-in-cicd/02-knowledge-unit.md) — route cache generation in deployment pipeline.
- [Console vs HTTP Boot Differences](../boot-order-timing/console-vs-http-boot-differences/02-knowledge-unit.md) — how route caching affects HTTP but not console boot.

## Research Notes
- The `CompiledUrlMatcherDumper` was introduced in Symfony 4.3 and adopted by Laravel. It uses a prefix tree approach: URLs with common prefixes share regex sub-patterns.
- Route caching has special behavior with `Route::redirect()`, `Route::view()`, and `Route::permanentRedirect()` — these are converted to internal controller classes by Laravel and are cacheable.
- The serialization format uses `Symfony\Component\Routing\Route::__serialize()` which includes the compiled regex in the serialized output.
- Laravel 11+ route loading uses `RouteServiceProvider::boot()` which checks for cache before loading route files.
