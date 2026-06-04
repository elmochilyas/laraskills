# Events Caching

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
Events caching (`event:cache`, `event:clear`) generates a manifest file (`bootstrap/cache/events.php`) that maps event classes to their listeners. This eliminates the need to scan listener provider directories and resolve reflected dependencies on every request. The cache is a straightforward optimization for applications using event-driven architecture with many registered listeners.

## Core Concepts
- **Event Discovery:** Laravel scans the `$listen` array in `EventServiceProvider` and any auto-discovered listener directories to build an event-to-listener mapping.
- **Manifest File:** The cached file contains a serialized array mapping fully-qualified event class names to arrays of listener class names.
- **Auto-Discovery:** Laravel can auto-discover listeners by scanning the `app/Listeners` directory and matching `handle()` methods against type-hinted events. This discovery is cached.
- **Cache File Location:** `bootstrap/cache/events.php` — returns the serialized event map array.
- **Clear Command:** `php artisan event:clear` removes the cached manifest.

## Mental Models
- **Phonebook Model:** Events are names, listeners are phone numbers. Without a cache, you have to look up each name in every directory. With a cache, you have a single, sorted phonebook.
- **Registration Desk Analogy:** Uncached event registration is like having attendees sign in at the door. The cached manifest is a pre-printed attendee list — everyone is already checked in before the event starts.
- **Lookup Table:** The cached file is effectively a hash map: `EventClass::class => [ListenerClass::class, ...]`. Dispatch iterates this map, no scanning required.

## Internal Mechanics
1. **`\Illuminate\Foundation\Console\EventCacheCommand::handle()`** collects all events and listeners.
2. It bootstraps the application, discovers events via `\Illuminate\Events\EventServiceProvider`:
   - Reads the `$listen` property (explicit mapping).
   - Processes the `$subscribe` property (subscriber classes).
   - Runs auto-discovery if enabled: scans `app/Listeners/` for classes with `handle()` methods type-hinting events.
3. The collected `[$event => [$listener, ...]]` array is serialized and written to `bootstrap/cache/events.php`.
4. At runtime, `\Illuminate\Events\EventServiceProvider::boot()` checks for the cached manifest. If found, it loads the listener mappings from the cache instead of running discovery.
5. The `Dispatcher` (`\Illuminate\Events\Dispatcher`) uses this mapping when dispatching events to resolve and call each listener.

## Patterns
- **Manifest Generation:** A build-time process scans source files and generates a lookup table consumed at runtime.
- **Cache-Aside with Stale-While-Revalidate:** If the cache exists, use it. If not, fall back to discovery and optionally cache the result. The first uncached request triggers discovery.
- **Reflection-Based Discovery:** Auto-discovery uses PHP's `ReflectionMethod` to inspect `handle()` type hints. This is expensive and avoided by caching.

## Architectural Decisions
- **Decision:** Cache events separately from config and routes.
  - **Rationale:** Events change at different frequencies. A dedicated cache file allows independent invalidation.
- **Decision:** Use auto-discovery opt-in with caching.
  - **Rationale:** Auto-discovery is convenient during development but too slow for production. Caching makes it viable by moving the reflection cost to build time.
- **Decision:** Serialize as plain array, not serialized objects.
  - **Rationale:** The manifest is a simple string array. `var_export()` keeps it readable and fast to load via `require`.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Eliminates reflection-based listener discovery per request | Must re-cache when listeners are added/changed | Includes `event:cache` in deployment script |
| ~5-15ms reduction in event registration overhead | Auto-discovery misses listeners outside conventions | Must manually register unconventional listeners |
| Consistent listener mapping across requests | Subscriber registration order may differ from discovery | Relies on explicit array ordering for predictable dispatch |
| Fast `require` of plain PHP manifest | Cache grows with number of event types | Even 500+ event types produce a small, fast file |

## Performance Considerations
- **Discovery Time:** Scanning 50 listener files with reflection adds 10-30ms to bootstrap. The cache reduces this to a single `require` (~1ms).
- **Memory:** The cached event map is a simple string array: ~50KB for 100 event types. Negligible memory impact.
- **OpCache:** The manifest file benefits from OpCache opcode caching on subsequent requests.
- **Auto-Discovery CPU Cost:** Reflection on each listener's `handle()` method is the primary bottleneck. The cache eliminates this entirely.

## Production Considerations
- **Run `event:cache` in deployment** if your application uses events with auto-discovered listeners.
- **Explicit listener registration** via `$listen` array is preferred for production — it avoids the discovery step entirely and documents the event flow.
- **Verify listener classes exist** before caching. Missing listener classes after cache build cause runtime errors.
- **CI/CD:** Include `event:cache` in deployment scripts after `config:cache` and `route:cache`.
- **Queue event mapping:** If using queued events (`ShouldQueue`), ensure the listener implements the contract before caching.

## Common Mistakes
- **Relying on auto-discovery without cache in production.** Each request pays the reflection cost. Always cache or use explicit `$listen` arrays.
- **Adding listeners via Service Provider `boot()` method** but not registering them in `$listen`. The cache only captures `$listen`, `$subscribe`, and auto-discovered listeners.
- **Event class not autoloadable.** The cache stores class names as strings; events must be resolvable by the autoloader.
- **Assuming event caching caches dispatched events.** Event caching only caches the listener mapping — not event instances or results.

## Failure Modes
- **Stale Cache After Listener Change:** If a listener class is renamed or removed without re-caching, the dispatcher attempts to resolve the old class name, causing a `ClassNotFoundException`.
- **Cache Not Cleared After Deployment:** Old event manifest still maps to old listener classes. Symptoms: listeners not firing, wrong behavior for events.
- **Auto-Discovery Collision:** Two listener classes handle the same event; cache captures discovery order which may differ from intended priority.

## Ecosystem Usage
- **Laravel Horizon:** Event caching is complementary to Horizon's queue monitoring. Horizon uses events internally but does not require application event caching.
- **Laravel Telescope:** Telescope listens to application events for debugging. Its own listeners are registered in `TelescopeServiceProvider` and participate in caching.
- **Laravel Nova:** Nova's event system is independent of application events and not affected by event caching.
- **Spatie packages:** Many Spatie packages (e.g., `spatie/laravel-event-sourcing`) register projectors and reactors as event listeners that participate in caching.

## Related Knowledge Units

### Prerequisites
- [Bootstrap with Event System](../boot-order-timing/bootstrap-with-event-system/02-knowledge-unit.md) — the event dispatch mechanism that the cache optimizes.
- [Lifecycle Callback Hooks](../boot-order-timing/lifecycle-callback-hooks/02-knowledge-unit.md) — how event listeners are registered during lifecycle hooks.

### Related Topics
- [Config Caching](./config-caching/02-knowledge-unit.md) — establishes the bootstrap cache pattern that events follow.
- [Services Cache](./services-cache/02-knowledge-unit.md) — deferred provider manifest affects which providers register events.
- [Optimize Command](./optimize-command/02-knowledge-unit.md) — `php artisan optimize` does NOT include event:cache (must be run separately).

### Advanced Follow-up Topics
- [Bootstrap Warmup in CI/CD](./bootstrap-warmup-in-cicd/02-knowledge-unit.md) — event cache generation in pipeline.
- [Deferred Provider Loading Timing](../boot-order-timing/deferred-provider-loading-timing/02-knowledge-unit.md) — how deferred providers interact with event listener registration.
- [Cache Invalidation Deployment](./cache-invalidation-deployment/02-knowledge-unit.md) — ensuring stale event manifests are cleared during deployment.

## Research Notes
- Auto-discovery was introduced in Laravel 5.8 and refined in 6.x. It uses `Illuminate\Events\EventServiceProvider::getEvents()` to discover listeners.
- The `getEvents()` method uses `ReflectionMethod` on each listener class to extract the parameter type hint from `handle()`.
- Event Subscribers (`$subscribe`) are cached as well — their `subscribe()` method is called once to build the mapping, then the result is cached.
- Laravel 11 reduced auto-discovery scope; the mechanism remains for custom event providers.
