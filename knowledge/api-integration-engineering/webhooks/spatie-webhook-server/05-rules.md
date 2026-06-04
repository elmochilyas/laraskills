# Spatie Laravel Webhook Server Package — Rules

---

## Always Dispatch Via Queue

## Category

Performance

## Rule

Use the queue-based `dispatch()` method for all webhook calls in production; never use `dispatchSync()` from HTTP controllers.

## Reason

`dispatchSync()` blocks the caller until the HTTP delivery completes. When called from a controller, the user waits for subscriber response time (100ms–30s). Queue dispatch returns immediately, freeing the worker and providing automatic retry on failure.

## Bad Example

```php
class OrderController extends Controller
{
    public function store(Request $request)
    {
        $order = Order::create($request->validated());
        WebhookCall::create()->url($url)->payload($order->toArray())->dispatchSync();
        return response()->json($order, 201);
    }
}
```

## Good Example

```php
class OrderController extends Controller
{
    public function store(Request $request)
    {
        $order = Order::create($request->validated());
        WebhookCall::create()
            ->url($url)
            ->payload($order->toArray())
            ->onQueue('webhooks')
            ->dispatch();
        return response()->json($order, 201);
    }
}
```

## Exceptions

Webhook dispatch inside an already-queued job that needs synchronous confirmation before completing.

## Consequences Of Violation

Performance: HTTP response delayed by subscriber speed. Scalability: PHP workers exhaust under load. Reliability: Subscriber timeout causes application error.

---

## Use Per-Subscriber Signing Secrets

## Category

Security

## Rule

Call `useSecret()` with a unique secret per subscriber; never use the default config secret for all subscribers.

## Reason

A shared signing secret means any subscriber can forge webhooks as another subscriber. If the shared secret leaks, all deliveries are compromised. Per-subscriber secrets enable independent rotation without affecting other subscribers.

## Bad Example

```php
WebhookCall::create()
    ->url($subscriber->webhook_url)
    ->payload($data)
    // Uses config('webhook-server.secret') by default
    ->dispatch();
```

## Good Example

```php
WebhookCall::create()
    ->url($subscriber->webhook_url)
    ->payload($data)
    ->useSecret($subscriber->webhook_secret)
    ->dispatch();
```

## Exceptions

Internal webhooks sent between your own services within a trusted network.

## Consequences Of Violation

Security: Shared secret compromises all subscribers. Maintainability: Cannot rotate per subscriber. Trust: No subscriber isolation.

---

## Use Tags for Subscriber-Grouped Notifications

## Category

Code Organization

## Rule

Assign tags to webhook calls to categorize delivery groups (e.g., by subscriber, event type, priority); never send all webhooks without tags.

## Reason

Tags enable subscriber-specific filtering, separate retry configuration, targeted monitoring, and selective reprocessing. Without tags, all webhooks are treated identically, making it impossible to differentiate critical vs non-critical delivery or per-subscriber statistics.

## Bad Example

```php
WebhookCall::create()->url($subscriber->url)->payload($data)->dispatch();
// No tags — cannot group or filter
```

## Good Example

```php
WebhookCall::create()
    ->url($subscriber->url)
    ->payload($data)
    ->useSecret($subscriber->secret)
    ->tag('subscriber:' . $subscriber->id)
    ->tag('event:order.placed')
    ->tag('priority:high')
    ->dispatch();
```

## Exceptions

Single-subscriber applications where grouping is unnecessary.

## Consequences Of Violation

Maintainability: Cannot filter webhooks by subscriber or event. Observability: Per-subscriber metrics unavailable. Operations: Cannot selectively reprocess specific groups.

---

## Implement Cleanup Strategy for Old WebhookCall Records

## Category

Maintainability

## Rule

Add a scheduled job or database query to delete `WebhookCall` records older than a configured retention period.

## Reason

Every `WebhookCall` dispatch stores payload and response data. Without cleanup, the table grows unboundedly, degrading query performance, increasing backup size, and raising storage costs.

## Bad Example

```php
// No cleanup — table grows forever
```

## Good Example

```php
// App\Console\Kernel.php
$schedule->call(function () {
    WebhookCall::where('created_at', '<', now()->subDays(30))->delete();
})->daily();
```

## Exceptions

Compliance/audit requirements that mandate longer retention. Archive to cold storage before deletion.

## Consequences Of Violation

Performance: Slow queries on bloated table. Storage: Unbounded database growth. Maintainability: Backup times increase.

---

## Monitor Delivery Failure Rates

## Category

Observability

## Rule

Track and alert on webhook delivery success-to-failure ratio per subscriber and overall.

## Reason

Delivery failure rate is the primary health indicator for outgoing webhook infrastructure. A sudden increase indicates subscriber downtime, network issues, or configuration errors. Without monitoring, degradation goes undetected until users or subscribers report it.

## Bad Example

```php
// No monitoring — success/failure invisible
Event::listen(WebhookCallSucceededEvent::class, fn () => null);
Event::listen(WebhookCallFailedEvent::class, fn () => null);
```

## Good Example

```php
Event::listen(WebhookCallFailedEvent::class, function ($event) {
    Metrics::increment('webhook.delivery_failed', [
        'url' => $event->webhookCall->url,
        'status' => $event->webhookCall->response['status'] ?? 'unknown',
    ]);
});
```

## Exceptions

Extremely low-volume environments where metrics infrastructure overhead exceeds value.

## Consequences Of Violation

Reliability: Undetected subscriber downtime. Debugging: No failure data for incident response. SLA: Cannot prove delivery metrics.

---

## Verify Subscriber URLs Before Adding to System

## Category

Security

## Rule

Send a verification request (e.g., URL challenge) to subscriber endpoints before storing them as active delivery targets.

## Reason

Unverified subscriber URLs may be typo-squatted, belong to a malicious actor, or point to a non-HTTP endpoint. Verification ensures only controlled, reachable endpoints receive webhook deliveries, preventing accidental data leakage or wasted delivery attempts.

## Bad Example

```php
$subscriber->update(['webhook_url' => $request->input('url')]);
// No verification — any URL accepted
```

## Good Example

```php
public function storeWebhookUrl(Request $request): JsonResponse
{
    $verified = WebhookVerificationService::verify($request->input('url'));
    if (!$verified) {
        return response()->json(['error' => 'URL verification failed'], 422);
    }
    $subscriber->update(['webhook_url' => $request->input('url')]);
    return response()->json(['status' => 'verified']);
}
```

## Exceptions

Internal services where endpoints are provisioned programmatically and verified by the deployment pipeline.

## Consequences Of Violation

Security: Data sent to unverified endpoints. Reliability: Delivery fails on non-existent endpoints. Trust: Subscriber spoofing risk.
