# Rule Card: Billing Production Observability Metrics

---

## Rule 1

**Rule Name:** track-webhook-pipeline-per-stage

**Category:** Always

**Rule:** Always emit a metric at each stage of the billing webhook pipeline: received, validated, deduplicated, dispatched, processed, and failed.

**Reason:** A single "processed" metric cannot localize failures. A webhook that's received but never dispatched indicates a queue problem. A webhook that's dispatched but never processed indicates a handler bug. Without per-stage metrics, you cannot determine where in the pipeline the failure occurred.

**Bad Example:**
```php
class StripeWebhookController
{
    public function handle(Request $request): JsonResponse
    {
        ProcessWebhook::dispatch(StripeWebhook::constructEvent(...));
        Cache::increment('stripe_webhook_processed_count'); // Only one metric
        return response()->json(['status' => 'ok']);
    }
}
```

**Good Example:**
```php
Cache::increment('stripe_webhook_received_count');     // Stage 1
Cache::increment('stripe_webhook_validated_count');     // Stage 2
Cache::increment('stripe_webhook_deduplicated_count');  // Stage 3
Cache::increment('stripe_webhook_dispatched_count');    // Stage 4
// In job handler:
Cache::increment('stripe_webhook_processed_count');     // Stage 5
Cache::increment('stripe_webhook_failed_count');        // Stage 6 (on failure)
```

**Exceptions:** Low-volume implementations (< 10 webhooks/day) may consolidate into fewer metrics if operational cost justifies it. However, the full pipeline should be instrumentable on demand.

**Consequences Of Violation:** Unable to determine failure location. "500 webhooks failed today" — but were they never validated? Validation failed? Queue dropped them? Handler threw exceptions? Without per-stage metrics, root cause analysis requires manual log search across multiple systems.

---

## Rule 2

**Rule Name:** correlation-id-on-every-billing-event

**Category:** Always

**Rule:** Generate and propagate a correlation ID (UUID) for every billing webhook, through every log entry, job dispatch, and database write.

**Reason:** Billing debugging without correlation IDs requires manual log correlation by timestamp, user ID, and event type — 10-30 minutes per incident. With correlation IDs, a single log query retrieves the complete journey.

**Bad Example:**
```php
Log::info('Processing webhook', ['event' => $event->id]); // No correlation ID
```

**Good Example:**
```php
$correlationId = (string) Str::uuid();
Log::info('Webhook received', ['correlation_id' => $correlationId, 'event' => $event->id]);
ProcessStripeWebhook::dispatch($event, $correlationId);
// In handler:
Log::info('Processing', ['correlation_id' => $this->correlationId]);
// In audit table:
BillingEvent::create(['correlation_id' => $correlationId, ...]);
```

**Exceptions:** None. Every billing webhook should carry a correlation ID. The cost is one UUID per webhook (~36 bytes), which is negligible.

**Consequences Of Violation:** Debugging a customer's billing complaint ("I was charged but my subscription didn't activate") requires manually tracing through logs by timestamp and user email — 20+ minutes per incident. With correlation IDs, it's `grep correlation_id_abc123` — 10 seconds.

---

## Rule 3

**Rule Name:** dedicated-billing-queue-with-separate-monitoring

**Category:** Always

**Rule:** Route all billing jobs to a dedicated queue with dedicated workers. Monitor this queue independently from general application queues.

**Reason:** Billing jobs directly impact revenue. A queue backup from a marketing email campaign, report generation, or image processing must never delay payment processing. Dedicated billing queues with separate workers and independent monitoring prevent this.

**Bad Example:**
```php
class ProcessPayment implements ShouldQueue
{
    public $queue = 'default'; // Mixed with all other jobs
}
```

**Good Example:**
```php
class ProcessPayment implements ShouldQueue
{
    public $queue = 'billing'; // Dedicated billing queue

    public function __construct(
        public string $paymentId,
        public string $correlationId,
    ) {}
}

// Horizon config:
'supervisor-billing' => [
    'connection' => 'redis',
    'queue' => ['billing'],
    'processes' => 3,
    'tries' => 3,
],
```

**Exceptions:** Applications without significant non-billing queue volume may not need dedicated queues. However, the separation should be planned for and implemented before billing volume reaches a level where contention occurs.

**Consequences Of Violation:** A bulk email campaign dispatches 500,000 jobs. The default queue backs up for 45 minutes. Payment processing webhooks that arrived during that window sit behind 500,000 email jobs. Payments are delayed. Subscription activations are delayed. Customers see "pending" for an hour. Revenue collection is delayed.

---

## Rule 4

**Rule Name:** alert-on-subscription-drift-nonzero

**Category:** Always

**Rule:** Run a daily subscription drift reconciliation job that compares local subscription state against Stripe's state. Alert on any non-zero drift with maximum severity.

**Reason:** Any drift between local state and Stripe state represents either: (a) a customer being billed without receiving service, or (b) a customer receiving service without being billed. Both are revenue-critical and require immediate investigation.

**Bad Example:**
```php
// No drift detection — rely on webhooks being 100% reliable
```

**Good Example:**
```php
// Daily scheduled job
class DetectSubscriptionDrift implements ShouldQueue
{
    public function handle(): void
    {
        $driftCount = 0;
        $subscriptions = Subscription::active()->get();

        foreach ($subscriptions as $local) {
            $stripeSub = Stripe::subscriptions()->retrieve($local->stripe_id);
            if ($local->status !== $stripeSub->status) {
                $driftCount++;
                Log::critical('Subscription drift detected', [
                    'subscription_id' => $local->id,
                    'local_status' => $local->status,
                    'stripe_status' => $stripeSub->status,
                ]);
            }
        }

        if ($driftCount > 0) {
            Cache::set('subscription_drift_count', $driftCount);
            // PagerDuty alert
        }
    }
}
```

**Exceptions:** None. Zero drift should be the invariant. Any drift is a revenue integrity issue.

**Consequences Of Violation:** A webhook delivery failure at Stripe goes unnoticed. Local subscriptions remain "active" but Stripe shows "canceled." Customers continue accessing paid features without paying — revenue leakage for weeks until detected by a manual audit or customer complaint.

---

## Rule 5

**Rule Name:** baseline-compare-alert-thresholds

**Category:** Prefer

**Rule:** Prefer alert thresholds based on historical baseline comparison (same hour last week, same day last month) over fixed-value thresholds.

**Reason:** Billing webhook volume varies by time of day, day of week, and seasonally. A fixed threshold of "alert if < 100 webhooks/hour" fires falsely every night at 3 AM and misses real anomalies during peak hours. Baseline comparison catches relative changes: "volume is 50% lower than the same hour last week."

**Bad Example:**
```php
// Alert rule
if webhook_count_last_hour < 100 → alert  // False at 3 AM, misses 12 PM drop from 1000 to 200
```

**Good Example:**
```php
// Alert rule
baseline = webhook_count_same_hour_last_week
if webhook_count_last_hour < (baseline * 0.5) → alert  // 50% drop relative to normal
```

**Exceptions:** Metrics that should always be zero (subscription drift, duplicate webhook rate above threshold) can use fixed thresholds. Volume-based metrics should use baseline comparison.

**Consequences Of Violation:** Alert fatigue from false positives at low-traffic hours. Missed anomalies at high-traffic hours. On-call engineers learn to ignore "webhook volume" alerts. Real incidents are missed.

---

## Rule 6

**Rule Name:** categorize-failed-billing-jobs

**Category:** Always

**Rule:** Always categorize failed billing jobs by both event type (invoice.payment_failed, customer.subscription.deleted) and failure reason (network_timeout, invalid_payload, rate_limited, unknown).

**Reason:** "50 billing jobs failed today" is unactionable. "40 invoice.payment_failed jobs failed due to rate_limited" indicates Stripe API throttling — you need to adjust retry strategy. "10 customer.subscription.deleted jobs failed due to invalid_payload" indicates a bug in webhook payload handling — you need to fix the code. Without categorization, every failure investigation starts from scratch.

**Bad Example:**
```php
Cache::increment('failed_billing_jobs'); // No categorization
```

**Good Example:**
```php
Cache::increment("failed_billing_jobs:{$event->type}");
Cache::increment("failed_billing_jobs:{$event->type}:{$failureReason}");
Cache::increment('failed_billing_jobs:total');
```

**Exceptions:** Very low volume (< 10 failures/day) may not need per-reason categorization. However, per-type categorization should always be present.

**Consequences Of Violation:** Every billing failure incident starts with: "What type of webhook? What's the failure reason?" — requiring manual investigation before any response can begin. Categorization enables the on-call engineer to immediately know: "It's a Stripe API rate limiting issue — increase backoff and retry" vs "It's an invalid payload — escalate to engineering."
