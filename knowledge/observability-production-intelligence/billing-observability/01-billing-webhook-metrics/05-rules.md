# Rules — Billing Webhook Production Metrics & Monitoring

## Rule 1: Track Webhook Lifecycle as Counters and Histograms, Not Just Logs
| Field | Value |
|-------|-------|
| **Name** | Track Webhook Lifecycle as Counters and Histograms, Not Just Logs |
| **Category** | Observability — Metrics |
| **Rule** | Implement dedicated counters for webhook lifecycle events — `stripe_webhook_received_count`, `stripe_webhook_processed_count`, `stripe_webhook_failed_count`, `stripe_webhook_duplicate_count` — tagged by `event_type`. Couple these with a latency histogram tracking P50/P95/P99 processing time. Counters and histograms enable alerting; logs alone do not. |
| **Reason** | Logs are for post-mortem investigation; metrics are for real-time alerting and dashboards. A webhook that failed and was retried successfully is visible in log search but invisible in failure count — the counter ratio (`failed / received`) provides a real-time signal of degradation. Latency histograms reveal slow handlers before they cause timeouts: P95 > 10s means 5% of customers experience slow billing updates, which translates to real user impact. Without structured metrics, the team discovers billing degradation when customers report it. |
| **Bad Example** | ```php
Log::info('Webhook processed', ['event_id' => $eventId]);
// No counters, no histograms. Team searches logs ad-hoc.
``` |
| **Good Example** | Dispatch Laravel events at lifecycle points; listeners increment Prometheus-compatible counters: `Metrics::counter('stripe_webhook_processed_count', ['event_type' => $eventType]); Metrics::histogram('stripe_webhook_processing_latency', $durationMs, ['event_type' => $eventType]);` |
| **Exceptions** | Development environments where metrics infrastructure is not set up. Use Telescope for local debugging and add metrics before production deployment. |
| **Consequences Of Violation** | Billing degradation goes undetected until customers report it. No historical metrics to correlate with deployments — cannot determine if a deploy caused the regression. No latency visibility means slow webhook handlers cause queue backlogs silently. |

## Rule 2: Alert on Subscription Drift > 0 Immediately, Not as a Warning
| Field | Value |
|-------|-------|
| **Name** | Alert on Subscription Drift > 0 Immediately, Not as a Warning |
| **Category** | Observability — Alerting |
| **Rule** | Run a periodic reconciliation job comparing local subscription state against Stripe's API. Any non-zero drift must trigger an immediate P1 alert (not a warning), waking up the on-call engineer. Subscription drift means the source of truth (your database) disagrees with Stripe — customers may be locked out of paid features or accessing them without payment. |
| **Reason** | Webhooks are the primary mechanism for keeping subscription state synchronized, but they can fail silently: a webhook handler throws an exception after partially updating state, or Stripe fails to deliver an event. A reconciliation job is the safety net. When drift is detected, it means webhooks have been failing for some period — the longer it goes undetected, the more customers are affected. Drift > 0 is always a revenue-impacting incident: either you're undercharging (giving away features) or overcharging (denying paid access). |
| **Bad Example** | Reconciling subscription state only during monthly billing review. Drift discovered weeks after it started. Affected customers have been on wrong plans for weeks. |
| **Good Example** | Nightly reconciliation job: fetch all active subscriptions from Stripe API, compare against local database, alert immediately on any mismatch. Record drift count as a gauge metric. Additionally, reconcile on-demand when a support case is opened for a specific team. |
| **Exceptions** | During Stripe API outages — drift may appear because the reconciliation job can't reach Stripe. In this case, the alert should indicate "reconciliation failed due to Stripe API unavailability" rather than actual drift. |
| **Consequences Of Violation** | Weeks of mismatched subscription state. Paying customers locked out of features they paid for — support tickets and chargebacks. Non-paying customers accessing premium features indefinitely — revenue leakage. Fixing requires manual per-customer reconciliation, which is slow and error-prone. |

## Rule 3: Tag All Billing Metrics by event_type
| Field | Value |
|-------|-------|
| **Name** | Tag All Billing Metrics by event_type |
| **Category** | Observability — Metrics Design |
| **Rule** | Every billing counter, histogram, and gauge must include the `event_type` label (e.g., `invoice.payment_succeeded`, `customer.subscription.deleted`). Never aggregate all webhook events into a single metric. Different event types have different business criticality — an `invoice.payment_failed` spike is critical; a `charge.refund.updated` spike may be benign. Without per-event-type metrics, you cannot distinguish between them. |
| **Reason** | Aggregating all webhook events into a single counter (`stripe_webhook_failed_count`) masks the impact. A 5% failure rate might be entirely on `charge.dispute.created` (moderate priority, handled by a different team) or entirely on `invoice.payment_succeeded` (critical, revenue-blocking). Without the `event_type` tag, the alert is ambiguous — the on-call engineer doesn't know whether to wake up immediately or handle it in the morning. Per-event-type metrics enable event-type-specific alert thresholds. |
| **Bad Example** | ```php
Metrics::counter('stripe_webhook_failed_count'); // No event_type tag
// Alert fires: "5% webhook failure rate." Which event type? Unknown.
``` |
| **Good Example** | ```php
Metrics::counter('stripe_webhook_failed_count', [
    'event_type' => $event->type, // 'invoice.payment_succeeded', 'customer.subscription.deleted', etc.
]);
// Alert fires: "5% webhook failure rate on invoice.payment_succeeded events." Actionable.
``` |
| **Exceptions** | Internal operational metrics that don't benefit from event-type granularity (total queue depth, worker count, Redis memory). These can be unlabeled. |
| **Consequences Of Violation** | Alerts are ambiguous and ignored. On-call engineers develop alert fatigue because every webhook failure alert requires manual investigation to determine severity. A critical failure on payment events gets the same alert priority as a non-critical failure on dispute events. The team stops trusting billing alerts. |

## Rule 4: Pass Correlation IDs Through Every Log Entry, Job, and API Call
| Field | Value |
|-------|-------|
| **Name** | Pass Correlation IDs Through Every Log Entry, Job, and API Call |
| **Category** | Observability — Tracing |
| **Rule** | Generate a correlation ID at the webhook entry point (controller). Pass it through every subsequent job constructor, event payload, Stripe API call (as metadata), and log entry. The `stripe_event_id` alone is not sufficient — it only traces back to Stripe, not through your internal pipeline (webhook controller → queued job → Stripe API call → notification dispatch). |
| **Reason** | When a customer reports a billing issue, support needs to trace the full lifecycle of their webhook: "Did the webhook arrive? Was it persisted? Did the job process it? Which API calls were made? Was a notification sent?" Without a correlation ID threading through every step, answering these questions requires grep-searching multiple log files with different keys. With correlation IDs, a single Loggregator/Sentry query returns the full pipeline. This reduces incident investigation time from hours to minutes. |
| **Bad Example** | ```php
Log::info('Processing webhook', ['stripe_event_id' => $eventId]); // Only in one place
// Job handler logs without the correlation ID
// API calls logged without context
``` |
| **Good Example** | ```php
$correlationId = (string) Str::uuid();
Log::withContext(['correlation_id' => $correlationId]); // Persistent across the request/job
// Pass correlationId into job constructor
ProcessStripeWebhook::dispatch($eventId, $correlationId);
// Include in Stripe API calls
$stripe->charges->create([...], ['metadata' => ['correlation_id' => $correlationId]]);
``` |
| **Exceptions** | Metrics collection (counters, gauges) — correlation IDs should not be metric labels due to cardinality explosion. Log the correlation ID; metrics remain aggregated. |
| **Consequences Of Violation** | Incident investigation takes hours instead of minutes. Support staff cannot confirm to a customer whether their payment was processed. On-call engineers grep multiple log files manually. Root cause analysis is guesswork without a complete trace. |

## Rule 5: Monitor Feature Gate Denial Spikes as Business Health Indicators
| Field | Value |
|-------|-------|
| **Name** | Monitor Feature Gate Denial Spikes as Business Health Indicators |
| **Category** | Observability — Business Metrics |
| **Rule** | Track a counter for feature gate denial events, tagged by `gate_name` and `team_id`. Set up anomaly detection for unexpected spikes — a sudden increase in `feature_gate_denial_count` without a corresponding deploy or plan change indicates billing state corruption. This is a business health metric, not just a technical metric. |
| **Reason** | Feature gates control access to premium features. When paying customers suddenly start being denied access, it's either a billing state corruption bug (subscription status not properly synced) or a deployment issue (feature flag misconfiguration). In both cases, the first signal is a spike in feature gate denials for legitimate paying teams. Monitoring this as a business metric means the team detects revenue-impacting issues before customers report them. |
| **Bad Example** | Feature gate denials are silently logged with no aggregation or alerting. Twenty paying teams are denied access to reports for 4 hours — discovered only when support tickets arrive. |
| **Good Example** | `Metrics::counter('feature_gate_denial_count', ['gate_name' => 'advanced-reporting', 'team_id' => $teamId]);` with an anomaly detection alert: if the denial rate exceeds the 7-day rolling average by 3 standard deviations, fire a P1 alert. Also display on a Pulse card on the operations dashboard. |
| **Exceptions** | During a planned migration where feature gates are being restructured and a spike in denials is expected. In this case, silence the alert for the migration window with a documented reason. |
| **Consequences Of Violation** | Paying customers silently lose access to features they paid for. Support ticket volume increases without a corresponding technical alert. The operations team learns about billing corruption from customers, not from their monitoring. Trust in the billing system erodes — customers check whether features still work after each deploy. |
