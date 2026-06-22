# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Stripe Webhook Idempotency & Event Deduplication
Difficulty Level: Advanced
Last Updated: 2026-06-22
Status: Standardized

---

# Overview

Stripe webhooks are the backbone of SaaS billing synchronization, but they are NOT guaranteed exactly-once delivery. Stripe may retry a webhook multiple times if your endpoint doesn't respond with 2xx quickly enough, or due to internal Stripe retries. Idempotent webhook processing — detecting and gracefully handling duplicate events — is mandatory for production billing systems. A single duplicate webhook that double-charges a customer or double-provisions a subscription is a customer trust disaster.

---

# Core Concepts

This knowledge unit addresses idempotent Stripe webhook processing, event deduplication, concurrent webhook handling, and webhook signature verification for Laravel applications.

## The Core Pattern

```
Stripe Webhook → Controller (verify signature)
    → StripeEvent model (unique on stripe_event_id)
        → If already processed → 200 OK (idempotent)
        → If new → ProcessStripeEvent job → update status → 200 OK
```

## StripeEvent Model

```php
// app/Models/StripeEvent.php
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;

#[Table('stripe_events')]
#[Fillable(['stripe_event_id', 'type', 'payload', 'status', 'processed_at'])]
#[Casts(['payload' => 'array', 'processed_at' => 'datetime'])]
class StripeEvent extends Model
{
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_PROCESSED = 'processed';
    const STATUS_FAILED = 'failed';
    const STATUS_SKIPPED = 'skipped';
}
```

## Migration

```php
Schema::create('stripe_events', function (Blueprint $table) {
    $table->id();
    $table->string('stripe_event_id')->unique();  // evt_xxx from Stripe
    $table->string('type');                         // customer.subscription.created, etc.
    $table->json('payload');                        // Full raw webhook payload
    $table->string('status')->default('pending');
    $table->timestamp('processed_at')->nullable();
    $table->text('error_message')->nullable();      // If processing failed
    $table->timestamps();

    $table->index('status');
    $table->index('type');
    $table->index('created_at');
});
```

---

# When To Use

- Every SaaS application that processes Stripe webhooks (this is all of them)
- When billing state changes must be accurately reflected in the application
- When duplicate webhook processing could cause double-charging, double-provisioning, or data corruption

---

# When NOT To Use

- Never skip this. Idempotency is not optional for production billing. Even a development/staging environment benefits from deduplication to avoid confusing state.

---

# Best Practices

1. **Deduplicate at the database level, not in application memory.** The `stripe_event_id` unique constraint is the final guard against concurrent duplicates. Use `DB::transaction()` and catch the unique constraint violation.

2. **Return 200 quickly, process asynchronously.** The webhook controller should insert the event and dispatch a job, then return 200. Stripe expects a response within 20 seconds. Heavy processing (subscription updates, email notifications) belongs in the queued job.

3. **Idempotent processing means replay without side effects.** The ProcessStripeEvent job must be safe to run multiple times for the same event. Use "upsert" operations (updateOrCreate, upsert) rather than raw inserts.

4. **Log every webhook, even duplicates.** If a duplicate arrives, log it (with a "duplicate" status or note) for debugging. Silent handling of duplicates makes troubleshooting impossible.

5. **Verify webhook signatures.** Never process an unverified webhook. The signature verification proves the payload came from Stripe, not an attacker.

---

# Architecture Guidelines

## Webhook Controller

```php
// App\Http\Controllers\StripeWebhookController.php
namespace App\Http\Controllers;

use App\Models\StripeEvent;
use App\Jobs\ProcessStripeEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class StripeWebhookController
{
    public function __invoke(Request $request): Response
    {
        // 1. Verify webhook signature
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret = config('cashier.webhook.secret');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (SignatureVerificationException $e) {
            \Log::warning('Stripe webhook signature verification failed', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);
            return response('Invalid signature', 400);
        } catch (\UnexpectedValueException $e) {
            \Log::warning('Stripe webhook invalid payload', [
                'error' => $e->getMessage(),
            ]);
            return response('Invalid payload', 400);
        }

        // 2. Deduplicate and persist
        try {
            DB::transaction(function () use ($event) {
                $stripeEvent = StripeEvent::firstOrCreate(
                    ['stripe_event_id' => $event->id],
                    [
                        'type' => $event->type,
                        'payload' => $event->toArray(),
                        'status' => StripeEvent::STATUS_PENDING,
                    ],
                );

                // Only dispatch job for newly created events
                if ($stripeEvent->wasRecentlyCreated) {
                    ProcessStripeEvent::dispatch($stripeEvent);
                }
                // If it already existed, this is a duplicate — idempotent 200
            });
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            // Concurrent webhook race: another process inserted this event
            // between our firstOrCreate check and insert. This is fine — return 200.
            \Log::info('Stripe webhook race condition caught', [
                'stripe_event_id' => $event->id,
                'type' => $event->type,
            ]);
        }

        return response('OK', 200);
    }
}
```

## ProcessStripeEvent Job

```php
// App\Jobs\ProcessStripeEvent.php
namespace App\Jobs;

use App\Models\StripeEvent;
use App\Billing\Handlers\SubscriptionCreatedHandler;
use App\Billing\Handlers\SubscriptionUpdatedHandler;
use App\Billing\Handlers\SubscriptionDeletedHandler;
use App\Billing\Handlers\InvoicePaymentSucceededHandler;
use App\Billing\Handlers\InvoicePaymentFailedHandler;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Bus\Queueable;

class ProcessStripeEvent implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10; // seconds between retries

    public int $uniqueFor = 300; // 5 minutes unique lock

    public function __construct(
        public StripeEvent $stripeEvent,
    ) {}

    public function uniqueId(): string
    {
        // Ensure only one job processes this event at a time
        return 'stripe-event:' . $this->stripeEvent->stripe_event_id;
    }

    public function handle(): void
    {
        // Guard: skip if already processed
        if ($this->stripeEvent->status === StripeEvent::STATUS_PROCESSED) {
            return;
        }

        // Mark as processing (prevents concurrent job from picking it up)
        $this->stripeEvent->update(['status' => StripeEvent::STATUS_PROCESSING]);

        try {
            $handler = $this->resolveHandler();
            $handler->handle($this->stripeEvent->payload);

            $this->stripeEvent->update([
                'status' => StripeEvent::STATUS_PROCESSED,
                'processed_at' => now(),
            ]);
        } catch (\Throwable $e) {
            $this->stripeEvent->update([
                'status' => StripeEvent::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);

            throw $e; // Re-throw to trigger retry
        }
    }

    private function resolveHandler(): object
    {
        return match ($this->stripeEvent->type) {
            'customer.subscription.created' => app(SubscriptionCreatedHandler::class),
            'customer.subscription.updated' => app(SubscriptionUpdatedHandler::class),
            'customer.subscription.deleted' => app(SubscriptionDeletedHandler::class),
            'invoice.payment_succeeded' => app(InvoicePaymentSucceededHandler::class),
            'invoice.payment_failed' => app(InvoicePaymentFailedHandler::class),
            default => throw new \InvalidArgumentException(
                "No handler for event type: {$this->stripeEvent->type}"
            ),
        };
    }
}
```

## Example Handler — Subscription Created

```php
// App\Billing\Handlers\SubscriptionCreatedHandler.php
namespace App\Billing\Handlers;

use App\Models\Team;
use App\Models\Plan;
use App\Services\EntitlementService;

class SubscriptionCreatedHandler
{
    public function __construct(
        private EntitlementService $entitlements,
    ) {}

    public function handle(array $payload): void
    {
        $subscriptionData = $payload['data']['object'];
        $teamId = $subscriptionData['metadata']['team_id'] ?? null;

        if (!$teamId) {
            \Log::warning('Subscription created without team_id metadata', [
                'stripe_subscription_id' => $subscriptionData['id'],
            ]);
            return;
        }

        $team = Team::findOrFail($teamId);
        $plan = Plan::where('stripe_price_id', $subscriptionData['items']['data'][0]['price']['id'])->first();

        if (!$plan) {
            \Log::error('Unknown Stripe price on subscription created', [
                'stripe_price_id' => $subscriptionData['items']['data'][0]['price']['id'],
            ]);
            return;
        }

        // Upsert — idempotent: safe to replay
        $team->subscription()->updateOrCreate(
            ['stripe_id' => $subscriptionData['id']],
            [
                'plan_id' => $plan->id,
                'stripe_status' => $subscriptionData['status'],
                'trial_ends_at' => $subscriptionData['trial_end'] ?? null,
                'current_period_start' => $subscriptionData['current_period_start'] ?? null,
                'current_period_end' => $subscriptionData['current_period_end'] ?? null,
            ],
        );

        // Invalidate entitlement cache — forces recomputation on next access
        $this->entitlements->invalidateCache($team);
    }
}
```

## Race Condition Handling

Two concurrent webhooks for the same event can both pass the `firstOrCreate` check before either inserts. The unique index on `stripe_event_id` prevents double-insert:

```
Process A: firstOrCreate → wasRecentlyCreated = true → dispatch job
Process B: firstOrCreate → wasRecentlyCreated = false → return 200 ✓

OR (race):

Process A: check exists → not found
Process B: check exists → not found
Process A: INSERT → succeeds
Process B: INSERT → UniqueConstraintViolationException → catch → return 200 ✓
```

The `ShouldBeUnique` contract on the job provides an additional guard: if two processes somehow dispatch for the same event ID, only one job runs.

---

# Performance Considerations

- Webhook endpoint must return 200 within 20 seconds. Move all processing to a queued job.
- Use Redis queue driver for low latency job dispatch.
- The unique index on `stripe_event_id` is fast (B-tree lookup) and handles thousands of webhooks per minute.
- Periodically prune old StripeEvent records (90+ days) to keep the table lean.
- Consider batching: if you receive many `invoice.payment_succeeded` events close together, you could batch them — but the dedup pattern already handles this efficiently.

---

# Security Considerations

- **Always verify webhook signatures.** Unverified webhooks allow attackers to forge billing events (cancel subscription, change plan).
- Rotate webhook signing secrets periodically and have a plan for zero-downtime rotation (accept old + new secrets during transition).
- Rate-limit the webhook endpoint. Stripe sends bursts during invoice runs — ensure your queue can handle the load.
- Webhook payloads may contain PII (customer email, billing address). The StripeEvent table should be treated as sensitive data.
- Never echo raw webhook payloads in error responses or debug output.
- Consider IP restriction: Stripe publishes their webhook IP ranges. If your network setup allows, restrict inbound webhooks to those IPs.

---

# Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Not deduplicating webhooks | Duplicate 'invoice.paid' sends two receipts; duplicate 'subscription.deleted' corrupts state | StripeEvent model with unique constraint on stripe_event_id |
| Processing webhooks synchronously | Stripe times out (20s) and retries, causing duplicate processing | Always dispatch a queued job |
| Not handling the race condition | Concurrent duplicates bypass application-level checks | Unique index on stripe_event_id + catch UniqueConstraintViolationException |
| Skipping signature verification | Attackers forge webhooks to cancel subscriptions or grant access | `Webhook::constructEvent()` with signing secret |
| Forgetting ShouldBeUnique on the job | Two workers pick up the same event simultaneously | `implements ShouldBeUnique` with uniqueId() returning stripe_event_id |
| Idempotent handler that isn't actually idempotent | Using `create()` instead of `updateOrCreate()` | Every handler must use upsert operations |
| No retry logic on failed events | Transient failures (DB lock, network) leave events permanently unprocessed | Job `$tries = 3` with exponential backoff |
| Hardcoding webhook secret | Secret appears in git history and logs | Use `config('cashier.webhook.secret')` from env |

---

# Related Topics

Prerequisites: Laravel Queues (Redis), Stripe account configuration, Cashier setup
Related: Webhook audit and replay, Subscription drift reconciliation, Cashier BillingGateway wrapper, Billing failure states

---

# AI Agent Notes

1. Idempotency is the single most critical concern in webhook processing. Design for it from the start, not as an afterthought.
2. The StripeEvent model is also your audit log. Every webhook — processed, duplicate, or failed — should be recorded.
3. Always use `updateOrCreate` or `upsert` in webhook handlers, never `create`. If a handler can't be idempotent, redesign it.
4. The `ShouldBeUnique` contract is a secondary guard. The primary guard is the unique database constraint.
5. Test webhook idempotency explicitly: send the same webhook twice and verify only one subscription/customer is created.
6. Test the concurrent race condition: in tests, you can simulate it by temporarily removing the unique constraint, dispatching two events simultaneously, then verifying only one takes effect.
7. Webhook handlers should be small, focused classes — one per event type. Don't create a single giant "WebhookHandler" with a switch statement.
8. The webhook controller must never call Cashier directly. All processing goes through the job → handler → BillingGateway chain.

---

# Verification

- [ ] Signature verification implemented in webhook controller
- [ ] StripeEvent model has unique index on stripe_event_id
- [ ] Webhook controller uses firstOrCreate for deduplication
- [ ] ProcessStripeEvent job implements ShouldBeUnique
- [ ] All handlers use upsert operations (updateOrCreate, upsert)
- [ ] Webhook controller returns 200 for both new and duplicate events
- [ ] UniqueConstraintViolationException is caught for concurrent race
- [ ] Webhook controller responds within 20 seconds (processing is async)
- [ ] Test: same webhook sent twice → only one subscription created
- [ ] Test: concurrent webhooks → no duplicate processing
- [ ] Test: invalid signature → 400 response
- [ ] Retry logic: failed events retry up to 3 times
- [ ] Failed events logged with error message
