# Events Caching

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Caching & Optimization |
| Knowledge Unit | Events Caching |
| Difficulty | Intermediate |
| Lifecycle Phase | Application Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Events caching (`event:cache`, `event:clear`) generates a manifest file (`bootstrap/cache/events.php`) that maps event classes to their listeners. This eliminates the need to scan listener provider directories and resolve reflected dependencies on every request. The cache is a straightforward optimization for applications using event-driven architecture with many registered listeners.

## Core Concepts
- **Manifest file**: `bootstrap/cache/events.php` returns a PHP array mapping event classes to arrays of listener classes.
- **Event discovery**: Without the cache, Laravel discovers listeners by iterating `EventServiceProvider::$listen` and scanning `$this->listen` directories.
- **Cache build**: `php artisan event:cache` collects all listeners from registered event providers and writes the serialized map.
- **Cache load**: At runtime, `EventServiceProvider::boot()` checks for the cached file. If present, it loads listeners from the cache instead of scanning.
- **Closure listeners**: Listeners defined as Closures are not cacheable — they must be converted to listener classes.
- **Cache clear**: `php artisan event:clear` removes the cached file.

## When To Use
- Applications with 50+ event-listener pairs where event discovery overhead is measurable.
- Production deployments where every millisecond of bootstrap time matters.
- Octane deployments where event discovery runs once per worker start.

## When NOT To Use
- Applications with few events (<10 listeners) — the optimization gain is negligible.
- Development environments where event listeners change frequently.
- When listeners are registered dynamically via closures or runtime conditions.

## Best Practices (WHY)
- **Use listener classes, not Closures**: Define listeners as classes in `EventServiceProvider::$listen`. *Why: Closures cannot be cached — they are serialization boundaries.*
- **Cache after event changes**: Re-run `event:cache` whenever listeners are added, removed, or modified. *Why: Stale cache means missing or incorrect listeners.*
- **Run after config:cache**: Event caching may depend on resolved configuration. *Why: Config values may determine which listeners are registered.*
- **Verify with event:list**: Run `php artisan event:list` to confirm listeners are registered correctly. *Why: The cache may mask registration issues.*

## Architecture Guidelines
- The events cache is loaded in `EventServiceProvider::boot()` — it replaces the scan-based listener discovery.
- Events with Closure listeners are not cached — they must be registered in `boot()` using `Event::listen()`.
- The events cache is a flat file — it does not support lazy loading or partial cache invalidation.
- Event auto-discovery (scanning for `$subscribe` methods) is also cached.

## Performance
- Uncached: listener discovery adds 5-20ms per request for applications with 50+ event-listener pairs.
- Cached: single `require` + array assignment — <1ms per request.
- OpCache further optimizes the cached file after the first request.
- The cache file is typically 5-50KB for a medium application.

## Security
- Cached event listeners run with the application's full permissions — ensure listeners validate input and access.
- The events cache does not filter listeners by environment — all cached listeners run regardless of environment.
- Third-party package listeners are cached — audit package listeners for security concerns.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Closure listeners not cached | `Event::listen(Event::class, fn() => ...)` | Listener missing after cache | Use listener classes |
| Stale cache after listener change | Adding listener but not re-caching | New listener not firing | Re-run event:cache |
| Assuming cache includes all listeners | Dynamic listeners registered in service provider boot() | Dynamic listeners still work but aren't cached | Cache static listeners; document dynamic ones |
| Forgetting event:clear after removal | Removed listener class still referenced | Class not found error on dispatch | Clear and regenerate cache |

## Anti-Patterns
- **Dynamic listener registration as default**: Registering most listeners via `Event::listen()` in boot() instead of `$listen` array — bypasses caching entirely.
- **Closure-heavy event handling**: Using anonymous functions for all listeners — blocks caching and makes listeners untestable.
- **Stale cache in production**: Deploying with an events cache that doesn't match the deployed code — listeners may be missing.

## Examples
```bash
# Generate events cache
php artisan event:cache

# Verify listeners
php artisan event:list

# Clear events cache
php artisan event:clear
```

## Related Topics
- **Prerequisites:** Service Provider Boot — the boot() method where events cache is loaded.
- **Closely Related:** Config Caching, Route Caching — sibling caching commands.
- **Advanced:** Cache Invalidation Deployment — coordinating cache clears during deployment.
- **Cross-Domain:** Event System Architecture — how events and listeners are registered.

## AI Agent Notes
- The events cache is loaded in `Illuminate\Foundation\Support\Providers\EventServiceProvider::boot()`.
- The cached file uses `var_export()` to serialize the listener map.
- `Event::fake()` in tests bypasses the cached event system entirely.
- To inspect the cached events: view `bootstrap/cache/events.php`.

## Verification
- [ ] `php artisan event:cache` runs successfully without errors
- [ ] All listeners are defined as classes in `$listen` array (no Closures)
- [ ] `php artisan event:list` output matches expected listeners
- [ ] Deployment includes `event:cache` step after code changes
- [ ] Event cache is cleared and regenerated after listener changes
