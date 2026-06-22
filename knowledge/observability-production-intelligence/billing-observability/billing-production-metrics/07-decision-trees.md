# Metadata

**Domain:** Observability & Production Intelligence
**Subdomain:** Billing Observability
**Knowledge Unit:** billing-production-metrics
**Generated:** 2026-06-22

---

# Decision Inventory

* Billing Queue Architecture: Dedicated vs Shared
* Alert Threshold Strategy: Baseline-Comparison vs Fixed-Value
* Failure Categorization Granularity
* Drift Reconciliation Frequency
* Correlation ID Storage Strategy
* Replay Mechanism for Failed Billing Events

---

# Architecture-Level Decision Trees

---

## Billing Queue Architecture: Dedicated vs Shared

---

### Decision Context

Route billing jobs to a dedicated queue with dedicated workers or use the shared default queue.

---

### Decision Criteria

* Billing volume (webhooks/hour)
* Non-billing queue volume and burstiness
* Revenue impact of delayed billing processing
* Worker resource constraints
* Monitoring isolation requirements

---

### Decision Tree

Does the application process more than 100 billing webhooks per day?
YES → Is there significant non-billing queue volume (>1000 jobs/hour)?
    YES → Dedicated billing queue REQUIRED (prevents full-queue from delaying payments)
    NO → Does billing latency directly impact customer experience?
        YES → Dedicated billing queue (ensure predictable processing time)
        NO → Shared queue acceptable initially; monitor and dedicate if contention appears
NO → Shared queue sufficient for low-volume billing
    ↓
    Can you allocate dedicated worker resources for billing?
    YES → Dedicated billing queue recommended for isolation regardless of volume
    NO → Use shared queue with prioritized workers for billing within the default queue

---

### Rationale

Dedicated billing queues prevent non-revenue jobs from delaying payment processing. The cost (additional supervisor configuration, worker processes) is minimal compared to the cost of delayed payment capture. Even at moderate volume, the isolation benefit justifies the overhead.

---

### Recommended Default

**Default:** Dedicated billing queue with 2-3 dedicated workers for any application with >100 billing webhooks/day.

**Reason:** The cost of a delayed payment ($X in revenue) multiplied by the probability of a queue backlog event exceeds the cost of dedicated workers ($Y/month in server resources). Dedicated billing queues are insurance against revenue delay.

---

### Risks Of Wrong Choice

Shared queue with high non-billing volume: billing webhooks behind thousands of non-critical jobs → payment delays → revenue delayed → customer complaints. Dedicated queue prematurely: slightly higher infrastructure cost, but no reliability risk.

---

### Related Rules

- dedicated-billing-queue-with-separate-monitoring

---

### Related Skills

- Instrument Billing Production Observability

---

## Alert Threshold Strategy: Baseline-Comparison vs Fixed-Value

---

### Decision Context

Use comparison against historical baselines or fixed numeric thresholds for alerting.

---

### Decision Criteria

* Metric behavior pattern (seasonal vs constant)
* Tolerance for false positives vs false negatives
* Available historical data
* Alerting infrastructure capability

---

### Decision Tree

Does the metric have natural time-of-day or day-of-week variation?
YES → Use baseline comparison (e.g., "50% below same hour last week")
NO → Is the metric a zero-tolerance gauge (should always be zero)?
    YES → Use fixed threshold (e.g., "alert if > 0")
    NO → Does the metric have a known acceptable range?
        YES → Use fixed threshold with generous bounds
        NO → Collect data for 2 weeks, then switch to baseline comparison

---

### Rationale

Baseline comparison adapts to natural variation (low traffic at night, high on weekdays) and catches proportionally anomalous drops. Fixed thresholds are appropriate for invariants (drift should always be zero) and metrics with tight, known acceptable ranges.

---

### Recommended Default

**Default:** Baseline comparison for volume metrics. Fixed threshold (zero/very-low) for integrity metrics like subscription drift and duplicate webhook rate.

**Reason:** Volume metrics have natural variation. Baseline comparison catches drops relative to normal behavior. Integrity metrics have invariant expectations — any deviation is actionable.

---

### Risks Of Wrong Choice

Fixed threshold on variable metric: alert fatigue (false positives during low-traffic hours), missed anomalies (false negatives during peak hours). Baseline on zero-invariant: unnecessary complexity for a metric where "> 0" always means "alert."

---

### Related Rules

- baseline-compare-alert-thresholds
- alert-on-subscription-drift-nonzero

---

### Related Skills

- Instrument Billing Production Observability

---

## Failure Categorization Granularity

---

### Decision Context

How granularly to categorize failed billing jobs — by event type only, by failure reason only, or by both.

---

### Decision Criteria

* Billing webhook diversity (number of event types)
* Failure reason diversity
* Operational response patterns (different actions for different categories)
* Metric storage and query capacity

---

### Decision Tree

Do different event types require different operational responses?
YES → Categorize by event type (e.g., invoice.payment_failed vs customer.subscription.deleted)
NO → Categorize by failure reason only
    ↓
    Do different failure reasons for the same event type require different responses?
    YES → Categorize by both event type AND failure reason
    NO → Categorize by event type only

---

### Rationale

Categorization enables the on-call engineer to immediately determine the right response. "40 invoice.payment_failed due to rate_limited" → adjust retry strategy. "10 customer.subscription.deleted due to invalid_payload" → escalate to engineering. Without both dimensions, every investigation starts from scratch.

---

### Recommended Default

**Default:** Categorize by both event type and failure reason.

**Reason:** The additional metric storage (one extra counter key per combination) is negligible. The operational benefit — instant diagnosis — is immense.

---

### Risks Of Wrong Choice

Event type only: "50 invoice.payment_failed failed" — is it rate limiting (increase backoff) or invalid payload (fix code)? Must manually investigate. Failure reason only: "30 rate_limited" — which webhook type? Different types may need different retry strategies.

---

### Related Rules

- categorize-failed-billing-jobs

---

### Related Skills

- Instrument Billing Production Observability

---

## Drift Reconciliation Frequency

---

### Decision Context

How often to run the subscription drift reconciliation job that compares local state to Stripe state.

---

### Decision Criteria

* Revenue sensitivity (cost of delayed drift detection)
* Subscription count (Stripe API rate limit impact)
* Reconciliation job duration
* Stripe API rate limits

---

### Decision Tree

Is the monthly revenue per subscription high (>$100)?
YES → Is the subscription count > 1000?
    YES → Hourly reconciliation (balance cost vs detection speed)
    NO → Continuous reconciliation (every 5-15 minutes)
NO → Is subscription count > 10,000?
    YES → Daily reconciliation (rate limit constraint)
    NO → Daily reconciliation (standard cadence)
    ↓
    Can you detect drift via webhook failure patterns instead?
    YES → Supplement reconciliation with webhook failure monitoring
    NO → Reconciliation is the primary drift detection method → more frequent is better

---

### Rationale

Drift detection frequency is a tradeoff between detection speed and API cost. For high-value subscriptions, faster detection prevents more revenue leakage. For large subscription counts, Stripe API rate limits constrain reconciliation frequency — batch processing is required.

---

### Recommended Default

**Default:** Daily reconciliation with alert on any non-zero drift. Supplement with webhook failure monitoring for near-real-time detection.

**Reason:** Daily reconciliation catches drift within 24 hours — acceptable for most businesses. Webhook failure monitoring provides a faster signal for cases where drift is caused by processing failures. Higher frequencies justified for high-value subscriptions.

---

### Risks Of Wrong Choice

Too infrequent: drift goes undetected for days → revenue leakage accumulates. Too frequent: Stripe API rate limits hit → reconciliation fails or is throttled. Other API calls (webhook processing, admin operations) are impacted by rate limit consumption.

---

### Related Rules

- alert-on-subscription-drift-nonzero

---

### Related Skills

- Instrument Billing Production Observability

---

## Correlation ID Storage Strategy

---

### Decision Context

Where to persist correlation IDs: log files only, dedicated audit table, or both.

---

### Decision Criteria

* Compliance requirements (financial audit trail)
* Debugging workflow
* Data retention policy
* Storage cost

---

### Decision Tree

Is there a financial compliance requirement for an immutable audit trail?
YES → Store in dedicated `billing_events` audit table (immutable, queryable)
NO → Is the primary use case operational debugging (tracing failed webhooks)?
    YES → Log files with structured logging (JSON format) + optional audit table for common queries
    NO → Audit table with soft-delete or archiving for long-term compliance

---

### Rationale

Log files enable fast debugging via log aggregation tools (ELK, Datadog, Grafana Loki). Audit tables provide immutable, queryable records for compliance. Both serve different purposes and can coexist. For high-compliance environments (PCI, SOC2), an audit table is mandatory.

---

### Recommended Default

**Default:** Both: log files for operational debugging, audit table for compliance and support team access.

**Reason:** Logs are ephemeral (rotated) — not suitable for audit. Audit tables are queryable by the support team without log aggregation access. The storage cost is minimal (~200 bytes per billing event).

---

### Risks Of Wrong Choice

Log-only: support team can't query billing events (no log aggregation access). Compliance audit fails (logs rotated, no immutable trail). Audit-table-only: debugging requires SQL queries instead of log aggregation tools — slower for complex tracing.

---

### Related Rules

- correlation-id-on-every-billing-event

---

### Related Skills

- Instrument Billing Production Observability

---

## Replay Mechanism for Failed Billing Events

---

### Decision Context

How to handle replay of failed billing webhooks — manual admin UI, automatic retry, or both.

---

### Decision Criteria

* Failure categorization (retryable vs non-retryable)
* Support team capability (can they investigate before replay?)
* Volume of failed events
* Compliance requirements (must replay be audited?)

---

### Decision Tree

Can failures be categorized as retryable (transient) vs non-retryable (permanent)?
YES → Implement automatic retry for retryable failures + manual replay UI for non-retryable after fix
NO → Implement manual replay UI with investigation step before replay
    ↓
    Does the support team need to replay events without engineering?
    YES → Admin panel with "Replay" button per failed event, with confirmation dialog
    NO → CLI command for engineering-driven replay
    ↓
    Is compliance audit required for manual replay?
    YES → Log every replay action with: who initiated it, timestamp, reason, original correlation ID
    NO → Simple replay with operation log

---

### Rationale

Automatic retry handles transient failures (network timeouts, rate limits) without human intervention. Manual replay handles permanent failures (invalid payload, bug fix deployed) that require investigation before re-processing. The support team should be able to replay without engineering involvement.

---

### Recommended Default

**Default:** Automatic retry for transient failures (via `$tries` + backoff). Manual replay UI for permanent failures. Both logged for audit.

**Reason:** Automatic retry handles the majority of failures. Manual replay empowers support to resolve customer issues without escalating to engineering. Audit logging ensures compliance.

---

### Risks Of Wrong Choice

No replay mechanism: every failed billing event requires engineering intervention → slow resolution → customer frustration. Automatic replay without categorization: invalid payloads retried indefinitely → queue waste → masking real issues. Manual replay without audit: no trace of who replayed what → compliance risk.

---

### Related Skills

- Instrument Billing Production Observability
