## Configure Exponential Backoff with Jitter
---
## Category
Reliability
---
## Rule
Always configure exponential backoff with jitter on webhook processing jobs; never use immediate retry.
---
## Reason
Immediate retry on transient failure often fails again instantly, wasting resources and generating noise; backoff gives time for recovery.
---
## Bad Example
```php
class ProcessWebhook implements ShouldQueue {
    public $tries = 10; // immediate retry — wastes resources
}
```
---
## Good Example
```php
class ProcessWebhook implements ShouldQueue {
    public $tries = 10;
    public $backoff = [2, 5, 15, 30, 60, 120, 240, 480, 960, 1920]; // exponential + jitter
}
```
---
## Exceptions
Non-critical webhooks where retry is unnecessary.
---
## Consequences Of Violation
Aggressive retry floods downstream services, preventing recovery and wasting queue worker resources.
## Apply Circuit Breaker Middleware
---
## Category
Reliability
---
## Rule
Add circuit breaker (Fuse) middleware to webhook processing jobs to stop retry during downstream outages.
---
## Reason
Without circuit breaker, retries continue hammering a failing service, preventing recovery and delaying other jobs.
---
## Bad Example
```php
class ProcessStripeWebhook implements ShouldQueue {
    public $tries = 10; // retries even when Stripe is down
}
```
---
## Good Example
```php
class ProcessStripeWebhook implements ShouldQueue {
    public $tries = 0; // Fuse controls retry
    public function middleware(): array {
        return [new CircuitBreakerMiddleware('stripe')];
    }
}
```
---
## Exceptions
Non-critical webhooks where retry can be abandoned without harm.
---
## Consequences Of Violation
Retries hammer a failing service, preventing recovery, wasting queue resources, delaying other jobs.
## Set $maxExceptions to Tolerate Occasional Failures
---
## Category
Reliability
---
## Rule
Configure `$maxExceptions` to 3 to allow occasional failures without exhausting retry count.
---
## Reason
Without `$maxExceptions`, every exception decrements retry count; a brief blip causing 3 exceptions exhausts a 3-retry job.
---
## Bad Example
```php
class ProcessWebhook implements ShouldQueue {
    public $tries = 5; // 5 exceptions exhausts all retries
}
```
---
## Good Example
```php
class ProcessWebhook implements ShouldQueue {
    public $tries = 10;
    public $maxExceptions = 3; // tolerate 3 exceptions without decrementing retries
}
```
---
## Exceptions
Jobs where any exception should count as a failed attempt.
---
## Consequences Of Violation
Jobs exhaust retry count during transient blips, causing permanent failure for recoverable issues.
## Implement Manual Retry for Failed Webhooks
---
## Category
Maintainability
---
## Rule
Provide a dashboard or Artisan command for manual retry of webhooks that exhausted all retry attempts.
---
## Reason
Without manual retry capability, failed webhooks are permanently lost after retry exhaustion.
---
## Bad Example
```php
// Failed webhooks silently discarded after retry exhaustion
```
---
## Good Example
```php
Artisan::command('webhooks:retry {id}', function ($id) {
    $webhook = WebhookCall::findOrFail($id);
    $webhook->resetAttempts();
    $webhook->dispatch();
});
// Or Horizon/Telescope dashboard for manual retry
```
---
## Exceptions
Non-critical webhooks where loss is acceptable.
---
## Consequences Of Violation
Permanent data loss on transient failures, no recovery path for failed processing.
## Monitor Failed Webhook Rates
---
## Category
Observability
---
## Rule
Track failed webhook rates per provider and alert on abnormal increases.
---
## Reason
Rising failure rates indicate provider issues, processing bugs, or configuration problems requiring investigation.
---
## Bad Example
```php
// No monitoring — failures accumulate silently
```
---
## Good Example
```php
Event::listen(FinalWebhookCallFailedEvent::class, function ($event) {
    Alert::critical("Webhook permanently failed: {$event->webhookCall->id}");
    Metrics::increment('webhook.final_failure', ['provider' => $event->webhookCall->provider]);
});
```
---
## Exceptions
Non-critical webhooks where failure monitoring isn't justified.
---
## Consequences Of Violation
Silent failure accumulation, delayed incident detection, data loss.
