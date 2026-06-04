# Laravel Queue Integration for Async Webhook Processing — Rules

---

## Always Route Webhook Jobs to a Dedicated Queue

## Category

Architecture

## Rule

Configure a dedicated queue name or connection for all webhook processing jobs; never dispatch them on the default queue alongside application jobs.

## Reason

Webhook processing involves external API calls, database writes, and potentially slow downstream services. A slow webhook job (retry, rate limit, timeout) blocks the entire queue, delaying application-critical jobs like email dispatch or notification delivery. Dedicated queues isolate webhook processing and enable independent worker scaling.

## Bad Example

```php
class ProcessStripeWebhook implements ShouldQueue
{
    public function handle(WebhookCall $call): void
    {
        // Dispatched on 'default' queue
    }
}
// PaymentController::store dispatched on same queue — blocked by slow webhook
```

## Good Example

```php
class ProcessStripeWebhook implements ShouldQueue
{
    public $queue = 'webhooks';

    public function handle(WebhookCall $call): void
    {
        // Processing isolated from application jobs
    }
}
```

## Exceptions

Low-volume integrations (<100 webhooks/day) where queue isolation overhead is not justified.

## Consequences Of Violation

Performance: Slow webhooks delay application jobs. Scalability: Cannot scale webhook workers independently. Reliability: Queue backpressure cascades.

---

## Set Explicit tries and backoff Properties on Every Webhook Job

## Category

Reliability

## Rule

Define `$tries` and `$backoff` properties on every webhook processing job class; never rely on default unlimited retry behavior.

## Reason

Without explicit `$tries`, jobs retry indefinitely (database queue) or follow application-wide defaults (often too aggressive). Unlimited retries consume queue resources on permanently failing jobs, delay other work, and never escalate for manual intervention.

## Bad Example

```php
class ProcessStripeWebhook implements ShouldQueue
{
    // No $tries or $backoff — default is unlimited/instant retry
    public function handle(WebhookCall $call): void { /* ... */ }
}
```

## Good Example

```php
class ProcessStripeWebhook implements ShouldQueue
{
    public $tries = 10;
    public $backoff = [2, 5, 15, 30, 60, 120, 240, 480, 960, 1920];

    public function handle(WebhookCall $call): void { /* ... */ }
}
```

## Exceptions

Jobs with custom retry-until middleware that explicitly manages attempt count (e.g., using `throttle` middleware with retry limits).

## Consequences Of Violation

Reliability: Unlimited retries consume workers. Performance: Failing jobs block healthy jobs. Maintenance: Dead jobs never escalate for manual review.

---

## Apply RateLimited Middleware to Webhook Jobs

## Category

Reliability

## Rule

Add `RateLimited` middleware to every webhook processing job class that makes downstream API calls.

## Reason

Webhook processing often triggers API calls to the same downstream service. Without rate limiting, a burst of webhook deliveries (e.g., after provider catch-up) overwhelms the downstream API, causing cascading failures. `RateLimited` middleware prevents upstream rate limit errors and downstream degradation.

## Bad Example

```php
class ProcessStripeWebhook implements ShouldQueue
{
    public function handle(WebhookCall $call): void
    {
        $this->stripeClient->charges->retrieve(/* ... */); // No rate limit
    }
}
```

## Good Example

```php
class ProcessStripeWebhook implements ShouldQueue
{
    public function middleware(): array
    {
        return [new RateLimited('stripe-api', 100, 60)];
    }

    public function handle(WebhookCall $call): void
    {
        $this->stripeClient->charges->retrieve(/* ... */);
    }
}
```

## Exceptions

Jobs that perform no external API calls (pure database operations).

## Consequences Of Violation

Reliability: Downstream API rate limit errors cause job failures. Performance: Thundering herd against downstream services. Scalability: Cannot control consumption rate.

---

## Implement Idempotency Check at Handle Method Entry

## Category

Reliability

## Rule

Start every webhook job's `handle()` method with an idempotency check using a unique event identifier; never assume a webhook arrives exactly once.

## Reason

Webhook providers implement at-least-once delivery. Same events can arrive multiple times due to provider retries, network duplicates, or manual replays. Without idempotency, each delivery triggers the same side effect (duplicate charge, duplicate notification, duplicate record).

## Bad Example

```php
public function handle(WebhookCall $call): void
{
    $this->fulfillOrder($call->payload['order_id']); // Runs on every duplicate
}
```

## Good Example

```php
public function handle(WebhookCall $call): void
{
    $eventId = $call->payload['id'];

    if (Cache::add("processed:{$eventId}", true, 86400) === false) {
        return; // Already processed
    }

    $this->fulfillOrder($call->payload['order_id']);
}
```

## Exceptions

Read-only events with no side effects (e.g., analytics pings).

## Consequences Of Violation

Data integrity: Duplicate records, double charges. Business: Incorrect state from repeated processing.

---

## Never Pass Full Eloquent Models to Queue Jobs

## Category

Performance

## Rule

Pass only the model identifier (primary key or UUID) to webhook queue jobs; never pass the entire Eloquent model instance.

## Reason

Eloquent model serialization serializes all loaded relationships and attributes, creating large job payloads that consume Redis/Database memory and network bandwidth. Deserialization may fail if the model schema changes between dispatch and processing. Passing only the ID and re-querying inside `handle()` ensures fresh data and small payloads.

## Bad Example

```php
class ProcessStripeWebhook implements ShouldQueue
{
    public function __construct(
        public WebhookCall $webhookCall // Full model serialized
    ) {}
}

dispatch(new ProcessStripeWebhook($webhookCall));
```

## Good Example

```php
class ProcessStripeWebhook implements ShouldQueue
{
    public function __construct(
        public int $webhookCallId // Only the ID
    ) {}

    public function handle(): void
    {
        $webhookCall = WebhookCall::findOrFail($this->webhookCallId);
        // Process with fresh model data
    }
}

dispatch(new ProcessStripeWebhook($webhookCall->id));
```

## Exceptions

Models with no relationships and small attribute sets where serialization overhead is negligible.

## Consequences Of Violation

Performance: Large job payloads increase queue latency. Reliability: Schema changes break stored jobs. Storage: Redis/Database memory consumption increases.

---

## Use dispatchAfterCommit Within Database Transactions

## Category

Reliability

## Rule

Use `dispatchAfterCommit()` or `dispatchIfCommitted()` when dispatching webhook processing jobs inside database transactions.

## Reason

Jobs dispatched within an uncommitted transaction are processed before the transaction is persisted. If the transaction rolls back, the job processes data that does not exist, causing inconsistency. Dispatching after commit ensures the job sees committed data.

## Bad Example

```php
DB::transaction(function () use ($webhookCall) {
    $payment = Payment::create([/* ... */]);
    ProcessPaymentWebhook::dispatch($webhookCall->id); // Dispatched before commit
});
// If transaction rolls back, job processes phantom payment
```

## Good Example

```php
DB::transaction(function () use ($webhookCall) {
    $payment = Payment::create([/* ... */]);
});
ProcessPaymentWebhook::dispatchIfCommitted($webhookCall->id); // Dispatched after commit
```

## Exceptions

Jobs that do not read transaction data (e.g., pure notification jobs that only use identifiers from before the transaction).

## Consequences Of Violation

Data integrity: Job processes phantom/rolled-back data. Reliability: Inconsistent state between database and processed results.
