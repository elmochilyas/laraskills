# Dispatching Webhooks — Rules

---

## Always Use Queue-Based Dispatch in Production

## Category

Performance

## Rule

Dispatch all webhooks asynchronously via `->onQueue()` in production environments; never use `dispatchSync()` in a request lifecycle.

## Reason

Synchronous dispatch ties the HTTP response time to subscriber endpoint latency. A slow subscriber (10–30s) blocks the PHP process, exhausting workers and degrading application responsiveness. Queue dispatch returns the HTTP response immediately and moves delivery to a background worker.

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

Webhook dispatch inside an already-queued job that needs synchronous completion before the job acknowledges. Health check verification endpoints.

## Consequences Of Violation

Performance: Response latency tied to subscriber speed. Scalability: PHP workers exhaust under load. Reliability: Subscriber timeout causes application error.

---

## Sign Every Webhook with a Subscriber-Specific Secret

## Category

Security

## Rule

Provide a unique `useSecret()` value per subscriber endpoint for every dispatched webhook; never omit signing.

## Reason

Unsigned webhooks can be forged by any intermediary. A global signing secret means a leaked secret compromises all subscribers and one subscriber can impersonate another. Per-subscriber secrets enable individual rotation and provide cryptographic proof of origin.

## Bad Example

```php
WebhookCall::create()
    ->url($subscriber->webhook_url)
    ->payload($data)
    ->doNotSign()
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

Internal webhooks between services on a trusted network where transport-level security (mTLS) provides authenticity.

## Consequences Of Violation

Security: Webhooks forgeable by any party. Integrity: Subscriber cannot verify payload authenticity. Trust: Per-subscriber isolation broken.

---

## Store Subscriber Webhook URLs in Database, Not Config Files

## Category

Maintainability

## Rule

Persist subscriber webhook URLs in a database table so they can be managed dynamically; never hardcode URLs in configuration files or code.

## Reason

Hardcoded URLs require deployments to add/change subscribers. Database storage enables self-service subscriber management via UI or API, per-subscriber secret rotation, and endpoint health tracking via the same model.

## Bad Example

```php
// config/webhooks.php
return [
    'subscribers' => [
        'acme' => 'https://acme.com/webhooks',
        'beta' => 'https://beta.io/callbacks',
    ],
];
```

## Good Example

```php
// In database: subscribers table with id, name, webhook_url, webhook_secret, is_active

WebhookCall::create()
    ->url($subscriber->webhook_url)
    ->payload($data)
    ->useSecret($subscriber->webhook_secret)
    ->dispatch();
```

## Exceptions

Single-tenant applications with exactly one hardcoded subscriber endpoint.

## Consequences Of Violation

Maintainability: Deployment required for subscriber changes. Scalability: Cannot support self-service subscriber management. Security: URLs in version control.

---

## Implement Idempotency via webhook-id in Payload

## Category

Reliability

## Rule

Include a unique, stable `webhook-id` in every webhook payload so subscribers can deduplicate deliveries.

## Reason

Webhook delivery is at-least-once by nature. Subscribers receive duplicate deliveries during retry cycles. A stable unique ID allows subscribers to check `webhook-id` before processing, preventing duplicate side effects (double charges, duplicate notifications).

## Bad Example

```php
WebhookCall::create()
    ->url($url)
    ->payload(['event' => 'order.placed', 'order_id' => $order->id])
    ->dispatch();
// No webhook-id — subscriber cannot deduplicate
```

## Good Example

```php
WebhookCall::create()
    ->url($url)
    ->payload([
        'webhook-id' => (string) Str::uuid(),
        'event' => 'order.placed',
        'data' => $order->toArray(),
    ])
    ->dispatch();
```

## Exceptions

Non-critical webhooks where duplicate processing is harmless (e.g., cache invalidation notifications).

## Consequences Of Violation

Reliability: Subscribers cannot safely retry. Data integrity: Duplicate side effects on subscriber side.

---

## Include Version Field for Subscriber Compatibility

## Category

Maintainability

## Rule

Include a `version` field in every webhook payload so subscribers can detect and adapt to payload format changes.

## Reason

Webhook payloads evolve over time (new fields, changed structure). Without a version indicator, a subscriber cannot distinguish between a schema change and a data anomaly. Versioning enables overlapping migration windows where both old and new payload formats are accepted.

## Bad Example

```php
WebhookCall::create()
    ->url($url)
    ->payload(['event' => 'user.updated', 'data' => $user->toArray()])
    ->dispatch();
// No version — subscribers cannot detect schema changes
```

## Good Example

```php
WebhookCall::create()
    ->url($url)
    ->payload([
        'version' => '2026-06-01',
        'event' => 'user.updated',
        'data' => $user->toArray(),
    ])
    ->dispatch();
```

## Exceptions

Internal webhooks where subscriber and sender are deployed together and versioned identically.

## Consequences Of Violation

Maintainability: Breaking payload changes require synchronized deployments. Reliability: Unexpected field changes may break subscribers.
