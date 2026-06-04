# Metadata
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: `withEvents` for Custom Listener Directories
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Laravel's auto-discovery scans `app/Listeners` by default. The `withEvents()` method on `EventServiceProvider` allows customization of the listener discovery path and the event directory path. This is essential for package development (where listeners live in the package's `src/Listeners` directory) and for applications that organize listeners outside the default `app/Listeners` convention. `withEvents()` accepts a path for events and/or a path for listeners, and discovers listeners in the specified directory.

# Core Concepts
- **`withEvents()`**: A method on `EventServiceProvider` that accepts a custom events path and/or listeners path.
- **Default paths**: `app/Events` for events, `app/Listeners` for listeners.
- **Customization**: Pass an array with `events` and `listeners` keys to `withEvents()`.
- **Multiple directories**: Call `withEvents()` multiple times or use `withEvents()` with arrays to discover from multiple locations.
- **Package usage**: Packages call `withEvents()` in their service providers to discover their own listeners.

# Mental Models
- **Relocating the club**: The default clubhouse is `app/Listeners`. `withEvents()` lets you open new clubhouse branches in other directories. Members (listeners) in any branch are brought into the fold.
- **Library organization**: `withEvents()` is like telling the library's auto-sort system that books can also be found on a different shelf (custom directory), not just the main shelf.

# Internal Mechanics
- `EventServiceProvider::discoverEvents()` reads paths from `$this->discoverEventsUsing()`.
- `withEvents()` allows the paths `['app/Listeners', 'app/Domain/Order/Listeners']` via an array.
- Each path is scanned using the same `EventDiscoveryService` mechanism.
- Discovered listeners from all paths are merged into the event-listener mapping.
- The discovery respects `ShouldBeDiscovered` (Laravel 13.12+) in all custom paths.
- `event:cache` includes listeners from all custom paths.

# Patterns
## Domain-Driven Listener Organization
- **Purpose**: Place listeners with their domain bounded context.
- **Benefit**: `app/Domain/Order/Listeners` colocated with `app/Domain/Order/Events`.
- **Tradeoff**: Requires `withEvents()` configuration; deviates from convention.

## Package Listener Discovery
- **Purpose**: Let packages auto-discover their own listeners.
- **Benefit**: Zero configuration for consuming applications.
- **Tradeoff**: Package listeners may conflict with app listeners.

## Multi-Tenant Listener Paths
- **Purpose**: Different listener sets for different contexts.
- **Benefit**: Clean separation of listeners per feature.
- **Tradeoff**: Must register each path; discovery becomes opaque.

# Architectural Decisions
- **Use `withEvents()` for**: Domain-driven directory structures, packages, monorepo with modular listeners.
- **Leave default paths for**: Standard Laravel applications, small-to-medium projects where `app/Listeners` is sufficient.
- **Combine with `ShouldBeDiscovered`**: For fine-grained control over which listeners in custom paths are active.

# Tradeoffs
Default listener path | Simple, discoverable, conventional | All listeners in one directory; no domain grouping
Custom listener paths | Domain-organized, modular, package-friendly | Configuration overhead; less obvious discovery
Multiple custom paths | Flexible, supports complex structures | More paths to scan; boot-time performance impact

# Performance Considerations
- Each custom path adds filesystem scanning time during discovery (unless cached).
- For packages, each package's `withEvents()` adds boot-time scanning.
- Cached mode (`event:cache`) includes all custom paths — no runtime cost.
- Very large custom directories with hundreds of listener files increase boot time.

# Production Considerations
- Run `event:cache` after changing `withEvents()` paths. Without cache, the new paths are only effective on next boot.
- Document custom listener paths in project README. Standard Laravel conventions are broken.
- Ensure `withEvents()` paths exist — if a path doesn't exist, the scanner silently skips it. No error.
- For packages, check for conflicts between package listeners and app listeners that handle the same events.

# Common Mistakes
- **Passing a string instead of array to `withEvents()`**: `withEvents(['app/Listeners'])` is correct. `withEvents('app/Listeners')` may be interpreted incorrectly.
- **Not matching path to `event:cache`**: If `event:cache` runs before `withEvents()` is registered, listeners in custom paths are not cached.
- **Adding custom paths but forgetting to create the directory**: The scanner throws no error — the path is silently skipped, and listeners don't register.
- **Expecting subdirectory scanning**: The scanner looks for listener files ONE level deep in the specified path, not recursively through all subdirectories.

# Failure Modes
- **Silent path failure**: Specified path doesn't exist → no error → listeners not discovered → event handlers don't fire.
- **Listener collision**: Same event handled by listeners in two different custom paths. Both fire, but order is non-deterministic.
- **Cache staleness after path change**: Adding a custom path without regenerating event cache — new listeners never register.
- **Package path overwritten**: If two packages register `withEvents()` at the same path, one may overwrite the other's discovery results.

# Ecosystem Usage
- **Laravel framework**: `EventServiceProvider` has `withEvents()` as of Laravel 11+ for custom discovery paths.
- **Laravel Horizon**: Horizon does not use `withEvents()` — it registers its listeners manually.
- **Spatie packages**: Some Spatie packages use `withEvents()` to auto-discover their listeners from package directories.

# Related Knowledge Units
- K025 Event Auto-Discovery (core discovery mechanism) | K026 `ShouldBeDiscovered` Interface (opt-in discovery)

## Research Notes
- Laravel's event auto-discovery (Laravel 8+) scans the Listeners directory and maps listeners to events by method type-hints — this eliminates manual Event::listen() registration for convention-based setups.
- The ShouldBeDiscoverable interface (Laravel 11+) provides fine-grained control over which listeners are auto-discovered — only listeners implementing this interface are included in auto-discovery scans.
- Event subscribers (implementing ShouldQueue on listeners) register multiple listeners in a single class via the subscribe() method — this pattern is useful for grouping related event handling logic.
- Queued event listeners use the same job serialization mechanism as queued jobs — the event object is serialized, dispatched to the queue, then unserialized and passed to the listener's handle() method.
- Wildcard event listeners (Event::listen('event.*')) can match multiple events using * as a wildcard character — these receive the event object and event name as arguments.
- Custom listener directories (Laravel 12+) can be configured in EventServiceProvider via the $listen property with directory paths — this supports modular monolith and package-based event architectures.
- Event discovery caching (event:cache and event:clear) improves performance in production by avoiding file scans — the cache must be rebuilt when new listeners are added or existing ones are modified.
- Community patterns for event-driven Laravel applications favor domain events over generic Laravel events, using dedicated event classes per domain concept rather than generic "model.saved" patterns.
