## Rule 1: Always write events to the outbox in the same database transaction as the aggregate change
---
## Category
Reliability
---
## Rule
Insert the outbox record in the same database transaction as the domain state change; never write the domain change and publish the event in separate transactions.
---
## Reason
Separate transactions create a window where the domain change is committed but the event is not published, losing the event forever.
---
## Bad Example
```php
DB::transaction(fn () => {
    $order->save();
}); // committed
$this->bus->publish(new OrderPlaced(...)); // if this fails, event lost
```
---
## Good Example
```php
DB::transaction(fn () => {
    $order->save();
    OutboxMessage::create([
        'id' => Str::uuid(),
        'type' => 'OrderPlaced',
        'payload' => json_encode($event->toArray()),
        'occurred_at' => now(),
    ]);
}); // both succeed or both fail
```
---
## Exceptions
When the event publish is inside the same resource manager (XA transaction), which is rare and complex.
---
## Consequences Of Violation
Lost events, silent data inconsistency, missing notifications.
---
## Rule 2: Do not send events synchronously—pick up from outbox with a separate publisher
---
## Category
Reliability
---
## Rule
Have a separate process (CLI command, worker, scheduled task) that queries the outbox and publishes pending events. Never publish directly in the web request.
---
## Reason
Synchronous publishing in the request path adds latency, couples availability (broker down = request fails), and defeats the outbox's purpose.
---
## Bad Example
```php
DB::transaction(fn () => {
    $order->save();
    $this->outbox->add($event);
});
$this->outbox->publishNow(); // synchronous publish in request
```
---
## Good Example
```php
// Request handler — only writes to outbox
DB::transaction(fn () => {
    $order->save();
    $this->outbox->add($event);
});
return response()->json(status: 202);

// CLI command — publishes asynchronously
class OutboxWorker
{
    public function handle(): void
    {
        $messages = OutboxMessage::whereNull('published_at')
            ->orderBy('occurred_at')
            ->limit(100)
            ->get();

        foreach ($messages as $message) {
            $this->publisher->publish($message->type, $message->payload);
            $message->update(['published_at' => now()]);
        }
    }
}
```
---
## Exceptions
When using a message broker that supports transactions (e.g., Kafka transactional producer) within a CLI context.
---
## Consequences Of Violation
Request latency, broker downtime blocks writes, outbox not fully utilized.
---
## Rule 3: Process outbox messages in order within the same aggregate stream
---
## Category
Reliability
---
## Rule
Order by `occurred_at` within the same aggregate ID; avoid strict global ordering across aggregates (it's not needed and limits throughput).
---
## Reason
Events for the same aggregate must be published in the order they occurred to maintain consistency; cross-aggregate ordering is unnecessary.
---
## Bad Example
```
Order aggregate events published out of order:
1. OrderShipped (published first)
2. OrderPlaced (published second)
Read model sees Shipped before Placed → inconsistent.
```
---
## Good Example
```
Within aggregate "order-123": OrderPlaced → OrderConfirmed → OrderShipped (preserved order)
Cross-aggregate: no ordering guarantees needed.
```
---
## Exceptions
When the event order across aggregates matters (rare — indicates a design issue).
---
## Consequences Of Violation
Read model inconsistencies, transient projection errors.
---
## Rule 4: Implement idempotent outbox processing—at-least-once delivery with dedup
---
## Category
Reliability
---
## Rule
Track published events by their unique ID in the outbox; on retry, skip already-published events to prevent duplicates.
---
## Reason
Outbox workers can crash or restart, re-processing already-published events; idempotency prevents duplicate messages.
---
## Bad Example
```php
// Worker restarts, re-publishes the same event
```
---
## Good Example
```php
class OutboxWorker
{
    public function handle(): void
    {
        OutboxMessage::whereNull('published_at')
            ->lockForUpdate()
            ->chunk(100, function ($messages) {
                foreach ($messages as $message) {
                    try {
                        $this->publisher->publish($message->type, $message->payload);
                        $message->update(['published_at' => now()]);
                    } catch (\Exception $e) {
                        Log::error("Failed to publish outbox message {$message->id}");
                        // Will be retried on next run
                    }
                }
            });
    }
}
```
---
## Exceptions
When the broker supports exactly-once delivery (very rare).
---
## Consequences Of Violation
Duplicate events, double processing, state corruption.
---
## Rule 5: Monitor outbox backlog and alert on growing delays
---
## Category
Reliability
---
## Rule
Alert when outbox messages remain unpublished for more than a threshold (e.g., 5 minutes). Track outbox table size and growth rate.
---
## Reason
A growing outbox backlog indicates the publisher is falling behind; without monitoring, events may be delayed by hours unnoticed.
---
## Bad Example
```
"Orders are placed but shipping isn't notified for 30 minutes."
No alert. "Just now noticed the delay."
```
---
## Good Example
```
Alert: Outbox backlog > 100 messages for > 5 minutes.
Dashboard: Outbox size, publish latency, error rate per outbox.
Response: Investigate publisher worker (busy, crashed, broker down).
```
---
## Exceptions
Low-volume systems (< 100 events/day) where backlog is naturally zero.
---
## Consequences Of Violation
Prolonged event delays, user-facing staleness, missed business SLAs.
