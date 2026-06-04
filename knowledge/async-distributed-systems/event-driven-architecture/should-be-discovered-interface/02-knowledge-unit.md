# Metadata
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: `ShouldBeDiscovered` Interface (Laravel 13.12+)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Introduced in Laravel 13.12, `ShouldBeDiscovered` is a marker interface that provides opt-in control over auto-discovery of event listeners. By default, all listeners in `app/Listeners` with `handle()` or `__invoke()` methods are auto-discovered. Implementing `ShouldBeDiscovered` on a listener makes it eligible for discovery; removing it (or not implementing it) prevents the listener from being auto-registered. This allows packaging listeners with an application while controlling which ones are active through the interface rather than manual registration.

# Core Concepts
- **Marker interface**: `ShouldBeDiscovered` has no methods. Its presence indicates the listener should be considered for auto-discovery.
- **Opt-in behavior**: Only listeners implementing `ShouldBeDiscovered` are discovered by default. Non-implementing listeners are skipped.
- **Backward compatibility**: Existing applications without `ShouldBeDiscovered` continue to discover all listeners (default behavior unchanged from before 13.12).
- **Selective discovery**: Mix discovered and non-discovered listeners in `app/Listeners`. Control each individually.

# Mental Models
- **Invitation list**: Previously, everyone in the venue (app/Listeners) was invited to the event. Now, only those wearing the "VIP badge" (ShouldBeDiscovered interface) get auto-invited.
- **Feature flag per listener**: `ShouldBeDiscovered` acts like a feature flag for each listener — implement the interface = feature ON, remove = feature OFF, without touching configuration.

# Internal Mechanics
- `EventDiscoveryService::discover()` checks `$listener instanceof ShouldBeDiscovered` before adding to the event mapping.
- The check is `in_array(ShouldBeDiscovered::class, class_implements($listener))` — a fast array lookup.
- Without the interface, the listener is simply not added to the `$events` mapping.
- The interface is in `Illuminate\Contracts\Events\ShouldBeDiscovered`.
- It applies to both `handle()` and `__invoke()` listeners.
- It does NOT affect manually registered listeners in `$listen` or `EventServiceProvider::boot()`.

# Patterns
## Staged Listener Activation
- **Purpose**: Add a listener to the filesystem but control when it activates.
- **Benefit**: Deploy listeners ahead of their activation date.
- **Tradeoff**: Manual step to implement `ShouldBeDiscovered` when ready.

## Package Listener Control
- **Purpose**: Ship listeners in packages but let the consuming application opt-in.
- **Benefit**: Package provides the listener; app decides if it's active.
- **Tradeoff**: Package must document the interface requirement.

## Feature-Branch Safe Listeners
- **Purpose**: Merge listeners from feature branches without accidental activation.
- **Benefit**: Listeners don't activate until `ShouldBeDiscovered` is explicitly implemented.
- **Tradeoff**: Must remember to add the interface.

# Architectural Decisions
- **Use `ShouldBeDiscovered` for new Laravel 13.12+ projects**: Provides explicit control over which listeners are active.
- **Use default behavior (no interface) for existing apps**: Switching to `ShouldBeDiscovered` requires implementing it on all active listeners — a migration step that can introduce errors.
- **Use `ShouldBeDiscovered` for conditional listeners**: Listeners that are only needed in specific environments or configurations.

# Tradeoffs
ShouldBeDiscovered opt-in | Explicit control, no accidental activation | Migration effort for existing apps; must remember to implement
Default discovery (before 13.12) | Simple, no interface needed | All listeners discovered; cannot selectively disable
Hybrid (some with, some without) | Granular control | Inconsistent discovery behavior; confusing

# Performance Considerations
- The `class_implements()` check is O(1) — negligible overhead compared to filesystem scanning.
- No impact on runtime event dispatch performance. Discovery is a boot-time concern.
- The interface implementation check replaces the previous unconditional discovery — no net performance change.

# Production Considerations
- Before upgrading to 13.12, audit which listeners should be auto-discovered. Any listener that needs to stay active must implement `ShouldBeDiscovered`.
- The `event:cache` respects `ShouldBeDiscovered` — cached mapping only includes listeners that implement it.
- For packages, document whether listeners implement `ShouldBeDiscovered` by default or require the app to add it.
- Testing: `Event::fake()` is not affected — it replaces the event dispatcher entirely.

# Common Mistakes
- **Not implementing `ShouldBeDiscovered` after Laravel 13.12 upgrade**: Listeners stop working until the interface is added. Check the upgrade guide.
- **Implementing `ShouldBeDiscovered` on manually registered listeners**: The interface has no effect on listeners registered via `$listen` or `EventServiceProvider`. It only controls auto-discovery.
- **Assuming `ShouldBeDiscovered` manually enables the listener**: It only enables auto-discovery. If the listener is not discovered, you must register it manually.
- **Not updating tests after implementing discovery control**: Tests that rely on listeners being active may fail if the listener was previously auto-discovered but now requires the interface.

# Failure Modes
- **Silent listener deactivation**: After upgrading to 13.12, discovered listeners without the interface stop working silently. No error or warning.
- **Accidental activation**: Implementing `ShouldBeDiscovered` on a listener that was intentionally not discovered activates it on next deploy.
- **Interface not imported**: The `use` statement for `ShouldBeDiscovered` is missing. PHP autoloader doesn't complain if the interface is never referenced in method signatures (it's a marker), but the check fails silently — listener not discovered.

# Ecosystem Usage
- **Laravel framework**: Introduced in 13.12. Backward compatible. Part of `Illuminate\Contracts\Events`.
- **Laravel Horizon**: Not directly affected — Horizon's listeners are registered via service provider, not discovery.
- **Spatie packages**: Package listeners may adopt `ShouldBeDiscovered` for opt-in discovery. Check per-package version.

# Related Knowledge Units
- K025 Event Auto-Discovery (mechanism context) | K029 Wildcard Event Listener Discovery

## Research Notes
- Laravel's event auto-discovery (Laravel 8+) scans the Listeners directory and maps listeners to events by method type-hints — this eliminates manual Event::listen() registration for convention-based setups.
- The ShouldBeDiscoverable interface (Laravel 11+) provides fine-grained control over which listeners are auto-discovered — only listeners implementing this interface are included in auto-discovery scans.
- Event subscribers (implementing ShouldQueue on listeners) register multiple listeners in a single class via the subscribe() method — this pattern is useful for grouping related event handling logic.
- Queued event listeners use the same job serialization mechanism as queued jobs — the event object is serialized, dispatched to the queue, then unserialized and passed to the listener's handle() method.
- Wildcard event listeners (Event::listen('event.*')) can match multiple events using * as a wildcard character — these receive the event object and event name as arguments.
- Custom listener directories (Laravel 12+) can be configured in EventServiceProvider via the $listen property with directory paths — this supports modular monolith and package-based event architectures.
- Event discovery caching (event:cache and event:clear) improves performance in production by avoiding file scans — the cache must be rebuilt when new listeners are added or existing ones are modified.
- Community patterns for event-driven Laravel applications favor domain events over generic Laravel events, using dedicated event classes per domain concept rather than generic "model.saved" patterns.
