# Metadata
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: Event Subscribers and Manual Registration
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Event subscribers are classes that group multiple event-listener mappings in a single `subscribe()` method. They provide an alternative to per-listener classes and manual `EventServiceProvider` registration. A subscriber's `subscribe(Dispatcher $events)` method registers event handlers using `$events->listen()`. Subscribers are registered via `EventServiceProvider::$subscribe` array. They are useful when a single class should handle multiple related events (e.g., an `OrderSubscriber` handling `OrderShipped`, `OrderPaid`, `OrderCancelled`).

# Core Concepts
- **Subscriber class**: A class with a `subscribe(Dispatcher $events)` method that calls `$events->listen()` for each event.
- **`$subscribe` array**: Property on `EventServiceProvider` listing subscriber classes.
- **Manual registration**: `EventServiceProvider::$listen` array mapping events to listener classes.
- **Hybrid registration**: Use `$listen` for simple event→listener, `$subscribe` for grouped handlers.
- **Existing listener methods**: Subscribers can use existing Listener classes or define handlers inline as closures/class methods.

# Mental Models
- **Multi-tool**: A subscriber is a Swiss Army knife for related events. Instead of carrying individual tools (listener files), one tool handles multiple operations.
- **Department manager**: A subscriber is like a department manager who handles multiple types of requests (events) for their department. Instead of separate staff (listeners) for each request type, one manager handles them all.

# Internal Mechanics
- `EventServiceProvider::boot()` iterates `$subscribe`, calls `$dispatcher->subscribe(SubscriberClass::class)`.
- `Dispatcher::subscribe()` instantiates the subscriber, calls `$subscriber->subscribe($this)`.
- Inside `subscribe()`, `$this->listen('event.name', [$this, 'handlerMethod'])` registers each handler.
- The subscriber instance is typically not resolved from the container — a new instance is created.
- Subscribers can also use `$subscriber->subscribe($events)` with Closure handlers.
- The resulting event-to-listener mapping is merged with auto-discovered and manually registered listeners.

# Patterns
## Domain Event Subscriber
- **Purpose**: Group all event handlers for a bounded context (Order, Payment, User).
- **Benefit**: Cohesive grouping; easier to find all event handling for a domain.
- **Tradeoff**: Subscriber may become large; violates Single Responsibility if not careful.

## Conditional Subscription
- **Purpose**: Register listeners conditionally based on configuration or environment.
- **Benefit**: Environment-specific event handling without multiple listener classes.
- **Tradeoff**: Conditional logic in `subscribe()` is not visible from the provider.

## Subscriber with Dependency Injection
- **Purpose**: Inject services into the subscriber for handler methods.
- **Benefit**: Handlers have access to services without container calls in each listener.
- **Tradeoff**: Subscriber gains coupling to injected services.

# Architectural Decisions
- **Use subscribers when**: A single class naturally handles multiple related events (e.g., cache warming subscriber handles CacheWarmEvents).
- **Use `$listen` for**: Simple one-to-one event→listener mapping. Most common cases.
- **Use auto-discovery for**: Conventional listener-per-event organization.
- **Avoid subscribers for**: Unrelated events grouped only for convenience — better to have separate listeners.

# Tradeoffs
Subscriber | Groups related handlers, cohesive | Can grow large; not discoverable; manual registration needed
`$listen` array | Explicit mapping, easy to read | One event per line; verbose for many events
Auto-discovery | Zero registration overhead | Opaque; no central view of event flow

# Performance Considerations
- Subscriber registration is a boot-time event. The `subscribe()` method is called once per request/worker boot.
- `$events->listen()` calls inside `subscribe()` add entries to the dispatcher's listener array.
- No runtime overhead difference between subscriber-registered and array-registered listeners.
- For large applications with many subscribers, the `subscribe()` methods may collectively take 10-50ms at boot.

# Production Considerations
- Subscribers are booted on every request (unless `event:cache` is used). The cache includes subscriber-registered listeners.
- Test subscribers as unit: instantiate the subscriber, call `subscribe($dispatcher)`, dispatch events, assert handlers ran.
- Subscribers that register many events (20+) may be doing too much. Consider splitting.
- For event caching, `event:cache` compiles subscriber-registered mappings into the cache file.

# Common Mistakes
- **Registering subscribers via `$listen` array**: Subscribers go in `$subscribe`, not `$listen`. Putting a subscriber in `$listen` tries to instantiate it as a listener class, which fails.
- **Not using `event:cache` after adding a subscriber**: Subscriber handlers won't fire until the cache is regenerated.
- **Making handlers non-public**: `$this->listen('event', [$this, 'privateMethod'])` — private methods cannot be called by the dispatcher. Use `public`.
- **Returning values from handlers**: Event handlers shouldn't return values. The dispatcher ignores return values.

# Failure Modes
- **Subscriber constructor injection fails**: If the subscriber requires dependencies that aren't resolvable from the container, registration fails at boot. Entire application breaks.
- **Duplicate registration**: If the same subscriber is registered via both `$subscribe` and auto-discovery (from app/Listeners), handlers fire twice.
- **Subscriber class not found**: Composer autoloader can't find the subscriber class. Registration fails at boot.

# Ecosystem Usage
- **Laravel framework**: `EventServiceProvider` is the canonical registration point. The framework core uses subscribers for internal system events.
- **Laravel Horizon**: Horizon registers its listeners via its own service provider, not through subscriber pattern.
- **Spatie packages**: Some Spatie packages use subscribers for their event handling (e.g., spatie/laravel-event-sourcing).

# Related Knowledge Units
- K025 Event Auto-Discovery (alternative registration) | K028 Queued Event Listeners (subscriber with queued handlers)

## Research Notes
- Laravel's event auto-discovery (Laravel 8+) scans the Listeners directory and maps listeners to events by method type-hints — this eliminates manual Event::listen() registration for convention-based setups.
- The ShouldBeDiscoverable interface (Laravel 11+) provides fine-grained control over which listeners are auto-discovered — only listeners implementing this interface are included in auto-discovery scans.
- Event subscribers (implementing ShouldQueue on listeners) register multiple listeners in a single class via the subscribe() method — this pattern is useful for grouping related event handling logic.
- Queued event listeners use the same job serialization mechanism as queued jobs — the event object is serialized, dispatched to the queue, then unserialized and passed to the listener's handle() method.
- Wildcard event listeners (Event::listen('event.*')) can match multiple events using * as a wildcard character — these receive the event object and event name as arguments.
- Custom listener directories (Laravel 12+) can be configured in EventServiceProvider via the $listen property with directory paths — this supports modular monolith and package-based event architectures.
- Event discovery caching (event:cache and event:clear) improves performance in production by avoiding file scans — the cache must be rebuilt when new listeners are added or existing ones are modified.
- Community patterns for event-driven Laravel applications favor domain events over generic Laravel events, using dedicated event classes per domain concept rather than generic "model.saved" patterns.
