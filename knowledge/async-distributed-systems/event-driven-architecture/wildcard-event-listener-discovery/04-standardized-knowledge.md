# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Event-Driven Architecture
- **Knowledge Unit:** K029 — Wildcard Event Listener Discovery
- **Knowledge ID:** K029
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Events: Event Discovery
  - Laravel Source — `Illuminate\Events\Dispatcher`

---

# Overview

Laravel supports wildcard event patterns using `*` as a glob-style matcher in both event names and listener signatures. A listener with `handle(* $event)` catches ALL events. A subscriber that registers `$events->listen('order.*', ...)` catches `order.shipped`, `order.paid`, `order.cancelled`, etc. Wildcard discovery reduces boilerplate for cross-cutting concerns (logging, metrics, auditing) that must observe many events without per-event registration.

---

# Core Concepts

- **Method-based wildcard:** A listener's `handle(* $event)` parameter type-hinted with `*` catches every dispatched event.
- **Name-based wildcard:** `$events->listen('order.*', $handler)` registers a handler for all events matching the `order.*` pattern.
- **Wildcard resolution:** The dispatcher uses `Str::is()` for pattern matching against the event's name.
- **Mixed wildcards:** Wildcards work with both class-based events (`App\Events\Order*`) and string-based events (`order.*`).

---

# When To Use

- Cross-cutting infrastructure concerns — logging all events, collecting metrics, auditing
- Namespace-based event categorization — `$events->listen('App\Events\Order*', ...)` catches all order-related events
- Centralized monitoring — observe event throughput, timing, or failure rates
- Conditional handling — catch all events in a namespace and route within the handler

---

# When NOT To Use

- Business logic event handling — explicit event→listener binding is clearer and more maintainable
- High-throughput event systems where wildcard pattern matching overhead is measurable
- Events that need ordered execution — wildcard listeners run after exact-match listeners
- When debugging event flow — wildcards make event→listener mapping non-obvious

---

# Best Practices

- **Use wildcards for infrastructure, not business logic.** Logging, metrics, and auditing benefit from wildcard observation. Domain-specific handling should use exact matches. *Why: Wildcard listeners obscure the event flow — debugging which listeners fire for an event becomes a runtime investigation.*
- **Keep wildcard listeners fast and exception-safe.** A wildcard listener that throws causes ALL matching events to fail. *Why: Wildcard listeners participate in every matching event dispatch — any failure cascades to all listeners downstream.*
- **Avoid `handle(* $event)` for business logic.** It catches ALL events, including framework internal events (`illuminate.queue.*`, `illuminate.cache.*`), potentially causing infinite loops. *Why: Framework events are also dispatched through the same dispatcher — a catch-all listener may interact with them unpredictably.*
- **Monitor wildcard listener performance.** A heavy wildcard listener on a high-frequency event degrades system performance. *Why: Each dispatch evaluates all matching wildcard patterns — the cost scales with both wildcard count and event frequency.*

---

# Architecture Guidelines

- Wildcard listeners are stored separately from exact-match listeners in the dispatcher.
- On dispatch, exact-match listeners run first, then wildcard listeners.
- Method-based wildcard (`* $event`) is discovered by `EventDiscoveryService` via the `*` type-hint.
- Wildcard patterns use `Str::is()` for matching against the event's fully qualified class name or string name.
- `event:cache` includes wildcard listener mappings.

---

# Performance Considerations

- Each wildcard pattern check is a `Str::is()` call. For 50 patterns and 100 events/sec, that's 5,000 pattern match checks/sec.
- Method-based wildcard (`* $event`) requires no pattern match — it runs for ALL events unconditionally.
- Wildcard listeners are slower than exact-match listeners due to pattern matching overhead.
- For high-throughput systems, minimize wildcard listeners. Use a single catch-all with internal filtering.

---

# Security Considerations

- A wildcard listener can observe ALL events, including events containing sensitive data. Ensure wildcard listeners do not log or transmit sensitive information.
- `handle(* $event)` catches authentication and authorization events — these may contain credentials or session tokens. Be extremely careful with catch-all listeners.
- Wildcard listeners in packages may unintentionally observe application-level events they should not access.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `* $event` for business logic | Catch-all listener handles domain events | Catches framework events too — unexpected side effects | Use exact-match listeners for domain logic |
| Assuming `*` matches across directory separators | `App\Events\Order*` does NOT match `App\Events\Payment\OrderRefunded` | Events in sub-namespaces not caught | Be specific about pattern boundaries |
| Not testing wildcard performance | Heavy logic in wildcard listener | Performance degradation proportional to event frequency | Keep wildcard logic minimal; test under load |
| Wildcard modifies event state | Event object shared across listeners | Subsequent listeners receive modified event | Never mutate event in wildcard listeners |

---

# Anti-Patterns

- **Catch-all listener as event router:** A single `handle(* $event)` with a large switch statement routing to different logic. Defeats the purpose of the event system.
- **Wildcard listener that dispatches new events:** Can create infinite loops — the dispatched event matches the same wildcard, triggering recursive dispatch.
- **Silent exception swallowing in wildcards:** `try { ... } catch (\Throwable $e) { }` hides failures for all matched events, making debugging impossible.

---

# Examples

```php
// Method-based wildcard — catches ALL events
class EventLogger
{
    public function handle(* $event): void
    {
        Log::debug('Event dispatched', ['event' => get_class($event)]);
    }
}

// Name-based wildcard in subscriber
class OrderEventObserver
{
    public function subscribe(Dispatcher $events): void
    {
        // Catches order.shipped, order.paid, order.cancelled
        $events->listen('order.*', [$this, 'onOrderEvent']);
    }

    public function onOrderEvent(string $eventName, object $event): void
    {
        Metrics::increment($eventName);
    }
}

// Namespace wildcard
$events->listen('App\Events\Order*', function ($event) {
    // Catches all Order* events regardless of full class name
    Cache::tags(['orders'])->flush();
});
```

---

# Related Topics

- **K025 Event Auto-Discovery (K025)** — Method-based wildcard discovery mechanism
- **K027 Event Subscribers (K027)** — Using wildcards in subscriber `subscribe()` method
- **K084 withEvents Custom Listener Directories (K084)** — Custom paths with wildcard discovery

---

# AI Agent Notes

- When generating wildcard listeners for infrastructure concerns, prefer name-based wildcards (`$events->listen('order.*', ...)`) over method-based catch-all (`* $event`). They are more predictable and safer.
- Never generate `handle(* $event)` for business logic. Restrict to logging, metrics, and auditing.
- When generating wildcard patterns, note that `*` matches within a namespace segment, not across `/` separators.
- Always consider framework events — a catch-all listener also catches `illuminate.*` events.

---

# Verification

- [ ] Name-based wildcard matches expected events — verify `order.*` catches `order.shipped`, not `payment.shipped`
- [ ] Method-based `* $event` catches ALL events — verify including framework events
- [ ] Exact-match listeners run before wildcard — verify execution order
- [ ] No infinite loop — verify wildcard listener does not dispatch matching events
- [ ] `event:cache` includes wildcard patterns — verify cached mapping includes wildcards
- [ ] Wildcard pattern does not cross namespace boundaries — verify `App\Events\Order*` does not match `App\Events\Payment\OrderRefunded`
