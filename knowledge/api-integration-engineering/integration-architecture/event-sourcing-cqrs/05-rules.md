## Use Event Sourcing Only for Critical Webhook Delivery Paths
---
## Category
Architecture
---
## Rule
Apply event sourcing (Spatie laravel-event-sourcing) only for critical webhook delivery requiring audit and replay; use simpler logging for non-critical paths.
---
## Reason
Event sourcing adds significant complexity (event store, projectors, reactors, replay); applying it to every webhook is over-engineering.
---
## Bad Example
```php
// Event sourcing for every webhook including analytics — wasted overhead
```
---
## Good Example
```php
$method = $webhook->isCritical() ? 'eventSource' : 'simpleLog';
$this->$method($webhook);
```
---
## Exceptions
Compliance requirements mandating full event sourcing for all delivery paths.
---
## Consequences Of Violation
Unnecessary complexity for simple webhooks, higher maintenance burden, slower development velocity on non-critical paths.
## Record Delivery Attempt Before HTTP Call
---
## Category
Reliability
---
## Rule
Record the delivery attempt event in the event store BEFORE making the HTTP call; update the event with response after.
---
## Reason
If the HTTP call fails or the process crashes, the attempt is still recorded; lost events cannot be replayed.
---
## Bad Example
```php
Http::post($endpoint, $payload); // no attempt recorded — lost on failure
WebhookDeliveryAttempted::create([...]); // recorded after — never reached on crash
```
---
## Good Example
```php
$attempt = WebhookDeliveryAttempted::create([...]); // recorded first
$response = Http::post($endpoint, $payload); // then HTTP call
$attempt->update(['status' => 'success', 'response' => $response->body()]);
```
---
## Exceptions
None — always record before HTTP call.
---
## Consequences Of Violation
Lost delivery events on process crash, incomplete audit trail, inability to replay failed deliveries.
## Use Projectors for Read Models, Not Direct Event Store Queries
---
## Category
Architecture
---
## Rule
Query delivery status from projector-maintained read models; never query the event store directly.
---
## Reason
Direct event store queries are slow (O(n) over all events) and complex; projectors maintain optimized read models with current delivery status.
---
## Bad Example
```php
$events = StoredEvent::where('aggregate_uuid', $uuid)->get(); // slow — reads all events
```
---
## Good Example
```php
$status = WebhookDeliveryStatus::find($uuid); // projector-maintained — fast
```
---
## Exceptions
Temporal queries requiring event history (use dedicated query service).
---
## Consequences Of Violation
Slow queries, high database load, complex query logic, poor performance at scale.
## Version Events from Day One
---
## Category
Maintainability
---
## Rule
Include a version number in every event class; never modify existing events after they are stored.
---
## Reason
Unversioned events cannot evolve; modifying stored events breaks replay for projectors that depend on the original format.
---
## Bad Example
```php
class WebhookDelivered { /* no version — cannot evolve */ }
```
---
## Good Example
```php
class WebhookDeliveredV1 { public int $version = 1; }
class WebhookDeliveredV2 extends WebhookDeliveredV1 { public array $metadata; }
```
---
## Exceptions
None — always version events from day one.
---
## Consequences Of Violation
Event replay breaks on schema changes, inability to evolve event structure, projector failures during replay.
## Test Replay Regularly
---
## Category
Testing
---
## Rule
Run event replay tests in CI to verify projectors can rebuild read models from scratch.
---
## Reason
Without regular replay testing, projectors silently diverge from event schemas; replay will fail when actually needed during disaster recovery.
---
## Bad Example
```php
// No replay test — projectors may be broken
```
---
## Good Example
```php
public function test_replay_rebuilds_projections()
{
    $this->seedEvents(100);
    Projector::rebuild();
    $this->assertCount(100, WebhookDeliveryStatus::all());
}
```
---
## Exceptions
None — always test replay capability regularly.
---
## Consequences Of Violation
Replay fails during disaster recovery, unable to rebuild read models, extended outage during recovery.
## Keep Reactors Asynchronous
---
## Category
Performance
---
## Rule
Dispatch reactor side effects to a queue; never execute reactors synchronously in the event processing pipeline.
---
## Reason
Synchronous reactors block event processing; if a reactor fails (e.g., notification service down), event processing is delayed for all subsequent events.
---
## Bad Example
```php
class NotifyReactor implements Reactor {
    public function onWebhookDelivered(WebhookDelivered $event) {
        Mail::send(...); // synchronous — blocks event processing
    }
}
```
---
## Good Example
```php
class NotifyReactor implements Reactor {
    public function onWebhookDelivered(WebhookDelivered $event) {
        SendDeliveryNotification::dispatch($event); // async — doesn't block
    }
}
```
---
## Exceptions
Reactors that must execute within the same transaction.
---
## Consequences Of Violation
Slow event processing, reactor failures block subsequent events, event processing pipeline degradation.
