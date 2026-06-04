# Rule Card: K029 — Wildcard Event Listener Discovery

---

## Rule 1

**Rule Name:** wildcards-for-infrastructure-only

**Category:** Always

**Rule:** Always use wildcard listeners for infrastructure concerns only — never for business logic.

**Reason:** Wildcard listeners obscure the event flow — debugging which listeners fire for an event becomes a runtime investigation.

**Bad Example:**
```php
class OrderEventHandler
{
    public function handle(* $event): void
    {
        if ($event instanceof OrderShipped) { /* process order */ }
    }
}
```

**Good Example:**
```php
class EventLogger
{
    public function handle(* $event): void
    {
        Log::debug('Event dispatched', ['event' => get_class($event)]);
    }
}
```

**Exceptions:** None — business logic belongs in explicit event→listener bindings.

**Consequences Of Violation:** A future developer cannot determine which listeners handle an event by reading `EventServiceProvider` — event→handler mapping is hidden in runtime code.

---

## Rule 2

**Rule Name:** keep-wildcards-fast-and-safe

**Category:** Always

**Rule:** Always keep wildcard listeners fast and exception-safe.

**Reason:** A wildcard listener that throws causes ALL matching events to fail — cascading through all downstream listeners.

**Bad Example:**
```php
public function handle(* $event): void
{
    Http::post('https://analytics.example.com/event', [...]); // Slow API call — delays every event
}
```

**Good Example:**
```php
public function handle(* $event): void
{
    try {
        Metrics::increment(get_class($event));
    } catch (Throwable $e) {
        Log::warning('Metric increment failed', ['error' => $e->getMessage()]);
    }
}
```

**Exceptions:** None — wildcard listeners participate in every matching event dispatch and must never fail.

**Consequences Of Violation:** An analytics wildcard listener throws an exception — the exception propagates through the event dispatch, cancelling ALL other listeners for that event, including critical business logic handlers.

---

## Rule 3

**Rule Name:** no-catchall-for-business-logic

**Category:** Never

**Rule:** Never use `handle(* $event)` for business logic.

**Reason:** It catches ALL events, including framework internal events (`illuminate.queue.*`, `illuminate.cache.*`), potentially causing infinite loops.

**Bad Example:**
```php
public function handle(* $event): void
{
    if ($event->order->needsProcessing()) {
        ProcessOrder::dispatch($event->order); // Dispatches event — wildcard catches it again
    }
}
```

**Good Example:**
```php
public function handle(OrderShipped $event): void
{
    if ($event->order->needsProcessing()) {
        ProcessOrder::dispatch($event->order);
    }
}
```

**Exceptions:** None — exact-match listeners are always safer than catch-all for domain logic.

**Consequences Of ViolATION:** The catch-all listener dispatches a job that fires an event — the catch-all catches it again, dispatching another job in an infinite loop until memory exhaustion.

---

## Rule 4

**Rule Name:** never-mutate-event-in-wildcard

**Category:** Never

**Rule:** Never mutate event state in wildcard listeners.

**Reason:** Events are shared objects passed to all listeners — mutation in a wildcard affects subsequent listeners unpredictably.

**Bad Example:**
```php
public function handle(* $event): void
{
    $event->processed = true; // Mutates ALL events — breaks downstream listeners
}
```

**Good Example:**
```php
public function handle(* $event): void
{
    Log::debug('Event dispatched', ['event' => get_class($event)]);
    // Read-only — no mutation
}
```

**Exceptions:** None — wildcard listeners should be read-only observers.

**Consequences Of Violation:** A downstream listener checks `$event->processed` and skips processing — the wildcard listener inadvertently broke the business logic listener's behavior.
