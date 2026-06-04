## Use Jitter-Based Exponential Backoff as Default
---
## Category
Reliability
---
## Rule
Always add jitter (±25%) to exponential backoff delays; never use pure exponential backoff in production.
---
## Reason
Pure exponential backoff causes thundering herd — when a service recovers, all retrying requests hit simultaneously.
---
## Bad Example
```php
class DefaultBackoff implements BackoffStrategy {
    public function wait(int $attempt): int { return pow(2, $attempt); } // no jitter
}
```
---
## Good Example
```php
class JitterBackoff implements BackoffStrategy {
    public function wait(int $attempt): int {
        $seconds = min(3600, pow(2, $attempt));
        return (int) ceil($seconds * (0.75 + mt_rand(0, 5000) / 10000)); // ±25%
    }
}
```
---
## Exceptions
Subscribers that explicitly request fixed-interval retries.
---
## Consequences Of Violation
Synchronized retry storms on service recovery, overwhelmed downstream, prolonged outage.
## Set Max Attempts Based on Business Criticality
---
## Category
Architecture
---
## Rule
Configure `max_attempts` per webhook type based on business requirements: 10-15 for critical, 3-5 for non-critical.
---
## Reason
Too few attempts cause premature failure for transient issues; too many exhaust resources for non-critical events.
---
## Bad Example
```php
WebhookCall::create()->url($url)->payload($data)->dispatch(); // defaults may not match needs
```
---
## Good Example
```php
// Critical payment webhook
WebhookCall::create()->url($url)->payload($data)->useBackoffStrategy(new CriticalBackoff(maxAttempts: 15));
// Non-critical notification
WebhookCall::create()->url($url)->payload($data)->useBackoffStrategy(new StandardBackoff(maxAttempts: 5));
```
---
## Exceptions
None — always configure explicitly.
---
## Consequences Of Violation
Critical webhooks fail prematurely or non-critical webhooks waste resources on excessive retries.
## Customize Backoff Per Event Type
---
## Category
Architecture
---
## Rule
Implement different backoff strategies for different event types; never use a single strategy for all events.
---
## Reason
Payment events need aggressive retry within minutes; notification events can tolerate hours-long delays.
---
## Bad Example
```php
// Single backoff for all webhook types
config(['webhook-server.backoff_strategy' => ExponentialBackoff::class]);
```
---
## Good Example
```php
$webhookCall->useBackoffStrategy(match ($event->type) {
    'payment.failed' => new AggressiveBackoff(),  // retry every 30s, max 20 attempts
    'user.updated' => new RelaxedBackoff(),       // retry every 5min, max 5 attempts
    default => new StandardBackoff(),
});
```
---
## Exceptions
Single-purpose webhook systems sending one event type.
---
## Consequences Of Violation
Uniform retry behavior doesn't match diverse event criticality, causing either premature failure or resource waste.
## Monitor Retry Rates and Final Failures
---
## Category
Observability
---
## Rule
Track retry attempt rates and final failure events as key delivery metrics; alert on abnormal patterns.
---
## Reason
Rising retry rates indicate subscriber degradation; final failures indicate permanent delivery issues requiring intervention.
---
## Bad Example
```php
// No monitoring — retry storms and failures go undetected
```
---
## Good Example
```php
Event::listen(WebhookCallFailedEvent::class, function ($event) {
    Metrics::increment('webhook.retry', ['subscriber' => $event->webhookCall->url]);
});
Event::listen(FinalWebhookCallFailedEvent::class, function ($event) {
    Alert::critical("Webhook permanently failed for {$event->webhookCall->url}");
});
```
---
## Exceptions
Non-critical webhooks where monitoring overhead isn't justified.
---
## Consequences Of Violation
Degraded delivery performance goes unnoticed, subscribers silently stop receiving events.
## Implement Subscriber Health Checks
---
## Category
Reliability
---
## Rule
Track subscriber endpoint health and skip retry for persistently dead endpoints to conserve resources.
---
## Reason
Retrying against a dead endpoint wastes resources and delays delivery to other subscribers.
---
## Bad Example
```php
// Retries all 10 attempts even if endpoint has been down for days
```
---
## Good Example
```php
if ($subscriber->isHealthy()) {
    $webhookCall->dispatch();
} else {
    Alert::warning("Skipping webhook to unhealthy subscriber: {$subscriber->url}");
}
```
---
## Exceptions
Subscribers where even dead endpoints must be retried for auditing purposes.
---
## Consequences Of Violation
Wasted retry resources on dead endpoints, delayed processing for other subscribers, increased queue backlog.
