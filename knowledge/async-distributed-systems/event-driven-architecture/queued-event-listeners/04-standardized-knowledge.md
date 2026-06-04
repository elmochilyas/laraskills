# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Event-Driven Architecture
- **Knowledge Unit:** K028 — Queued Event Listeners
- **Knowledge ID:** K028
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Events: Queued Event Listeners
  - Laravel Source — `Illuminate\Events\CallQueuedListener`
  - Laravel Source — `Illuminate\Events\Dispatcher`

---

# Overview

An event listener that implements `ShouldQueue` is automatically queued — the event is dispatched, the listener class is serialized (with the event), and pushed to the queue as a `CallQueuedListener` job. This allows listeners to perform I/O operations (API calls, email sending) without blocking the event dispatcher. The queued listener pattern is the bridge between the synchronous event system and the async queue system. All standard queue configuration (connection, queue, delay, tries, backoff, middleware) applies to queued listeners.

---

# Core Concepts

- **ShouldQueue on listeners:** Marking a listener with `ShouldQueue` routes it through the queue system.
- **CallQueuedListener:** The internal job class that wraps the listener and event. It calls `$listener->handle($event)` when processed.
- **SerializesModels:** Queued listeners should use `SerializesModels` if the event contains Eloquent models.
- **Queue configuration:** Queued listeners support `$connection`, `$queue`, `$delay`, `$tries`, `$backoff`, `$timeout` properties.
- **Synchronous fallback:** If `ShouldQueue` is not present, the listener runs inline in the event dispatch flow.

---

# When To Use

- Listeners that make external network calls (HTTP APIs, SMTP, SMS gateways)
- Listeners that perform expensive I/O (file processing, image manipulation)
- Listeners that can tolerate eventual consistency (notifications, analytics)
- Any listener where blocking the event dispatcher is unacceptable

---

# When NOT To Use

- Listeners that update local database state and need immediate consistency — inline execution ensures atomicity with the dispatch
- Listeners that must run in the same transaction as the event dispatch — queued listeners run asynchronously
- Listeners with very short execution time (< 5ms) — queue overhead exceeds execution time
- Event ordering is critical — queued listeners have no guaranteed ordering across listeners

---

# Best Practices

- **Always set `$tries` on queued listeners.** Without it, the listener retries indefinitely until `retryUntil()` stops it. *Why: Infinite retries can cause cascading failures — a listener that always fails retries forever, consuming worker resources.*
- **Add `SerializesModels` to listeners handling Eloquent models.** Without it, the event's model properties are serialized as full object dumps, wasting queue space. *Why: `SerializesModels` replaces model instances with IDs, restoring them on the worker — smaller payload and fresher data.*
- **Keep events serializable-friendly.** Avoid non-serializable objects (closures, resources) in event properties. *Why: The event is serialized into the `CallQueuedListener` job — non-serializable properties cause dispatch-time failures.*
- **Test queued listeners directly, not through event fakes.** `Event::fake()` captures events but does not process queued listener jobs. *Why: The `CallQueuedListener` job is dispatched to the queue — `Event::fake()` only asserts the event was dispatched, not that the listener processed it.*

---

# Architecture Guidelines

- The dispatcher iterates all registered listeners for an event. Synchronous listeners run first, then queued listeners are dispatched.
- Each queued listener creates one `CallQueuedListener` job. An event with 5 queued listeners creates 5 separate jobs.
- `CallQueuedListener::handle()` calls `$this->listener->{$this->method}($this->event)` (typically `$listener->handle($event)`).
- Queue configuration properties (`$connection`, `$queue`, `$tries`, etc.) are read from the listener class via reflection.
- Failed queued listeners trigger the `failed()` method on the listener class if defined.

---

# Performance Considerations

- Queued listener dispatch adds serialization + queue push + later worker pop + deserialization overhead.
- The event dispatcher still blocks until ALL inline listeners complete — queued listeners are pushed but not executed at dispatch time.
- Each queued listener creates one queue job — high listener counts per event multiply queue volume.
- Slow inline listeners delay the event dispatch for ALL listeners (including queued ones). Move slow listeners to `ShouldQueue`.
- In cached mode (`event:cache`), `ShouldQueue` checks are pre-computed — no reflection overhead at runtime.

---

# Security Considerations

- The event payload is serialized into the queue job — sensitive data in event properties is stored in the queue backend until processed.
- Queued listeners run in the worker process with worker-level permissions — ensure the worker has appropriate access for all listener operations.
- The `failed()` method on listeners executes after failure — it should not assume the event data is still valid or the original context exists.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No `SerializesModels` on queued listeners | Event contains Eloquent models without the trait | Large payloads, stale model data on worker | Add `SerializesModels` to the listener |
| No `$tries` set | Assuming default retry behavior | Infinite retries on failure — worker stuck on failing listener | Always set `$tries` or `retryUntil()` |
| Testing only with `Event::fake()` | Not testing listener `handle()` directly | Listener logic never actually executed in tests | Test `$listener->handle($event)` directly |
| Slow inline listener blocking queue dispatch | One inline listener takes 5 seconds | All queued listeners delayed by 5 seconds | Move all slow listeners to `ShouldQueue` |
| Non-serializable event properties | Closures, resources in event payload | Job fails at dispatch time | Keep events serializable |

---

# Anti-Patterns

- **Queuing listeners that update local state:** Database writes or cache updates in a queued listener introduces eventual consistency. If the worker is delayed, the UI shows stale data.
- **No idempotency in queued listeners:** The same event may be processed multiple times due to retries. Design listeners to handle duplicate execution safely.
- **Event payload with full model graphs:** Passing `$user->load('posts.comments')` in an event — the entire loaded relation tree is serialized. Pass IDs and fetch fresh data in the listener.
- **Queuing ALL listeners indiscriminately:** Not all listeners need async execution. Fast listeners (< 5ms) add unnecessary queue overhead.

---

# Examples

```php
// Queued event listener
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;

class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public $connection = 'redis';
    public $queue = 'notifications';
    public $tries = 3;
    public $backoff = [5, 15, 60];

    public function handle(OrderShipped $event): void
    {
        Mail::to($event->order->user)->send(
            new ShipmentConfirmation($event->order)
        );
    }

    public function failed(OrderShipped $event, Throwable $e): void
    {
        Log::error('Shipment notification failed', [
            'order_id' => $event->order->id,
            'error' => $e->getMessage(),
        ]);
    }
}

// Event with only serializable data (avoids model serialization issues)
class OrderShipped
{
    public function __construct(
        public int $orderId,
        public string $status,
    ) {}
}

// Inline listener for fast local state updates
class UpdateOrderStatus
{
    public function handle(OrderShipped $event): void
    {
        DB::table('orders')
            ->where('id', $event->orderId)
            ->update(['status' => $event->status]);
    }
}
```

---

# Related Topics

- **K006 ShouldQueue Contract (K006)** — Contract mechanics and queueable interface
- **K025 Event Auto-Discovery (K025)** — How queued listeners are discovered
- **K005 SerializesModels Trait (K005)** — Model serialization in queued contexts

---

# AI Agent Notes

- When generating queued listeners, always include `SerializesModels` if the event contains Eloquent models, and always set `$tries` to a finite number.
- The `CallQueuedListener` internal job dispatches `$listener->handle($event)` — ensure the method signature matches.
- When generating test code for queued listeners, use `Bus::fake()` to assert the `CallQueuedListener` job was dispatched, and test the listener's `handle()` method directly.
- Consider whether the listener truly needs queueing — if it takes < 5ms and updates local state, inline execution may be more appropriate.

---

# Verification

- [ ] Listener with `ShouldQueue` creates a `CallQueuedListener` job — verify via `Bus::fake()` or Horizon dashboard
- [ ] `$tries` limits retry count — verify listener fails after specified attempts
- [ ] `SerializesModels` restores fresh models — verify model is re-queried on worker (not using serialized stale data)
- [ ] `failed()` method called after exhaustion — verify cleanup logic executes on failure
- [ ] Inline listeners run first — verify order: inline handlers complete before queued jobs are pushed
- [ ] Non-serializable event causes dispatch error — verify `CallQueuedListener` fails at dispatch with serialization error
