## Record Receipt Event Before Processing
---
## Category
Reliability
---
## Rule
Record the `WebhookReceived` event in the event store before any validation or processing begins.
---
## Reason
Pre-recording guarantees the webhook receipt is captured even if processing crashes; an unrecorded webhook is irrecoverable.
---
## Bad Example
```php
public function handle(Request $request) {
    $this->process($request); // process first — lost on crash
    Event::record(new WebhookReceived($request));
}
```
---
## Good Example
```php
public function handle(Request $request) {
    $event = Event::record(new WebhookReceived($request->getContent(), $request->header())); // pre-record
    $this->process($event);
}
```
---
## Exceptions
Non-critical webhooks where loss is acceptable.
---
## Consequences Of Violation
Webhook receipt lost on process crash, incomplete audit trail, inability to reprocess missed webhooks.
## Store Raw Payload in Event, Never Modify
---
## Category
Reliability
---
## Rule
Store the unmodified raw request body and headers in the receipt event; never parse, transform, or re-encode.
---
## Reason
The raw payload is the source of truth for signature verification and reprocessing; any transformation breaks verifiability.
---
## Bad Example
```php
Event::record(new WebhookReceived(['data' => $request->input('data')])); // parsed — not raw
```
---
## Good Example
```php
Event::record(new WebhookReceived(
    body: $request->getContent(), // raw JSON string
    headers: $request->headers->all()
));
```
---
## Exceptions
None — always store raw payload.
---
## Consequences Of Violation
Signature verification fails on reprocessing, original evidence lost, audit trail integrity compromised.
## Use Projectors for Read Models, Not Event Store
---
## Category
Architecture
---
## Rule
Maintain delivery status views through projectors; never query the event store directly for current state.
---
## Reason
Direct event store queries are slow (O(n)) and complex; projectors maintain optimized read models.
---
## Bad Example
```php
$events = StoredEvent::whereAggregateUuid($uuid)->get(); // slow — iterates all events
```
---
## Good Example
```php
$status = WebhookStatus::find($uuid); // projector-maintained — fast lookup
```
---
## Exceptions
Temporal queries requiring full event history.
---
## Consequences Of Violation
Slow query performance on event store, complex query logic, poor scalability.
## Keep Reactors Asynchronous
---
## Category
Performance
---
## Rule
Dispatch reactor side effects to a queue; never execute reactors synchronously in the event processing pipeline.
---
## Reason
Synchronous reactors block event processing; a slow or failing reactor delays processing of subsequent events.
---
## Bad Example
```php
class SendNotificationReactor {
    public function onWebhookReceived(WebhookReceived $event) {
        Mail::send(...); // synchronous — blocks event pipeline
    }
}
```
---
## Good Example
```php
class SendNotificationReactor {
    public function onWebhookReceived(WebhookReceived $event) {
        SendWebhookNotification::dispatch($event); // queued — non-blocking
    }
}
```
---
## Exceptions
Reactors that must execute within the same transaction as the projection.
---
## Consequences Of Violation
Slow event processing, reactor failures block subsequent events, event processing pipeline degradation.
## Version Events from Day One
---
## Category
Maintainability
---
## Rule
Include a version number in every event class; never modify stored events.
---
## Reason
Unversioned events cannot evolve; modifying stored events breaks replay for projectors depending on the original format.
---
## Bad Example
```php
class WebhookReceived { /* no version — cannot add fields */ }
```
---
## Good Example
```php
class WebhookReceivedV1 { public int $version = 1; }
class WebhookReceivedV2 extends WebhookReceivedV1 { public array $metadata; }
```
---
## Exceptions
None — always version events from day one.
---
## Consequences Of Violation
Event replay breaks on schema changes, inability to evolve event structure, projector failures during recovery.
## Test Replay Capability Regularly
---
## Category
Testing
---
## Rule
Write tests that replay events through all projectors and verify correct state is rebuilt.
---
## Reason
Only regular replay testing catches projector bugs (diverged schemas, missing handlers) before disaster recovery requires replay.
---
## Bad Example
```php
// No replay test — projectors silently diverge from event schemas
```
---
## Good Example
```php
public function test_replay_rebuilds_delivery_status()
{
    WebhookReceived::seed(50);
    WebhookProcessingFailed::seed(10);
    Projector::rebuild();
    $this->assertEquals(40, WebhookStatus::where('status', 'completed')->count());
}
```
---
## Exceptions
None — always test replay capability.
---
## Consequences Of Violation
Replay fails during disaster recovery, unable to rebuild read models, extended outage during recovery.
