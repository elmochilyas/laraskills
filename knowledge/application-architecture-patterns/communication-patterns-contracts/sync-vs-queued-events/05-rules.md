# Rules: Synchronous vs queued event handling

## Rule 1: Default to sync within context, queue across contexts
---
## Category
Architecture
---
## Handle events synchronously within a bounded context and queue events that cross context boundaries.
---
## Reason
Within a context, events are part of the same transactional boundary — sync handlers ensure consistency. Across contexts, queuing decouples availability — the downstream context being down doesn't block the upstream.
---
## Bad Example
```php
// Queuing an internal event that should be synchronous
class OrderPlaced
{
    public function __construct(
        public readonly string $orderId,
    ) {}
}

class SendNotification extends ShouldQueue // Queued within same context
{
    public function handle(OrderPlaced $event): void
    {
        // Notification processing — was fine as sync
    }
}
```
---
## Good Example
```php
// Sync handler within context
class UpdateInventory
{
    public function handle(OrderPlaced $event): void
    {
        // Same-context side effect — synchronous
    }
}

// Queued handler for cross-context
class NotifyBilling extends ShouldQueue implements ShouldBeUnique
{
    public $afterCommit = true;

    public function handle(OrderPlaced $event): void
    {
        // Cross-context side effect — queued
    }
}
```
---
## Exceptions
Expensive same-context operations (e.g., report generation) can be queued even within a context if the user doesn't need to wait.
---
## Consequences Of Violation
Queuing within a context introduces unnecessary latency and eventual consistency risk. Syncing across contexts couples availability.
---

## Rule 2: Keep critical side effects synchronous
---
## Category
Reliability | Consistency
---
## Always handle side effects that require transactional consistency synchronously. Never queue operations that must be consistent within the same request.
---
## Reason
Queued handlers run in a separate process. If the worker is down or the job fails, the side effect never happens. Synchronous handlers execute within the same transaction, guaranteeing consistency.
---
## Bad Example
```php
class DeductInventory extends ShouldQueue // Queuing inventory deduction!
{
    public $afterCommit = true;

    public function handle(OrderPlaced $event): void
    {
        // If this job fails, inventory isn't deducted despite order being placed
        Inventory::decrement($event->productId, $event->quantity);
    }
}
```
---
## Good Example
```php
class DeductInventory // Sync handler
{
    public function handle(OrderPlaced $event): void
    {
        // Inventory deducted atomically with order placement
        Inventory::decrement($event->productId, $event->quantity);
    }
}
```
---
## Exceptions
If the side effect can tolerate eventual consistency (e.g., updating a search index), queuing is acceptable.
---
## Consequences Of Violation
Inconsistent state when workers fail or are delayed; duplicate inventory; financial discrepancies; data corruption.
---

## Rule 3: Queue expensive or slow operations
---
## Category
Performance
---
## Always defer expensive operations (email sending, PDF generation, report building, third-party API calls) to the queue.
---
## Reason
Synchronous execution of slow operations blocks the HTTP response, degrading user experience. Queuing defers the work and returns the response immediately.
---
## Bad Example
```php
class SendOrderConfirmation // Sync handler for email
{
    public function handle(OrderPlaced $event): void
    {
        Mail::to($event->customerEmail)->send(new OrderConfirmation($event->orderId));
        // User waits for SMTP round-trip before getting HTTP response
    }
}
```
---
## Good Example
```php
class SendOrderConfirmation extends ShouldQueue // Queued handler for email
{
    public $afterCommit = true;

    public function handle(OrderPlaced $event): void
    {
        Mail::to($event->customerEmail)->send(new OrderConfirmation($event->orderId));
        // Response sent immediately; email processed by worker
    }
}
```
---
## Exceptions
If the email must be confirmed to the user in the same request (e.g., "check your inbox to verify"), use sync with a loading state in the UI.
---
## Consequences Of Violation
Slow page loads; user abandonment; request timeouts; poor scalability under load.
---

## Rule 4: Always set `$afterCommit = true` on queued handlers
---
## Category
Reliability
---
## Set `public $afterCommit = true` on every queued event handler. Never queue events inside an active transaction without this guard.
---
## Reason
If a queued event is dispatched inside a transaction that later rolls back, the event is already on the queue — a phantom event. `$afterCommit` ensures the event is only queued if the transaction commits.
---
## Bad Example
```php
class SendInvoice extends ShouldQueue
{
    // No $afterCommit — event queued inside transaction
    public function handle(InvoiceGenerated $event): void
    {
        Mail::send($event->invoice);
    }
}
```
---
## Good Example
```php
class SendInvoice extends ShouldQueue
{
    public $afterCommit = true; // Only queue if transaction commits

    public function handle(InvoiceGenerated $event): void
    {
        Mail::send($event->invoice);
    }
}
```
---
## Exceptions
If dispatching outside a transaction (no DB work), `$afterCommit` is unnecessary but harmless.
---
## Consequences Of Violation
Phantom events sent for rolled-back transactions; customers receive emails for orders that don't exist; audit logs record events for operations that never completed.
---

## Rule 5: Do not queue everything indiscriminately
---
## Category
Reliability | Scalability
---
## Never apply `ShouldQueue` to every event handler by default. Mix sync and queued handlers intentionally based on criticality and cost.
---
## Reason
If all handlers are queued and the worker goes down, the entire system becomes inconsistent. Synchronous handlers provide a fallback execution path and guarantee critical side effects run.
---
## Bad Example
```php
// All handlers queued — no sync path
class EventServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Event::listen(OrderPlaced::class, UpdateInventory::class); // Should be sync
        Event::listen(OrderPlaced::class, SendEmail::class);    // Correctly queued
        Event::listen(OrderPlaced::class, RebuildCache::class); // Should be sync
        Event::listen(OrderPlaced::class, NotifyCRM::class);    // Correctly queued
    }
}
```
---
## Good Example
```php
class EventServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Sync — critical for consistency
        Event::listen(OrderPlaced::class, UpdateInventory::class);
        Event::listen(OrderPlaced::class, RebuildSearchIndex::class);

        // Queued — expensive or cross-context
        Event::listen(OrderPlaced::class, SendEmail::class);
        Event::listen(OrderPlaced::class, NotifyCRM::class);
    }
}
```
---
## Exceptions
If the application has no critical side effects (e.g., read-only analytics), queuing everything is acceptable.
---
## Consequences Of Violation
Worker failure causes system-wide inconsistency; critical operations silently fail; recovery requires manual replay of all events.
---
