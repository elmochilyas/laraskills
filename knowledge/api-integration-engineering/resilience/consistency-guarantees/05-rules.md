## Right-Size Consistency Guarantee to Business Impact
---
## Category
Architecture
---
## Rule
Choose at-most-once for idempotent operations where data loss is acceptable, at-least-once for operations where duplicates can be handled, and exactly-once for financial and critical operations.
---
## Reason
Exactly-once adds 10-50ms overhead and complexity; using it everywhere wastes resources. At-most-once may lose data. Choosing correctly balances cost with business risk.
---
## Bad Example
```php
// Uses exactly-once (idempotency + locking) for analytics events — wasted overhead
```
---
## Good Example
```php
$consistency = match ($operationCriticality) {
    'financial' => ConsistencyLevel::ExactlyOnce,  // idempotency + lock
    'standard' => ConsistencyLevel::AtLeastOnce,   // idempotent processing
    'analytics' => ConsistencyLevel::AtMostOnce,   // fire and forget
};
```
---
## Exceptions
Regulatory requirements may mandate exactly-once regardless of business impact.
---
## Consequences Of Violation
Over-engineering wastes resources on low-criticality operations; under-engineering causes data corruption on critical operations.
## Combine Idempotency Key with Lock for Exactly-Once
---
## Category
Reliability
---
## Rule
To achieve exactly-once semantics, always combine idempotency keys with distributed locking.
---
## Reason
Idempotency keys alone don't prevent concurrent duplicate processing; a lock serializes concurrent requests with the same key.
---
## Bad Example
```php
// Idempotency check without lock — two concurrent requests both pass the check
```
---
## Good Example
```php
$lock = Cache::lock("charge:{$key}", 30);
if ($lock->get()) {
    try {
        $result = $this->processCharge($data);
        Cache::put("idempotency:$key", $result, 86400);
    } finally {
        $lock->release();
    }
}
```
---
## Exceptions
Single-worker deployments where concurrent requests are impossible.
---
## Consequences Of Violation
Concurrent requests with same key both process, violating exactly-once and creating duplicate side effects.
## Use Transactional Outbox for Exactly-Once Outgoing Delivery
---
## Category
Reliability
---
## Rule
For outgoing webhooks requiring exactly-once delivery, implement the transactional outbox pattern: write to an outbox table within the same DB transaction as the business operation.
---
## Reason
Without transactional outbox, a webhook may be sent even if the business operation fails, or the business operation succeeds but the webhook is never sent — violating consistency.
---
## Bad Example
```php
DB::transaction(function () {
    $order = Order::create($data);
    Http::post('/webhook', $order->toArray()); // webhook sent outside transaction
});
```
---
## Good Example
```php
DB::transaction(function () {
    $order = Order::create($data);
    Outbox::create(['payload' => $order->toArray()]); // in same transaction
});
// Outbox worker picks up and sends
```
---
## Exceptions
Non-critical notifications where eventual delivery is acceptable.
---
## Consequences Of Violation
Inconsistent state between business data and notified systems; webhooks sent for failed operations or never sent for succeeded ones.
## Use Inbox with Unique Constraint for Exactly-Once Incoming Webhooks
---
## Category
Reliability
---
## Rule
For incoming webhooks requiring exactly-once processing, persist the event ID in an inbox table with a unique constraint before processing.
---
## Reason
The unique constraint prevents duplicate processing even under concurrent delivery; without it, at-least-once delivery causes duplicate side effects.
---
## Bad Example
```php
// Processes webhook without checking inbox — duplicate delivery processes twice
```
---
## Good Example
```php
try {
    Inbox::create(['event_id' => $eventId]); // unique constraint prevents duplicate
    $this->processWebhook($event);
} catch (UniqueConstraintViolationException $e) {
    // Already processed — safe to ignore
}
```
---
## Exceptions
Idempotent processing operations where duplicate execution is harmless.
---
## Consequences Of Violation
Duplicate processing of webhook events, double payments, duplicate order confirmations, data corruption.
## Document Chosen Guarantee Per Integration
---
## Category
Maintainability
---
## Rule
Document the consistency guarantee (at-most-once / at-least-once / exactly-once) for every integration in the service class docblock or integration documentation.
---
## Reason
Consumers and future maintainers need to understand what guarantees are provided to safely use the integration and know what failure modes to expect.
---
## Bad Example
```php
class StripeChargeService { // no documented guarantee — others must guess
```
---
## Good Example
```php
/**
 * Processes Stripe charges with exactly-once semantics.
 * Uses idempotency keys + distributed locking.
 * Failures are retried via queue with exponential backoff.
 */
class StripeChargeService { }
```
---
## Exceptions
None — always document the guarantee.
---
## Consequences Of Violation
Consumers mis-handle failures (e.g., implementing retry on at-most-once operations), debugging confusion, integration bugs.
