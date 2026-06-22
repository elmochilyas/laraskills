# Metadata

- **Domain:** Observability & Production Intelligence
- **Subdomain:** Billing Observability
- **Knowledge Unit:** Billing Production Observability Metrics
- **Knowledge ID:** KXXX-billing-production-metrics
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-22
- **Source References:**
  - Stripe Docs — Webhooks: Best Practices
  - Laravel Docs — Cashier/Spark webhook handling
  - Laravel Pulse — Custom Cards
  - Prometheus — Metric Types (Counter, Gauge, Histogram)

---

# Overview

Billing production observability goes beyond generic application monitoring. It requires tracking the complete lifecycle of every billing event — webhook receipt, validation, deduplication, job dispatch, execution, completion, and failure. The key metrics form a pipeline: `stripe_webhook_received_count` (incoming volume), `stripe_webhook_processed_count` (successful completions), `stripe_webhook_failed_count` (processing failures), `stripe_webhook_duplicate_count` (idempotent deduplication), `stripe_webhook_processing_latency` (end-to-end time), and `subscription_drift_count` (data integrity). Infrastructure metrics include `billing_queue_depth`, `failed_billing_jobs` (by type and reason), `feature_gate_denial_count`, and `permission_denial_spikes`. Correlation IDs enable end-to-end tracing. Pulse dashboards, Sentry/Bugsnag alerts, and manual replay UI complete the observability system.

---

# Core Concepts

- **Pipeline metrics**: Counters at each stage: received, validated, deduplicated, dispatched, processing, completed, failed.
- **Webhook metrics**: `received_count`, `processed_count`, `failed_count`, `duplicate_count`, `processing_latency`.
- **Integrity metrics**: `subscription_drift_count` (local vs Stripe state divergence), `billing_queue_depth` (backlog).
- **Failure metrics**: `failed_billing_jobs` by type (`invoice.payment_failed`, `customer.subscription.deleted`) and reason (`network_timeout`, `invalid_payload`, `rate_limited`).
- **Anomaly metrics**: `feature_gate_denial_count` (unexpected feature access denial), `permission_denial_spikes` (security or misconfiguration indicator).
- **Correlation IDs**: UUID at webhook entry, propagated through job constructor, logged at every step, stored in `billing_events` audit table.
- **Alert thresholds**: Based on historical baselines. Webhook volume drop >50% = possible delivery failure. Processing latency > p99 = queue backlog. Drift > 0 = critical investigation.
- **Pulse dashboards**: Custom `BillingMetrics` card showing real-time pipeline metrics, queue depth, and failure rates.
- **Sentry/Bugsnag**: Billing exceptions grouped by webhook event type, with correlation IDs in exception context.
- **Replay UI**: Admin panel to manually replay failed webhooks after investigation.

---

# When To Use

- Any production Laravel application with Stripe billing (Cashier, Spark, or custom)
- When billing revenue depends on webhook processing reliability
- When you need to detect billing anomalies before customers report them
- When you need audit trails for billing events (compliance, customer disputes)
- When billing failures must trigger immediate on-call response

---

# When NOT To Use

- Applications without billing (no webhooks to monitor)
- Only using Stripe Checkout (no server-side webhook processing)
- Very low volume (< 10 webhooks/day) where manual monitoring suffices
- When a third-party billing platform (Chargebee, Recurly) handles webhooks — but still monitor their delivery

---

# Best Practices

- **Track every stage of the webhook pipeline.** Don't just track "processed." Track received, validated, deduplicated, dispatched, processing, completed, failed. *Why: A webhook that's received but never dispatched indicates a queue problem. A webhook that's dispatched but never completed indicates a processing bug. Without per-stage metrics, you can't localize the failure.*
- **Use correlation IDs end-to-end.** Generate a UUID at the webhook controller, pass it to the job, log it in every handler step, store it in the audit table. *Why: Debugging a failed billing event without correlation IDs requires manual log correlation by timestamp and user ID — 10-30 minutes per incident. With correlation IDs, it's a single log query.*
- **Alert on subscription drift.** Any drift between local subscription state and Stripe's state is a revenue-critical issue. *Why: A customer whose local subscription shows "active" but Stripe shows "canceled" has access they shouldn't. A customer whose local shows "canceled" but Stripe shows "active" is being billed without service. Both are revenue-impacting.*
- **Dedicated billing queue with separate monitoring.** Billing jobs impact revenue directly. They must not compete with general application jobs for worker time. *Why: A queue backup from a marketing email campaign should not delay payment processing. Dedicated billing queues with separate workers prevent this.*
- **Configure alert thresholds based on historical baselines, not fixed values.** A 50% drop in webhook volume at 3 AM may be normal (low traffic). The same drop at 3 PM is anomalous. *Why: Fixed thresholds ("alert if < 100 webhooks/hour") fire falsely during low-traffic periods and miss real anomalies during high-traffic periods. Baseline comparison catches relative changes.*

---

# Performance Considerations

- Metric emission: `Cache::increment()` adds ~1ms per metric at each pipeline stage. ~6-8ms total per webhook for per-stage counter increments.
- For high-throughput (>100 webhooks/second), use StatsD/UDP or Prometheus pushgateway — fire-and-forget, no blocking.
- Correlation ID logging: one UUID per log entry (~36 bytes). Negligible.
- Subscription drift reconciliation: one Stripe API call per active subscription. Batch this (100 per minute) to stay within Stripe rate limits.
- Pulse storage: billing metrics stored in `pulse_entries`. Configure retention to prevent unbounded growth.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Only tracking "processed" metric | Simplified monitoring | Cannot localize failures (queue? handler? validation?) | Per-stage metrics (received, validated, dispatched, processed, failed) |
| No correlation IDs | Manual log correlation | Slow debugging (10-30 min per incident) | UUID at webhook entry, propagated through all layers |
| Same queue as general app jobs | Queue consolidation | Billing delayed by non-critical job backlog | Dedicated billing queue with separate workers |
| Fixed alert thresholds | No baseline analysis | False alerts during low-traffic, missed anomalies during high-traffic | Baseline comparison (same hour last week) |
| No subscription drift detection | Implicit trust in webhooks | Revenue leakage undetected for days/weeks | Daily reconciliation job with zero-drift alert |
| Not monitoring feature gate denials | Gate assumed working | Billing features silently disabled for all users | Denial counter with anomaly detection |

---

# Examples

```php
// Webhook controller with per-stage metrics and correlation IDs
class StripeWebhookController extends Controller
{
    public function handleWebhook(Request $request): JsonResponse
    {
        $correlationId = (string) Str::uuid();
        $startTime = microtime(true);

        // Stage 1: Received
        Cache::increment('stripe_webhook_received_count');
        Log::info('Stripe webhook received', [
            'correlation_id' => $correlationId,
            'event_type' => $request->input('type'),
        ]);

        // Stage 2: Validated (signature check)
        try {
            $event = StripeWebhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature'),
                config('services.stripe.webhook_secret'),
            );
            Cache::increment('stripe_webhook_validated_count');
        } catch (\Exception $e) {
            Cache::increment('stripe_webhook_validation_failed_count');
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // Stage 3: Deduplicated
        if (Cache::get("stripe_webhook:{$event->id}")) {
            Cache::increment('stripe_webhook_duplicate_count');
            return response()->json(['status' => 'duplicate'], 200);
        }
        Cache::put("stripe_webhook:{$event->id}", true, 86400);

        // Stage 4: Dispatched
        ProcessStripeWebhook::dispatch($event, $correlationId);

        // Stage 5: Latency recorded after job completes (in job handler)
        return response()->json(['status' => 'dispatched', 'correlation_id' => $correlationId]);
    }
}
```

```php
// Job handler with completion metrics
class ProcessStripeWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public object $event,
        public string $correlationId,
    ) {}

    public function handle(): void
    {
        Log::info('Processing billing webhook', [
            'correlation_id' => $this->correlationId,
            'event_type' => $this->event->type,
        ]);

        try {
            match ($this->event->type) {
                'invoice.payment_succeeded' => $this->handlePaymentSucceeded(),
                'customer.subscription.deleted' => $this->handleSubscriptionDeleted(),
                // ...
            };

            Cache::increment('stripe_webhook_processed_count');
            Log::info('Webhook processed', ['correlation_id' => $this->correlationId]);

        } catch (\Exception $e) {
            Cache::increment('stripe_webhook_failed_count');
            Cache::increment("failed_billing_jobs:{$this->event->type}");
            Log::error('Webhook processing failed', [
                'correlation_id' => $this->correlationId,
                'event_type' => $this->event->type,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
```

```php
// Pulse custom billing card
class BillingMetrics extends Card
{
    public function render(): View
    {
        return view('pulse.billing-metrics', [
            'received' => Cache::get('stripe_webhook_received_count', 0),
            'processed' => Cache::get('stripe_webhook_processed_count', 0),
            'failed' => Cache::get('stripe_webhook_failed_count', 0),
            'duplicates' => Cache::get('stripe_webhook_duplicate_count', 0),
            'queueDepth' => Redis::llen('queues:billing'),
            'failedJobs' => DB::table('failed_jobs')
                ->where('queue', 'billing')
                ->where('failed_at', '>', now()->subDay())
                ->count(),
        ]);
    }
}
```

---

# Related Topics

- **K062 Stripe Webhook Handling** — Webhook processing patterns
- **K046 `$tries` and `$maxExceptions`** — Retry behavior for failed billing jobs
- **K055 `ShouldBeUnique`** — Webhook deduplication patterns
- **Pulse Documentation** — Custom cards, slow job detection
- **Sentry/Bugsnag** — Exception tracking and grouping
- **Prometheus** — Metric types (Counter, Gauge, Histogram) and alerting rules
