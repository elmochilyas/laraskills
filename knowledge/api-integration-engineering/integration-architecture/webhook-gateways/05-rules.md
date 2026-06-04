## Store Events Locally Before Sending to Gateway
---
## Category
Reliability
---
## Rule
Persist the event to a local database before dispatching it to a webhook gateway service.
---
## Reason
If the gateway is unreachable, the event is preserved locally for later delivery; relying solely on the gateway means events are lost during gateway outages.
---
## Bad Example
```php
$gateway->sendMessage($payload); // event lost if gateway is down
```
---
## Good Example
```php
$event = WebhookEvent::create($payload); // local store first
$gateway->sendMessage($event->toStandardPayload()); // then gateway
```
---
## Exceptions
Non-critical events where loss is acceptable.
---
## Consequences Of Violation
Permanent event loss during gateway outages, unrecoverable data gaps, broken subscriber integrations.
## Use Gateway for 50+ Subscribers; Self-Hosted for <20
---
## Category
Architecture
---
## Rule
Choose a managed gateway service (Convoy, Svix) when delivering to 50+ subscriber endpoints; use self-hosted dispatch for <20.
---
## Reason
Self-hosted dispatch at scale requires significant operational investment (workers, retry, monitoring, scaling). A gateway provides managed delivery infrastructure when subscriber count makes operational overhead prohibitive.
---
## Bad Example
```php
// Self-hosted dispatch to 200 subscribers — high operational burden
```
---
## Good Example
```php
$subscriberCount = Subscriber::count();
$dispatcher = match(true) {
    $subscriberCount >= 50 => new GatewayDispatcher($gateway),
    default => new SelfHostedDispatcher($jobQueue),
};
$dispatcher->dispatch($event);
```
---
## Exceptions
Strict data residency requirements preventing gateway usage.
---
## Consequences Of Violation
Operational overhead of managing delivery infrastructure at scale, scaling challenges during subscriber growth, missed deliveries during self-hosted infrastructure failures.
## Design Events as Standard Webhooks Compliant
---
## Category
Maintainability
---
## Rule
Format outgoing events using the Standard Webhooks specification for portability between gateway providers.
---
## Reason
Standard Webhooks format (webhook-id, webhook-timestamp, webhook-signature headers) allows switching between gateways or migrating to self-hosted without reformatting events.
---
## Bad Example
```php
// Custom format — vendor lock-in to specific gateway
```
---
## Good Example
```php
$event = $gateway->sendMessage(
    [
        'id' => $event->id,
        'type' => 'order.created',
        'timestamp' => $event->created_at->toIso8601String(),
        'payload' => $event->data,
    ],
    $this->getStandardWebhookHeaders($event) // id, timestamp, signature
);
```
---
## Exceptions
Gateway providers requiring proprietary formats (migrate away from them).
---
## Consequences Of Violation
Vendor lock-in to specific gateway provider, costly migration to alternative provider, inability to switch delivery methods.
## Implement Circuit Breaker for Gateway API Calls
---
## Category
Reliability
---
## Rule
Wrap gateway API calls in a circuit breaker to avoid hammering an unreachable gateway.
---
## Reason
A gateway is a critical dependency; without a circuit breaker, a gateway outage causes cascading failures in your application.
---
## Bad Example
```php
$gateway->sendMessage($payload); // no circuit breaker — retries gateway endlessly
```
---
## Good Example
```php
if ($circuitBreaker->isOpen('gateway')) {
    // Fallback: queue event for later delivery
    DispatchEvent::dispatch($event)->onQueue('gateway_fallback');
    return;
}
try {
    $gateway->sendMessage($event->toPayload());
} catch (GatewayException $e) {
    $circuitBreaker->reportFailure('gateway');
}
```
---
## Exceptions
Gateway with 99.99%+ uptime SLA and documented failover.
---
## Consequences Of Violation
Endless retries to unavailable gateway, application hang, resource exhaustion.
## Use Gateway for External Subscribers; Self-Hosted for Internal
---
## Category
Architecture
---
## Rule
Route external subscriber deliveries through the gateway; use self-hosted dispatch for internal services.
---
## Reason
Internal services don't require the overhead of managed gateway delivery; external subscribers benefit from gateway's retry, signing, and endpoint management.
---
## Bad Example
```php
// All events through gateway — unnecessary cost and latency for internal subscribers
```
---
## Good Example
```php
if ($subscriber->isInternal()) {
    ProcessInternalWebhook::dispatch($event)->onQueue('internal');
} else {
    $gateway->sendMessage($event->toStandardPayload());
}
```
---
## Exceptions
Internal services with strict delivery SLAs that exceed self-hosted capabilities.
---
## Consequences Of Violation
Unnecessary gateway costs for internal events, unnecessary latency for internal delivery, increased gateway API call volume.
## Monitor Gateway Delivery Latency and Failure Rates
---
## Category
Observability
---
## Rule
Track gateway delivery latency, success rate, and failure rate as integration SLIs.
---
## Reason
Gateway performance issues manifest as delayed or failed external deliveries; without monitoring, degradation goes undetected until subscribers complain.
---
## Bad Example
```php
// Gateway delivery not monitored — blind to delivery issues
```
---
## Good Example
```php
$success = $gateway->sendMessage($payload);
Metrics::increment($success ? 'gateway.delivery.success' : 'gateway.delivery.failure');
Metrics::timing('gateway.delivery.latency', $elapsed);
```
---
## Exceptions
None — always monitor gateway delivery metrics.
---
## Consequences Of Violation
Undetected gateway degradation, subscriber complaints as first indicator, delayed incident response.
