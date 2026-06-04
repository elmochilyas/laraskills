## Use Provider Webhook ID + Provider Name as Unique Constraint
---
## Category
Reliability
---
## Rule
Create a unique constraint on `(provider, webhook_id)` in the inbox table; never use `webhook_id` alone.
---
## Reason
Different providers may use colliding webhook ID formats; combining with provider name ensures global uniqueness.
---
## Bad Example
```php
SQL: UNIQUE(webhook_id) // collision possible between providers
```
---
## Good Example
```php
Schema::create('webhook_inbox', function ($table) {
    $table->id();
    $table->string('provider');
    $table->string('webhook_id');
    $table->json('payload');
    $table->string('status')->default('pending');
    $table->unique(['provider', 'webhook_id']); // provider-scoped uniqueness
});
```
---
## Exceptions
Single-provider systems where collision is impossible.
---
## Consequences Of Violation
Legitimate webhooks from different providers rejected as duplicates, event loss, data inconsistency.
## Create Inbox Record Before Dispatching Job
---
## Category
Reliability
---
## Rule
Insert the inbox record in the HTTP receiving endpoint before dispatching the processing job; never dispatch without first storing.
---
## Reason
If the queue is backed up or the job fails, the inbox record preserves the payload for later processing. Dispatching without storing loses the event on job failure.
---
## Bad Example
```php
ProcessWebhook::dispatch($data); // no inbox record — lost on job failure
```
---
## Good Example
```php
$inbox = WebhookInbox::create([
    'provider' => 'stripe',
    'webhook_id' => $request->header('webhook-id'),
    'payload' => $request->getContent(),
    'status' => 'pending',
]);
ProcessWebhook::dispatch($inbox);
```
---
## Exceptions
Non-critical webhooks where loss is acceptable.
---
## Consequences Of Violation
Permanent event loss on job failure, no reprocessing capability, data gaps.
## Process Inbox Records in FIFO Order Per Provider
---
## Category
Reliability
---
## Rule
Process inbox records in creation order per provider to maintain event ordering.
---
## Reason
Out-of-order processing of events for the same provider can cause data inconsistency (processing a "refund" before the "charge" it references).
---
## Bad Example
```php
$records = WebhookInbox::where('status', 'pending')->orderBy('id')->get(); // mixed providers
```
---
## Good Example
```php
$records = WebhookInbox::where('status', 'pending')
    ->where('provider', $provider)
    ->orderBy('id')
    ->limit(50)
    ->get(); // FIFO per provider
```
---
## Exceptions
Providers delivering idempotent events where order doesn't matter.
---
## Consequences Of Violation
Out-of-order processing, data inconsistency, "refund before charge" errors, processing failures.
## Monitor Stuck Unprocessed Records
---
## Category
Observability
---
## Rule
Alert on inbox records stuck in `pending` status for longer than the expected processing window (5-15 minutes).
---
## Reason
Stuck records indicate queue worker issues, processing bugs, or dead jobs that require operator intervention.
---
## Bad Example
```php
// No monitoring — stuck records invisible until customer complains
```
---
## Good Example
```php
$stuck = WebhookInbox::where('status', 'pending')
    ->where('created_at', '<', now()->subMinutes(15))
    ->count();
if ($stuck > 10) {
    Alert::warning("{$stuck} stuck inbox records for stripe");
}
```
---
## Exceptions
None — always monitor for stuck records.
---
## Consequences Of Violation
Silent processing failures, delayed event handling, customer-facing delays in processing.
## Implement Dead Letter Queue After Max Retries
---
## Category
Reliability
---
## Rule
Move inbox records to a dead letter state after exhausting processing retries for manual review.
---
## Reason
Some webhooks will permanently fail (invalid payload, business logic errors); moving them to dead letter prevents infinite retry loops and enables operator review.
---
## Bad Example
```php
// Infinite retries — clogs queue with permanently failing records
```
---
## Good Example
```php
class ProcessWebhook implements ShouldQueue {
    public int $maxAttempts = 5;
    public function failed(\Throwable $e, WebhookInbox $inbox): void {
        $inbox->update(['status' => 'dead_letter', 'error' => $e->getMessage()]);
        Log::error('Webhook processing exhausted', ['inbox_id' => $inbox->id]);
    }
}
```
---
## Exceptions
None — always implement dead letter handling.
---
## Consequences Of Violation
Infinite retry loops, queue clogged with failing jobs, no operator visibility into permanently failing records.
## Clean Up Processed Records on Schedule
---
## Category
Maintainability
---
## Rule
Delete processed inbox records after a defined retention period (30-90 days).
---
## Reason
Without cleanup, the inbox table grows unbounded, degrading insert and query performance.
---
## Bad Example
```php
// No cleanup — inbox table grows forever
```
---
## Good Example
```php
$schedule->call(function () {
    WebhookInbox::where('status', 'processed')
        ->where('updated_at', '<', now()->subDays(90))
        ->delete();
})->daily();
```
---
## Exceptions
Compliance requirements mandating longer retention.
---
## Consequences Of Violation
Table bloat, slow inserts on new webhooks, degraded query performance, increased storage costs.
