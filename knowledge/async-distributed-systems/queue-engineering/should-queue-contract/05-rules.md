# Rule Card: K006 — `ShouldQueue` Contract and Queueable Types

---

## Rule 1

**Rule Name:** always-implement-should-queue

**Category:** Always

**Rule:** Always implement `ShouldQueue` on job classes — use `dispatchSync()` for sync cases instead of removing the interface.

**Reason:** The interface signals the dispatch path — `dispatchSync()` overrides it cleanly without changing the class contract.

**Bad Example:**
```php
// Removed ShouldQueue because some callers need sync — now all dispatches are sync
class ProcessOrder
{
    // No ShouldQueue — no async option for any caller
}
```

**Good Example:**
```php
class ProcessOrder implements ShouldQueue
{
    use Dispatchable;
}

// Sync callers use dispatchSync() explicitly
ProcessOrder::dispatchSync($order);
```

**Exceptions:** Job classes that are never intended to be queued should not implement `ShouldQueue`.

**Consequences Of Violation:** Callers lose the ability to dispatch async — every call becomes synchronous, increasing response times and reducing throughput.

---

## Rule 2

**Rule Name:** add-serializes-models-to-listeners

**Category:** Always

**Rule:** Always add the `SerializesModels` trait to queued event listeners.

**Reason:** Without it, the entire event payload is serialized naively — causing payload bloat and potential serialization failures.

**Bad Example:**
```php
class SendOrderNotification implements ShouldQueue
{
    public function handle(OrderCreated $event): void
    {
        // $event->order serialized entirely — payload bloat
    }
}
```

**Good Example:**
```php
class SendOrderNotification implements ShouldQueue
{
    use SerializesModels;

    public function handle(OrderCreated $event): void
    {
        // $event->order serialized as ModelIdentifier — lightweight
    }
}
```

**Exceptions:** Listeners that don't contain Eloquent models in their event payload don't need the trait.

**Consequences Of Violation:** Each queued listener payload includes the full serialized model graph — memory usage spikes and serialization errors for non-serializable properties.

---

## Rule 3

**Rule Name:** never-mail-send-in-production

**Category:** Never

**Rule:** Never use `Mail::send()` in production.

**Reason:** `Mail::send()` blocks the HTTP request while the SMTP call completes — queuing mail avoids adding network latency to responses.

**Bad Example:**
```php
Mail::send(new OrderConfirmation($order)); // Blocks request for SMTP latency
```

**Good Example:**
```php
Mail::queue(new OrderConfirmation($order)); // Returns immediately
```

**Exceptions:** In development/testing environments, synchronous mail is acceptable to simplify debugging.

**Consequences Of Violation:** Web response times increase by 100ms-5s per email — at peak traffic, this compound delay significantly reduces request throughput.

---

## Rule 4

**Rule Name:** dont-remove-shouldqueue-for-sync

**Category:** Never

**Rule:** Never conditionally remove `ShouldQueue` to make a job synchronous.

**Reason:** Removing the interface changes the class contract for all callers — `dispatchSync()` handles sync dispatch without removing the interface.

**Bad Example:**
```php
// Removed ShouldQueue for "sync" behavior
class ProcessPayment
{
    public function handle(): void { ... }
}
```

**Good Example:**
```php
class ProcessPayment implements ShouldQueue
{
    use Dispatchable;

    public function handle(): void { ... }
}

// Caller controls sync vs async
ProcessPayment::dispatchSync($payment); // sync when needed
ProcessPayment::dispatch($payment);     // async when needed
```

**Exceptions:** Classes that are never dispatched (always called directly) don't need `ShouldQueue`.

**Consequences Of Violation:** All callers are forced to sync dispatch — if a queue worker is added later, the job class must be refactored.
