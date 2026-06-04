# Rule Card: K028 — Queued Event Listeners

---

## Rule 1

**Rule Name:** set-tries-on-queued-listeners

**Category:** Always

**Rule:** Always set `$tries` on queued event listeners.

**Reason:** Without it, the listener retries indefinitely until `retryUntil()` stops it — consuming worker resources forever on a permanent failure.

**Bad Example:**
```php
class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;
    // No $tries — retries forever on failure
}
```

**Good Example:**
```php
class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
}
```

**Exceptions:** Listeners with `retryUntil()` providing a time-based cutoff may safely omit `$tries`.

**Consequences Of Violation:** A permanent failure (invalid address) retries forever — every retry sends another failing API call, burns worker time, and fills logs.

---

## Rule 2

**Rule Name:** add-serializes-models-to-listener

**Category:** Always

**Rule:** Always add `SerializesModels` to queued listeners handling events with Eloquent models.

**Reason:** Without it, the event's model properties are serialized as full object dumps — wasting queue space and storing stale data.

**Bad Example:**
```php
class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue, Queueable;
    // No SerializesModels — entire model graph serialized
}
```

**Good Example:**
```php
class SendShipmentNotification implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;
    // Models replaced with ModelIdentifier — lightweight payload
}
```

**Exceptions:** Listeners that handle events without Eloquent model properties don't need the trait.

**Consequences Of Violation:** Each queued listener payload includes the full serialized model graph including all loaded relations — a 1KB event becomes a 100KB payload, wasting Redis memory and increasing serialization time.

---

## Rule 3

**Rule Name:** keep-events-serializable

**Category:** Never

**Rule:** Never include non-serializable objects (closures, resources) in event properties.

**Reason:** The event is serialized into the `CallQueuedListener` job — non-serializable properties cause dispatch-time failures.

**Bad Example:**
```php
class OrderShipped
{
    public function __construct(
        public Order $order,
        public \Closure $callback, // Closure — not serializable
    ) {}
}
```

**Good Example:**
```php
class OrderShipped
{
    public function __construct(
        public int $orderId,
    ) {}
}
```

**Exceptions:** Events that are only dispatched synchronously (never queued) may include non-serializable properties.

**Consequences Of Violation:** The `CallQueuedListener` job fails at dispatch with a serialization error — the event is dispatched, but the queued listener never runs.

---

## Rule 4

**Rule Name:** test-queued-listeners-directly

**Category:** Always

**Rule:** Always test queued listeners directly, not through `Event::fake()`.

**Reason:** `Event::fake()` captures events but does not process queued listener jobs — it only asserts the event was dispatched.

**Bad Example:**
```php
Event::fake();
dispatch(new OrderShipped($order));
Event::assertDispatched(OrderShipped::class);
// Listener logic never executed — test passes vacuously
```

**Good Example:**
```php
$listener = new SendShipmentNotification;
$listener->handle(new OrderShipped($order));
// Listener logic directly tested
Mail::assertSent(ShipmentConfirmation::class);
```

**Exceptions:** When testing only dispatch behavior (not listener execution), `Event::fake()` is appropriate.

**Consequences Of Violation:** The listener's `handle()` method is never tested — a bug in the listener's email logic, API call, or database write goes undetected.
