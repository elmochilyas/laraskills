# Spatie laravel-webhook-server Dispatch and Retry Customization — Rules

---

## Create WebhookCall from Service Classes, Not Controllers

## Category

Code Organization

## Rule

Generate and dispatch `WebhookCall` instances inside dedicated service or action classes, never inside controllers.

## Reason

Controllers should handle HTTP concerns only. Embedding webhook dispatch logic in controllers violates single responsibility, makes testing difficult, and couples delivery logic to request context. Service classes encapsulate the dispatch, signing, and error handling in a testable unit.

## Bad Example

```php
class OrderController extends Controller
{
    public function store(Request $request)
    {
        $order = Order::create($request->validated());
        WebhookCall::create()
            ->url($order->subscriber->webhook_url)
            ->payload(['event' => 'order.created', 'data' => $order->toArray()])
            ->useSecret($order->subscriber->webhook_secret)
            ->onQueue('webhooks')
            ->dispatch();
        return response()->json($order, 201);
    }
}
```

## Good Example

```php
class OrderController extends Controller
{
    public function __construct(private WebhookDispatchService $webhook) {}

    public function store(Request $request)
    {
        $order = Order::create($request->validated());
        $this->webhook->dispatchOrderCreated($order);
        return response()->json($order, 201);
    }
}

class WebhookDispatchService
{
    public function dispatchOrderCreated(Order $order): void
    {
        WebhookCall::create()
            ->url($order->subscriber->webhook_url)
            ->payload(['event' => 'order.created', 'data' => $order->toArray()])
            ->useSecret($order->subscriber->webhook_secret)
            ->onQueue('webhooks')
            ->dispatch();
    }
}
```

## Exceptions

Simple prototyping or proof-of-concept code where testability is not a concern.

## Consequences Of Violation

Maintainability: Dispatch logic scattered across controllers. Testing: Cannot unit-test dispatch behavior without HTTP request setup. Architecture: Business logic coupled to HTTP layer.

---

## Always Configure max_attempts

## Category

Reliability

## Rule

Set an explicit `max_attempts` value in the webhook server configuration or per-call; never rely on the default unlimited retry.

## Reason

Without a configured limit, `WebhookCall` retry chains run indefinitely on dead endpoints, consuming queue workers and database storage. Set a value aligned to your delivery SLA (10–15 attempts typical for a 24-hour delivery window).

## Bad Example

```php
// In config/webhook-server.php
return [
    'max_attempts' => null, // unlimited retries
];
```

## Good Example

```php
// In config/webhook-server.php
return [
    'max_attempts' => 10,
];
```

## Exceptions

Non-critical webhooks where eventual delivery is acceptable without a hard deadline. In that case, set a high-but-finite limit (e.g., 25) rather than null.

## Consequences Of Violation

Reliability: Queue workers permanently occupied on dead endpoints. Performance: Unbounded `webhook_calls` table growth. Maintainability: Zombie retry chains with no termination.

---

## Register WebhookCallSucceededEvent and WebhookCallFailedEvent Listeners

## Category

Observability

## Rule

Register listeners for both `WebhookCallSucceededEvent` and `WebhookCallFailedEvent` to track delivery outcomes and detect degradation.

## Reason

Delivery success/failure events are the primary signal for webhook health. Without them, you cannot measure delivery rate, detect subscriber degradation, or alert on abnormal failure patterns. Success tracking also provides delivery confirmation for audit trails.

## Bad Example

```php
// Only tracking final failure — no visibility into transient failures
Event::listen(FinalWebhookCallFailedEvent::class, fn ($e) => /* alert */);
```

## Good Example

```php
Event::listen(WebhookCallSucceededEvent::class, function ($event) {
    Log::info('Webhook delivered', [
        'id' => $event->webhookCall->id,
        'url' => $event->webhookCall->url,
        'attempt' => $event->webhookCall->attempt,
    ]);
});

Event::listen(WebhookCallFailedEvent::class, function ($event) {
    Metrics::increment('webhook.delivery_failed', ['url' => $event->webhookCall->url]);
});
```

## Exceptions

Extremely high-volume webhook dispatch (>100K/day) where logging every event incurs cost; sample or aggregate in that case.

## Consequences Of Violation

Observability: No delivery success/failure metrics. Reliability: Degradation detected only after final failure. Debugging: No per-attempt logs for troubleshooting.

---

## Use Dedicated Queue for Webhook Dispatch

## Category

Performance

## Rule

Route all webhook dispatches to a dedicated queue connection or queue name, isolated from application jobs.

## Reason

Webhook dispatch HTTP calls can take seconds. When dispatched on the default queue, a slow subscriber blocks application jobs behind it. A dedicated queue allows independent worker scaling and prevents delivery latency from affecting application responsiveness.

## Bad Example

```php
WebhookCall::create()->url($url)->payload($data)->dispatch();
// Dispatched on 'default' queue — blocks application jobs
```

## Good Example

```php
// In config/webhook-server.php
'queue' => 'webhook-dispatches',

// Or per-call:
WebhookCall::create()->url($url)->payload($data)->onQueue('webhook-dispatches')->dispatch();
```

## Exceptions

Low-volume integrations (<100 webhooks/day) where queue isolation overhead is unnecessary.

## Consequences Of Violation

Performance: Subscriber latency affects application job throughput. Scalability: Cannot scale webhook workers independently. Reliability: Queue backpressure delays critical application jobs.

---

## Do Not Store Webhook URLs in Plain Text

## Category

Security

## Rule

Encrypt subscriber webhook URLs at rest using Laravel's encryption or a dedicated encrypted column.

## Reason

Webhook URLs are sensitive endpoint addresses that, when leaked, enable attackers to send fraudulent payloads or discover application structure. Encryption at rest mitigates database breach impact and may be required for compliance (PCI DSS, SOC 2).

## Bad Example

```php
// Stored as plain string in database column
$subscriber->update(['webhook_url' => $request->webhook_url]);
```

## Good Example

```php
// In Subscriber model
use Illuminate\Database\Eloquent\Casts\AsEncryptedString;

protected $casts = [
    'webhook_url' => AsEncryptedString::class,
];
```

## Exceptions

Ephemeral local development environments with non-sensitive URLs.

## Consequences Of Violation

Security: Database breach exposes subscriber URLs. Compliance: Audit non-passing for sensitive data encryption.

---

## Implement Cleanup Schedule for Old WebhookCall Records

## Category

Maintainability

## Rule

Schedule a daily cleanup query that deletes `WebhookCall` records older than a configured retention period.

## Reason

Every webhook dispatch creates a `WebhookCall` record storing payload and response. Without cleanup, this table grows without bound, degrading insert/query performance and inflating backup size.

## Bad Example

```php
// No cleanup — webhook_calls table grows indefinitely
// Console\Kernel.php has no webhook cleanup schedule
```

## Good Example

```php
// App\Console\Kernel.php
$schedule->call(function () {
    WebhookCall::where('created_at', '<', now()->subDays(config('webhook-server.retention_days', 30)))
        ->delete();
})->daily();
```

## Exceptions

Regulatory retention requirements (e.g., 90 days for PCI). Archive to cold storage before deletion in those cases.

## Consequences Of Violation

Performance: Slow queries on large `webhook_calls` table. Maintainability: Database storage costs increase. Reliability: Index maintenance overhead.
