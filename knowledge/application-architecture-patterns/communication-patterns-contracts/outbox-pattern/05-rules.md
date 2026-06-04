# Rules: Outbox pattern for reliable event delivery

## Rule 1: Write to the outbox in the same transaction as the business operation
---
## Category
Reliability
---
## Always insert outbox records within the same database transaction as the business operation that generates them. Never write to the outbox in a separate transaction.
---
## Reason
If the outbox write is in a separate transaction, the business transaction can commit while the outbox write fails — the event is lost. Same-transaction guarantees atomicity: if the business operation commits, the outbox record is persisted.
---
## Bad Example
```php
DB::transaction(function () {
    $order = Order::create(/* ... */);
}); // Business transaction commits

// Outbox written separately — if this fails, event is lost!
DB::transaction(function () use ($order) {
    Outbox::insert([
        'type' => 'OrderPlaced',
        'payload' => json_encode(['orderId' => $order->id]),
    ]);
});
```
---
## Good Example
```php
DB::transaction(function () {
    $order = Order::create(/* ... */);

    // Outbox insert in the SAME transaction
    Outbox::insert([
        'id' => Str::uuid()->toString(),
        'type' => 'OrderPlaced',
        'payload' => json_encode(['orderId' => $order->id]),
        'occurred_at' => now(),
    ]);
}); // Both commit or both roll back atomically
```
---
## Exceptions
None. Same-transaction outbox is the defining characteristic of the pattern.
---
## Consequences Of Violation
Events lost when outbox write fails after business commit; phantom events when business rolls back but outbox commits; no reliability guarantee.
---

## Rule 2: Make all outbox consumers idempotent
---
## Category
Reliability
---
## Design every event consumer to handle duplicate events safely. Never assume exactly-once delivery from the outbox pattern.
---
## Reason
The outbox pattern provides at-least-once delivery. The polling publisher retries on failure, which can produce duplicates. Consumers must be idempotent to avoid double-processing.
---
## Bad Example
```php
class OrderConfirmationHandler
{
    public function handle(OrderPlaced $event): void
    {
        Mail::send(new OrderConfirmation($event->orderId));
        // If this handler receives the same event twice, user gets two emails
    }
}
```
---
## Good Example
```php
class OrderConfirmationHandler
{
    public function handle(OrderPlaced $event): void
    {
        // Idempotency check — skip if already processed
        $processed = ProcessedEvent::where('event_id', $event->eventId)->exists();
        if ($processed) {
            return;
        }

        Mail::send(new OrderConfirmation($event->orderId));

        // Record event as processed
        ProcessedEvent::create(['event_id' => $event->eventId]);
    }
}
```
---
## Exceptions
Analytics events where duplicates are acceptable (e.g., page view counting — slight over-counting is tolerable).
---
## Consequences Of Violation
Duplicate emails, SMS, charges; double inventory deductions; inconsistent state; customer complaints about duplicate communications.
---

## Rule 3: Use a polling publisher for simplicity
---
## Category
Architecture | Maintainability
---
## Implement the outbox publisher as a scheduled command that polls the outbox table, publishes pending events, and marks them as published. Avoid complex change data capture (CDC) setups unless polling latency is unacceptable.
---
## Reason
A polling publisher (Laravel `schedule:run` every minute) is simple to implement, debug, and deploy. CDC (Debezium, PostgreSQL logical replication) adds significant infrastructure complexity.
---
## Bad Example
```php
// Complex CDC setup for a simple application — over-engineering
// docker-compose.yml
//   debezium:
//     image: debezium/connect:latest
//     depends_on: [kafka, postgres]
//   kafka:
//     image: confluentinc/cp-kafka:latest
// etc.

// Multiple infrastructure components to maintain just for event publishing
```
---
## Good Example
```php
// Simple polling publisher — scheduled command
class PublishOutboxEvents extends Command
{
    public $signature = 'outbox:publish';
    public $description = 'Publish pending outbox events to the message bus';

    public function handle(): void
    {
        Outbox::whereNull('published_at')
            ->orderBy('occurred_at')
            ->chunk(100, function ($events) {
                foreach ($events as $event) {
                    try {
                        Bus::publish($event->type, json_decode($event->payload, true));
                        $event->update(['published_at' => now()]);
                    } catch (Throwable $e) {
                        Log::error('Outbox publish failed', [
                            'event_id' => $event->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });
    }
}

// Scheduler — runs every minute
// routes/console.php
Schedule::command('outbox:publish')->everyMinute();
```
---
## Exceptions
Systems requiring sub-second event delivery latency (e.g., real-time trading, gaming) may need CDC.
---
## Consequences Of Violation
Unnecessary infrastructure complexity for polling-suitable latency requirements; harder debugging; higher operational costs.
---

## Rule 4: Implement outbox cleanup
---
## Category
Maintainability | Performance
---
## Regularly archive or delete published outbox records to prevent table bloat. Never let the outbox table grow unbounded.
---
## Reason
Published outbox records are no longer needed but accumulate in the table. Over time, the outbox table grows, slowing queries, increasing storage costs, and degrading polling performance.
---
## Bad Example
```php
// No cleanup — outbox table grows forever
class PublishOutboxEvents extends Command
{
    public function handle(): void
    {
        Outbox::whereNull('published_at')->chunk(100, function ($events) {
            foreach ($events as $event) {
                // Publishes event but never cleans up published records
                Bus::publish($event->type, $event->payload);
                $event->update(['published_at' => now()]);
            }
        });
    }
}
```
---
## Good Example
```php
class PublishOutboxEvents extends Command
{
    public $signature = 'outbox:publish';

    public function handle(): void
    {
        Outbox::whereNull('published_at')
            ->orderBy('occurred_at')
            ->chunk(100, function ($events) {
                foreach ($events as $event) {
                    try {
                        Bus::publish($event->type, json_decode($event->payload, true));
                        $event->update(['published_at' => now()]);
                    } catch (Throwable $e) {
                        Log::error('Outbox publish failed', [
                            'event_id' => $event->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });
    }
}

class CleanOutbox extends Command
{
    public $signature = 'outbox:clean';
    public $description = 'Delete published outbox records older than retention period';

    public function handle(): void
    {
        $retentionDays = config('outbox.retention_days', 7);

        Outbox::whereNotNull('published_at')
            ->where('published_at', '<', now()->subDays($retentionDays))
            ->delete();

        $this->info("Cleaned outbox records older than {$retentionDays} days.");
    }
}

// Scheduler
Schedule::command('outbox:publish')->everyMinute();
Schedule::command('outbox:clean')->daily();
```
---
## Exceptions
If outbox records are also used for audit trails, archive them to a separate audit table instead of deleting.
---
## Consequences Of Violation
Outbox table grows to millions of records; chunky queries slow down; polling takes longer; storage costs increase; index maintenance overhead.
---

## Rule 5: Use `dispatchAfterCommit` for non-critical events instead of outbox
---
## Category
Architecture | Maintainability
---
## Use Laravel's built-in `dispatchAfterCommit` for non-critical events where temporary loss is acceptable. Reserve the outbox pattern for events where delivery guarantees are critical.
---
## Reason
The outbox pattern requires a publisher, cleanup job, and idempotent consumers — significant infrastructure. `dispatchAfterCommit` is a single method call and sufficient for logging, analytics, and non-critical notifications.
---
## Bad Example
```php
// Outbox for analytics events — over-engineered
DB::transaction(function () {
    $pageView = PageView::create(/* ... */);
    Outbox::insert([
        'type' => 'PageViewed',
        'payload' => json_encode(['pageId' => $pageView->id]),
    ]);
});

// Separate publisher, cleanup job, and idempotency for analytics data
// that could tolerate occasional loss
```
---
## Good Example
```php
// Simple dispatchAfterCommit for non-critical events
class PageViewController
{
    public function show(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->firstOrFail();

        PageViewed::dispatchAfterCommit($page->id);
        // If this event is lost, it's acceptable — analytics can tolerate

        return response()->json($page);
    }
}

// Outbox pattern reserved for critical events
DB::transaction(function () {
    $invoice = Invoice::create(/* ... */);
    Outbox::insert([
        'id' => Str::uuid()->toString(),
        'type' => 'InvoiceGenerated',
        'payload' => json_encode(['invoiceId' => $invoice->id]),
        'occurred_at' => now(),
    ]);
});
// Invoice events — must-not-lose, critical for business operations
```
---
## Exceptions
If the infrastructure is already in place, you may use the outbox for all events for consistency.
---
## Consequences Of Violation
Unnecessary complexity for non-critical events; more infrastructure to maintain; higher latency for events that don't need the reliability guarantee.
---
