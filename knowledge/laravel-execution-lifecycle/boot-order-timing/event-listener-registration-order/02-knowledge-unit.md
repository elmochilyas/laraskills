# Event Listener Registration Order

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Event listener registration order determines the sequence in which listeners execute when an event is dispatched. Listeners are registered during the `boot()` phase of service providers and through auto-discovery. The order of registration (and the optional `$priority` property) determines execution order. Understanding this timing is critical for ensuring listeners run in the correct sequence when events have multiple handlers, especially in package-heavy applications where listener registration order may be implicit.

## Core Concepts

### Registration in boot()
Event listeners are typically registered in `EventServiceProvider::boot()` or individual provider `boot()` methods via `Event::listen()`. Registration in `register()` is not supported — the event dispatcher must be fully initialized.

### $listen Array
The `$listen` property on `EventServiceProvider` maps events to their listener classes. Processed in array order — listeners defined first in the array execute first (at the same priority level).

### $subscribe Property
Subscriber classes are registered and their `subscribe()` method is called to define multiple event-handler mappings. Subscribers are processed after `$listen` entries.

### Auto-Discovery
Laravel can auto-discover listeners by scanning the `app/Listeners` directory and matching `handle()` methods to event type-hints. Discovered listeners are appended after `$listen` entries.

### Listener Priority
`Event::listen(Event::class, [Listener::class, 'handle'], $priority)` — higher priority values run first. Default priority is 0.

### Event Caching
`event:cache` generates a cached manifest of event-to-listener mappings, removing the need for runtime discovery and freezing the listener order at cache-build time.

## Mental Models

### The Concert Queue
Imagine a concert venue with multiple entry gates (listeners). The order of entry is determined by ticket priority (VIP first, general admission second). Within the same priority tier, the order people arrived at the gate (registration order) determines entry sequence.

### The Assembly Line
Each event is a product on an assembly line. Listeners are stations along the line. The product moves through stations in a fixed order — station order determines execution order. Priority is like express lanes that skip ahead.

### The Event Bus Route
Think of an event as a bus traveling a fixed route. Listeners are bus stops in sequence. The bus must pass through stops in registration order. Priority listeners are like express buses that stop at their stops before the regular bus route begins.

## Internal Mechanics

### EventDispatcher Storage
```php
// Illuminate\Events\Dispatcher
// Listeners stored in $this->listeners[$event]
// Each listener entry: ['handler' => callable, 'priority' => int]

public function listen($events, $listener = null)
{
    // ...
    $this->listeners[$event][$priority][] = $this->makeListener($listener);
}
```

Listeners are stored in a nested array: `$this->listeners[$event][$priority][]`. Higher priority keys are iterated first. Within the same priority, array order (registration order) determines execution sequence.

### Registration Flow
1. `EventServiceProvider::boot()` is called during boot phase
2. `$listen` array is processed — each event→listener mapping is registered via `Event::listen()`
3. `$subscribe` classes are instantiated and `subscribe()` is called on each
4. Auto-discovery scans `app/Listeners/` directory
5. Additional `Event::listen()` calls in other providers' `boot()` methods register more listeners
6. At event dispatch time, listeners are retrieved by priority, then registration order

### Priority Sorting
```php
public function getListeners($event)
{
    // Sort by priority (highest first)
    // Within same priority, preserve registration order
    $listeners = $this->listeners[$event] ?? [];
    krsort($listeners);
    return array_merge(...array_values($listeners));
}
```

### Auto-Discovery Cost
Auto-discovery uses `ReflectionMethod` on each listener's `handle()` method to find the event type-hint. This is the most expensive part of uncached event registration.

## Patterns

### Declarative $listen Pattern
Use the `$listen` array for static, cacheable event-to-listener mappings. This is declarative and visible at a glance.

### Subscriber for Related Listeners
Group related listeners into subscriber classes for cohesion. The subscriber's `subscribe()` method registers multiple listener mappings in a single class.

### Explicit Priority Pattern
Use priority sparingly — only when semantic ordering is required (e.g., logging before notification, validation before processing).

## Architectural Decisions

### Why listeners in boot(), not register()?
Listeners often depend on services registered during `register()`. The two-phase provider pattern ensures the container is fully populated before listeners are registered.

### Why array order for same priority?
PHP arrays preserve insertion order. This makes the `$listen` array predictable — developers control order by ordering array entries. No complex sorting rules.

### Why auto-discovery exists despite being slow?
Auto-discovery provides zero-configuration convenience for small applications. It follows Laravel's convention-over-configuration philosophy. Production applications should cache or use explicit `$listen`.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Explicit $listen order is predictable | $listen array can grow large | Hard to audit listener order in large apps |
| Priority enables semantic ordering | Priority values are arbitrary | Conflicts when multiple packages set priority |
| Auto-discovery enables zero-config | 10-30ms per-request Reflection cost | Must cache or switch to explicit in production |
| Package listeners auto-register | Package listener order is implicit | Unexpected execution order vs application listeners |

## Performance Considerations

- **Auto-discovery:** Adds 10-30ms to bootstrap by reflecting on listener `handle()` methods — cache or use explicit `$listen`.
- **Event caching:** Reduces listener registration to a single `require` of the manifest file (~1ms).
- **Per-listener overhead:** Each listener callback adds ~1-5µs dispatch overhead. 50 listeners per event = ~250µs.
- **Wildcard listeners:** `Event::listen('event.*', ...)` — slower because the event dispatcher must match against patterns.
- **Priority sort:** `krsort()` on the priority array is O(n log n) — negligible for typical listener counts.

## Production Considerations

- **Cache events:** Always run `event:cache` in production to eliminate auto-discovery and freeze listener order.
- **Document priority:** If using priority, document the values and the intended order for each event.
- **Audit listener dependencies:** Listeners that depend on other listeners' side effects are fragile — order should not be taken for granted.
- **Deployment cache strategy:** Include `event:cache` in deployment scripts, after `config:cache` but before serving traffic.
- **Monitor dispatch order:** Use Laravel Telescope to observe actual listener execution order and verify it matches expectations.

## Common Mistakes

- **Priority confusion:** Higher priority number runs first — not last. Developers often reverse this.
- **Duplicate listeners:** Listener registered twice (auto-discovered + explicit in `$listen`) — executes twice for one dispatch.
- **Listeners in boot() not cached:** `Event::listen()` in provider `boot()` but not in `$listen` — cache does not capture programmatic registrations.
- **Stale event cache:** Listener added but cache not cleared — listener never fires after deployment.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Listener never fires | Event dispatched but no side effect | Listener registered after event cache was built | Clear and regenerate event cache |
| Listener fires twice | Duplicate side effects per event | Listener registered in both $listen and auto-discovery | Ensure single registration path |
| Wrong execution order | Listener B runs before A despite intended A→B | Priority confusion or implicit registration order | Use explicit $listen and document order |
| ClassNotFoundException | Deployed app references removed listener | Stale event cache with old listener class | Clear cache on deploy |

## Ecosystem Usage

- **Laravel Telescope:** Registers watchers as listeners in its `EventServiceProvider`. Telescope watchers use priority to run before application listeners.
- **Laravel Horizon:** Listens to queue events (`JobProcessed`, `JobFailed`) — uses its own listener registration order to log before notifying.
- **Spatie packages:** Register event listeners in their service providers using `Event::listen()` in `boot()`. Order relative to app listeners depends on provider registration order.
- **Laravel Nova:** Listens to cycle events for its activity logging. Uses subscriber classes for clean organization.

## Related Knowledge Units

### Prerequisites
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md) — where listener registration occurs.
- [Register Phase Order](../register-phase-order/02-knowledge-unit.md) — all services must be registered before listeners are set up.

### Related Topics
- [Deferred Providers (ku-03)](../ku-03-deferred-providers/02-knowledge-unit.md) — deferred providers use `when()` to trigger loading when events are dispatched.
- [Event Caching (ku-03)](../../caching-optimization/events-caching/02-knowledge-unit.md) — how listener mappings are cached.

## Research Notes
- The event dispatcher stores listeners in `$this->listeners[$event]` — listeners are appended in registration order.
- `event:cache` generates `bootstrap/cache/events.php` — inspect it to verify listener mappings.
- Auto-discovery uses `ReflectionMethod` on `handle()` to find the event type-hint — expensive and should be cached.
- Listener order at the same priority level follows registration order within `$listen`, then subscriber registration, then auto-discovery.
