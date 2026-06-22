# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Observability & Production Intelligence |
| Subdomain | Billing Observability |
| Knowledge Unit | Billing Webhook Production Metrics & Monitoring |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Laravel Events, Laravel Horizon, Laravel Pulse, Stripe SDK, Structured Logging |
| Related KUs | Alerting & Incident Response, APM Performance Monitoring, Error Tracking, Distributed Tracing |
| Source | domain-analysis.md |

# Overview

Billing webhook observability is the systematic collection, monitoring, and alerting of metrics that track the health of a Laravel SaaS billing pipeline. Stripe webhooks are the critical integration point between Stripe events and internal subscription state — when webhook processing fails silently, subscription state drifts from reality, and customers lose access to paid features or continue accessing them without payment. A robust billing observability stack prevents revenue-impacting outages and detects configuration bugs before they compound.

# Core Concepts

- **Webhook lifecycle metrics**: Counters for received, processed, failed, and duplicate events, tagged by `event_type` (e.g., `invoice.payment_succeeded`, `customer.subscription.deleted`).
- **Latency histograms**: Measure P50/P95/P99 processing time from webhook receipt to completion, identifying slow handlers.
- **Subscription drift gauge**: A gauge comparing canonical subscription state in the database against Stripe's API. Any non-zero value indicates a reconciliation failure.
- **Queue depth gauges**: Per-queue depth for billing-specific workers. High depth signals worker starvation or slow jobs.
- **Business impact counters**: Feature gate denial spikes and permission denial spikes — unexpected increases indicate billing state corruption causing legitimate users to be locked out.
- **Horizon**: Queue health dashboards — failed jobs, wait times per queue, throughput per worker.
- **Pulse**: Application-level KPIs — slow queries on billing tables, cache hit rates for permission lookups, exception rates on billing cards.
- **Telescope**: Development/staging webhook debugging (never enabled in production).
- **Sentry/Bugsnag**: Exception tracking with correlation IDs (`stripe_event_id`, `team_id`) to trace failures across the webhook-to-job-to-API call chain.
- **Correlation IDs**: A single identifier passed through the webhook handler → queued job → Stripe API call chain, enabling end-to-end tracing.

# When To Use

- All production Laravel SaaS applications processing Stripe webhooks
- Applications where subscription state correctness directly impacts revenue
- When features are gated behind paid plans and denied access is a business incident
- During billing system migrations or Stripe API version upgrades
- When onboarding new team members who need visibility into billing pipeline health

# When NOT To Use

- Applications without any billing integration
- Development-only environments (use Telescope for local debugging)
- Prototypes that don't handle real money
- Applications using only Stripe Checkout (no webhooks) — metrics are still valuable but less critical

# Best Practices (WHY)

- **Track webhook lifecycle as counters, not just logs**: Counters enable alerting and dashboards. Logs are for post-mortem investigation. You need both. A webhook that failed and was retried successfully is invisible in logs alone but visible in counter ratios.
- **Set alert thresholds on ratios, not absolutes**: Alert on `failed_count / received_count > 1%` rather than absolute failure count. This adapts to traffic volume changes.
- **Correlation IDs in every log entry**: Without correlation IDs, diagnosing a single customer's billing issue requires grep-hunting across multiple log files. With `stripe_event_id` in every entry, filtering to the full lifecycle is one query.
- **Pulse cards for billing KPIs**: Create custom Pulse cards showing `subscription_drift_count`, `failed_billing_jobs`, and `feature_gate_denial_count` on the operations dashboard. Make billing health visible alongside application health.
- **Monitor feature gate denials proactively**: If `feature_gate_denial_count` spikes without a corresponding deploy or plan change, investigate immediately — it indicates billing state corruption.
- **Alert on subscription drift > 0 immediately**: Subscription drift means the database and Stripe disagree about what a customer should have. This is a revenue-critical incident, not a warning.

# Metric Implementation

| Metric | Type | Labels | Alert Threshold |
|--------|------|--------|-----------------|
| `stripe_webhook_received_count` | Counter | `event_type` | — |
| `stripe_webhook_processed_count` | Counter | `event_type` | — |
| `stripe_webhook_failed_count` | Counter | `event_type`, `failure_reason` | `failed / received > 1%` over 5min |
| `stripe_webhook_duplicate_count` | Counter | `event_type` | `duplicate / received > 10%` |
| `stripe_webhook_processing_latency` | Histogram | `event_type` | P95 > 10s |
| `subscription_drift_count` | Gauge | — | > 0 |
| `billing_queue_depth` | Gauge | `queue_name` | > 100 |
| `failed_billing_jobs` | Counter | `job_class` | > 0 for more than 3 consecutive runs |
| `feature_gate_denial_count` | Counter | `gate_name`, `team_id` | Spike detection |
| `permission_denial_spikes` | Counter | `permission` | Spike detection |

```php
// Laravel event for webhook lifecycle — dispatched from StripeEvent processing
class StripeWebhookReceived
{
    use Dispatchable;

    public function __construct(
        public readonly string $eventId,
        public readonly string $eventType,
        public readonly string $teamId,
    ) {}
}

class StripeWebhookProcessed
{
    use Dispatchable;

    public function __construct(
        public readonly string $eventId,
        public readonly string $eventType,
        public readonly string $teamId,
        public readonly float $durationMs,
    ) {}
}

class StripeWebhookFailed
{
    use Dispatchable;

    public function __construct(
        public readonly string $eventId,
        public readonly string $eventType,
        public readonly string $teamId,
        public readonly string $failureReason,
    ) {}
}

// Listener increments Prometheus-compatible counters
class RecordWebhookMetrics
{
    public function handle(StripeWebhookProcessed $event): void
    {
        // Increment counter with event_type label
        Metrics::counter('stripe_webhook_processed_count', [
            'event_type' => $event->eventType,
        ]);

        Metrics::histogram('stripe_webhook_processing_latency', $event->durationMs, [
            'event_type' => $event->eventType,
        ]);
    }
}

// Custom Horizon metric — failed billing jobs
// In App\Providers\HorizonServiceProvider:
Horizon::routeSlackNotificationsTo(env('HORIZON_SLACK_WEBHOOK'));
Horizon::routeMailNotificationsTo(env('HORIZON_EMAIL'));

// Custom Pulse card for billing KPIs
// App\Livewire\BillingHealthCard.php
class BillingHealthCard extends Card
{
    public function render(): Renderable
    {
        return view('pulse::billing-health', [
            'subscriptionDrift' => Cache::get('billing.subscription_drift', 0),
            'failedBillingJobs' => DB::table('failed_jobs')
                ->where('queue', 'billing')
                ->count(),
            'recentWebhookFailures' => Cache::get('billing.webhook_failures_5min', 0),
        ]);
    }
}

// Structured logging with correlation IDs
Log::channel('billing')->info('Processing webhook', [
    'stripe_event_id' => $eventId,
    'team_id' => $teamId,
    'subscription_id' => $subscriptionId,
    'event_type' => $eventType,
    'correlation_id' => $correlationId,
]);
```

# Architecture Guidelines

- **Events, not direct metric calls in handlers**: Fire Laravel events at webhook lifecycle points (`StripeWebhookReceived`, `StripeWebhookProcessed`, `StripeWebhookFailed`). Listeners record metrics. This decouples metric recording from business logic and makes metric collection testable.
- **Horizon for queue-level observability**: Use Horizon's built-in dashboards for queue health. Customize `config/horizon.php` to separate billing queues from application queues. Monitor failed jobs, wait times, and throughput per billing queue.
- **Pulse for application-level observability**: Create custom Pulse cards for billing KPIs visible on the main operations dashboard. Pulse runs in-process, so keep card queries lightweight — use cached values refreshed by scheduled jobs.
- **Sentry correlation**: Pass `stripe_event_id` and `team_id` to Sentry as tags and extra context. This enables "show me all errors for this Stripe event" queries in Sentry's UI.
- **Separate billing queue**: Use a dedicated `billing` queue so billing jobs don't compete with application jobs. Monitor queue depth independently.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only monitoring webhook failures in Stripe dashboard | Assuming Stripe's dashboard is sufficient | Stripe only shows delivery failures, not processing failures | Monitor processing failures in your own metrics. Stripe delivered the event — your code failed to handle it. |
| No latency monitoring | Only tracking success/failure counts | Slow webhook processing causes queue backlogs but generates no alerts | Always track P95/P99 latency. Alert at >10s. |
| No subscription drift monitoring | Trusting that webhooks keep state correct | Weeks of mismatched state before customer reports a problem | Run daily reconciliation: compare DB state to Stripe API. Alert on any drift. |
| Not tagging metrics by event_type | All webhook events lumped together | Can't distinguish between `invoice.payment_succeeded` failures (critical) and `charge.dispute.created` failures (moderate) | Tag all counters by `event_type`. Create event-type-specific alerts for revenue-critical events. |
| Correlational IDs not passed through jobs | Logging correlation only in the webhook handler | Can't trace a job failure back to its originating webhook | Pass `stripe_event_id` into job constructors. Include in every log entry and Sentry context. |

# Anti-Patterns

- **Metrics only in Stripe's dashboard**: Stripe reports delivery, not processing. A webhook that delivered successfully but threw an exception in your handler is invisible in Stripe. Your monitoring must cover the full pipeline.
- **Telescope in production**: Telescope records every request payload, including Stripe webhook secrets and customer data. Never enable in production. Use Telescope only for local/staging debugging.
- **Alerting on absolute counts without baselines**: Alerting "more than 5 failures" fires during legitimate traffic spikes. Use ratios (`failed/received`) and anomaly detection.
- **No reconciliation process**: Relying on webhooks alone for subscription state. Webhooks can fail. Stripe can have downtime. A periodic reconciliation job comparing your database to Stripe's API is the safety net.

# Related Topics

- **Prerequisites**: Laravel Events, Laravel Horizon, Laravel Pulse, Stripe SDK
- **Closely Related**: Billing Alerts & Repair Flows, Alerting & Incident Response, Error Tracking
- **Advanced**: Custom OpenTelemetry instrumentation, SLO-based alerting for billing pipeline, Reconciliation job design

# AI Agent Notes

- When implementing webhook handling, always emit events at lifecycle points. Don't inline metric recording in the handler itself — it makes testing harder and couples observability to business logic.
- When setting up a billing queue in Horizon, verify the queue name matches between `config/horizon.php` and job dispatch calls. A typo means jobs go to the `default` queue and billing queue metrics show zero.
- Correlation IDs should be generated at the webhook entry point (controller) and passed through every subsequent job, event, and API call. Use `Log::withContext()` in Laravel 11+ to automatically attach correlation IDs to all log entries in the current request context.

# Verification

- [ ] Webhook lifecycle events (`Received`, `Processed`, `Failed`) are defined and dispatched
- [ ] Counters and latency histograms track all billing webhook events, tagged by `event_type`
- [ ] Subscription drift reconciliation runs on a schedule (daily minimum)
- [ ] Billing queue is separated from application queues in `config/horizon.php`
- [ ] Custom Pulse cards show billing KPIs on the operations dashboard
- [ ] Sentry/Bugsnag is configured with `stripe_event_id` and `team_id` as tags
- [ ] Alert thresholds defined: webhook failure rate > 1%, P95 latency > 10s, queue depth > 100, drift > 0
- [ ] Structured logs include `stripe_event_id`, `team_id`, `subscription_id` in every billing log entry
- [ ] Correlation IDs pass through the full webhook → job → API call chain
- [ ] Telescope is disabled in all production environments
