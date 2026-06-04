# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Event-Driven Architecture
- **Knowledge Unit:** K027 — Event Subscribers and Manual Registration
- **Knowledge ID:** K027
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Events: Event Subscribers
  - Laravel Source — `Illuminate\Events\Dispatcher`
  - Laravel Source — `Illuminate\Events\EventServiceProvider`

---

# Overview

Event subscribers are classes that group multiple event-listener mappings in a single `subscribe()` method. They provide an alternative to per-listener classes and manual `EventServiceProvider` registration. A subscriber's `subscribe(Dispatcher $events)` method registers event handlers using `$events->listen()`. Subscribers are registered via `EventServiceProvider::$subscribe` array. They are useful when a single class should handle multiple related events (e.g., an `OrderSubscriber` handling `OrderShipped`, `OrderPaid`, `OrderCancelled`).

---

# Core Concepts

- **Subscriber class:** A class with a `subscribe(Dispatcher $events)` method that calls `$events->listen()` for each event.
- **`$subscribe` array:** Property on `EventServiceProvider` listing subscriber classes.
- **Manual registration:** `EventServiceProvider::$listen` array mapping events to listener classes.
- **Hybrid registration:** Use `$listen` for simple event→listener, `$subscribe` for grouped handlers.
- **Existing listener methods:** Subscribers can use existing Listener classes or define handlers inline as closures/class methods.

---

# When To Use

- Grouping related event handlers for a bounded context (e.g., `OrderSubscriber`, `PaymentSubscriber`)
- Conditional subscription — register listeners based on configuration or environment
- Subscribers with dependency injection — handlers share injected services
- Replace scattered listener classes with cohesive handler groups

---

# When NOT To Use

- Simple one-to-one event→listener mapping — use `$listen` or auto-discovery instead
- When the subscriber would grow too large (>5-7 event handlers) — split into multiple subscribers or separate listeners
- Package development where listeners should be individually overridable — subscribers make it harder to override a single handler
- When auto-discovery is sufficient and the grouping provides no benefit

---

# Best Practices

- **Register subscribers in `$subscribe`, not `$listen`.** Putting a subscriber in `$listen` tries to instantiate it as a listener class, which fails. *Why: The dispatcher treats `$listen` entries as direct listener classes — subscribers need their `subscribe()` method called, which only happens via `$subscribe`.*
- **Make handler methods `public`.** The dispatcher calls `$this->handlerMethod($event)` — private methods cause a callable error. *Why: PHP's callable type only accepts public methods for class method strings — the dispatcher cannot invoke private subscriber methods.*
- **Keep subscribers focused on one domain.** A subscriber handling both `Order` and `Inventory` events violates cohesion. Split. *Why: Subscribers are meant for cohesive grouping — unrelated events in one subscriber obscure the event flow and violate Single Responsibility.*
- **Run `event:cache` after adding a subscriber.** Subscriber handlers are compiled into the cache — without regeneration, they won't fire. *Why: The cached event mapping is pre-computed — subscriber-registered listeners are only included when the cache is rebuilt.*

---

# Architecture Guidelines

- `EventServiceProvider::boot()` iterates `$subscribe`, calls `$dispatcher->subscribe(SubscriberClass::class)`.
- The subscriber instance is typically not resolved from the container — a new instance is created.
- Inside `subscribe()`, calls `$this->listen('event.name', [$this, 'handlerMethod'])` register each handler.
- Subscribers can also use Closure handlers: `$events->listen('event', fn($event) => ...)`.
- The resulting event-to-listener mapping is merged with auto-discovered and manually registered listeners.
- `event:cache` compiles subscriber-registered mappings into the cache file.

---

# Performance Considerations

- Subscriber registration is a boot-time concern — `subscribe()` is called once per request/worker boot.
- Each `$events->listen()` call inside `subscribe()` adds an entry to the dispatcher's listener array.
- No runtime overhead difference between subscriber-registered and array-registered listeners.
- For large applications with many subscribers, `subscribe()` methods may collectively take 10-50ms at boot.
- Cached mode eliminates this overhead — `event:cache` pre-compiles subscriber mappings.

---

# Security Considerations

- Subscriber constructor injection is resolved by the container — if dependencies fail to resolve, the entire application fails at boot.
- Subscribers can read configuration and environment data in `subscribe()` — configuration values are embedded in the event mapping at boot time.
- A subscriber with a broad pattern `$events->listen('*', ...)` intercepts ALL events — use very carefully.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Subscriber in `$listen` array | Confusing `$listen` and `$subscribe` | Subscriber instantiated as listener — callable error or no-op | Always use `$subscribe` for subscriber classes |
| Private handler methods | `private function handleOrderShipped(...)` | PHP callable error — dispatcher can't invoke | Use `public` for all handler methods |
| Not caching after subscriber change | Adding subscriber without `event:cache` | Handlers don't fire until cache regenerated | Run `event:cache` after any subscriber change |
| Duplicate registration | Same subscriber in both `$subscribe` and auto-discovery | Handlers fire twice for each event | Check both registration mechanisms |

---

# Anti-Patterns

- **Giant subscriber handling 15+ events:** Violates Single Responsibility. Split by domain.
- **Subscriber with heavy constructor injection:** Resolving many services at boot time slows every request/worker start.
- **Subscriber registering listeners for multiple packages:** Subscribers should be application-level. Package listeners belong in service providers.
- **Conditional subscription based on runtime state:** The condition is evaluated at boot — state may change by the time events fire. Use listener-level conditional logic instead.

---

# Examples

```php
// Subscriber class grouping order-related event handlers
class OrderEventSubscriber
{
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(OrderShipped::class, [$this, 'onOrderShipped']);
        $events->listen(OrderPaid::class, [$this, 'onOrderPaid']);
        $events->listen(OrderCancelled::class, [$this, 'onOrderCancelled']);
    }

    public function onOrderShipped(OrderShipped $event): void
    {
        Mail::to($event->order->user)->send(new ShipmentConfirmation($event->order));
    }

    public function onOrderPaid(OrderPaid $event): void
    {
        $this->invoiceService->generate($event->order);
    }

    public function onOrderCancelled(OrderCancelled $event): void
    {
        $this->inventoryService->restock($event->order->items);
    }
}

// Registration in EventServiceProvider
class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        // Individual event-listener mappings
        OrderShipped::class => [
            SendShipmentNotification::class, // auto-discovered alternative
        ],
    ];

    protected $subscribe = [
        OrderEventSubscriber::class, // subscriber handles multiple events
    ];
}

// Conditional subscription based on environment
class EnvironmentAwareSubscriber
{
    public function subscribe(Dispatcher $events): void
    {
        if (app()->isProduction()) {
            $events->listen(OrderShipped::class, [$this, 'sendAnalyticsToProduction']);
        } else {
            $events->listen(OrderShipped::class, [$this, 'logAnalyticsForDebug']);
        }
    }
}
```

---

# Related Topics

- **K025 Event Auto-Discovery (K025)** — Alternative registration via directory scanning
- **K028 Queued Event Listeners (K028)** — ShouldQueue on handlers within subscribers
- **K029 Wildcard Event Listener Discovery (K029)** — Pattern-based event matching in subscribers

---

# AI Agent Notes

- When generating subscriber code, register it in `EventServiceProvider::$subscribe`, not `$listen`.
- Handler methods in subscribers must be `public`.
- If a subscriber needs queueing for specific handlers, use `ShouldQueue` on the subscriber class (all handlers are queued) or dispatch a queued job inside the handler (selective queueing).
- For conditional subscription based on configuration, evaluate conditions inside `subscribe()` — this is evaluated at boot time.

---

# Verification

- [ ] Subscriber registered via `$subscribe` array — confirm all handlers fire for their respective events
- [ ] Subscriber in `$listen` causes error — verify error is thrown on instantiation
- [ ] Public handler methods — confirm callable resolves correctly
- [ ] `event:cache` includes subscriber mappings — verify cached file contains subscriber-registered listeners
- [ ] No duplicate handler execution — confirm subscriber and auto-discovery don't both register the same handler
