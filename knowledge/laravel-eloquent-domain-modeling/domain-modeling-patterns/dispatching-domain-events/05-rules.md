# Dispatching Domain Events — Rules

---

## Rule: Dispatch Domain Events Only After the Database Transaction Commits
---
## Category
Reliability
---
## Rule
Always dispatch domain events after the database transaction has committed. Use `DB::afterCommit()` or dispatch in a deferred callback to guarantee the event only fires on successful persistence.
---
## Reason
Dispatching before commit causes events to fire even if the transaction rolls back, resulting in listeners performing side effects (emails, API calls, projections) for operations that never actually completed.
---
## Bad Example
```php
DB::transaction(function () use ($order) {
    $order->place();
    Event::dispatch(new OrderPlaced($order->id)); // Fires even if transaction rolls back!
    $this->doSomethingThatMayFail();
});
```
---
## Good Example
```php
DB::transaction(function () use ($order) {
    $order->place();
    $this->doSomethingThatMayFail();

    // Dispatch after all operations succeed
    DB::afterCommit(fn () => Event::dispatch(new OrderPlaced($order->id)));
});
```
---
## Exceptions
When the event listener itself must be in the same transaction (e.g., updating a same-aggregate read model synchronously). Use sync listeners and same-transaction dispatch carefully.
---
## Consequences Of Violation
Orphaned side effects: emails sent for rolled-back orders, projection updates for failed transactions, and difficult-to-debug inconsistencies between write model and derived data.

---

## Rule: Carry Identity and Value Objects, Not Model Instances
---
## Category
Architecture
---
## Rule
Pass only the aggregate root's ID and relevant value objects (primitives, DTOs) in domain event payloads. Never pass Eloquent model instances.
---
## Reason
Eloquent model instances carry the full database row state, may have changed by the time a queued listener processes them, and serialize large amounts of unnecessary data. IDs decouple the event from the model's state at dispatch time.
---
## Bad Example
```php
class OrderPlaced
{
    public function __construct(
        public readonly Order $order, // Full model instance — bad!
    ) {}
}
```
---
## Good Example
```php
class OrderPlaced
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $customerId,
        public readonly int $totalCents,
        public readonly string $currency,
    ) {}
}
```
---
## Exceptions
Synchronous listeners executing within the same request where the model is guaranteed unchanged. Still prefer IDs for consistency.
---
## Consequences Of Violation
Serialization of large model graphs into queues, stale data in listeners when the model is re-loaded after changes, and tight coupling between event consumers and the Eloquent model's structure.

---

## Rule: Use the Recorded Events Pattern for Complex Operations
---
## Category
Design
---
## Rule
Collect domain events in an array during a multi-step domain operation, then flush and dispatch all events atomically after the transaction commits.
---
## Reason
Dispatching events inline during a multi-step operation risks partial dispatch if an intermediate step fails. The recorded events pattern ensures all or none of the events are dispatched, maintaining consistency.
---
## Bad Example
```php
public function place(): void
{
    DB::transaction(function () {
        $this->status = 'placed';
        $this->save();
        Event::dispatch(new OrderPlaced($this->id));

        $this->sendConfirmation();
        Event::dispatch(new OrderConfirmationSent($this->id));
        // If sendConfirmation fails, OrderPlaced was already dispatched
    });
}
```
---
## Good Example
```php
class Order extends Model
{
    private array $recordedEvents = [];

    public function place(): void
    {
        $this->status = 'placed';
        $this->save();
        $this->recordEvent(new OrderPlaced($this->id));

        $this->sendConfirmation();
        $this->recordEvent(new OrderConfirmationSent($this->id));
    }

    public function recordEvent(object $event): void
    {
        $this->recordedEvents[] = $event;
    }

    public function releaseEvents(): array
    {
        $events = $this->recordedEvents;
        $this->recordedEvents = [];
        return $events;
    }
}

// In the use case:
DB::transaction(function () use ($order) {
    $order->place();
});

DB::afterCommit(fn () => array_map(
    fn ($event) => Event::dispatch($event),
    $order->releaseEvents()
));
```
---
## Exceptions
Simple single-event operations where inline dispatch after `DB::afterCommit()` is sufficient.
---
## Consequences Of Violation
Partial event dispatch during failures, making it impossible to guarantee that all side effects of a complex operation succeed or fail together.

---

## Rule: Name Domain Events in Past Tense
---
## Category
Maintainability
---
## Rule
Always name domain event classes in past tense (e.g., `OrderPlaced`, `PaymentReceived`, `SubscriptionCancelled`).
---
## Reason
Past tense signals that the event represents something that has already happened and cannot be undone. Present tense (`OrderPlacing`) or future tense (`OrderWillBePlaced`) creates confusion about timing and whether the operation is still in progress.
---
## Bad Example
```php
class OrderPlace { ... }      // Vague — is it a command or an event?
class OrderPlacing { ... }    // Present tense — is it still happening?
```
---
## Good Example
```php
class OrderPlaced { ... }
class PaymentReceived { ... }
class SubscriptionCancelled { ... }
```
---
## Exceptions
Commands — use imperative tense for commands (e.g., `PlaceOrder`, `CancelSubscription`). Rules apply only to domain events.
---
## Consequences Of Violation
Ambiguous naming confuses developers about the event's nature (command vs. event) and whether the occurrence is past, present, or future.

---

## Rule: Register All Domain Event Listeners in EventServiceProvider
---
## Category
Code Organization
---
## Rule
Explicitly register every domain event-to-listener mapping in the `EventServiceProvider` `$listen` array rather than using `Event::listen()` calls scattered across service providers or boot methods.
---
## Category
Code Organization
---
## Rule
Explicitly register every domain event-to-listener mapping in the `EventServiceProvider` `$listen` array instead of using `Event::listen()` calls scattered across service providers or boot methods.
---
## Reason
A central registry makes all event-subscriber relationships visible in one place. Scattered `Event::listen()` calls hide the wiring, making it impossible to audit which events trigger which side effects without a full-codebase search.
---
## Bad Example
```php
// In AppServiceProvider::boot():
Event::listen(OrderPlaced::class, SendOrderConfirmation::class);

// In SomeProvider::boot():
Event::listen(OrderPlaced::class, UpdateInventoryProjection::class);

// No central registry — hard to find all listeners
```
---
## Good Example
```php
// In EventServiceProvider:
protected $listen = [
    OrderPlaced::class => [
        SendOrderConfirmation::class,
        UpdateInventoryProjection::class,
        CreateShipment::class,
    ],
    PaymentReceived::class => [
        UpdateInvoiceStatus::class,
    ],
];
```
---
## Exceptions
Dynamic listener registration based on runtime configuration — but prefer central registration even then.
---
## Consequences Of Violation
Unintentional missing listeners when new events are added, difficulty onboarding new developers, and hard-to-trace bugs where expected side effects don't fire.

---

## Rule: Use ShouldQueue for Non-Critical Side Effects
---
## Category
Performance
---
## Rule
Implement `ShouldQueue` on listeners whose side effects are not immediately required for the response, such as notifications, projections, and external API calls.
---
## Reason
Synchronous listeners extend the HTTP response time by the duration of all side effects. Queuing non-critical listeners keeps the response fast and allows listeners to be retried independently on failure.
---
## Bad Example
```php
class SendOrderConfirmation // No ShouldQueue — synchronous
{
    public function handle(OrderPlaced $event): void
    {
        Mail::send(...); // User waits for email to send
    }
}
```
---
## Good Example
```php
class SendOrderConfirmation implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        Mail::send(...); // Runs on queue — response is immediate
    }
}
```
---
## Exceptions
Listeners whose side effects are required for a consistent response (e.g., updating a critical read model that the user will immediately query). Use sync for these, async for everything else.
---
## Consequences Of Violation
Slow HTTP responses, user-facing timeouts, and side effects that fail silently when the response has already been sent and the exception is unhandled.

---

## Rule: Include Correlation IDs in Every Domain Event
---
## Category
Scalability
---
## Rule
Include a universally unique correlation ID in every domain event payload to enable tracing related events across bounded contexts and services.
---
## Reason
Domain events trigger chains of side effects across contexts. Without a correlation ID, tracing a user action through multiple event listeners, queues, and contexts requires manual log correlation. Correlation IDs enable automated tracing and debugging.
---
## Bad Example
```php
class OrderPlaced
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $customerId,
    ) {
        // No correlation ID — cannot trace this event across systems
    }
}
```
---
## Good Example
```php
class OrderPlaced
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $customerId,
        public readonly string $correlationId,
    ) {}
}

// Usage:
Event::dispatch(new OrderPlaced(
    orderId: $order->id,
    customerId: $order->user_id,
    correlationId: Str::uuid(),
));
```
---
## Exceptions
Simple synchronous-only events within a single bounded context where logging trace is acceptable for debugging.
---
## Consequences Of Violation
Near-impossible debugging of multi-step event chains, inability to correlate failures across contexts, and poor observability in distributed architectures.
