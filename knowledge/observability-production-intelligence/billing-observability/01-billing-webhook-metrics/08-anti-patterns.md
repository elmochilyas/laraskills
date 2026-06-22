# Anti-Patterns for Billing Webhook Production Metrics & Monitoring

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Observability & Production Intelligence |
| Subdomain | Billing Observability |
| Knowledge Unit | Billing Webhook Production Metrics & Monitoring |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-BWM-001 | Metrics Only in Stripe Dashboard | High | High |
| AP-BWM-002 | Telescope in Production | Critical | Low |
| AP-BWM-003 | Alerting on Absolute Counts Without Baselines | Medium | High |
| AP-BWM-004 | No Subscription Drift Reconciliation | High | Medium |
| AP-BWM-005 | No Correlation IDs Across Job Chain | Medium | High |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-WQD-004 (No Dead-Letter Table) — from Webhook Queue Design
- AP-QDS-005 (Deploy and Forget) — from Queue Deployment Safety

---

## AP-BWM-001: Metrics Only in Stripe Dashboard

### Category
Observability | Monitoring Gaps

### Description
Relying solely on Stripe's dashboard for webhook monitoring. Stripe shows delivery success/failure, but not processing success/failure. A webhook that was delivered successfully (Stripe's 200 response) but threw an exception in the handler is invisible in Stripe's dashboard.

### Why It Happens
- Stripe's dashboard is readily available and shows webhook delivery status
- The team doesn't realize delivery != processing
- No internal metrics infrastructure has been set up
- Stripe's dashboard seems "good enough" for billing monitoring

### Warning Signs
- No internal webhook metrics (counters, histograms) in the application
- The team checks Stripe's dashboard for webhook health
- Webhook processing failures are discovered by customer reports, not monitoring
- No `stripe_webhook_failed_count` metric exists in the application's monitoring

### Why Harmful
Stripe reports delivery, not processing. A webhook that delivered successfully (your server returned 200) but threw an exception in the queued processing job is invisible in Stripe. The delivery shows as successful, but the subscription wasn't updated, the invoice wasn't generated, or the notification wasn't sent. The team has no visibility into processing failures — they discover them when customers report billing issues.

### Real-World Consequences
- A SaaS platform relies on Stripe's dashboard for webhook monitoring. Stripe shows all webhooks as "delivered successfully." But 15% of `invoice.payment_succeeded` webhooks are failing in the queued processing job due to a bug in a recent deploy. The failures are invisible in Stripe's dashboard (delivery succeeded). Three weeks later, 200 customers report "my subscription shows as pending even though I paid." The team discovers the processing failures by examining the failed_jobs table — 3 weeks of unprocessed payment webhooks.

### Preferred Alternative
Implement internal webhook lifecycle metrics: `stripe_webhook_received_count`, `stripe_webhook_processed_count`, `stripe_webhook_failed_count`, `stripe_webhook_duplicate_count`. These track the full pipeline: receipt → processing → success/failure. Fire Laravel events at lifecycle points; listeners record metrics. Monitor both delivery (Stripe dashboard) and processing (internal metrics).

### Refactoring Strategy
1. Define `StripeWebhookReceived`, `StripeWebhookProcessed`, `StripeWebhookFailed` events.
2. Dispatch them at lifecycle points in the webhook processing pipeline.
3. Implement listeners that increment Prometheus-compatible counters tagged by `event_type`.
4. Set up dashboards (Pulse cards or external dashboard) for the internal metrics.
5. Set alert thresholds on internal metrics (failure rate > 1%).

### Detection Checklist
- [ ] No internal webhook metrics (counters, histograms) in the application
- [ ] Team checks Stripe's dashboard for webhook health
- [ ] Processing failures discovered by customer reports, not monitoring
- [ ] No `stripe_webhook_failed_count` metric exists
- [ ] No distinction between delivery success and processing success

### Related Rules
- Track Webhook Lifecycle as Counters and Histograms, Not Just Logs

---

## AP-BWM-002: Telescope in Production

### Category
Security | Observability

### Description
Enabling Laravel Telescope in a production environment. Telescope records every request payload, database query, and event — including Stripe webhook secrets, customer billing data, and PII. This data is accessible via the Telescope dashboard, creating a security exposure.

### Why It Happens
- Telescope was enabled during development and not disabled for production
- The team uses Telescope for production debugging without understanding the security implications
- The `TELESCOPE_ENABLED` environment variable is set to `true` in production
- No environment-based guard on Telescope's service provider

### Warning Signs
- `TELESCOPE_ENABLED=true` in the production `.env` file
- Telescope dashboard accessible in production (`/telescope`)
- Telescope database table growing rapidly in production
- No environment check in `TelescopeServiceProvider`

### Why Harmful
Telescope records full request payloads — including the `Stripe-Signature` header, webhook payload data (customer IDs, payment method details, amounts), and authentication tokens. This data in the Telescope database is a treasure trove for an attacker who gains access. Additionally, Telescope's overhead degrades production performance: every request and query is instrumented.

### Real-World Consequences
- A SaaS platform leaves Telescope enabled in production. An attacker gains read access to the database (via SQL injection in another feature). They access the `telescope_entries` table, which contains full Stripe webhook payloads including customer payment method details. The attacker uses this data for social engineering attacks against customers. The data breach notification is required under GDPR and CCPA.

### Preferred Alternative
Disable Telescope in all production environments. Use `TELESCOPE_ENABLED=false` in the production `.env`. Add an environment guard in `TelescopeServiceProvider::register()`: `if (!$this->app->environment('production')) { $this->hideFromRequests(); }`. Use Sentry/Bugsnag for production exception tracking. Use Horizon and Pulse for production metrics.

### Refactoring Strategy
1. Check `TELESCOPE_ENABLED` in the production `.env` — set to `false`.
2. Add an environment guard in `TelescopeServiceProvider`.
3. Remove the Telescope dashboard route from production routes.
4. Consider pruning the `telescope_entries` table if it contains production data.
5. Use Sentry/Bugsnag for production exception tracking instead.

### Detection Checklist
- [ ] `TELESCOPE_ENABLED=true` in the production `.env`
- [ ] Telescope dashboard accessible in production (`/telescope`)
- [ ] No environment guard in `TelescopeServiceProvider`
- [ ] Telescope database table growing in production
- [ ] Team uses Telescope for production debugging

### Related Rules
- (Implied by Telescope disabling best practices)

---

## AP-BWM-003: Alerting on Absolute Counts Without Baselines

### Category
Observability | Alerting

### Description
Setting alert thresholds on absolute counts ("more than 5 failures") without considering traffic volume. During legitimate traffic spikes (marketing campaign, product launch), the absolute count exceeds the threshold even when the failure rate is normal, causing false alerts. During quiet periods, a high failure rate may not reach the absolute threshold, causing missed alerts.

### Why It Happens
- Absolute thresholds are simpler to configure than ratio-based thresholds
- The team doesn't know the normal traffic volume or failure rate
- No historical baseline data exists
- The monitoring tool makes absolute thresholds easier to set up

### Warning Signs
- Alert thresholds like "failed > 5" without a corresponding "rate > 1%" threshold
- Alerts fire during marketing campaigns or product launches (traffic spikes)
- Alerts don't fire during quiet periods even when the failure rate is high
- The team ignores billing alerts because they're "always going off during spikes"

### Why Harmful
Absolute-count alerts without baselines produce false positives during traffic spikes (alert fatigue) and false negatives during quiet periods (missed incidents). The team develops alert fatigue — ignoring billing alerts because they fire during every marketing campaign. When a real billing incident occurs, the alert is ignored like all the others.

### Real-World Consequences
- A SaaS platform has an alert: "webhook failures > 10 in 5 minutes." During a Black Friday promotion, webhook volume triples. The failure count reaches 12 (from 4 at normal volume), but the failure rate is 0.5% (normal). The alert fires. The on-call engineer investigates and finds nothing wrong. This happens 5 times during the promotion. The engineer starts ignoring the alert. A week later, a real bug causes a 5% failure rate, but the absolute count is only 8 (it's a quiet day). The alert doesn't fire. 50 customers' subscriptions aren't processed.

### Preferred Alternative
Alert on ratios: `failed_count / received_count > 1%` over 5 minutes. This adapts to traffic volume. A 1% failure rate is equally concerning at 100 webhooks (1 failure) and 10,000 webhooks (100 failures). For state-dependent metrics (drift, queue depth), use absolute thresholds (drift > 0, depth > 100).

### Refactoring Strategy
1. Identify alerts with absolute-count thresholds.
2. For volume-dependent metrics, change to ratio-based thresholds.
3. For state-dependent metrics, keep absolute thresholds.
4. Calculate historical baselines to validate threshold values.
5. Set up anomaly detection for metrics without clear thresholds.

### Detection Checklist
- [ ] Alert thresholds on absolute counts without ratio-based alternatives
- [ ] Alerts fire during traffic spikes with normal failure rates
- [ ] Alerts don't fire during quiet periods with high failure rates
- [ ] Team ignores billing alerts due to alert fatigue
- [ ] No historical baseline data for setting thresholds

### Related Rules
- Tag All Billing Metrics by event_type

---

## AP-BWM-004: No Subscription Drift Reconciliation

### Category
Observability | Data Integrity

### Description
Relying solely on webhooks to keep subscription state synchronized between Stripe and the local database. No periodic reconciliation job compares the two. When webhooks fail silently (exception in handler, queue backlog, Stripe delivery failure), the drift accumulates undetected.

### Why It Happens
- Webhooks are assumed to be reliable ("Stripe always delivers")
- Reconciliation requires Stripe API calls (costs API quota)
- No awareness that webhooks can fail silently
- The team trusts the webhook pipeline without a safety net

### Warning Signs
- No reconciliation job in the scheduled tasks
- No `subscription_drift_count` metric
- Drift discovered by customer reports, not monitoring
- No process for comparing local state to Stripe's API
- Weeks of mismatched state before discovery

### Why Harmful
Webhooks can fail silently: a handler throws an exception after partially updating state, a queue backlog delays processing, or Stripe fails to deliver an event. Without reconciliation, the local database and Stripe drift apart. Paying customers are locked out of features. Non-paying customers retain premium access. The longer the drift goes undetected, the more customers are affected and the harder the reconciliation.

### Real-World Consequences
- A SaaS platform has no reconciliation job. A bug in a webhook handler causes `customer.subscription.deleted` events to fail silently for 3 weeks. 45 cancelled customers retain premium access (revenue leakage). 12 of those customers notice and exploit the free access. The issue is discovered during a manual billing audit 3 weeks later. The team must manually reconcile 45 subscriptions, issue refunds for 12 customers who were charged during the "cancelled" period, and fix the handler bug. A daily reconciliation job would have caught the drift within 24 hours.

### Preferred Alternative
Run a periodic reconciliation job: fetch active subscriptions from Stripe's API, compare against local database. Any non-zero drift triggers a P1 alert. Run daily for most systems; hourly for high-volume billing. Record drift count as a gauge metric.

### Refactoring Strategy
1. Create a `ReconcileSubscriptions` job that fetches subscriptions from Stripe and compares to local DB.
2. Schedule it daily (or more frequently for high-volume systems).
3. Record `subscription_drift_count` as a gauge metric.
4. Set a P1 alert on drift > 0.
5. Create a repair flow for drift: force-sync affected subscriptions from Stripe's API.

### Detection Checklist
- [ ] No reconciliation job in scheduled tasks
- [ ] No `subscription_drift_count` metric
- [ ] Drift discovered by customer reports, not monitoring
- [ ] No process for comparing local state to Stripe's API
- [ ] Weeks of mismatched state before discovery

### Related Rules
- Alert on Subscription Drift > 0 Immediately

---

## AP-BWM-005: No Correlation IDs Across Job Chain

### Category
Observability | Tracing

### Description
Logging correlation IDs (like `stripe_event_id`) only at the webhook entry point, not passing them through the queued job, subsequent API calls, and notification dispatch. When a customer reports a billing issue, the team can't trace the full lifecycle without grep-searching multiple log files.

### Why It Happens
- The developer logs the `stripe_event_id` in the webhook controller but forgets to pass it to the job
- The job constructor only accepts the event ID, not a correlation ID
- `Log::withContext()` is not used to propagate correlation IDs
- No awareness that the full chain needs to be traceable

### Warning Signs
- Log entries in the webhook controller have `stripe_event_id` but job log entries don't
- No `correlation_id` field in log entries
- Incident investigation requires grep-searching multiple log files
- Support staff can't confirm whether a specific webhook was processed
- Sentry/Bugsnag errors don't have `stripe_event_id` or `team_id` tags

### Why Harmful
When a customer reports "my payment didn't process," the support team needs to trace the full lifecycle: did the webhook arrive? was it persisted? did the job process it? which API calls were made? was a notification sent? Without correlation IDs threading through every step, answering these questions requires grep-searching multiple log files with different keys. Investigation takes hours instead of minutes.

### Real-World Consequences
- A customer reports "I paid but my subscription is still pending." The support engineer searches logs for the customer's email — finds the webhook receipt but not the processing. Searches the job log — no `stripe_event_id` to filter by. Searches the Stripe API call log — no correlation to the original webhook. After 45 minutes of grep-searching across 4 log files, the engineer discovers the job failed with a "subscription not found" error. If correlation IDs had been passed through the chain, the investigation would have taken 30 seconds: filter logs by `correlation_id`.

### Preferred Alternative
Generate a `correlation_id` at the webhook entry point. Pass it through the job constructor. Use `Log::withContext(['correlation_id' => $correlationId])` to attach it to all subsequent log entries. Include it in Stripe API call metadata. Set it as a tag in Sentry/Bugsnag. One query returns the full pipeline trace.

### Refactoring Strategy
1. Generate `correlation_id = Str::uuid()` at the webhook controller.
2. Pass it to the processing job constructor.
3. Use `Log::withContext(['correlation_id' => $correlationId])` in the job's `handle()`.
4. Include it in Stripe API call metadata.
5. Set `stripe_event_id`, `team_id`, and `correlation_id` as Sentry tags.

### Detection Checklist
- [ ] Log entries in the webhook controller have correlation IDs but job entries don't
- [ ] No `correlation_id` field in log entries
- [ ] Incident investigation requires grep-searching multiple log files
- [ ] Support staff can't quickly trace a billing issue
- [ ] Sentry/Bugsnag errors don't have `stripe_event_id` or `team_id` tags

### Related Rules
- Pass Correlation IDs Through Every Log Entry, Job, and API Call
