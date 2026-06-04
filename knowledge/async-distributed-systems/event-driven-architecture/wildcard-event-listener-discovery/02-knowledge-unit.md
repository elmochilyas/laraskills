# Metadata
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: Wildcard Event Listener Discovery
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Laravel supports wildcard event patterns using `*` as a glob-style matcher in both event names and listener signatures. A listener with `handle(* $event)` catches ALL events. A subscriber that registers `$events->listen('order.*', ...)` catches `order.shipped`, `order.paid`, `order.cancelled`, etc. Wildcard discovery reduces boilerplate for cross-cutting concerns (logging, metrics, auditing) that must observe many events without per-event registration.

# Core Concepts
- **Method-based wildcard**: A listener's `handle(* $event)` parameter type-hinted with `*` catches every dispatched event.
- **Name-based wildcard**: `$events->listen('order.*', $handler)` registers a handler for all events matching the `order.*` pattern.
- **Wildcard resolution**: The dispatcher uses `str_is()` or `Str::is()` for pattern matching against the event's fully qualified class name or name string.
- **Mixed wildcards**: Wildcards work with both class-based events (listening for `App\Events\Order*`) and string-based events (`order.*`).

# Mental Models
- **Catch-all net**: A wildcard listener casts a wide net that catches all events matching the pattern. Useful for monitoring and logging.
- **Prefix routing**: Like route prefixes in web routing. `order.*` matches anything in the "order" namespace of events.

# Internal Mechanics
- `Dispatcher::getWildcardListeners()` returns listeners registered with wildcard patterns.
- On `dispatch($event)`, the dispatcher first runs exact-match listeners, then iterates wildcard patterns.
- For each wildcard pattern, `Str::is($wildcard, $eventName)` checks if the event matches.
- Wildcard listeners receive the full event object, same as exact-matched listeners.
- Method-based wildcard: discovered by `EventDiscoveryService` — if the `handle()` method has a `*` type-hint on the first parameter, it's registered as a wildcard.
- Wildcard listeners are stored separately from exact listeners in the dispatcher.

# Patterns
## Event Logger / Auditor
- **Purpose**: Log all events passing through the system.
- **Benefit**: Complete audit trail with a single listener.
- **Tradeoff**: High volume for busy applications; log storage costs.

## Namespace-Based Event Categorization
- **Purpose**: Treat event class namespaces as event categories.
- **Benefit**: `$events->listen('App\Events\Order*', ...)` catches all order-related events.
- **Tradeoff**: Requires consistent event naming conventions.

## Conditional Wildcard Handling
- **Purpose**: Use wildcard to catch all events, but filter within the handler.
- **Benefit**: Centralized logic with per-event routing.
- **Tradeoff**: Handler becomes a router; logic duplication risk.

# Architectural Decisions
- **Use wildcards for infrastructure concerns**: Logging, metrics, monitoring. These benefit from catching all events.
- **Avoid wildcards for business logic**: Explicit event→listener binding is clearer for domain-specific handling.
- **Use method-based wildcard (`handle(* $event)`) with caution**: Catches ALL events — may create performance issues and unexpected behavior.

# Tradeoffs
Wildcard listener | Single handler for many events, easy cross-cutting | Overhead on every dispatch; opaque event flow
Exact-match listener | Explicit, predictable, no overhead | Many registrations for cross-cutting concerns
Method-based `*` wildcard | Automatic catch-all | Very broad; performance impact on every event

# Performance Considerations
- Each wildcard pattern check is a `Str::is()` call. For 50 wildcard patterns and 100 events/second, that's 5000 pattern match checks/second.
- Method-based wildcard (`handle(* $event)`) requires no pattern match — the listener is called for ALL events unconditionally.
- Wildcard listeners are slower than exact-matched listeners because pattern matching has overhead.
- For high-throughput event systems, minimize wildcard listeners. Use a single catch-all with internal filtering.

# Production Considerations
- A wildcard listener that throws an exception causes ALL matching events to fail. Any failure in the wildcard handler cascades to all dispatched events.
- Wildcard listeners should be fast and never throw. Log exceptions internally.
- Use `event:cache` — cached event mapping includes wildcard patterns.
- Monitor the number of wildcard listeners. Too many degrades dispatch performance.
- Debugging event flow is harder with wildcards — you can't see the mapping in `EventServiceProvider`.

# Common Mistakes
- **Using `handle(* $event)` for business logic**: Catches ALL events, including framework internal events. May cause unexpected behavior or infinite loops.
- **Assuming wildcards match class hierarchy**: `App\Events\Order*` matches `OrderShipped`, `OrderPaid`. It does NOT match `App\Events\Payment\OrderRefunded` — the `*` stops at directory separators.
- **Not testing wildcard listener performance**: A wildcard listener with heavy logic on a frequently dispatched event can degrade system performance.
- **Wildcard handler modifies event state**: The event object is shared across all listeners. Wildcard modification affects subsequent handlers.

# Failure Modes
- **Wildcard listener on framework events**: `handle(* $event)` catches Laravel internal events (queue events, auth events, DB events). May cause recursive loops or performance degradation.
- **Infinite loop via wildcard**: A wildcard listener dispatches an event that matches its own wildcard, creating a recursion loop.
- **Wildcard masking exact-match errors**: If a wildcard listener swallows exceptions (try/catch in listener), it may hide failures in exact-match listeners.
- **Performance degradation at scale**: A wildcard listener with I/O operations (logging to external service) on high-frequency events creates backpressure.

# Ecosystem Usage
- **Laravel framework**: The dispatcher supports wildcards natively. Framework events use string names (`illuminate.queue.*`, `illuminate.cache.*`).
- **Laravel Horizon**: Horizon's internal event listeners use exact matches, not wildcards.
- **Spatie packages**: Some packages use wildcards for observing domain events (e.g., spatie/laravel-event-sourcing uses wildcard event listeners for projectors).

# Related Knowledge Units
- K025 Event Auto-Discovery (basis for method-level wildcard) | K027 Event Subscribers (wildcards in subscribers)

## Research Notes
- Laravel's event auto-discovery (Laravel 8+) scans the Listeners directory and maps listeners to events by method type-hints — this eliminates manual Event::listen() registration for convention-based setups.
- The ShouldBeDiscoverable interface (Laravel 11+) provides fine-grained control over which listeners are auto-discovered — only listeners implementing this interface are included in auto-discovery scans.
- Event subscribers (implementing ShouldQueue on listeners) register multiple listeners in a single class via the subscribe() method — this pattern is useful for grouping related event handling logic.
- Queued event listeners use the same job serialization mechanism as queued jobs — the event object is serialized, dispatched to the queue, then unserialized and passed to the listener's handle() method.
- Wildcard event listeners (Event::listen('event.*')) can match multiple events using * as a wildcard character — these receive the event object and event name as arguments.
- Custom listener directories (Laravel 12+) can be configured in EventServiceProvider via the $listen property with directory paths — this supports modular monolith and package-based event architectures.
- Event discovery caching (event:cache and event:clear) improves performance in production by avoiding file scans — the cache must be rebuilt when new listeners are added or existing ones are modified.
- Community patterns for event-driven Laravel applications favor domain events over generic Laravel events, using dedicated event classes per domain concept rather than generic "model.saved" patterns.
