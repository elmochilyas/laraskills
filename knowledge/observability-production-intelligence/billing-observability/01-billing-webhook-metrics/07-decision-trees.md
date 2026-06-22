# Decision Trees for Billing Webhook Production Metrics & Monitoring

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Observability & Production Intelligence |
| Subdomain | Billing Observability |
| Knowledge Unit | Billing Webhook Production Metrics & Monitoring |
| Related KUs | Billing alerts & repair flows, Alerting & incident response, Error tracking |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-BWM-001 | Should this metric be a counter, histogram, or gauge? | P0 |
| DT-BWM-002 | Should we alert on absolute counts or ratios? | P0 |
| DT-BWM-003 | How often should subscription reconciliation run? | P1 |
| DT-BWM-004 | Which observability tool is appropriate for this use case? | P1 |

---

## DT-BWM-001: Should This Metric Be a Counter, Histogram, or Gauge?

### Decision Context
Different metric types serve different purposes. Counters track cumulative events (webhook received, processed, failed). Histograms track distributions (processing latency). Gauges track current state (queue depth, subscription drift). Choosing the wrong type makes alerting and dashboards ineffective.

### Decision Criteria
- Does the metric track cumulative events that only increase?
- Does the metric track a distribution of values (latency, duration)?
- Does the metric track current state that can go up or down?
- Does the metric need percentile calculations (P50, P95, P99)?

### Decision Tree

```
Does the metric track cumulative events that only increase?
├── YES → COUNTER. Examples: stripe_webhook_received_count, stripe_webhook_failed_count
├── NO → Does the metric track a distribution of values (latency, duration)?
    ├── YES → HISTOGRAM. Examples: stripe_webhook_processing_latency, stripe_api_call_duration
    ├── NO → Does the metric track current state that can go up or down?
        ├── YES → GAUGE. Examples: subscription_drift_count, billing_queue_depth, failed_billing_jobs
        └── NO → Re-evaluate: is this a metric or a log entry?
```

### Rationale
Counters are for alerting on rates (failure rate = failed counter / received counter). Histograms are for alerting on percentiles (P95 latency > 10s). Gauges are for alerting on current state (drift > 0, queue depth > 100). Using a counter for queue depth would show cumulative depth over time, not current depth — useless for alerting.

### Recommended Default
**Counters for events, histograms for latency/duration, gauges for current state.** When in doubt, start with a counter — it's the most versatile metric type.

### Risks Of Wrong Choice
- **Counter for current state**: Cumulative value is meaningless for alerting on current queue depth or drift.
- **Gauge for events**: Can go down, losing event history. Counters only increase, preserving cumulative counts.

### Related Rules
- Track Webhook Lifecycle as Counters and Histograms, Not Just Logs

---

## DT-BWM-002: Should We Alert on Absolute Counts or Ratios?

### Decision Context
Alerting on absolute counts ("more than 5 failures") fires during legitimate traffic spikes. Alerting on ratios ("failure rate > 1%") adapts to traffic volume. The choice determines whether alerts are actionable or noisy.

### Decision Criteria
- Does traffic volume vary significantly (daily patterns, marketing spikes)?
- Is the absolute count meaningful without context (5 failures out of 10 vs. 5 out of 10,000)?
- Does the alert need to adapt to growth (more users = more webhooks = more absolute failures)?
- Is the team experiencing alert fatigue from absolute-count alerts?

### Decision Tree

```
Does traffic volume vary significantly (daily patterns, marketing spikes)?
├── NO → Absolute counts may be acceptable (stable volume means stable thresholds).
├── YES → Does the metric's business impact depend on the rate, not the count?
    ├── YES → ALERT ON RATIOS. Example: failed/received > 1% (adapts to volume).
    ├── NO → Is the absolute count itself the concern?
        ├── YES → ALERT ON ABSOLUTE. Example: subscription_drift > 0 (any drift is critical).
        └── NO → Use ratio for volume-dependent metrics, absolute for state-dependent metrics.
```

### Rationale
A failure rate of 1% is equally concerning at 100 webhooks/day (1 failure) and 10,000 webhooks/day (100 failures). An absolute threshold of "5 failures" fires at 1% on a quiet day (5 out of 500) but doesn't fire at 0.05% on a busy day (5 out of 10,000). Ratios adapt to volume and alert on the rate that matters.

### Recommended Default
**Ratios for volume-dependent metrics (failure rate, duplicate rate). Absolute for state-dependent metrics (drift > 0, queue depth > 100).**

### Risks Of Wrong Choice
- **Absolute for volume-dependent metrics**: Alert fires during traffic spikes even when the rate is normal. Alert fatigue. Team ignores alerts.
- **Ratio for state-dependent metrics**: "drift rate = 0.01%" seems low, but any non-zero drift is a revenue incident. Use absolute > 0.

### Related Rules
- Alert on Subscription Drift > 0 Immediately
- Tag All Billing Metrics by event_type

---

## DT-BWM-003: How Often Should Subscription Reconciliation Run?

### Decision Context
Subscription drift reconciliation compares local database state against Stripe's API. Running it too infrequently means drift accumulates before detection. Running it too frequently consumes Stripe API quota and may hit rate limits. The frequency must balance detection speed against API cost.

### Decision Criteria
- How many active subscriptions does the system have?
- How often do webhook processing failures occur?
- What's the acceptable maximum drift detection window?
- How much Stripe API quota is available for reconciliation?

### Decision Tree

```
How many active subscriptions does the system have?
├── < 1,000 → DAILY reconciliation is sufficient. Drift window: 24 hours.
├── 1,000-10,000 → DAILY reconciliation, staggered in batches. Drift window: 24 hours.
├── 10,000-100,000 → DAILY for high-value plans, WEEKLY for all plans. Or continuous incremental reconciliation.
└── > 100,000 → INCREMENTAL reconciliation (reconcile a subset each hour). Full reconciliation weekly.
```

### Rationale
Reconciliation makes Stripe API calls — one per subscription. For 1,000 subscriptions, that's 1,000 API calls per run (well within the 100/sec read limit). For 100,000 subscriptions, a full daily reconciliation would make 100,000 API calls — feasible but consumes significant quota. Incremental reconciliation (reconcile 5,000 per hour) spreads the load and reduces the drift detection window.

### Recommended Default
**Daily reconciliation for most SaaS applications. For high-volume systems, incremental reconciliation (subset per hour) with full weekly reconciliation.**

### Risks Of Wrong Choice
- **Too infrequent**: Drift accumulates for weeks. Customers on wrong plans for extended periods.
- **Too frequent**: Stripe API quota consumed by reconciliation, causing rate limits for legitimate customer-facing API calls.

### Related Rules
- Alert on Subscription Drift > 0 Immediately

---

## DT-BWM-004: Which Observability Tool Is Appropriate for This Use Case?

### Decision Context
Laravel offers Horizon (queue health), Pulse (application metrics), Telescope (local debugging), and integrates with Sentry/Bugsnag (exception tracking). Each has a different purpose. Using the wrong tool for a given need wastes resources and provides poor visibility.

### Decision Criteria
- Is the need for queue-level observability or application-level observability?
- Is the tool for production or development/staging?
- Is the need for exception tracking or metric tracking?
- Does the team need real-time dashboards or post-mortem investigation?

### Decision Tree

```
Is the need for queue-level observability (job throughput, wait times, failed jobs)?
├── YES → HORIZON. Queue-specific dashboards, failed job management, per-queue metrics.
├── NO → Is the need for application-level KPIs (slow queries, cache hit rates, custom metrics)?
    ├── YES → PULSE. In-process metrics, custom cards, lightweight.
    ├── NO → Is the need for local/staging debugging (request payloads, DB queries)?
        ├── YES → TELESCOPE. Detailed request/query/event inspection. NEVER in production.
        ├── NO → Is the need for exception tracking and error analysis?
            ├── YES → SENTRY/BUGSNAG. Stack traces, error grouping, release tracking, alerting.
            └── NO → Re-evaluate the observability need.
```

### Rationale
Horizon is purpose-built for queue observability — it shows job throughput, wait times, and failed jobs per queue. Pulse is for application-level KPIs that don't fit Horizon's queue focus. Telescope is for deep debugging with full request/query inspection — but it records sensitive data and must never run in production. Sentry/Bugsnag are for exception tracking with stack traces and release correlation.

### Recommended Default
**Horizon for queues, Pulse for app KPIs, Sentry/Bugsnag for exceptions, Telescope for local dev only. Use all four in combination — they serve different purposes.**

### Risks Of Wrong Choice
- **Telescope in production**: Records webhook secrets and customer data. Security incident.
- **Pulse for queue metrics**: Pulse can show some queue data but Horizon is purpose-built and more detailed.
- **Sentry for metrics**: Sentry is for exceptions, not counters/histograms. Use Pulse or a metrics backend.

### Related Rules
- Track Webhook Lifecycle as Counters and Histograms, Not Just Logs
