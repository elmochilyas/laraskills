# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering / Billing Webhook Queues |
| Knowledge Unit | Webhook queue design for billing systems |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Laravel Queues, Horizon, Stripe webhooks, Database transactions |
| Related KUs | Billing queue topology, Queue deployment safety, After-commit events and jobs |
| Source | domain-analysis.md |

# Overview

Stripe webhook processing belongs on its own dedicated `webhooks` queue with controlled concurrency, idempotency middleware, and retry isolation. Webhook jobs must not compete with email notifications or report generation. Use `ShouldBeUnique`, `WithoutOverlapping`, or custom idempotency middleware to prevent duplicate processing from Stripe's at-least-once webhook delivery. Design for the worst case: webhooks can arrive out of order, be redelivered days later, and arrive faster than your workers can process them.

# Core Concepts

- **Dedicated webhooks queue**: Isolates webhook processing from other queue work. Controlled concurrency prevents race conditions on subscription state.
- **Idempotency**: Stripe may redeliver the same event multiple times. Webhook jobs must be idempotent. `ShouldBeUnique` (keyed on `stripe_event_id`) or a custom middleware checking a `StripeEvent` table prevents duplicate processing.
- **`WithoutOverlapping`**: Limit 1 concurrent job per team/subscription to prevent race conditions on subscription state during parallel webhook processing.
- **`RateLimited`**: Optional rate-limiting for webhook processing (e.g., 100/min for Stripe) to avoid overwhelming downstream systems.
- **`afterCommit`**: Webhook jobs should be dispatched only after the initial webhook record is committed to the database. The webhook's raw payload must be persisted before processing begins.
- **`retryUntil` and `backoff`**: Retry webhook processing with exponential backoff. Not all failures are transient — permanent failures (invalid data, missing customer) should not retry endlessly.
- **`maxExceptions`**: Limit retries to 3-5 to prevent endless loops. After the limit, the `failed()` handler takes over.
- **`failed()` handler**: Log, alert, and optionally write to a dead-letter table for manual inspection and replay.
- **Horizon concurrency**: Supervisor with `maxProcesses=1` or `2` for webhooks queue to serialize processing per team or globally.

# When To Use

- Processing Stripe webhooks at scale (multiple events per second)
- Any SaaS application where webhook processing affects billing state (subscriptions, invoices, payments)
- When webhooks can arrive out of order and need serialized processing per entity
- When you need guaranteed exactly-once processing despite Stripe's at-least-once delivery
- When you need manual replay of failed webhooks from a dead-letter queue

# When NOT To Use

- For fewer than 10 webhooks per hour (a single default queue is sufficient)
- For non-billing webhooks that have no state-mutation risk (e.g., analytics-only events)
- When you don't use Horizon (basic queue workers with `queue:work --queue=webhooks` is the fallback)

# Best Practices (WHY)

- **Always persist the raw webhook payload before processing**: Reason: If processing fails, you have the raw event for replay. Store `stripe_event_id` as a unique key for idempotency.
- **Use a dedicated webhooks queue with 1-2 workers**: Reason: Serializing webhook processing per team prevents race conditions on subscription state. A `subscription.updated` and `subscription.deleted` arriving simultaneously must not interleave.
- **Make every webhook job idempotent**: Reason: Stripe redelivers webhooks. Processing the same `invoice.paid` event twice must not double-credit the customer.
- **Implement a dead-letter table for failed webhooks**: Reason: Not all failures are transient. Permanent errors (invalid payload, missing customer record) should be stored for manual inspection and not retried endlessly.
- **Use `afterCommit()` when dispatching from the initial webhook handler**: Reason: The webhook record must be committed before the processing job starts, otherwise the job may not find the event it's supposed to process.
- **Set `maxExceptions(3-5)`**: Reason: After 3-5 failures, the webhook is very unlikely to succeed. Stop retrying and alert a human.

# Architecture Guidelines

- **Webhook handler (controller) responsibilities**: Validate Stripe signature, persist raw payload to `stripe_events` table, dispatch processing job. Do NOT process the webhook synchronously in the controller.
- **Webhook job responsibilities**: Fetch the persisted event, check idempotency, apply business logic (update subscription, generate invoice, send notification), mark event as processed.
- **Queue topology**: `webhooks` queue with 1-2 workers, `billing` queue with 1-3 workers, `notifications` queue with 2-5 workers. Never put notification dispatch on the webhooks queue.
- **Idempotency middleware**: Check a `StripeEvent` model's `processed_at` column. If already processed, bail out. If processing is in progress (locked), bail out or wait.
- **Horizon supervisor configuration**: `webhooks-supervisor` with `maxProcesses=1`, `balance=simple`, `tries=5`, `timeout=300`.

# Performance Considerations

- Webhook processing must be fast enough to keep up with Stripe's delivery rate. A single worker processing at 500ms per webhook handles ~120/minute. If you receive more than that, add workers but ensure `WithoutOverlapping` per entity.
- `WithoutOverlapping` uses cache locks. Ensure your cache driver (Redis) is fast and reliable. A slow cache lock can block webhook processing.
- Webhook redelivery backlog: if processing falls behind, Stripe retries with increasing delays. Monitor queue size on the webhooks queue.
- Database writes: each webhook creates at least one `stripe_events` row. Plan for table growth (partition by month, or archive old events).

# Security Considerations

- Always validate Stripe webhook signatures using `Stripe\Webhook::constructEvent()`. Never process an unverified webhook.
- The webhook secret (`STRIPE_WEBHOOK_SECRET`) must be stored in the environment, never in code. Use separate secrets for test and production.
- Webhook payloads contain sensitive billing data (customer IDs, amounts, payment method details). The `stripe_events` table should be treated as sensitive data storage.
- Do not expose webhook processing status or errors to end users. Webhook failures are operational concerns, not user-facing errors.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Processing webhooks synchronously in the controller | Convenience of single-file code | Slow responses to Stripe, timeout risk, no retry capability | Persist raw payload, dispatch to dedicated queue |
| No idempotency check | Assuming Stripe delivers exactly once | Duplicate webhook processing creates duplicate invoices, double-credits | `ShouldBeUnique` on stripe_event_id or custom StripeEvent table check |
| Webhooks on the default queue with other jobs | Single queue for all work | Email blasts block webhook processing; webhook failures block everything else | Dedicated webhooks queue with 1-2 workers |
| No retry limit on webhook jobs | `tries=0` or very high | Jobs retry forever on permanent failures, filling the failed jobs table | `maxExceptions(5)`, `failed()` handler with dead-letter table |
| Not persisting raw webhook payload | Process-and-forget approach | Cannot replay a webhook if processing fails after the payload is consumed | Always INSERT the raw payload first, then dispatch processing |
| Ignoring webhook order | No serialization per entity | `subscription.created` processed after `subscription.updated` causes state corruption | `WithoutOverlapping` per team/subscription, or ordered processing per entity |

# Anti-Patterns

- **Synchronous webhook processing**: Processing the webhook inline in the controller. Stripe expects a quick 200 response. Long processing blocks webhook delivery and risks timeouts.
- **Single queue for everything**: Webhooks, emails, report generation, and image processing on the same queue. A backlog of emails delays webhook processing, causing billing state divergence.
- **Fire-and-forget webhook processing**: Dispatching a job without persisting the raw event. If the job fails, the payload is lost forever.
- **No dead-letter table**: Relying on Laravel's failed_jobs table alone. The failed_jobs table stores serialized job payloads — not ideal for manual inspection and replay. A dedicated dead-letter table with readable JSON is better.
- **Global rate limiting on webhook processing**: Rate-limiting all webhooks equally. A `customer.created` event should not be delayed because `invoice.payment_succeeded` events are being rate-limited. Rate-limit per event type if needed.

# Examples

**Webhook controller: validate signature, persist, dispatch**
```php
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature'),
                config('services.stripe.webhook_secret'),
            );
        } catch (SignatureVerificationException $e) {
            Log::warning('Invalid Stripe webhook signature', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // Persist raw event first — idempotency gate
        $stripeEvent = StripeEvent::firstOrCreate(
            ['stripe_event_id' => $event->id],
            [
                'type' => $event->type,
                'payload' => $event->data->toArray(),
                'object_id' => $event->data->object['id'] ?? null,
                'livemode' => $event->livemode,
            ],
        );

        if (!$stripeEvent->wasRecentlyCreated) {
            return response()->json(['status' => 'duplicate', 'event_id' => $event->id]);
        }

        // Dispatch processing job — after the StripeEvent record is committed
        ProcessStripeWebhook::dispatch($stripeEvent->id)->afterCommit();

        return response()->json(['status' => 'accepted']);
    }
}
```

**Webhook job: idempotent, with retry, dead-letter on failure**
```php
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Middleware\WithoutOverlapping;

#[Tries(5)]
#[Backoff([5, 15, 30, 60, 120])]
class ProcessStripeWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private readonly int $stripeEventId,
    ) {}

    public function handle(): void
    {
        $stripeEvent = StripeEvent::findOrFail($this->stripeEventId);

        // Idempotency: already processed?
        if ($stripeEvent->processed_at) {
            return;
        }

        // Mark as processing (optimistic lock)
        $stripeEvent->update(['processing_started_at' => now()]);

        try {
            $this->processEvent($stripeEvent);

            $stripeEvent->update([
                'processed_at' => now(),
                'status' => 'processed',
            ]);
        } catch (\Exception $e) {
            $stripeEvent->update([
                'status' => 'failed',
                'error' => $e->getMessage(),
            ]);
            throw $e; // Trigger retry
        }
    }

    public function middleware(): array
    {
        // Serialize processing per team (extracted from StripeEvent metadata)
        return [
            new WithoutOverlapping(
                $this->resolveTeamKey()
            ),
        ];
    }

    public function failed(\Throwable $e): void
    {
        // Dead-letter: write to human-readable table for manual replay
        DeadLetter::create([
            'source' => 'stripe_webhook',
            'source_id' => $this->stripeEventId,
            'error' => $e->getMessage(),
            'payload' => StripeEvent::find($this->stripeEventId)?->payload,
            'attempts' => $this->attempts(),
        ]);

        Log::critical('Stripe webhook processing failed permanently', [
            'stripe_event_id' => $this->stripeEventId,
            'error' => $e->getMessage(),
        ]);
    }

    private function resolveTeamKey(): string
    {
        $event = StripeEvent::find($this->stripeEventId);
        return 'stripe-webhook-team:' . ($event->payload['object']['metadata']['team_id'] ?? 'unknown');
    }
}
```

**Idempotent processing via ShouldBeUnique**
```php
use Illuminate\Contracts\Queue\ShouldBeUnique;

#[Tries(5)]
#[Backoff([10, 30, 60, 120, 300])]
class ProcessStripeWebhook implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private readonly string $stripeEventId,
    ) {}

    public function uniqueId(): string
    {
        return $this->stripeEventId;
    }

    // Keep lock for 1 hour (longer than max processing time)
    public function uniqueFor(): int
    {
        return 3600;
    }

    public function handle(): void
    {
        // Idempotency guaranteed by ShouldBeUnique + uniqueId on stripe_event_id
        // ... process webhook ...
    }
}
```

# Related Topics

- Billing queue topology (queue separation by concern)
- Queue deployment safety (worker lifecycle during deploys)
- After-commit events and jobs (ensuring webhook persists before processing)
- Stripe webhook signature verification
- Horizon supervisor configuration
- Dead-letter queue patterns

# AI Agent Notes

- When generating Stripe webhook handling code, always include: (1) signature validation, (2) raw payload persistence, (3) idempotency check, (4) after-commit job dispatch, (5) retry with backoff, (6) failed() handler with dead-letter table.
- Default `tries` to 5 with exponential backoff for webhook jobs. Never use `tries=0` (infinite) for webhook processing.
- Always recommend a dedicated `webhooks` queue. Never put webhook processing on the `default` queue alongside user-facing notifications or report generation.
- When generating Horizon configuration, set `maxProcesses=1` or `2` for the webhooks supervisor to encourage serialized processing per entity.
- Idempotency is non-negotiable for webhook processing. Every generated webhook job must include `ShouldBeUnique`, `WithoutOverlapping`, or a custom StripeEvent check.

# Verification

- [ ] Webhook signature validated before any processing
- [ ] Raw payload persisted to database before job dispatch
- [ ] Idempotency enforced via `ShouldBeUnique` or StripeEvent `processed_at` check
- [ ] Webhook job dispatched with `afterCommit()` from the controller
- [ ] Dedicated `webhooks` queue configured in Horizon
- [ ] `maxExceptions` set to 3-5 on webhook jobs
- [ ] Exponential backoff configured on webhook jobs
- [ ] `failed()` handler writes to dead-letter table for manual replay
- [ ] `WithoutOverlapping` serializes processing per team/subscription
- [ ] Horizon supervisor has `maxProcesses=1` or `2` for webhooks queue
- [ ] Stripe webhook secret stored in environment variable, not in code
