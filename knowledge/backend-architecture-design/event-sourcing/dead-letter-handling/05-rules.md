## Rule 1: Every event consumer must route unprocessable events to a dead letter queue
---
## Category
Reliability
---
## Rule
When an event handler fails after retries (or cannot handle the event at all), move the event to a dead letter queue (DLQ) instead of silently dropping or infinitely retrying.
---
## Reason
Events are the source of truth in event-driven systems; dropping them permanently loses information. DLQs preserve the event for investigation and replay.
---
## Bad Example
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        try {
            // process
        } catch (\Exception $e) {
            Log::error('Failed to process event: ' . $event->orderId);
            // silently fails — event lost
        }
    }
}
```
---
## Good Example
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        try {
            // process
        } catch (\Exception $e) {
            $this->deadLetterQueue->publish(
                new DeadLetterEvent(
                    originalEvent: $event,
                    reason: $e->getMessage(),
                    occurredAt: now(),
                    consumer: self::class
                )
            );
        }
    }
}
```
---
## Exceptions
When the failure is transient and the event handler has built-in retry with backoff (but route to DLQ after max retries).
---
## Consequences Of Violation
Permanent data loss, missing read model updates, silent bugs.
---
## Rule 2: Implement automated alerts and a recovery dashboard for DLQ events
---
## Category
Reliability
---
## Rule
Monitor DLQ depth; alert when events are in the DLQ for more than a threshold (e.g., 1 hour). Provide a UI or command to inspect, replay, or discard DLQ events.
---
## Reason
DLQs that are not monitored are dead letter graveyards—events sit forever, unnoticed, and the system is silently inconsistent.
---
## Bad Example
```
DLQ has 1,000 events from 3 weeks ago. No one checks. "Oh, those? We just ignore them."
```
---
## Good Example
```
Alert: "DLQ depth > 10 for more than 1 hour" → on-call investigates.
Dashboard: shows each DLQ event with payload, error, timestamp.
Actions: Replay, Skip, Inspect payload, Download batch.
```
---
## Exceptions
Non-critical events where eventual correctness is acceptable within a longer window.
---
## Consequences Of Violation
Silent data loss, undetected inconsistencies, trust erosion in event system.
---
## Rule 3: Include all metadata needed for diagnosis in the dead letter event
---
## Category
Reliability
---
## Rule
The DLQ entry must contain: original event payload, event ID, consumer class name, error message with stack trace, timestamp, and retry count.
---
## Reason
Without metadata, diagnosing the root cause of the failure is impossible—developers must guess or reproduce the scenario.
---
## Bad Example
```json
{
  "event": {"orderId": 123},
  "error": "Something went wrong"
}
```
---
## Good Example
```json
{
  "event_id": "evt_abc123",
  "original_payload": {"orderId": 123, "items": [...], "total": 99.99},
  "consumer": "App\\Projectors\\OrderProjector",
  "error": "Call to a member function getItems() on null",
  "stack_trace": "#0 ...",
  "occurred_at": "2026-03-15T10:30:00Z",
  "retry_count": 3
}
```
---
## Exceptions
When the payload contains PII that must be redacted in the DLQ.
---
## Consequences Of Violation
Impossible to diagnose failures, prolonged outage.
---
## Rule 4: Replay DLQ events in order after the root cause is fixed
---
## Category
Reliability
---
## Rule
After fixing the bug that caused events to be dead-lettered, replay the DLQ events in their original order to restore consistency.
---
## Reason
Replaying out of order can cause state inconsistencies (e.g., OrderCancelled replayed before OrderPlaced).
---
## Bad Example
```
Fix deployed. 50 DLQ events replayed in random order.
State: items released before reserved, notifications sent in wrong order.
```
---
## Good Example
```
Fix deployed. DLQ events replayed in chronological order.
OrderPlaced first, then OrderShipped, then OrderCompleted.
State consistent.
```
---
## Exceptions
When the events are commutative (order doesn't matter) and reordering is safe.
---
## Consequences Of Violation
State corruption after replay.
---
## Rule 5: Distinguish between transient failures (retry) and permanent failures (DLQ)
---
## Category
Reliability
---
## Rule
Retry transient failures (network timeout, database deadlock) with exponential backoff; route permanent failures (invalid data, schema mismatch) directly to DLQ.
---
## Reason
Retrying permanent failures wastes compute and delays processing of subsequent valid events; routing transient failures to DLQ prematurely creates unnecessary manual work.
---
## Bad Example
```php
// Retry everything 3 times, then DLQ
try {
    $this->process($event);
} catch (\Exception $e) {
    if ($retries < 3) {
        $this->retryLater($event);
    } else {
        $this->dlq($event); // Schema mismatch retried 3 times unnecessarily
    }
}
```
---
## Good Example
```php
try {
    $this->process($event);
} catch (NetworkTimeoutException $e) {
    $this->retryWithBackoff($event); // transient → retry
} catch (InvalidDataException $e) {
    $this->dlq($event); // permanent → DLQ immediately
}
```
---
## Exceptions
When classifying the exception type is not feasible (legacy code); use retry budget as a safety net.
---
## Consequences Of Violation
Wasted retries for permanent failures, manual triage for transient failures.
