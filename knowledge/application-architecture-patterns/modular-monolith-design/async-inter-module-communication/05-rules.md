# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Inter-module asynchronous communication via events
Knowledge Unit ID: MMD-07
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---
## Rule Name
Default to queued events for cross-module communication
---
## Category
Architecture
---
## Rule
Dispatch all cross-module events synchronously with `ShouldQueue` by default. Queue slow listeners (email, reports, webhooks) so they don't block the HTTP response.
---
## Reason
Synchronous event listeners block the HTTP response until they complete. A slow listener (email sending, PDF generation, third-party API call) adds seconds of latency. Queuing adds ~1-5ms dispatch time and keeps responses fast.
---
## Bad Example
```php
class SendInvoiceEmail implements ShouldQueue
{
    // Not queued — email sending blocks the response
    public function handle(InvoiceGenerated $event): void
    {
        Mail::to($event->email)->send(new InvoiceMail($event->invoiceId));
    }
}
```
---
## Good Example
```php
class SendInvoiceEmail implements ShouldQueue
{
    public $queue = 'email';

    public function handle(InvoiceGenerated $event): void
    {
        Mail::to($event->email)->send(new InvoiceMail($event->invoiceId));
    }
}
```
---
## Exceptions
Events that must complete before the response to maintain data consistency (e.g., updating a cache used immediately after) may dispatch synchronously. Document each exception.
---
## Consequences Of Violation
HTTP response time includes slow listener execution; poor user experience; timeout errors.

---
## Rule Name
Keep event payloads minimal — IDs and changed values only
---
## Category
Architecture
---
## Rule
Include only the aggregate ID and changed values in event payloads. Never pass entire Eloquent models or full serialized aggregates.
---
## Reason
Full Eloquent models create coupling (consumer depends on provider's model schema) and serialization issues (Eloquent serializes all relationships, attributes, and protected data).
---
## Bad Example
```php
class OrderPlaced
{
    public function __construct(
        public Order $order, // Full Eloquent model — couples consumer to schema
        public User $user,   // Full User model — includes sensitive data
    ) {}
}
```
---
## Good Example
```php
class OrderPlaced
{
    public function __construct(
        public int $orderId,
        public int $userId,
        public array $productIds,
        public MoneyDTO $total,
    ) {}
}
```
---
## Exceptions
During the initial extraction phase of a legacy system, temporary payload bloat may be tolerated. Schedule cleanup within one sprint.
---
## Consequences Of Violation
Consumer coupled to provider's database schema; serialization issues with Eloquent relations; oversized queue payloads; security exposure of sensitive model data.

---
## Rule Name
Use past-tense naming for events
---
## Category
Code Organization
---
## Rule
Name events in past tense (`OrderPlaced`, `InvoiceGenerated`, `PaymentReceived`), never as commands (`CreateOrder`, `GenerateInvoice`).
---
## Reason
Events record things that have already happened. Past tense communicates that the event is a fact, not a request. Commands are a different pattern (imperative requests). Using past tense correctly sets expectations for listeners.
---
## Bad Example
```php
// Named as command — implies "do this"
class CreateOrder { /* ... */ }
class SendInvoiceEmail { /* ... */ }
```
---
## Good Example
```php
// Named as event — records what happened
class OrderCreated { /* ... */ }
class InvoiceEmailSent { /* ... */ }
```
---
## Exceptions
No common exceptions. Past tense event naming is a universal convention.
---
## Consequences Of Violation
Confusion between commands and events; unclear whether the event is a request to do something or a record of something that happened; inconsistent naming across modules.

---
## Rule Name
Make event listeners idempotent
---
## Category
Reliability
---
## Rule
Design every event listener to handle duplicate event dispatches safely. Check if the action was already performed before executing, or ensure the action is naturally idempotent.
---
## Reason
Events may be dispatched twice due to retries (queue worker retries), logic errors (duplicate dispatch), or at-least-once delivery guarantees. Non-idempotent listeners cause duplicate emails, duplicate charges, or duplicate records.
---
## Bad Example
```php
class SendWelcomeEmail
{
    public function handle(UserRegistered $event): void
    {
        Mail::send(...); // Sends email every time — no deduplication
        // Queue retry sends ANOTHER welcome email
    }
}
```
---
## Good Example
```php
class SendWelcomeEmail
{
    public function handle(UserRegistered $event): void
    {
        // Check if already sent
        if (UserWelcomeEmail::where('user_id', $event->userId)->exists()) {
            return; // Already sent — skip
        }

        Mail::send(...);
        UserWelcomeEmail::create(['user_id' => $event->userId, 'sent_at' => now()]);
    }
}
```
---
## Exceptions
Events dispatched with "exactly-once" guarantees (custom wrapper ensuring unique delivery) may skip idempotency checks, but the guarantee must be verified at the infrastructure level.
---
## Consequences Of Violation
Duplicate emails to customers; duplicate payment charges (refund costs, customer trust loss); duplicate records in database.

---
## Rule Name
Do not use events for within-module communication
---
## Category
Architecture
---
## Rule
Use direct method calls for communication within the same module. Events are for cross-module communication only.
---
## Reason
Events within a module add unnecessary indirection without decoupling benefit. Direct method calls are simpler, faster, and traceable. Within a module, classes can reference each other directly.
---
## Bad Example
```php
// Within the same Billing module
class InvoiceController
{
    public function generate()
    {
        InvoiceGenerated::dispatch(); // Event dispatched and listened within same module
    }
}

class SendInvoiceListener
{
    public function handle(InvoiceGenerated $event): void
    {
        // Same module — direct call would be simpler
    }
}
```
---
## Good Example
```php
// Within the same module — direct call
class InvoiceController
{
    public function generate()
    {
        $this->invoiceService->generateAndSend(current user());
    }
}

class InvoiceService
{
    public function generateAndSend(User $user): void
    {
        // Direct method call — no event needed
    }
}
```
---
## Exceptions
When the module is complex enough that specific domain events are needed (e.g., aggregate root events for consistency boundaries), intra-module events are acceptable. Document the choice.
---
## Consequences Of Violation
Unnecessary indirection; harder to trace flow; performance overhead (event dispatch/listener resolution); confusion about module boundaries.

---
## Rule Name
Document module events as the module's async API contract
---
## Category
Maintainability
---
## Rule
Document every event a module dispatches: event name, payload structure, when it is dispatched, and expected listener behavior. This is the module's asynchronous API contract.
---
## Reason
Other teams and modules need to know what events to subscribe to. Without documentation, discovery requires reading source code, and important events may be missed.
---
## Bad Example
```php
// No documentation — new developer needs to grep for dispatch() calls
// "Does Billing dispatch an event when an invoice is paid?"
```
---
## Good Example
```php
// Modules/Billing/docs/events.md
// # Billing Events
// ## InvoiceGenerated
// - Dispatched after invoice is created and persisted
// - Payload: invoiceId, customerId, total, dueDate
// - Listeners: SendInvoiceEmail (queued)
// - Idempotency: check invoice_email_sent table
```
---
## Exceptions
For very small teams (2-3 developers) with complete codebase knowledge, documentation may be deferred until the module has 3+ external listeners.
---
## Consequences Of Violation
Event discovery requires code reading; missing event handling causes functional gaps; event changes not communicated.

---
## Rule Name
Limit events per request to prevent flow opacity
---
## Category
Maintainability
---
## Rule
Keep event dispatches per request under 10. When a single request triggers more than 10 events, consider consolidating or re-examining the design.
---
## Reason
An event chain of 10+ events per request makes the flow impossible to trace, debug, and reason about. Each event adds a potential failure point and obscures the request's intent.
---
## Bad Example
```php
// OrderController adds item — 12 events triggered
OrderItemAdded::dispatch();
OrderTotalRecalculated::dispatch();
CustomerTierChecked::dispatch();
PromotionApplied::dispatch();
StockReserved::dispatch();
OrderUpdated::dispatch();
// ... 6 more events
// Impossible to trace what happens on "add item"
```
---
## Good Example
```php
// Consolidate related changes into a single event
OrderItemAdded::dispatch(new OrderItemAddedDTO(
    orderId: $order->id,
    itemId: $item->id,
    quantity: $quantity,
    price: $price,
    newTotal: $order->total,
    promotionApplied: $promotion,
));
// Listeners extract the data they need from the consolidated payload
```
---
## Exceptions
Reporting and audit events (not operational) may add more events without affecting flow traceability, as they are not part of the request's core logic.
---
## Consequences Of Violation
Event flow is untraceable; debugging is extremely difficult; cascading failures from multiple event points.
