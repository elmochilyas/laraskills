# Metadata
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: Event Auto-Discovery via Directory Scanning
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Laravel auto-discovers event listeners by scanning the `app/Listeners` directory and checking each class for a `handle()` or `__invoke()` method. The parameter type-hint of these methods determines which event the listener handles. This eliminates manual `EventServiceProvider` registration for the common case. The scanner uses `Composer\ClassMapGenerator` or filesystem iteration to find listener classes, then reflects on their method signatures to build the event-listener mapping. Auto-discovery runs on each request unless cached via `event:cache`.

# Core Concepts
- **Directory-based discovery**: Listener classes inside `app/Listeners` are automatically discovered.
- **Method-based binding**: A listener's `handle(OrderShipped $event)` method signature determines it listens to `OrderShipped`.
- **`__invoke()` support**: Listeners with `__invoke(OrderShipped $event)` work the same as `handle()`.
- **Caching**: `php artisan event:cache` compiles the event-listener mapping into a cached file, bypassing filesystem scanning.
- **Performance tradeoff**: Without caching, the scanner runs on every request — negligible for small apps but measurable for large ones.

# Mental Models
- **Automated switchboard**: The scanner is an automated telephone switchboard operator. It looks at each listener's hand (method signature) and routes the right calls (events) to them.
- **Club membership**: Each listener has a "I handle these events" badge (type-hinted parameter). The doorman (discovery) reads the badge and lets them into the right room.

# Internal Mechanics
- `EventServiceProvider` calls `parent::boot()` which triggers discovery if not cached.
- `EventDiscoveryService` scans `app/Listeners` (configurable path via `withEvents()`).
- For each listener class found, `ReflectionClass` gets methods `handle` or `__invoke`.
- The method's first parameter is type-hinted to a class — this is the event.
- The discovered mapping is merged with manually registered listeners (`$listen` property).
- Cached mode (`event:cache`): reads `bootstrap/cache/events.php` — a pre-computed array.
- Without caching, discovery runs on every boot of `EventServiceProvider`.

# Patterns
## Convention-Based Listener Organization
- **Purpose**: Organize listeners by event within `app/Listeners`.
- **Benefit**: No registration overhead; new listener = new file.
- **Tradeoff**: Discovery overhead; must follow method naming convention.

## Hybrid Discovery + Manual Registration
- **Purpose**: Use auto-discovery for common listeners, manual for special cases.
- **Benefit**: Best of both worlds — low ceremony for common, explicit for complex.
- **Tradeoff**: Two registration mechanisms to maintain.

## Cached Events in Production
- **Purpose**: Use `event:cache` for production to eliminate discovery overhead.
- **Benefit**: Faster boot time; consistent mapping.
- **Tradeoff**: Must re-cache on every deploy.

# Architectural Decisions
- **Use auto-discovery for standard event-driven apps**: Low ceremony, works well with Laravel conventions.
- **Use `event:cache` in production**: Always. The marginal boot time improvement is worth it.
- **Use manual registration for**: Listeners outside `app/Listeners`, listeners with complex conditional registration, package listeners.
- **Use `withEvents()` for**: Custom listener directories outside `app/Listeners`.

# Tradeoffs
Auto-discovery | No registration boilerplate, convention-based | Boot time overhead; opaque mapping without cache
Manual registration | Explicit, predictable, no scanning | Boilerplate; easy to forget to register new listeners
Cached mapping | Fastest boot, deterministic | Requires re-cache on deploy; cache staleness risk

# Performance Considerations
- Filesystem scanning: Reads all files in `app/Listeners`. For 100 listener files, ~10-20ms per request without cache.
- Reflection: Each listener class is analyzed via ReflectionClass. Reflection is cached by opcode cache (OPcache), so subsequent requests are faster.
- Cached mode: Reads one cached PHP file — <1ms.
- In production with OPcache, non-cached discovery adds ~5-15ms to boot time (filesystem I/O is the bottleneck).

# Production Considerations
- Run `event:cache` in deployment script. Without it, the filesystem is scanned on every request.
- OPcache accelerates reflection results — without it, each request re-discovers.
- If listeners are added to `app/Listeners` without re-caching, they won't be registered. This is a common deployment mistake.
- The cache file (`bootstrap/cache/events.php`) should be ignored by version control but included in deployment artifacts.

# Common Mistakes
- **Not running `event:cache` in production**: Without caching, discovery runs on every request. Minor but unnecessary overhead.
- **Adding listeners outside `app/Listeners`**: Listeners in other directories are not discovered. Use `withEvents()` or manual registration.
- **Multiple `handle()` methods**: A listener can only have one auto-discovered event. If it has multiple `handle()` methods, only the first discovered (or last, depending on scanner) binds.
- **Not regenerating cache after adding listeners**: New listeners don't work until `event:cache` is rerun.

# Failure Modes
- **Cache staleness**: Deploy changes but forget to re-cache — new listeners not registered, old listeners still run.
- **Listener without type-hinted parameter**: `handle()` without a parameter type-hint cannot be auto-discovered. The listener is silently skipped.
- **Ambiguous listener discovery**: If two listeners have the same `handle()` signature but different names, both are registered. This is usually correct but can be confusing.
- **Listener class parse error**: A PHP syntax error in a listener file causes the entire discovery process to fail, and NO listeners are registered.

# Ecosystem Usage
- **Laravel framework**: `EventServiceProvider` integrates discovery. `EventDiscoveryService` handles scanning.
- **Laravel Horizon**: Horizon events (JobFailed, JobProcessed) use listeners for dashboard updates — these are registered manually in HorizonServiceProvider.
- **Spatie packages**: Package listeners are registered via service providers, not auto-discovery.

# Related Knowledge Units
- K026 `ShouldBeDiscovered` Interface (Laravel 13.12+) | K027 Event Subscribers and Manual Registration

## Research Notes
- Laravel's event auto-discovery (Laravel 8+) scans the Listeners directory and maps listeners to events by method type-hints — this eliminates manual Event::listen() registration for convention-based setups.
- The ShouldBeDiscoverable interface (Laravel 11+) provides fine-grained control over which listeners are auto-discovered — only listeners implementing this interface are included in auto-discovery scans.
- Event subscribers (implementing ShouldQueue on listeners) register multiple listeners in a single class via the subscribe() method — this pattern is useful for grouping related event handling logic.
- Queued event listeners use the same job serialization mechanism as queued jobs — the event object is serialized, dispatched to the queue, then unserialized and passed to the listener's handle() method.
- Wildcard event listeners (Event::listen('event.*')) can match multiple events using * as a wildcard character — these receive the event object and event name as arguments.
- Custom listener directories (Laravel 12+) can be configured in EventServiceProvider via the $listen property with directory paths — this supports modular monolith and package-based event architectures.
- Event discovery caching (event:cache and event:clear) improves performance in production by avoiding file scans — the cache must be rebuilt when new listeners are added or existing ones are modified.
- Community patterns for event-driven Laravel applications favor domain events over generic Laravel events, using dedicated event classes per domain concept rather than generic "model.saved" patterns.
