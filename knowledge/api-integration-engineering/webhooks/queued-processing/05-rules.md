## Always Use Queue-First Processing
---
## Category
Architecture
---
## Rule
Dispatch all webhook processing to a queue job from the HTTP endpoint; never process synchronously in the controller.
---
## Reason
Synchronous processing ties up the HTTP worker, causes upstream timeouts, and prevents retry on failure.
---
## Bad Example
```php
public function handle(Request $request): Response {
    $this->processPayment($request->all()); // synchronous — blocks response
    return response()->json(['status' => 'ok']);
}
```
---
## Good Example
```php
public function handle(Request $request): Response {
    ProcessStripeWebhook::dispatch($request->getContent())->onQueue('webhooks');
    return response()->json(['status' => 'ok']); // immediate 200
}
```
---
## Exceptions
Health check endpoints requiring synchronous validation.
---
## Consequences Of Violation
Slow responses cause upstream timeouts and retries, processing failures cannot be retried, poor throughput.
## Use Dedicated Queue Workers for Webhooks
---
## Category
Scalability
---
## Rule
Route webhook processing jobs to a dedicated queue (`webhooks`) with separate workers.
---
## Reason
Webhook processing backlogs should not delay application jobs (emails, notifications); dedicated queues provide resource isolation.
---
## Bad Example
```php
ProcessStripeWebhook::dispatch($data); // default queue — competes with app jobs
```
---
## Good Example
```php
ProcessStripeWebhook::dispatch($data)->onQueue('webhooks'); // isolated queue
// config/horizon.php — dedicated worker pool for webhooks
```
---
## Exceptions
Very low-volume applications where isolation is unnecessary.
---
## Consequences Of Violation
Webhook backlog blocks application job processing, application performance degrades during webhook storms.
## Configure Job Timeout Exceeding Expected Processing Time
---
## Category
Reliability
---
## Rule
Set job timeout to exceed the maximum expected processing time by at least 50% buffer.
---
## Reason
Jobs that exceed timeout are force-failed; too-short timeout causes premature failure of legitimate processing.
---
## Bad Example
```php
class ProcessStripeWebhook implements ShouldQueue {
    public $timeout = 30; // may not be enough for API calls + processing
}
```
---
## Good Example
```php
class ProcessStripeWebhook implements ShouldQueue {
    public $timeout = 120; // buffer for API calls, DB writes, and retry handling
}
```
---
## Exceptions
None — always configure explicit timeouts.
---
## Consequences Of Violation
Jobs force-killed during legitimate processing, incomplete operations, data inconsistency.
## Apply Circuit Breaker Middleware to Webhook Jobs
---
## Category
Reliability
---
## Rule
Add circuit breaker middleware to webhook job classes to stop retry when downstream services are degraded.
---
## Reason
Without circuit breaker, retries continue hammering a failing downstream service, preventing recovery and wasting resources.
---
## Bad Example
```php
class ProcessStripeWebhook implements ShouldQueue {
    public $tries = 10; // retries even when Stripe is down — wasteful
}
```
---
## Good Example
```php
class ProcessStripeWebhook implements ShouldQueue {
    public $tries = 0; // Fuse circuit breaker controls retry
    public function middleware(): array {
        return [new CircuitBreakerMiddleware('stripe')];
    }
}
```
---
## Exceptions
Non-critical webhooks where retry is unnecessary.
---
## Consequences Of Violation
Retries hammer a failing service, preventing recovery, wasting queue worker resources.
## Implement Idempotency Check at Start of handle()
---
## Category
Reliability
---
## Rule
Check for prior processing at the start of `handle()` using the webhook ID to prevent duplicate execution.
---
## Reason
At-least-once delivery guarantees duplicates; without idempotency, each duplicate causes side effects (double charges, double notifications).
---
## Bad Example
```php
public function handle(WebhookCall $webhookCall): void {
    $this->processCharge($webhookCall->payload); // runs on every delivery
}
```
---
## Good Example
```php
public function handle(WebhookCall $webhookCall): void {
    if (Cache::has("processed:{$webhookCall->id}")) return;
    $this->processCharge($webhookCall->payload);
    Cache::put("processed:{$webhookCall->id}", true, 86400);
}
```
---
## Exceptions
Webhooks that are idempotent by nature (e.g., notification-only events).
---
## Consequences Of Violation
Duplicate charges, double order processing, data corruption from repeated execution.
