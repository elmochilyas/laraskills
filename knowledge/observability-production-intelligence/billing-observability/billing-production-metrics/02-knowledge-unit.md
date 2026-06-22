# Metadata

Domain: Observability & Production Intelligence
Subdomain: Billing Observability
Knowledge Unit: Billing Production Observability Metrics
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Billing systems are the revenue backbone of SaaS applications. Production observability metrics for billing must go beyond generic application monitoring to track the complete lifecycle of every billing event: webhook receipt, processing, completion, failure, duplication, and latency. Key metrics include `stripe_webhook_received_count`, `stripe_webhook_processed_count`, `stripe_webhook_failed_count`, `stripe_webhook_duplicate_count`, `stripe_webhook_processing_latency`, `subscription_drift_count`, `billing_queue_depth`, `failed_billing_jobs`, and `feature_gate_denial_count`. These metrics enable anomaly detection (unexpected webhook volume changes), alerting (processing latency exceeding SLA), and recovery (failed job patterns). Combined with correlation IDs tracing webhook→job→handler, Pulse dashboards, and Sentry/Bugsnag exception tracking, billing observability forms a complete monitoring system that prevents revenue leakage.

---

# Core Concepts

- **`stripe_webhook_received_count`**: Counter. Incremented on every webhook received (before validation). Measures incoming volume.
- **`stripe_webhook_processed_count`**: Counter. Incremented on successful webhook processing. Measures throughput.
- **`stripe_webhook_failed_count`**: Counter. Incremented on webhook processing failure. Measures error rate.
- **`stripe_webhook_duplicate_count`**: Counter. Incremented when a duplicate webhook is detected (via idempotency key or event ID). Measures redundant delivery.
- **`stripe_webhook_processing_latency`**: Histogram. Time from webhook receipt to completion. Measures processing speed.
- **`subscription_drift_count`**: Gauge. Number of subscriptions where local state differs from Stripe's state. Measures data integrity.
- **`billing_queue_depth`**: Gauge. Number of pending jobs in billing queues. Measures backlog.
- **`failed_billing_jobs`**: Counter (by job type, by failure reason). Measures job failure categories.
- **`feature_gate_denial_count`**: Counter. Number of times a billing feature was denied by feature gates. Anomaly detection for unexpected changes.
- **`permission_denial_spikes`**: Counter with anomaly detection. Unexpected spikes in billing permission denials indicate potential security issues or misconfiguration.
- **Correlation IDs**: UUID propagated through webhook → job dispatch → handler execution → database write. Enables end-to-end tracing.

---

# Mental Models

- **Revenue Pipeline**: Every webhook is a potential revenue event. Webhooks lost in the pipeline = revenue leakage. Monitor every stage: received → validated → processed → completed.
- **Hospital Triage System**: Webhooks arrive at the emergency room (queue). Triage (validation) determines severity. Doctors (workers) process them. Monitoring tracks: patients waiting (queue depth), patients treated (processed count), patients lost (failed count), treatment time (latency).
- **Assembly Line QC**: Each webhook moves through stations (receive, validate, process, complete). Quality control (monitoring) checks each station. A backup at any station triggers an alert before the whole line stops.

---

# Internal Mechanics

- **Metric emission**: Use Laravel's `Cache::increment()` for counters, or dedicated observability libraries (Prometheus client, CloudWatch, Datadog StatsD).
- **Counter pattern**: Increment on event, never decrement. Rate is derived from counter difference over time windows.
- **Gauge pattern**: Set to current value. Queue depth, subscription drift — point-in-time measurements.
- **Histogram pattern**: Record individual durations. Prometheus `Histogram` with buckets: [0.1, 0.5, 1, 5, 10, 30, 60] seconds.
- **Correlation IDs**: Generated at webhook entry point (`App\Http\Controllers\WebhookController`), attached to job via constructor, logged in every handler step, stored in `billing_events` table.
- **Alert thresholds**: Configured for each metric. Example: `stripe_webhook_failed_count > 10 in 5 minutes → PagerDuty`. `billing_queue_depth > 1000 → Slack warning`.

---

# Patterns

## Webhook Lifecycle Tracking
- **Purpose**: Track every webhook from receipt to completion, with metrics at each stage.
- **Benefit**: Full visibility into billing pipeline. Detect bottlenecks and failures.
- **Tradeoff**: Additional code in webhook handler for metric emission.

## Subscription Drift Detection
- **Purpose**: Periodically compare local subscription state with Stripe's state. Flag discrepancies.
- **Benefit**: Catch data integrity issues before customers notice.
- **Tradeoff**: Requires regular reconciliation job; Stripe API rate limits.

## Anomaly Detection via Baseline Comparison
- **Purpose**: Compare current metric values against historical baselines (same hour last week, same day last month).
- **Benefit**: Detect subtle anomalies — 30% drop in webhook volume may indicate webhook delivery failure at Stripe.
- **Tradeoff**: Requires historical data storage; baseline calculation logic.

## Correlation ID Tracing
- **Purpose**: Single UUID traces the complete journey: webhook entry → validation → job dispatch → job execution → database write → response.
- **Benefit**: Debugging a failed billing event takes seconds instead of hours.
- **Tradeoff**: Must propagate ID across HTTP, queue, and database layers.

## Horizon Billing Queue Monitoring
- **Purpose**: Dedicated Horizon queue for billing jobs with separate monitoring.
- **Benefit**: Billing queue health is independent of general queue health. Billing issues don't get lost in generic queue monitoring.
- **Tradeoff**: Additional Horizon supervisor configuration.

---

# Architectural Decisions

- **Use dedicated billing queues**: Separate billing jobs from general application jobs. Dedicated workers, dedicated monitoring.
- **Emit metrics at each pipeline stage**: Don't just track "webhook processed." Track: received, validated (signature check), deduplicated, dispatched, processing, completed, failed. Each stage is independently measurable.
- **Correlation ID as first-class citizen**: Generate at entry point, pass through every layer. Log with every metric emission.
- **Pulse for dashboards**: Laravel Pulse provides out-of-the-box queue monitoring. Extend with custom billing cards.
- **Sentry/Bugsnag for exceptions**: Billing exceptions must be tracked separately from general application exceptions. Distinct alert severity.
- **Subscription drift as daily reconciliation job**: Compare local DB with Stripe API once per day. High-severity alert on any drift.

---

# Tradeoffs

| Approach | Benefit | Cost |
|----------|---------|------|
| Per-stage metrics | Granular failure detection | More code, more metrics to monitor |
| Correlation IDs on every event | Fast debugging | Storage overhead (UUID per log entry) |
| Dedicated billing Horizon queue | Independent scaling, isolated monitoring | Additional supervisor configuration |
| Daily subscription reconciliation | Catch data drift | Stripe API rate limits; reconciliation job resource cost |
| Feature gate denial metrics | Detect config issues | Requires feature gate instrumentation in billing code |
| Pulse + Sentry dual monitoring | Pulse for trends, Sentry for exceptions | Two systems to configure and alert from |

---

# Performance Considerations

- Metric emission overhead: `Cache::increment()` ~1ms. At 1000 webhooks/second, that's 1 second of CPU just for counters. Use StatsD/UDP for high-throughput — fire-and-forget.
- Correlation ID logging: one UUID per log entry. Negligible storage (~36 bytes per entry).
- Subscription drift check: Stripe API call per active subscription. For 100K subscriptions, that's 100K API calls — batch the reconciliation, use Stripe rate limits carefully.
- Horizon billing queue: separate workers mean dedicated CPU/memory allocation. Monitor worker saturation separately.
- Pulse storage: Pulse stores metrics in the database. Billing metrics at high volume may bloat the `pulse_entries` table.

---

# Production Considerations

- Alert on webhook volume anomalies: compare 5-minute windows to same-hour-last-week. 50% drop = possible Stripe delivery failure.
- Alert on processing latency > p99 threshold: billing webhooks should process in < 10 seconds. Longer = queue backlog or external API slowness.
- Alert on `subscription_drift_count > 0`: any drift is a revenue-critical event. Immediate investigation required.
- Alert on `failed_billing_jobs` by failure category: distinguish between transient (network timeout — retry) vs permanent (invalid payload — investigate).
- Dedicated billing on-call rotation: billing failures are revenue failures. They deserve dedicated response.
- Manual replay UI for failed billing events: support team can replay a failed webhook from the admin panel without engineering intervention.

---

# Failure Modes

- **Metric emission failure**: If the cache/StatsD is down, metrics are silently dropped. Monitoring on monitoring — alert if no metrics for N minutes.
- **Correlation ID not propagated**: Missing ID in some log entries. Partial tracing. Debugging still possible but slower.
- **Subscription drift false positives**: Reconciliation job compares stale cached data. Implement cache-busting before reconciliation.
- **Queue depth metric stale**: Queue driver doesn't report depth accurately. Redis `LLEN` vs Horizon's `pending` count may differ.
- **Alert fatigue from noisy thresholds**: Thresholds set too tight — every minor fluctuation triggers an alert. Tune thresholds with historical data.
- **Pulse storage overflow**: High-frequency billing metrics overflow `pulse_entries` table. Configure retention policies, use external metrics stores for high cardinality.

---

# Ecosystem Usage

- **Laravel Pulse**: Queue monitoring, slow job detection, usage cards. Extend with custom `BillingMetrics` card.
- **Sentry / Bugsnag**: Exception tracking with stack traces. Group billing exceptions by webhook event type.
- **Prometheus + Grafana**: Time-series metrics with historical baselines, anomaly detection, dashboards.
- **Datadog / CloudWatch**: Managed observability with built-in anomaly detection and alerting.
- **Stripe Dashboard**: Webhook delivery logs, event search. NOT a substitute for application-side monitoring.
- **Horizon**: Queue depth, job throughput, failed job counts. Key source for `billing_queue_depth` and `failed_billing_jobs`.

---

# Related Knowledge Units

- K048 Queue Worker Configuration — Billing queue worker tuning
- K046 `$tries` and `$maxExceptions` — Retry behavior for failed billing jobs
- K055 `ShouldBeUnique` — Webhook deduplication
- K062 Stripe Webhook Handling — Webhook processing patterns
- Pulse documentation — Dashboard customization

## Research Notes

- Stripe webhooks have built-in idempotency via `idempotency_key`. Duplicate detection should be the first stage after signature verification — before any business logic.
- Stripe sends webhooks with at-least-once delivery. Duplicates are guaranteed. Every billing webhook handler must be idempotent regardless of duplicate detection metrics.
- The `stripe_webhook_received_count - (stripe_webhook_processed_count + stripe_webhook_failed_count)` should approach zero over a sliding window. A persistent gap indicates webhooks stuck in the queue or silently dropped.
- Subscription drift can occur from: failed webhook processing, direct database modifications, Stripe API changes not reflected locally, race conditions between webhook and API calls.
- Billing feature gates should emit a metric every time they deny access. A spike in denials for a feature that should be 100% enabled indicates a misconfiguration or attack.
- Correlation IDs should be generated at the webhook controller level (earliest entry point) and passed to jobs via constructor. The ID is logged in every `Log::info()` call and stored in the `billing_events` audit table.
