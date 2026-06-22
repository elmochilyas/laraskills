# Rules — Webhook Queue Design for Billing Systems

## Rule 1: Always Persist Raw Webhook Payload Before Processing
| Field | Value |
|-------|-------|
| **Name** | Always Persist Raw Webhook Payload Before Processing |
| **Category** | Data Integrity |
| **Rule** | Always INSERT the raw webhook payload into a `stripe_events` table (or equivalent) before dispatching a processing job. Never process-and-forget the raw payload — if the job fails, the payload is lost forever and cannot be replayed. |
| **Reason** | Stripe webhooks carry billing state transitions (subscription created, payment succeeded, invoice finalized). If the processing job fails and the raw payload was not persisted, there is no way to replay the event. The team must then reconstruct the event from Stripe's dashboard or API, which is error-prone and slow during an incident. |
| **Bad Example** | `ProcessStripeWebhook::dispatch($event->data->toArray())` — dispatches a job with the parsed payload, but if the job fails at the queue level (Redis outage, memory exhaustion), the payload is in the failed_jobs table as a serialized blob, not queryable or replayable. |
| **Good Example** | `$stripeEvent = StripeEvent::firstOrCreate(['stripe_event_id' => $event->id], ['type' => $event->type, 'payload' => $event->data->toArray()]); ProcessStripeWebhook::dispatch($stripeEvent->id)->afterCommit();` — persists first, dispatches after DB commit. |
| **Exceptions** | Webhook events that are purely informational (no state mutation) and where loss is acceptable, such as `charge.refund.updated` when you don't track refund statuses locally. Still prefer persistence for auditability. |
| **Consequences Of Violation** | Irrecoverable loss of billing events. Subscription state drifts from Stripe's truth. Customers lose paid access or retain access without payment. Requires manual Stripe API reconciliation — slow and error-prone during incidents. |

## Rule 2: Never Process Webhooks Synchronously in the Controller
| Field | Value |
|-------|-------|
| **Name** | Never Process Webhooks Synchronously in the Controller |
| **Category** | Resilience |
| **Rule** | The Stripe webhook controller must only validate the signature, persist the raw payload, and dispatch a processing job. Never perform business logic (subscription updates, invoice generation, notification sending) inline in the controller. |
| **Reason** | Stripe expects a 200 response within ~20 seconds. Synchronous processing risks timeouts, which Stripe interprets as failure and triggers redelivery. Long processing also blocks the HTTP worker, reducing capacity for other webhooks. If the inline logic throws an exception, the webhook endpoint returns 500 — Stripe retries, potentially re-processing a partially-applied state change. |
| **Bad Example** | ```php
public function __invoke(Request $request) {
    $event = Webhook::constructEvent(...);
    $subscription = Subscription::where('stripe_id', $event->data->object['id'])->first();
    $subscription->update(['status' => 'active']); // inline business logic
    Mail::to($subscription->user)->send(new SubscriptionConfirmed($subscription)); // blocks HTTP response
}
``` |
| **Good Example** | ```php
public function __invoke(Request $request) {
    $event = Webhook::constructEvent(...);
    $stripeEvent = StripeEvent::firstOrCreate(['stripe_event_id' => $event->id], [...]);
    if ($stripeEvent->wasRecentlyCreated) {
        ProcessStripeWebhook::dispatch($stripeEvent->id)->afterCommit();
    }
    return response()->json(['status' => 'accepted']);
}
``` |
| **Exceptions** | Health-check webhooks or webhooks that only need to acknowledge receipt with no processing. Also, during local development/debugging synchronous processing is acceptable for rapid iteration. |
| **Consequences Of Violation** | Timeouts cause Stripe redelivery storms. Partial state changes from failed inline processing corrupt billing state. HTTP worker pool exhaustion under high webhook volume. |

## Rule 3: Enforce Idempotency on Every Webhook Job
| Field | Value |
|-------|-------|
| **Name** | Enforce Idempotency on Every Webhook Job |
| **Category** | Data Integrity |
| **Rule** | Every webhook processing job must be idempotent. Use `ShouldBeUnique` (keyed on `stripe_event_id`), a `StripeEvent` `processed_at` column check, or a custom idempotency middleware. Stripe delivers webhooks with at-least-once semantics — processing the same `invoice.paid` event twice must not double-credit the customer. |
| **Reason** | Stripe redelivers webhooks for transient failures, network issues, or if your endpoint returns 5xx. Without idempotency, a redelivered `invoice.payment_succeeded` event creates duplicate revenue records. A redelivered `customer.subscription.deleted` event may attempt to cancel an already-cancelled subscription, triggering confusing error states. |
| **Bad Example** | A job with no duplicate check: `public function handle() { Invoice::create(['amount' => $payload['amount'], ...]); }` — every redelivery creates a new invoice. |
| **Good Example** | `ShouldBeUnique` with `uniqueId()` returning `$this->stripeEventId`, or a database check: `if ($stripeEvent->processed_at) return; $stripeEvent->update(['processing_started_at' => now()]);` before applying business logic. |
| **Exceptions** | Webhooks for events that are inherently idempotent by nature (e.g., `charge.succeeded` when you only log it and never mutate state). Still, idempotency is cheap insurance — prefer adding it by default. |
| **Consequences Of Violation** | Duplicate charges, double-credited accounts, duplicate invoice records, corrupted subscription state transitions. A Stripe redelivery storm during a partial outage amplifies the damage. |

## Rule 4: Serialize Webhook Processing Per Entity with WithoutOverlapping
| Field | Value |
|-------|-------|
| **Name** | Serialize Webhook Processing Per Entity with WithoutOverlapping |
| **Category** | Concurrency |
| **Rule** | Use `WithoutOverlapping` middleware keyed on the team or subscription ID to ensure only one webhook per entity processes at a time. Webhooks for the same subscription (`subscription.updated`, `subscription.deleted`) can arrive simultaneously and must not interleave their state mutations. |
| **Reason** | Stripe can deliver multiple webhooks for the same resource concurrently. A `subscription.updated` and `subscription.deleted` arriving at the same time, processed by different workers, can produce corrupted state: the delete handler sets `status = 'cancelled'`, then the update handler overwrites it back to `status = 'active'` based on stale data. Serializing per entity prevents this race condition. |
| **Bad Example** | Ten workers all picking up webhooks for the same subscription simultaneously with no locking — race conditions on subscription state. |
| **Good Example** | `new WithoutOverlapping('stripe-webhook-team:' . $teamId)` in the job's `middleware()` method. Only one worker processes webhooks for that team at a time. |
| **Exceptions** | When you are certain that webhooks for a given entity cannot interleave (e.g., you process all webhooks synchronously, or you have a single worker). Also, when the webhook type is stateless and order-independent (e.g., `charge.refunded` with no state update). |
| **Consequences Of Violation** | Subscription state corruption from interleaved webhook processing. A customer is both active and cancelled. Invoice statuses flip inconsistently. These bugs are intermittent and extremely difficult to reproduce and debug. |

## Rule 5: Set a Finite Retry Limit with maxExceptions and a failed() Handler
| Field | Value |
|-------|-------|
| **Name** | Set a Finite Retry Limit with maxExceptions and a failed() Handler |
| **Category** | Resilience |
| **Rule** | Never use `tries=0` (infinite) for webhook processing jobs. Set `maxExceptions(3-5)` with exponential backoff. Implement a `failed()` handler that writes to a human-readable dead-letter table for manual inspection and replay. Not all failures are transient — permanent failures (invalid payload, missing customer record, Stripe API auth error) should stop retrying after a finite number of attempts. |
| **Reason** | Infinite retries for a permanent failure (e.g., a webhook referencing a customer that was deleted from Stripe) wastes worker resources indefinitely and fills the failed_jobs table. The dead-letter table provides a queryable, human-readable record of what failed permanently, enabling support staff to replay after manual resolution. |
| **Bad Example** | `#[Tries(0)]` on a webhook job — the job retries forever on a permanent failure. Workers waste CPU on doomed retries. |
| **Good Example** | ```php
#[Tries(5)]
#[Backoff([5, 15, 30, 60, 120])]
class ProcessStripeWebhook implements ShouldQueue {
    public function failed(\Throwable $e): void {
        DeadLetter::create([
            'source' => 'stripe_webhook',
            'source_id' => $this->stripeEventId,
            'error' => $e->getMessage(),
            'payload' => StripeEvent::find($this->stripeEventId)?->payload,
        ]);
        Log::critical('Stripe webhook processing failed permanently', [
            'stripe_event_id' => $this->stripeEventId,
        ]);
    }
}
``` |
| **Exceptions** | Health-check jobs or one-off maintenance tasks where permanent failure is impossible by definition. For billing webhooks specifically, always use a finite limit. |
| **Consequences Of Violation** | Workers permanently occupied retrying doomed jobs. Dead-letter queue absent — no visibility into permanent failures. Support staff cannot replay failed webhooks without direct database access. Permanent failures silently accumulate for days or weeks. |
