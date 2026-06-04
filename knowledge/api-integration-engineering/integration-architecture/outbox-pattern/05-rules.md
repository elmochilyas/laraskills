## Create Outbox Record in Same Transaction as Business Operation
---
## Category
Reliability
---
## Rule
Insert the outbox webhook record within the same database transaction as the triggering business operation; never commit one without the other.
---
## Reason
Transactional outbox guarantees that either both the business operation and the webhook are committed, or neither is. Without this, a business operation may succeed but the webhook dispatch is lost.
---
## Bad Example
```php
$order = Order::create($data); // committed
Webhook::dispatch('order.created', $order); // may fail — order created but webhook lost
```
---
## Good Example
```php
DB::transaction(function () {
    $order = Order::create($data);
    Outbox::create(['event' => 'order.created', 'payload' => $order->toArray()]);
    // Both committed together or neither committed
});
```
---
## Exceptions
Non-critical notifications where occasional loss is acceptable.
---
## Consequences Of Violation
Webhooks lost on process crash between business commit and dispatch, subscriber systems out of sync, silent data inconsistency.
## Use Dedicated Outbox Table
---
## Category
Code Organization
---
## Rule
Store outbox records in a dedicated `webhook_outbox` table; never piggyback on business tables or use a shared events table.
---
## Reason
A dedicated table allows independent indexing, relay processing, and cleanup without coupling to business data.
---
## Bad Example
```php
// Piggybacking on business table — couples webhook relay to business schema
```
---
## Good Example
```php
Schema::create('webhook_outbox', function ($table) {
    $table->id();
    $table->string('event_type');
    $table->json('payload');
    $table->string('status')->default('pending');
    $table->unsignedTinyInteger('attempts')->default(0);
    $table->timestamp('scheduled_at')->nullable();
    $table->timestamps();
    $table->index(['status', 'scheduled_at']);
});
```
---
## Exceptions
None — always use a dedicated outbox table.
---
## Consequences Of Violation
Schema coupling, difficult indexing for relay queries, business table bloat from outbox records.
## Implement Idempotency on Outbox Records
---
## Category
Reliability
---
## Rule
Use a unique constraint on outbox records to prevent duplicate relay processing.
---
## Reason
If a relay crashes after processing but before marking the record as delivered, the next relay pass may re-process the record, causing duplicate webhook delivery.
---
## Bad Example
```php
// No idempotency — relay may send duplicate webhooks on crash
```
---
## Good Example
```php
// Unique constraint on event_id prevents duplicate inserts
try {
    Outbox::create(['id' => $eventId, 'event' => 'order.created', 'payload' => $data]);
} catch (UniqueConstraintViolationException $e) {
    // Duplicate — safe to skip
}
```
---
## Exceptions
Exactly-once delivery guaranteed by downstream subscriber idempotency.
---
## Consequences Of Violation
Duplicate webhook delivery, subscriber receives same event multiple times, duplicate side effects.
## Batch Process Outbox Records
---
## Category
Performance
---
## Rule
Relay outbox records in batches (100 per cycle) instead of processing one at a time.
---
## Reason
Batch processing increases throughput and reduces database query overhead for high-volume webhook delivery.
---
## Bad Example
```php
// Single record per cycle — high DB query overhead
$record = Outbox::where('status', 'pending')->first();
```
---
## Good Example
```php
$records = Outbox::where('status', 'pending')
    ->where('scheduled_at', '<=', now())
    ->limit(100)
    ->get();
foreach ($records as $record) {
    $this->dispatch($record);
}
```
---
## Exceptions
Low-volume systems where batch processing adds unnecessary complexity.
---
## Consequences Of Violation
Low throughput on high-volume outbox, DB query overhead per record, webhook delivery backlog.
## Process Outbox via Queue or Scheduler
---
## Category
Architecture
---
## Rule
Use a scheduled Artisan command or queue worker to process outbox records; never process synchronously in the HTTP request.
---
## Reason
Synchronous outbox processing adds delivery latency to the HTTP response and risks timeout on slow endpoints.
---
## Bad Example
```php
DB::transaction(function () {
    $order = Order::create($data);
    Outbox::create([...]);
});
$this->processOutbox(); // synchronous — delays HTTP response
```
---
## Good Example
```php
DB::transaction(function () {
    $order = Order::create($data);
    Outbox::create([...]);
});
// Outbox processed by: php artisan webhooks:relay (scheduler)
// Or queue: ProcessOutbox::dispatch()
```
---
## Exceptions
Critical webhooks requiring immediate delivery.
---
## Consequences Of Violation
Slow HTTP responses, timeout risks, HTTP request blocked on webhook delivery, poor user experience.
## Archive Processed Outbox Records
---
## Category
Maintainability
---
## Rule
Archive or delete outbox records after successful delivery; implement TTL-based cleanup.
---
## Reason
Without cleanup, the outbox table grows unbounded, degrading query performance for the relay.
---
## Bad Example
```php
// No cleanup — outbox table grows forever
```
---
## Good Example
```php
$schedule->call(function () {
    Outbox::where('status', 'delivered')
        ->where('updated_at', '<', now()->subDays(7))
        ->delete();
})->daily();
```
---
## Exceptions
Compliance requirements mandating longer outbox retention.
---
## Consequences Of Violation
Table bloat, slow relay queries, increased storage costs, degraded webhook delivery performance.
