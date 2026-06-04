## Route Integration Jobs to Dedicated Queues
---
## Category
Scalability
---
## Rule
Route all webhook processing and API dispatch jobs to dedicated Horizon queues (`webhooks`, `integrations`); never use the default queue.
---
## Reason
Integration jobs have different throughput and latency requirements than application jobs; sharing the default queue causes contention and delays.
---
## Bad Example
```php
ProcessStripeWebhook::dispatch($data); // default queue — competes with emails, notifications
```
---
## Good Example
```php
ProcessStripeWebhook::dispatch($data)->onQueue('webhooks');
SendMailgunEmail::dispatch($email)->onQueue('integrations');
```
---
## Exceptions
Very low-traffic apps where queue isolation isn't warranted.
---
## Consequences Of Violation
Webhook backlog blocks application job processing, integration delays affect user-facing features, cross-service queue contention.
## Tag All Integration Jobs for Horizon Filtering
---
## Category
Maintainability
---
## Rule
Implement the `tags()` method on every integration job class to enable filtering by service and operation type.
---
## Reason
Without tags, Horizon shows all jobs as indistinguishable entries; tags enable per-service filtering, monitoring, and debugging.
---
## Bad Example
```php
class ProcessStripeWebhook implements ShouldQueue { /* no tags — indistinguishable */ }
```
---
## Good Example
```php
class ProcessStripeWebhook implements ShouldQueue {
    public function tags(): array {
        return ['stripe', 'webhook', 'payment:' . $this->webhookCall->id];
    }
}
```
---
## Exceptions
Simple integration jobs where tag overhead isn't justified.
---
## Consequences Of Violation
Cannot filter jobs by service in Horizon dashboard, debugging requires searching all jobs, difficulty monitoring per-service health.
## Set Worker Timeout Based on Max API Response Time
---
## Category
Reliability
---
## Rule
Configure Horizon worker timeout to exceed the maximum expected API response time for that queue's integrations.
---
## Reason
Worker timeout shorter than API response time causes force-killed jobs that may have succeeded on the API side, leading to duplicate processing.
---
## Bad Example
```php
// config/queue.php: 'retry_after' => 30 // too short for 60s API responses
```
---
## Good Example
```php
// config/horizon.php — per-queue timeout
'webhooks' => ['connection' => 'redis', 'queue' => ['webhooks'], 'timeout' => 120],
'integrations' => ['connection' => 'redis', 'queue' => ['integrations'], 'timeout' => 60],
```
---
## Exceptions
Integrations with guaranteed fast responses.
---
## Consequences Of Violation
Jobs force-killed during legitimate processing, duplicate side effects, data inconsistency.
## Monitor Queue Wait Time as Leading Indicator
---
## Category
Observability
---
## Rule
Track Horizon queue wait time per integration queue and alert on increasing trends.
---
## Reason
Increasing wait time is the earliest indicator of backpressure, preceding error rate increases; early detection enables proactive worker scaling.
---
## Bad Example
```php
// No wait time monitoring — backpressure detected only when errors spike
```
---
## Good Example
```php
// Horizon dashboard shows wait times; custom alerting:
$wait = Horizon::queueWaitTime('webhooks');
if ($wait > 300) { // >5 min wait
    Alert::warning('Webhook queue wait time increasing');
}
```
---
## Exceptions
None — always monitor queue wait times.
---
## Consequences Of Violation
Silent backpressure buildup, delayed webhook processing detected only when errors occur, reactive instead of proactive scaling.
## Configure Notifications for Failure Rate Thresholds
---
## Category
Observability
---
## Rule
Set up Horizon notifications to alert when integration queue failure rates exceed thresholds.
---
## Reason
Elevated failure rates indicate upstream issues, processing bugs, or rate limit problems requiring immediate investigation.
---
## Bad Example
```php
// No failure rate alerts — integration degradation goes undetected
```
---
## Good Example
```php
// config/horizon.php
'notification' => [
    'environment' => ['production'],
    'slack_webhook_url' => env('HORIZON_SLACK_WEBHOOK'),
    'threshold' => 10, // notify if >10 failures in 5 minutes
],
```
---
## Exceptions
Non-critical integration queues where failure alerts aren't warranted.
---
## Consequences Of Violation
Integration degradation undetected until users or subscribers report issues, delayed incident response.
## Use "Auto" Balancing for Variable Webhook Traffic
---
## Category
Scalability
---
## Rule
Configure Horizon with `balance: 'auto'` for webhook queues to handle variable traffic patterns.
---
## Reason
Webhook traffic is bursty (provider sends events in batches); auto balancing dynamically allocates workers where needed.
---
## Bad Example
```php
'webhooks' => ['connection' => 'redis', 'queue' => ['webhooks'], 'balance' => 'simple'],
```
---
## Good Example
```php
'webhooks' => ['connection' => 'redis', 'queue' => ['webhooks'], 'balance' => 'auto'],
```
---
## Exceptions
Consistent, predictable webhook traffic patterns.
---
## Consequences Of Violation
Worker underutilization during low traffic, queue backlog during traffic bursts, inefficient resource allocation.
