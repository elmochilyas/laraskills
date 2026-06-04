## Design for At-Least-Once Delivery with Idempotent Processing
---
## Category
Architecture
---
## Rule
Assume at-least-once webhook delivery from fintech providers; implement idempotent processing using the webhook event ID as the idempotency key.
---
## Reason
Fintech providers retry on delivery failure; without idempotent processing, retries cause duplicate payments, double refunds, or duplicate order processing.
---
## Bad Example
```php
public function handlePaymentWebhook(Request $request) {
    Order::create($request->all()); // no idempotency — duplicate on retry
}
```
---
## Good Example
```php
public function handlePaymentWebhook(Request $request) {
    $eventId = $request->header('webhook-id');
    $lock = Cache::lock("payment:{$eventId}", 30);
    if ($lock->get()) {
        try {
            Order::create($request->input('data'));
        } finally {
            $lock->release();
        }
    }
}
```
---
## Exceptions
None — always implement idempotent processing for fintech webhooks.
---
## Consequences Of Violation
Duplicate payments, double refunds, duplicate order processing, financial reconciliation failures.
## Never Assume Ordering Guarantees
---
## Category
Reliability
---
## Rule
Process webhook events by their event timestamp, not their arrival order; implement compensating logic for out-of-order delivery.
---
## Reason
Fintech webhooks can arrive out of order due to retry delays, network issues, or provider-side re-routing; processing by arrival order causes stale data overwrites.
---
## Bad Example
```php
// Processes events in arrival order — old event overwrites newer data
```
---
## Good Example
```php
$eventTimestamp = $event->data['timestamp'];
$lastProcessed = Cache::get("last_event:{$resourceId}", 0);
if ($eventTimestamp <= $lastProcessed) {
    return; // stale event — discard
}
// Process event
Cache::put("last_event:{$resourceId}", $eventTimestamp);
```
---
## Exceptions
Fintech providers with documented in-order delivery guarantees.
---
## Consequences Of Violation
Stale event data overwrites newer state, incorrect balances, data inconsistency.
## Set Reconciliation Window to Match Max Retry Horizon
---
## Category
Reliability
---
## Rule
Configure the reconciliation window to equal the provider's maximum retry duration (e.g., Stripe: 3 days).
---
## Reason
Events delivered after reconciliation runs are missed by the matching process, accumulating as unreconciled items that require manual intervention.
---
## Bad Example
```php
// 24h reconciliation window — Stripe retries for 72h, some events missed
```
---
## Good Example
```php
$reconciliationWindow = match ($provider) {
    'stripe' => now()->subDays(3), // 3 days — match Stripe retry window
    'adyen' => now()->subDays(7),  // 7 days — Adyen retry window
};
$unmatched = $this->findUnmatchedTransactions($reconciliationWindow);
```
---
## Exceptions
None — match reconciliation window to provider's retry horizon.
---
## Consequences Of Violation
Unreconciled transactions accumulate, manual investigation for late-delivered events, reconciliation inaccuracies.
## Implement Queue-First Architecture for All Fintech Webhooks
---
## Category
Architecture
---
## Rule
Dispatch all fintech webhook processing to a queue immediately on receipt; never process synchronously in the HTTP request.
---
## Reason
Fintech webhooks can trigger complex processing (reconciliation, ledger updates, notifications); synchronous processing holds the HTTP connection and risks timeout.
---
## Bad Example
```php
public function handleWebhook(Request $request) {
    $this->processPayment($request->all()); // synchronous — risks timeout
}
```
---
## Good Example
```php
public function handleWebhook(Request $request) {
    $payload = WebhookEntry::create(['body' => $request->getContent()]);
    ProcessFintechWebhook::dispatch($payload)->onQueue('fintech');
    return response('OK', 200);
}
```
---
## Exceptions
Simple audit log webhooks requiring no processing.
---
## Consequences Of Violation
HTTP timeout on complex processing, duplicate processing on client retry, slow response to provider, provider rate limiting.
## Implement Compensating Transactions for Late Delivery
---
## Category
Reliability
---
## Rule
Provide compensating operations (voids, refunds, reversals) for late-delivered or duplicate webhook events.
---
## Reason
Even with idempotency, some scenarios (late reversal after settlement) require explicit compensating logic to maintain data consistency.
---
## Bad Example
```php
// No compensating logic — late webhooks cause unrecoverable state
```
---
## Good Example
```php
if ($event->type === 'payment.captured' && $this->alreadyRefunded($orderId)) {
    // Late capture after refund — reverse the capture
    $this->reversePayment($event->data['payment_id']);
}
```
---
## Exceptions
Idempotent processing that handles all timing scenarios.
---
## Consequences Of Violation
Unrecoverable data inconsistency, incorrect balances, financial reconciliation failures requiring manual fix.
## Monitor Delivery SLIs Per Provider
---
## Category
Observability
---
## Rule
Track delivery latency, success rate, and duplicate rate per fintech provider as SLIs; alert on SLA breaches.
---
## Reason
Fintech integrations have financial impact; degraded delivery metrics require immediate attention to prevent revenue loss.
---
## Bad Example
```php
// No per-provider SLI monitoring — degradation causes financial impact undetected
```
---
## Good Example
```php
Metrics::timing("webhook.latency.{$provider}", $latencyMs);
Metrics::increment("webhook.success.{$provider}");
Metrics::increment("webhook.duplicate.{$provider}");
if ($latencyMs > 300000) { // >5 min
    Alert::warning("{$provider} webhook latency exceeds SLA");
}
```
---
## Exceptions
None — always monitor fintech webhook SLIs.
---
## Consequences Of Violation
Undetected delivery degradation, financial impact from delayed payment processing, SLA breaches with provider.
