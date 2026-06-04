# ku-08: Event Listener Registration Order

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **KU:** ku-08-event-listener-registration-order
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Event listener registration order determines the sequence in which listeners execute when an event is dispatched. Listeners are registered during the `boot()` phase of service providers and through auto-discovery. The order of registration (and the optional `$priority` property) determines execution order. Understanding this timing is critical for ensuring listeners run in the correct sequence when events have multiple handlers.

## Core Concepts
- **Registration in boot()**: Event listeners are typically registered in `EventServiceProvider::boot()` or individual provider `boot()` methods via `Event::listen()`.
- **$listen array**: The `$listen` property on `EventServiceProvider` maps events to their listener classes. Processed in array order.
- **$subscribe property**: Subscriber classes are registered and their `subscribe()` method is called to define multiple event-handler mappings.
- **Auto-discovery**: Laravel can auto-discover listeners by scanning the `app/Listeners` directory and matching `handle()` methods to event type-hints.
- **Listener priority**: `Event::listen(Event::class, [Listener::class, 'handle'], $priority)` — higher priority values run first.
- **Event caching**: `event:cache` generates a cached manifest of event-to-listener mappings, removing the need for runtime discovery.

## When To Use
- When multiple listeners handle the same event and execution order matters (e.g., logging before notification).
- When using event caching to optimize bootstrap performance.
- When registering listeners from packages that must run before or after application listeners.
- When using subscribers that register multiple event-handler pairs.

## When NOT To Use
- Do not rely on execution order for independent listeners — order dependence indicates that listeners share state, which is an anti-pattern.
- Do not register listeners in `register()` methods — listeners should be registered in `boot()` when all services are available.
- Do not use priority to work around architectural issues — if listener A must run before B, consider whether they should be a single listener.

## Best Practices (WHY)
- **Use $listen array for static mappings**: It's declarative, cacheable, and visible at a glance.
- **Use explicit priority sparingly**: Default priority (0) is fine for most cases. Use priority only when order is semantically required.
- **Cache events in production**: `event:cache` eliminates runtime listener discovery and provides consistent execution order.
- **Use subscribers for related listeners**: Group listeners for the same feature into a subscriber class for cohesion.

## Architecture Guidelines
- Place listener registration in `EventServiceProvider` or dedicated provider's `boot()` method.
- Listener order in `$listen` array determines registration order (and execution order at same priority).
- Package listeners register during package provider `boot()` — they execute after application listeners unless priority is set.
- Auto-discovered listeners execute after explicitly registered listeners (they are appended to the listener list).

## Performance
- Auto-discovery adds 10-30ms to bootstrap by reflecting on listener `handle()` methods — cache or use explicit `$listen`.
- Event caching reduces listener registration to a single `require` of the manifest file (~1ms).
- Each listener callback adds ~1-5µs dispatch overhead. 50 listeners per event = ~250µs.
- Wildcard listeners (`Event::listen('event.*', ...)`) are slower — the event dispatcher must match against patterns.

## Security
- Listeners may receive sensitive event data. Ensure listeners that log or transmit data are properly permission-checked.
- Event caching serializes listener class names — ensure listener classes exist after deployment (cache invalidation).
- Do not register listeners that execute destructive operations before validation listeners.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Priority confusion | Higher priority number runs first | Not understanding the priority direction | Expected order reversed | Document: higher priority = runs first |
| Duplicate listeners | Listener registered twice (auto-discovered + explicit) | Both $listen and auto-discovery match | Listener executes twice for one dispatch | Use explicit registration OR auto-discovery, not both |
| Boot() registration not cached | Listener registered in boot() via Event::listen() but not in $listen | Developer uses programmatic registration | Cache does not capture this listener — runs uncached | Add to $listen or use EventServiceProvider |
| Listener ordering assumptions | Assuming package listeners run before app listeners | Not checking provider registration order | Package listener overrides or conflicts | Use explicit priority or reorder providers |
| Stale event cache | Listener added but cache not cleared | Deployment without event:clear | Listener never fires | Include event:clear in deploy script |

## Anti-Patterns
- **Listener state sharing**: Two listeners for the same event that depend on each other's execution order — they should be a single listener or use a shared service.
- **Event-registration-in-controller**: Registering listeners inside controller methods — listeners should be registered in provider `boot()`.
- **Non-deterministic ordering**: Relying on auto-discovery order without explicit `$listen` or priority.

## Examples
```php
class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        OrderPlaced::class => [
            LogOrderActivity::class, // Runs first (ordered first in array)
            ProcessPayment::class,   // Runs second
            SendOrderConfirmation::class, // Runs third
        ],
    ];

    public function boot()
    {
        Event::listen(OrderPlaced::class, UpdateInventory::class, 10); // Higher priority = runs before $listen listeners
    }
}
```

## Related Topics
- Boot Phase Order — where listener registration occurs
- Event Caching — how listener mappings are cached
- Deferred Providers (ku-03) — deferred providers that register listeners must use `when()` to load on time
- Lifecycle Callback Hooks — listener registration in boot callbacks

## AI Agent Notes
- The event dispatcher stores listeners in `$this->listeners[$event]` — listeners are appended in registration order.
- `event:cache` generates `bootstrap/cache/events.php` — inspect it to verify listener mappings.
- Auto-discovery uses `ReflectionMethod` on `handle()` to find the event type-hint — this is expensive and should be cached.
- Listener order at the same priority level follows registration order.

## Verification
- [ ] All listeners are registered in `$listen` array or via `Event::listen()` in provider `boot()`
- [ ] Event cache is generated for production (`php artisan event:cache`)
- [ ] No listener is registered twice via both $listen and auto-discovery
- [ ] Priority values are documented and used consistently
- [ ] Cache is cleared and regenerated after listener changes
