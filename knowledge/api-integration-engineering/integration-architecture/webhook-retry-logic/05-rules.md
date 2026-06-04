## Record Retry Attempt Events Before HTTP Call
---
## Category
Reliability
---
## Rule
Write the retry attempt event to the event store before executing the HTTP call; update with result after.
---
## Reason
If the process crashes during the HTTP call, the attempt is already recorded, preserving the retry history for audit and recovery.
---
## Bad Example
```php
$response = Http::post($endpoint, $data); // attempt not recorded — lost on crash
Event::record(WebhookDeliveryAttempted::class, ['result' => $response->status()]);
```
---
## Good Example
```php
$attempt = Event::record(WebhookDeliveryAttempted::class, ['status' => 'pending']); // pre-record
$response = Http::post($endpoint, $data);
$attempt->update(['status' => $response->successful() ? 'success' : 'failed']);
```
---
## Exceptions
None — always record before HTTP call.
---
## Consequences Of Violation
Lost retry history on process crash, incomplete audit trail, inability to analyze retry effectiveness.
## Include Full Context in Retry Events
---
## Category
Observability
---
## Rule
Record attempt number, scheduled delay, actual delay, response status, and error details in every retry event.
---
## Reason
Full context enables retry effectiveness analysis, delay pattern optimization, and debugging of delivery issues.
---
## Bad Example
```php
// Minimal event — insufficient for analysis
Event::record(WebhookDeliveryAttempted::class);
```
---
## Good Example
```php
Event::record(WebhookDeliveryAttempted::class, [
    'attempt' => 3,
    'scheduled_delay' => 5000,
    'actual_delay' => 5200,
    'response_status' => 503,
    'error' => 'Service Unavailable',
    'subscriber_id' => $subscriber->id,
    'backoff_strategy' => 'exponential_with_jitter',
]);
```
---
## Exceptions
Low-volume webhooks where minimal event detail suffices.
---
## Consequences Of Violation
Inability to analyze retry patterns, difficulty debugging delivery failures, no data for backoff optimization.
## Use Projectors for Retry Effectiveness Dashboards
---
## Category
Observability
---
## Rule
Build projectors that compute retry effectiveness metrics (success rate per attempt, average delay, total retry duration) from retry events.
---
## Reason
Raw retry events are hard to query for aggregate metrics; projectors maintain ready-to-query read models for dashboards.
---
## Bad Example
```php
// Querying raw events for metrics — slow and complex
$events = StoredEvent::whereType(WebhookDeliveryAttempted::class)->get();
```
---
## Good Example
```php
class RetryEffectivenessProjector extends Projector {
    public function onWebhookDeliveryAttempted(WebhookDeliveryAttempted $event): void {
        RetryMetrics::updateOrCreate(
            ['subscriber_id' => $event->subscriber_id],
            ['total_attempts' => DB::raw('total_attempts + 1'), 'success_rate' => ...]
        );
    }
}
```
---
## Exceptions
Simple setups where direct queries are fast enough.
---
## Consequences Of Violation
Slow metrics queries, difficulty monitoring retry effectiveness, no visibility into retry optimization opportunities.
## React on Final Failure with Alternative Delivery
---
## Category
Reliability
---
## Rule
When retries are exhausted, fire a reactor that triggers alternative delivery (SMS, email, manual queue) instead of silently dropping.
---
## Reason
Exhausted retries mean the primary delivery channel has permanently failed; alternative delivery ensures the event is not lost.
---
## Bad Example
```php
// Exhausted retries — event silently dropped
```
---
## Good Example
```php
Event::listen(WebhookRetriesExhausted::class, function ($event) {
    Alert::critical("Webhook delivery failed after all retries: {$event->webhook->id}");
    SendFallbackNotification::dispatch($event->webhook)->onQueue('high');
});
```
---
## Exceptions
Non-critical webhooks where silent failure is acceptable.
---
## Consequences Of Violation
Critical events lost after retry exhaustion, no fallback notification, business impact from missed deliveries.
## Analyze Backoff Strategy per Provider
---
## Category
Performance
---
## Rule
Track retry delay patterns per provider dashboard to optimize backoff configurations.
---
## Reason
Different providers have different optimal backoff patterns; analyzing retry data reveals whether delays are too short (causing 429s) or too long (delaying recovery).
---
## Bad Example
```php
// Same backoff for all providers — suboptimal for each
```
---
## Good Example
```php
// From retry event analysis:
// Stripe: responses slower at peak hours → longer initial backoff
// Mailgun: fast recovery → shorter backoff
$backoff = match ($provider) {
    'stripe' => [5000, 15000, 60000],  // longer delays
    'mailgun' => [1000, 5000, 15000],  // shorter delays
};
```
---
## Exceptions
Providers with similar optimal backoff patterns.
---
## Consequences Of Violation
Suboptimal retry delays, excessive retries causing 429s on some providers, unnecessarily long recovery on others.
