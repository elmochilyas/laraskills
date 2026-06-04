# Rules for Domain Events in Laravel

## Domain Events Are Past Tense Facts
---
## Category
Architecture | Domain Events
---
## Rule
Domain Events MUST be named in past tense using business language; events represent facts that have occurred, not commands to do something.
---
## Reason
Past tense naming communicates that the event is an immutable record of the past. Commands (imperative) are intentions, not facts. Confusing the two leads to architecture where listeners are expected to modify state rather than react to already-completed state changes.
---
## Bad Example
```php
class PayInvoice { /* This is a command, not a domain event */ }
class InvoicePaymentRequested { /* Ambiguous — is this a command or event? */ }
```
---
## Good Example
```php
class InvoicePaid { /* This is a domain event — invoice was paid */ }
class OrderShipped { /* This is a domain event — order was shipped */ }
```
---
## Exceptions
No exceptions. Past tense naming is universal in DDD and event sourcing.
---
## Consequences Of Violation
Architecture confusion; event replay hazards; listeners that modify state instead of reacting.

## Dispatch Before Persistence
---
## Category
Architecture | Domain Events
---
## Rule
Domain Events SHOULD be recorded inside Aggregate methods and dispatched BEFORE or AFTER persistence (not inside the aggregate), using a recorded-events pattern that collects events during business operations and dispatches them at the application layer boundary.
---
## Reason
Recording events inside aggregates ties the event to the exact business operation that caused it. Dispatching at the application boundary ensures events are sent after the transaction succeeds, avoiding events for rolled-back operations.
---
## Bad Example
```php
// Event dispatched but transaction may roll back
Event::dispatch(new InvoicePaid($id));
DB::transaction(fn() => $invoice->save());
```
---
## Good Example
```php
// Events recorded in aggregate, dispatched after successful persistence
DB::transaction(fn() => $repo->save($invoice));
foreach ($invoice->releaseEvents() as $event) {
    Event::dispatch($event);
}
```
---
## Exceptions
Events used for intra-aggregate consistency within the same transaction may be dispatched before persistence.
---
## Consequences Of Violation
Events dispatched for rolled-back transactions; events and persistence get out of sync.

## Events at Domain Boundary
---
## Category
Architecture | Domain Events
---
## Rule
Define Domain Event classes in the Domain layer (or Domain/Application boundary) as plain PHP classes; they MUST NOT contain Laravel-specific traits, framework imports, or infrastructure concerns.
---
## Reason
Domain Events are business concepts. Framework dependencies couple them to Laravel, making them unusable in domain testing, event sourcing replay, or extraction to separate packages.
---
## Bad Example
```php
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
class InvoicePaid {
    use Dispatchable, InteractsWithSockets, SerializesModels;
}
```
---
## Good Example
```php
final class InvoicePaid {
    public function __construct(
        public readonly string $invoiceId,
        public readonly \DateTimeImmutable $occurredAt,
    ) {}
}
```
---
## Exceptions
Framework event traits may be used in Application-layer event classes that are never serialized or replayed.
---
## Consequences Of Violation
Domain events coupled to Laravel; cannot be serialized independently; event sourcing replay requires Laravel bootstrap.

## Listener in Infrastructure Layer
---
## Category
Architecture | Domain Events
---
## Rule
Event listener classes MUST reside in the Infrastructure layer; they MAY use Eloquent, facades, contracts, and other Laravel infrastructure.
---
## Reason
Listeners handle side effects (email, search, notifications, persistence) which are infrastructure concerns. Placing them outside Domain/Application layers respects the dependency rule and keeps business logic infrastructure-agnostic.
---
## Bad Example
```php
// In Domain layer
class SendInvoiceNotification {
    public function handle(InvoicePaid $event): void {
        Mail::send(...); // Infrastructure in Domain
    }
}
```
---
## Good Example
```php
// In Infrastructure/Listeners/
class SendInvoiceNotification implements ShouldQueue {
    public function handle(InvoicePaid $event): void {
        Mail::send(...); // Infrastructure code in Infrastructure layer
    }
}
```
---
## Exceptions
No exceptions. Event listeners are inherently infrastructure.
---
## Consequences Of Violation
Domain layer coupled to infrastructure; business logic and side effects entangled; domain not testable without mail/database mocks.

## Events Carry Minimal Required Data
---
## Category
Architecture | Domain Events
---
## Rule
Domain Events MUST carry only the minimal data required by listeners; prefer Aggregate identifiers over full object serialization.
---
## Reason
Large event payloads increase serialization cost, queue storage, and processing time. They also couple the event contract to the full Aggregate structure, making event evolution harder. Identifiers allow listeners to fetch current state independently.
---
## Bad Example
```php
class InvoicePaid {
    public function __construct(
        public readonly Invoice $invoice, // Full aggregate in event
    ) {}
}
```
---
## Good Example
```php
class InvoicePaid {
    public function __construct(
        public readonly string $invoiceId, // Just the identifier
        public readonly \DateTimeImmutable $paidAt,
    ) {}
}
```
---
## Exceptions
Events used for event sourcing or read model projection may require full Aggregate state at the time of the event.
---
## Consequences Of Violation
Large event payloads; tight coupling between event contract and aggregate structure; event schema evolution difficulties.

## Critical Listeners Use Queue
---
## Category
Architecture | Domain Events
---
## Rule
Non-critical side effect listeners (email, search indexing, webhooks, notifications) MUST implement `ShouldQueue` for async processing; only intra-transaction consistency listeners may be synchronous.
---
## Reason
Synchronous listeners add their execution time to the HTTP response time. Queueing offloads processing to workers, keeping response times fast and isolating failures. Only listeners that must update state within the same database transaction should be synchronous.
---
## Bad Example
```php
class SendEmailListener {
    public function handle(InvoicePaid $event): void {
        Mail::send(...); // Synchronous — adds 500ms+ to response
    }
}
```
---
## Good Example
```php
class SendEmailListener implements ShouldQueue {
    public $connection = 'redis';
    public function handle(InvoicePaid $event): void {
        Mail::send(...); // Queued — response unaffected
    }
}
```
---
## Exceptions
Read model projections in the same database transaction, or operations that MUST complete before the response is sent.
---
## Consequences Of Violation
Slow HTTP responses; user-facing latency; cascading failures when external services are slow.

## Events Must Be Idempotent
---
## Category
Architecture | Reliability
---
## Rule
All Domain Event listeners MUST be idempotent — processing the same event multiple times MUST produce the same result as processing it once.
---
## Reason
At-least-once delivery is common in queue-based systems. Network failures, worker crashes, and retries mean any event may be processed multiple times. Non-idempotent listeners cause duplicate emails, double-charges, and inconsistent state.
---
## Bad Example
```php
public function handle(InvoicePaid $event): void {
    $this->mailer->send($event->invoiceId); // Duplicate email on retry
}
```
---
## Good Example
```php
public function handle(InvoicePaid $event): void {
    if (Cache::has("sent:{$event->invoiceId}")) {
        return; // Already processed
    }
    $this->mailer->send($event->invoiceId);
    Cache::put("sent:{$event->invoiceId}", true, 3600);
}
```
---
## Exceptions
Events used for append-only operations (audit logs) where duplicates are acceptable.
---
## Consequences Of Violation
Duplicate side effects; data inconsistency; customer-facing issues (duplicate charges, duplicate emails).
