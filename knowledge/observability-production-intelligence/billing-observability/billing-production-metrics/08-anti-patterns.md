# Anti-Patterns — Billing Production Observability Metrics

## Metadata
| Field | Value |
|-------|-------|
| Domain | Observability & Production Intelligence |
| Subdomain | Billing Observability |
| Knowledge Unit | Billing Production Observability Metrics |
| Version | 1.0 |
| Last Updated | 2026-06-22 |

## Anti-Pattern Inventory

1. Single "Processed" Metric Only
2. No Correlation IDs
3. Billing Jobs on Shared Default Queue
4. Fixed Thresholds for Variable Metrics
5. No Subscription Drift Detection
6. Uncategorized Failure Metrics
7. No Replay Mechanism
8. Alert Messages Leaking PII

---

## 1. Single "Processed" Metric Only

### Category
Observability

### Description
Tracking only a single "webhook_processed" metric without per-stage pipeline metrics, making it impossible to localize where in the pipeline failures occur.

### Why It Happens
The developer adds a simple counter: "increment when webhook is processed successfully." This tells you how many succeeded but not how many were received, failed validation, deduplicated, or failed during processing. When something breaks, you know "fewer webhooks are being processed" but not WHY.

### Warning Signs
- Only one metric for the entire webhook pipeline
- Cannot answer: "How many webhooks were received vs processed?"
- Incident response always starts with: "Check the logs manually"
- No ability to determine if the issue is in validation, queue, or handler

### Why Harmful
On-call receives an alert: "Webhook processed count dropped by 60%." Is the issue at Stripe (fewer webhooks sent)? Signature validation (invalid signatures)? Queue (jobs not being dispatched)? Handler (processing exceptions)? Without per-stage metrics, the engineer must manually check: Stripe dashboard (are they sending?), application logs (validation errors?), Horizon (queue depth?), Sentry (handler exceptions?). Diagnosis takes 20+ minutes instead of 2.

### Consequences
- Failure localization requires manual investigation across multiple systems
- Mean Time To Diagnose (MTTD) increases from minutes to tens of minutes
- Incorrect initial response due to ambiguity (fix the wrong system)
- On-call burnout from complex, manual diagnosis for every incident

### Alternative
Emit a counter at each pipeline stage: received, validated, deduplicated, dispatched, processed, failed.

### Refactoring Strategy
1. Add `Cache::increment('stripe_webhook_received_count')` in the controller (before validation)
2. Add `Cache::increment('stripe_webhook_validated_count')` after signature check
3. Add `Cache::increment('stripe_webhook_duplicate_count')` on idempotency check
4. Add `Cache::increment('stripe_webhook_dispatched_count')` after job dispatch
5. Add `Cache::increment('stripe_webhook_processed_count')` in job handler on success
6. Add `Cache::increment('stripe_webhook_failed_count')` in catch block

### Detection Checklist
- [ ] Counter emitted at each pipeline stage
- [ ] Can answer "received vs dispatched vs processed" from metrics alone
- [ ] Gap between received and dispatched indicates validation or dedup issue
- [ ] Gap between dispatched and processed indicates handler issue

### Related Rules
track-webhook-pipeline-per-stage

### Related Skills
Instrument Billing Production Observability

### Related Decision Trees
Failure Categorization Granularity

---

## 2. No Correlation IDs

### Category
Observability

### Description
Not generating or propagating correlation IDs across the webhook pipeline, requiring manual log correlation by timestamp and user ID for every billing investigation.

### Why It Happens
The developer logs webhook events with the Stripe event ID. But Stripe's event ID isn't propagated to the job handler log entries. When debugging, the engineer must correlate by timestamp ("3 webhooks at 14:32:15, which log line corresponds to which?") or by user ID ("find all logs for user_42 in the 5-minute window"). This works for isolated incidents but breaks down at scale.

### Warning Signs
- Log entries don't share a common identifier across pipeline stages
- Debugging involves "grep for timestamp range + user ID"
- Support tickets about billing issues take 30+ minutes to investigate
- No common field linking webhook receipt to database write

### Why Harmful
A customer reports: "I was charged but my subscription didn't activate." The support engineer searches logs for the customer's email. They find: the webhook received log (14:32:15.001), the processing started log (14:32:15.892), but no completion log. Did the job fail? Was it the same webhook or a different one? Was the failure related? Without correlation IDs, the engineer must manually assemble the timeline from dozens of log lines. Investigation takes 30 minutes. With correlation IDs, it takes 10 seconds: `grep "correlation_id_abc123"`.

### Consequences
- Debugging billing issues takes 10-30x longer
- Support response times degrade
- Multi-event debugging (e.g., "payment failed → subscription canceled") near impossible
- On-call engineers dread billing incidents

### Alternative
Generate a UUID at webhook entry, pass to job constructor, log at every step, store in audit table.

### Refactoring Strategy
1. Add `$correlationId = (string) Str::uuid();` in webhook controller
2. Pass correlation ID to job: `new ProcessWebhook($event, $correlationId)`
3. Log correlation ID in every handler step: `Log::info('message', ['correlation_id' => $this->correlationId])`
4. Store correlation ID in `billing_events` audit table
5. Configure log aggregation to index correlation ID as a searchable field

### Detection Checklist
- [ ] Correlation ID generated at webhook entry point
- [ ] Passed to job constructor
- [ ] Logged in every handler step
- [ ] Stored in audit table
- [ ] Searchable in log aggregation tool

### Related Rules
correlation-id-on-every-billing-event

### Related Skills
Instrument Billing Production Observability

### Related Decision Trees
Correlation ID Storage Strategy

---

## 3. Billing Jobs on Shared Default Queue

### Category
Architecture

### Description
Routing billing jobs to the same queue as general application jobs, where a surge in non-billing work delays payment processing.

### Why It Happens
The application starts with one queue. Billing jobs are dispatched to the default queue alongside email jobs, report generation, image processing, and data exports. The team never separates them because "the queue is fast enough." Then a marketing campaign dispatches 100,000 email jobs. The billing webhook that arrived at the same time sits behind 100,000 email jobs.

### Warning Signs
- All jobs use `$queue = 'default'`
- Horizon only has one supervisor
- Queue depth spikes correlate with non-billing events (campaigns, imports)
- Billing processing times are unpredictable (fast at 3 AM, slow at noon)

### Why Harmful
A Black Friday campaign dispatches 500,000 promotional email jobs. 200 payment webhooks arrive during the campaign. They're queued behind the email jobs. Payment processing is delayed by 45 minutes. Customers complete checkout but see "payment pending" for nearly an hour. Some abandon their carts. Others contact support. Revenue is lost not because payments failed, but because payment processing was delayed by non-revenue work.

### Consequences
- Payment processing delayed by non-billing queue backlog
- Unpredictable billing latency
- Revenue delay during high-traffic periods
- Customer trust eroded by "pending payment" experience

### Alternative
Create a dedicated `billing` queue with dedicated Horizon workers. Route all billing jobs to this queue.

### Refactoring Strategy
1. Create `billing` queue in Horizon config with 2-3 dedicated workers
2. Update all billing job classes: `public $queue = 'billing'`
3. Configure separate monitoring for billing queue depth
4. Set billing queue worker timeout appropriate for payment processing
5. Test: dispatch 100K non-billing jobs + 10 billing jobs — verify billing completes first

### Detection Checklist
- [ ] Dedicated billing queue configured in Horizon
- [ ] All billing jobs routed to billing queue
- [ ] Billing queue depth monitored independently
- [ ] Billing processing times predictable regardless of other queue activity
- [ ] Load test verifies billing isolation

### Related Rules
dedicated-billing-queue-with-separate-monitoring

### Related Skills
Instrument Billing Production Observability

### Related Decision Trees
Billing Queue Architecture: Dedicated vs Shared

---

## 4. Fixed Thresholds for Variable Metrics

### Category
Observability

### Description
Using fixed numeric thresholds for alerting on metrics with natural time-of-day or day-of-week variation, causing alert fatigue from false positives and missed anomalies from false negatives.

### Why It Happens
The team configures "Alert if webhook count < 100 per hour." At 3 AM, normal traffic is 20 webhooks/hour — the alert fires every night. The on-call engineer acknowledges and ignores it. At 2 PM, normal traffic is 500 webhooks/hour. A bug reduces it to 150. That's a 70% drop but still above the 100 threshold — no alert fires. The threshold is simultaneously too sensitive at night and too loose during the day.

### Warning Signs
- Alert fires at the same time every day (low traffic hours)
- On-call engineers habitually acknowledge without investigating
- Real incidents missed during peak hours
- "We need to tune the thresholds" is a recurring conversation

### Why Harmful
Alert fatigue: on-call engineers learn to ignore "webhook volume" alerts because they fire every night. Real incidents are acknowledged alongside false positives and overlooked. A genuine Stripe webhook delivery failure at 2 PM is missed because the fixed threshold (100) was set for the daily minimum, not the hourly baseline. Revenue-impacting incidents go undetected for hours.

### Consequences
- Alert fatigue — engineers ignore alerts
- Real incidents missed (false negatives during peak hours)
- On-call trust in monitoring system eroded
- Incidents detected by customers, not monitoring

### Alternative
Use baseline-comparison alerting: compare current metric to the same hour last week. Alert if volume drops below 50% of baseline.

### Refactoring Strategy
1. Store historical metric data (Prometheus, Datadog, CloudWatch) for 4+ weeks
2. Calculate baseline: average of same hour over last 4 weeks
3. Configure alert: `current_value < (baseline * 0.5)` → alert
4. For metrics with strong seasonality, add day-of-week awareness
5. Keep fixed thresholds only for zero-tolerance metrics (drift, duplicate rate)

### Detection Checklist
- [ ] Volume-based metrics use baseline comparison alerting
- [ ] No false alerts during low-traffic hours
- [ ] Real anomalies detected during peak hours
- [ ] Fixed thresholds reserved for zero-tolerance metrics only
- [ ] Baseline calculation window documented (e.g., "same hour, 4-week average")

### Related Rules
baseline-compare-alert-thresholds

### Related Skills
Instrument Billing Production Observability

### Related Decision Trees
Alert Threshold Strategy: Baseline-Comparison vs Fixed-Value

---

## 5. No Subscription Drift Detection

### Category
Reliability

### Description
Relying entirely on webhook processing for subscription state synchronization, without a periodic reconciliation job to detect drift between local state and Stripe's authoritative state.

### Why It Happens
The team trusts Stripe webhooks. "Stripe guarantees delivery." But webhooks can fail: the application was down during delivery, a bug caused silent processing failures, a deployment caused payload incompatibility. Without reconciliation, these failures silently accumulate drift — the local database and Stripe diverge. Customers are billed without service, or receive service without billing.

### Warning Signs
- No scheduled job comparing local subscriptions to Stripe
- "We've never had a webhook issue" (false confidence)
- Customer complaints: "I canceled but you're still billing me"
- Manual investigation reveals local state ≠ Stripe state

### Why Harmful
A webhook processing bug causes `customer.subscription.deleted` events to silently fail for 3 weeks. During that time, 50 customers cancel in Stripe but remain "active" locally. They stop being billed but continue accessing paid features — $15,000 in revenue leakage. The bug is discovered when a customer asks "Why am I still getting premium features after canceling?" The drift went undetected for 21 days because no reconciliation job existed.

### Consequences
- Revenue leakage from active local subscriptions where Stripe shows canceled
- Over-billing from active Stripe subscriptions where local shows canceled
- Customer trust damaged
- Manual cleanup of drift takes days of engineering time

### Alternative
Run a daily reconciliation job comparing all active local subscriptions to Stripe's state. Alert on any non-zero drift.

### Refactoring Strategy
1. Create `DetectSubscriptionDrift` job, scheduled daily
2. For each active subscription: fetch Stripe state via API
3. Compare `local.status` vs `stripe.status`
4. If mismatch: log critical, increment drift counter, store in `subscription_drifts` table
5. Alert (PagerDuty) if drift count > 0
6. Add drift dashboard: show drift count over time (should always be 0)

### Detection Checklist
- [ ] Daily drift reconciliation job scheduled and running
- [ ] Alert configured for any non-zero drift
- [ ] Drift counter trended in monitoring dashboard
- [ ] Drift reconciliation handles Stripe API rate limits (batched)
- [ ] Manual drift resolution procedure documented

### Related Rules
alert-on-subscription-drift-nonzero

### Related Skills
Instrument Billing Production Observability

### Related Decision Trees
Drift Reconciliation Frequency

---

## 6. Uncategorized Failure Metrics

### Category
Observability

### Description
Tracking only a total "failed_billing_jobs" count without categorization by event type or failure reason, making operational response impossible without manual investigation.

### Why It Happens
The developer adds a single `Cache::increment('failed_billing_jobs')` in the catch block. When an alert fires ("50 billing failures"), the on-call engineer sees "50" and must manually investigate to determine: what types of webhooks failed? invoice.payment_failed? customer.subscription.deleted? What caused the failures? rate_limited? network_timeout? invalid_payload? Each incident requires re-discovering this information.

### Warning Signs
- Single metric for all billing failures
- On-call always asks: "What type of failures are these?"
- Incident response starts with manual log search every time
- Trend analysis impossible ("are invoice failures increasing?")

### Why Harmful
An on-call alert: "200 billing failures in the last hour." The engineer must manually query logs to discover: 180 are `invoice.payment_failed` due to `rate_limited` (Stripe throttling — increase backoff). 20 are `customer.subscription.deleted` due to `invalid_payload` (bug – escalate to engineering). Without categorization, the engineer wastes 15 minutes discovering what would be immediately visible with categorized metrics. Two different responses are needed, but both are delayed.

### Consequences
- Delayed diagnosis of every billing incident
- Inability to trend failures by type ("are payment failures increasing week over week?")
- Wrong response applied because failure reason is unknown
- Engineering time wasted on manual categorization that metrics should provide

### Alternative
Categorize failures by event type AND failure reason in separate counters.

### Refactoring Strategy
1. Add per-type counter: `Cache::increment("failed_billing_jobs:{$event->type}")`
2. Add per-type-per-reason counter: `Cache::increment("failed_billing_jobs:{$event->type}:{$reason}")`
3. Add total counter: `Cache::increment('failed_billing_jobs:total')`
4. Create Pulse card or dashboard table showing failures by type and reason
5. Configure separate alert thresholds per category (rate_limited → warn; invalid_payload → critical)

### Detection Checklist
- [ ] Failures categorized by event type
- [ ] Failures categorized by failure reason
- [ ] Dashboard shows failure breakdown by both dimensions
- [ ] On-call can determine response from categorized metrics without log search
- [ ] Trend analysis possible per category

### Related Rules
categorize-failed-billing-jobs

### Related Skills
Instrument Billing Production Observability

### Related Decision Trees
Failure Categorization Granularity

---

## 7. No Replay Mechanism

### Category
Operations

### Description
No mechanism to replay failed billing webhooks without engineering intervention, meaning every failed webhook requires an engineer to manually re-dispatch the job.

### Why It Happens
The team assumes "failed jobs go to failed_jobs table, engineers can re-dispatch them." No admin UI is built for support to replay. Every billing failure that requires manual replay becomes an engineering ticket. At scale, this becomes a constant drain on engineering time.

### Warning Signs
- Support team files engineering tickets for "replay this billing webhook"
- Engineers manually running `php artisan queue:retry {id}` for billing events
- No admin panel with "Replay" button for failed events
- Failed billing events accumulate in failed_jobs without resolution

### Why Harmful
A customer reports "I was charged but my subscription didn't activate." The support agent investigates and finds the webhook failed due to a transient network error. The fix is simple: replay the webhook. But the support agent doesn't have access to do that. They file an engineering ticket. The ticket sits in the queue for 2 hours. The customer waits 2 hours for a 30-second resolution. Customer satisfaction drops. Engineering time is consumed by repetitive manual work.

### Consequences
- Every failed billing event requires engineering time
- Customer resolution delayed by engineering ticket queue
- Support team disempowered — can't resolve billing issues directly
- Engineering time diverted from feature work to operations

### Alternative
Build an admin panel Replay UI. Support agents can review a failed event, optionally modify the payload, and replay. All replays are audited.

### Refactoring Strategy
1. Store billing events in `billing_events` table (not just failed_jobs) with correlation ID
2. Build admin panel with: list of failed events, event details, "Replay" button
3. Replay action: re-dispatches `ProcessStripeWebhook` job with original payload
4. Log replay action: who initiated it, timestamp, reason, original correlation ID
5. Rate-limit manual replays to prevent abuse
6. Add "Auto-retry" for transient failures (separate from manual replay)

### Detection Checklist
- [ ] Admin panel shows failed billing events with details
- [ ] "Replay" button available to support team
- [ ] All replays logged with operator identity and reason
- [ ] Rate limiting on manual replays
- [ ] Automatic retry for transient failures separate from manual replay

### Related Skills
Instrument Billing Production Observability

### Related Decision Trees
Replay Mechanism for Failed Billing Events

---

## 8. Alert Messages Leaking PII

### Category
Security

### Description
Including personally identifiable information (email, name, subscription details) in billing alert messages sent to Slack, PagerDuty, or email.

### Why It Happens
The developer includes the full webhook payload or user context in the alert message for debugging convenience. "Alert: Payment failed for john@example.com, subscription sub_123, amount $99." This leaks customer information to everyone in the Slack channel or on the PagerDuty rotation — many of whom don't need access to customer PII.

### Warning Signs
- Alert messages contain user emails, names, or subscription IDs
- Slack channels receive customer PII in billing alerts
- PagerDuty incident titles include user identifiers
- No data classification review of alert templates

### Why Harmful
A PagerDuty alert fires: "Payment failed for jane.doe@healthcare-provider.com, subscription premium_health_plan." The alert goes to the entire on-call rotation, including contractors and third-party support. Healthcare customer information is now exposed to unauthorized parties. GDPR/CCPA violation. HIPAA violation if healthcare data. The convenience of including user context in the alert created a compliance incident.

### Consequences
- Customer PII exposed to unauthorized personnel
- GDPR/CCPA/HIPAA compliance violations
- Data breach notification requirements triggered
- Loss of customer trust
- Potential regulatory fines

### Alternative
Include only non-sensitive identifiers in alerts: correlation ID (UUID), event type, failure reason, metric value. Link to internal dashboard for full details (access-controlled).

### Refactoring Strategy
1. Audit all alert message templates for PII
2. Replace PII with correlation IDs and internal identifiers
3. Alert format: "Billing alert: 50 payment failures (rate_limited). Correlation IDs: abc123, def456. Dashboard: https://..."
4. Ensure dashboard access is role-restricted
5. Add data classification labels to alert templates
6. Run periodic PII scan on alert channels (Slack, PagerDuty, email)

### Detection Checklist
- [ ] Alert messages contain no user emails, names, or subscription details
- [ ] Correlation IDs used as the link to investigate specific events
- [ ] Dashboard access is role-restricted
- [ ] Data classification reviewed for all alert templates
- [ ] Periodic PII scan of alert channels

### Related Skills
Instrument Billing Production Observability
