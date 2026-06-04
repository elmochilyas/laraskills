# Queue and Async Processing for Webhooks — Rules

---

## Dispatch Job from Controller, Return 200 Immediately

## Category

Performance

## Rule

Dispatch a queue job and return HTTP 200 from the webhook controller within milliseconds; never perform business logic in the controller.

## Reason

Webhook providers enforce delivery timeouts (typically 5–30s). Synchronous processing in the controller risks timeout, triggering provider retry and duplicate delivery. Queue dispatch returns 200 immediately, acknowledging receipt while business logic runs asynchronously with retry capability.

## Bad Example

```php
class WebhookController extends Controller
{
    public function handle(Request $request)
    {
        $this->fulfillOrder($request->all()); // 2-3 seconds of work
        return response()->json(['status' => 'ok']);
        // Provider may timeout and retry
    }
}
```

## Good Example

```php
class WebhookController extends Controller
{
    public function handle(Request $request)
    {
        ProcessOrderWebhook::dispatch($request->getContent());
        return response()->json(['status' => 'ok']);
        // Returns immediately — work happens async
    }
}
```

## Exceptions

Health check endpoints that must respond synchronously. Operations completing in <10ms with no side effects.

## Consequences Of Violation

Performance: Provider timeout triggers duplicate delivery. Reliability: Processing failure loses event. Scalability: PHP workers exhaust on slow processing.

---

## Use Unique Jobs with ShouldBeUnique for Deduplication

## Category

Reliability

## Rule

Implement `ShouldBeUnique` on webhook processing jobs when the same event must not be processed concurrently or within a deduplication window.

## Reason

Webhook providers may deliver the same event multiple times due to retries. Without deduplication, each delivery dispatches a new job, causing concurrent processing of the same event. `ShouldBeUnique` prevents duplicate job dispatch within the configurable deduplication window.

## Bad Example

```php
class ProcessStripeWebhook implements ShouldQueue
{
    public function handle(WebhookCall $call): void
    {
        // No deduplication — same event processed multiple times
        $this->fulfillOrder($call->payload['order_id']);
    }
}
```

## Good Example

```php
class ProcessStripeWebhook implements ShouldQueue, ShouldBeUnique
{
    public $uniqueFor = 3600; // Deduplicate for 1 hour

    public function uniqueId(): string
    {
        // Use the event-level ID from the webhook payload
        return 'stripe:' . ($this->payload['id'] ?? '');
    }

    public function handle(WebhookCall $call): void
    {
        $this->fulfillOrder($call->payload['order_id']);
    }
}
```

## Exceptions

Events with internal idempotency (e.g., database upserts by event ID) that are naturally safe to process multiple times.

## Consequences Of Violation

Data integrity: Duplicate processing of same event. Reliability: Concurrent processing may race on shared state.

---

## Dispatch After Database Commit with dispatchIfCommitted

## Category

Reliability

## Rule

Use `dispatchIfCommitted()` when dispatching webhook processing jobs within database transactions; never dispatch before the transaction commits.

## Reason

Jobs dispatched inside an uncommitted transaction may execute before the transaction completes. If the transaction rolls back, the job processes data that does not exist, causing inconsistency. `dispatchIfCommitted()` ensures the job is only queued after a successful commit.

## Bad Example

```php
DB::transaction(function () use ($data) {
    $payment = Payment::create([/* ... */]);
    ProcessPayment::dispatch($payment->id); // Dispatched before commit
});
// Rollback leaves orphan job processing phantom data
```

## Good Example

```php
DB::transaction(function () use ($data) {
    $payment = Payment::create([/* ... */]);
});
ProcessPayment::dispatchIfCommitted($payment->id); // Only after commit
```

## Exceptions

Jobs that do not depend on transaction data (e.g., simple notifications using pre-existing data).

## Consequences Of Violation

Data integrity: Job processes phantom/rolled-back records. Reliability: Inconsistent application state.

---

## Implement Job Middleware for Rate Limiting

## Category

Reliability

## Rule

Apply `RateLimited` middleware to webhook processing jobs that make downstream API calls; never process webhook jobs without controlling downstream consumption rate.

## Reason

A burst of webhook deliveries (e.g., provider catch-up after downtime) can overwhelm downstream APIs, causing rate limit errors and cascading failures. `RateLimited` middleware prevents jobs from exceeding the configured rate, smoothing consumption and protecting downstream services.

## Bad Example

```php
class ProcessGitHubWebhook implements ShouldQueue
{
    public function handle(WebhookCall $call): void
    {
        $this->github->api('repo')->events(/* ... */);
        // No rate limit — burst hits GitHub API hard
    }
}
```

## Good Example

```php
class ProcessGitHubWebhook implements ShouldQueue
{
    public function middleware(): array
    {
        return [new RateLimited('github-api', 60, 60)]; // 60 calls per minute
    }

    public function handle(WebhookCall $call): void
    {
        $this->github->api('repo')->events(/* ... */);
    }
}
```

## Exceptions

Jobs that perform no external API calls (pure database operations).

## Consequences Of Violation

Reliability: Downstream rate limit errors cause job failures. Performance: Thundering herd against external APIs. Scalability: Inconsistent downstream load.

---

## Use ShouldBeEncrypted for Jobs Containing Sensitive Data

## Category

Security

## Rule

Implement `ShouldBeEncrypted` on webhook processing jobs that contain sensitive payload data in their serialized properties.

## Reason

Job payloads are serialized and stored in the queue driver (Redis, database) in plain text by default. Unencrypted job data exposes sensitive information (PII, payment details, API keys) to anyone with queue access. `ShouldBeEncrypted` transparently encrypts the serialized job data.

## Bad Example

```php
class ProcessPaymentWebhook implements ShouldQueue
{
    public function __construct(
        public array $payload // Plain text in queue
    ) {}
}
```

## Good Example

```php
class ProcessPaymentWebhook implements ShouldQueue, ShouldBeEncrypted
{
    public function __construct(
        public array $payload // Encrypted when serialized to queue
    ) {}
}
```

## Exceptions

Jobs that contain no sensitive data (e.g., public event type and ID only).

## Consequences Of Violation

Security: Sensitive data exposes in queue storage. Compliance: Data protection regulations violated (GDPR, PCI).

---

## Isolate Queue Connection Per Service When Needed

## Category

Architecture

## Rule

Configure separate queue connections for different webhook providers or service groups when processing requirements differ significantly.

## Reason

Different providers have different throughput, latency, and reliability characteristics. A high-volume provider (e.g., Stripe) can starve a low-volume but critical provider (e.g., Slack alerting) if they share a queue connection. Isolated connections allow independent worker scaling, failure domains, and configuration.

## Bad Example

```php
// All providers share same queue connection
'connections' => [
    'redis' => ['driver' => 'redis', 'queue' => 'default'],
];
```

## Good Example

```php
'connections' => [
    'redis-default' => ['driver' => 'redis', 'queue' => 'default'],
    'redis-webhooks' => ['driver' => 'redis', 'queue' => 'webhooks'],
];

class ProcessStripeWebhook implements ShouldQueue
{
    public $connection = 'redis-webhooks';
}
```

## Exceptions

Low-volume applications (<1K webhooks/day) where queue isolation overhead is not justified.

## Consequences Of Violation

Performance: One provider's volume blocks another. Scalability: Cannot independently scale provider workers. Reliability: Queue failure affects all providers.
