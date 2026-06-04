# ECC Standardized Knowledge — Route Caching

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Route Caching |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Route caching (`php artisan route:cache`) serializes the compiled route collection into a single file (`bootstrap/cache/routes-v7.php`), reducing route matching from iterative checking (O(n)) to prefix-tree matching (O(log n) or near-constant). The cache file contains all route patterns, controllers, middleware, and named routes in a serialized format optimized for fast deserialization.

The critical constraint: routes using Closures cannot be cached because Closures contain executable code that references external scope. A single Closure route in the codebase blocks caching for ALL routes. This is a framework enforcement, not a configuration option — the serializer throws `LogicException` when it encounters a Closure route.

---

## Core Concepts

### Cache Generation
`php artisan route:cache` serializes all registered routes into `bootstrap/cache/routes-v7.php`. The file is a PHP array containing serialized Route objects.

### Cache Loading
On the next request, the framework loads the cached file instead of executing route files. The deserialized route collection is ready for matching without any file iteration.

### Closure Restriction
Routes with Closure handlers cannot be serialized. The `SerializableClosure` library cannot guarantee successful serialization for all closures, so the framework refuses to cache rather than produce a corrupted cache.

### Cache Invalidation
`php artisan route:clear` removes the cached route file. Routes are then loaded from route files on the next request.

### Route List After Cache
`php artisan route:list` works even after caching — it reads from the cached collection rather than re-parsing route files.

---

## When To Use

- ALL production deployments with controller-based routes
- Applications with 50+ routes (caching benefit is proportional to route count)
- API-heavy applications where route matching is a measurable portion of request time
- Deployments where optimization is prioritized

---

## When NOT To Use

- Development environments (cache masks route file changes)
- Applications with Closure-based routes that cannot be converted
- Dynamic routes that change at runtime (very rare)

---

## Best Practices

### Use Controllers for ALL Routes
Convert every Closure route to a controller or invokable class.

**Why:** A single Closure route blocks caching for the entire application. All routes lose the 5x performance benefit because of one convenience Closure.

### Cache on Every Deployment
Always run `php artisan route:cache` as part of the deployment script.

**Why:** Without caching, route matching iterates all routes and compiles regex patterns on every request. Caching eliminates iteration entirely.

### Verify After Caching
Run `php artisan route:list` after caching to verify all routes are present.

**Why:** A failed cache generation (due to Closure routes or serialization errors) silently falls back to uncached matching. Verification catches silent cache failures.

### Clear Cache Before Modifications
Run `route:clear` before modifying routes in development.

**Why:** A stale cache prevents new routes from being recognized. Developers adding routes will see 404s until the cache is cleared.

---

## Architecture Guidelines

### Cache File Location
`bootstrap/cache/routes-v7.php` — the version number in the filename prevents loading stale cache across Laravel version upgrades.

### Cache Content
The cached file contains serialized Route objects with: URI patterns, regex compilations, controller references, middleware lists, name mappings, parameter constraints.

### Cache Miss Behavior
If the cache file doesn't exist or is unreadable, the framework falls back to standard route file loading. No error is raised — the performance benefit is silently lost.

---

## Performance Considerations

### Uncached Routing
- O(n) iteration over all routes
- Regex compilation on first match per route
- 5-15ms for 100 routes on first request
- 2-5ms on subsequent requests (OpCache)

### Cached Routing
- Uses Symfony `CompiledUrlMatcher` (prefix-tree regex)
- O(log n) or near-constant matching
- ~1-2ms regardless of route count
- Regex patterns are pre-compiled during cache generation

### Cache Generation Time
`route:cache` time is proportional to route count. For 500 routes: ~2-5 seconds. For 2000 routes: ~10-20 seconds. Run during deployment, not during development.

---

## Security Considerations

### Stale Route Cache
A stale cache may expose old routes or miss new security middleware. Always regenerate cache after route changes.

### Cache File Permissions
The cached route file is a PHP file executed by the framework. Protect it with filesystem permissions to prevent unauthorized modification.

### Cache Poisoning
If an attacker can modify `bootstrap/cache/routes-v7.php`, they can change routing behavior. Ensure the cache directory is not publicly writable.

---

## Common Mistakes

### Closure Routes Blocking Cache
Desc: Using a single Closure route that blocks caching for all routes.
Cause: Convenience — Closure is faster to write.
Consequence: All routes lose caching benefit.
Better: Convert to invokable controller.

### Forgetting to Cache After Route Changes
Desc: Adding or modifying routes without running `route:cache`.
Cause: Deployment script doesn't include cache step.
Consequence: New routes return 404 (stale cache doesn't include them).
Better: Always run `route:cache` in deployment.

### Debugging with Stale Cache
Desc: Changing route files but the cache still loads.
Cause: Not clearing the cache after modifications.
Consequence: Route changes don't take effect.
Better: Set `APP_ENV=local` or run `route:clear` to disable cache in development.

---

## Anti-Patterns

### Conditional Route Registration
Registering routes conditionally based on runtime values. `route:cache` captures the route state at cache generation time — conditional routes may not be cached correctly.

### Caching in Development
Running `route:cache` in development environments. This masks route file changes and causes confusing 404 errors. Use `route:clear` for development.

---

## Examples

### Deployment Commands
```bash
php artisan route:cache
php artisan route:list # Verify all routes present
```

### Development Commands
```bash
php artisan route:clear # Before modifying routes
```

### CI/CD Pipeline
```yaml
deploy:
  script:
    - php artisan route:cache
    - php artisan config:cache
    - php artisan optimize
```

---

## Related Topics

### Prerequisites
- **Route Definition** — Controller-based routes (prerequisite for caching)
- **Route Groups** — All group attributes are preserved in cache

### Closely Related
- **Route Name Generation** — Named routes are cached
- **Route Model Binding** — Binding configuration is preserved in cache

### Cross-Domain
- **DevOps & Infrastructure** — Deployment scripts for cache commands

---

## AI Agent Notes

### Important Decisions
- Closure routes block caching — this is a framework limitation, not configurable
- The cache file is versioned (`routes-v7.php`) to prevent stale cache across Laravel upgrades
- `route:cache` serializes ALL routes into a single file — no selective caching
- Route caching does NOT affect middleware or controller resolution, only route matching

### Important Constraints
- A single Closure route blocks caching for the entire application
- The cache file is generated at deployment time and must be regenerated on route changes
- `route:list` works from cache — it reads the cached collection
- Conditional route registration may not serialize correctly

### Rules Generation Hints
- Enforce controller-based routes for all production code (ban Closure routes)
- Enforce `route:cache` in deployment scripts
- Enforce `route:clear` before route modifications in development

---

## Verification

This document has been validated against:
- `Illuminate\Foundation\Console\RouteCacheCommand` — cache generation
- `Illuminate\Foundation\Console\RouteClearCommand` — cache removal
- `Illuminate\Routing\RouteCollection::compile()` — Symfony CompiledUrlMatcher compilation
- `Illuminate\Routing\SerializesRoute` — route serialization logic
