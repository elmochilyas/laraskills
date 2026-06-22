# Skill: Billing Webhook Production Metrics & Monitoring

## Purpose
Implement comprehensive production observability for Stripe webhook processing pipelines. Track webhook lifecycle as counters and histograms (not just logs), tag metrics by `event_type`, alert on subscription drift immediately, pass correlation IDs through every log and API call, and monitor feature gate denials as business health indicators.

## When To Use
- All production Laravel SaaS applications processing Stripe webhooks
- Applications where subscription state correctness directly impacts revenue
- When features are gated behind paid plans and denied access is a business incident
- During billing system migrations or Stripe API version upgrades
- When onboarding new team members who need visibility into billing pipeline health

## When NOT To Use
- Applications without any billing integration
- Development-only environments (use Telescope for local debugging)
- Prototypes that don't handle real money
- Non-production environments where manual Telescope/Sentry inspection is sufficient

## Prerequisites
- Understanding of Laravel events and event listeners
- Familiarity with Laravel Horizon for queue-level observability
- Knowledge of Laravel Pulse for application-level metrics
- Understanding of structured logging and correlation IDs
- Familiarity with Sentry/Bugsnag for exception tracking

## Inputs
- The Stripe event types being handled (for metric tagging)
- The billing queues in use (for per-queue depth monitoring)
- The feature gates in the application (for denial spike monitoring)
- The alerting infrastructure (Slack, PagerDuty, email)
- Whether read replicas are used (affects reconciliation frequency)

## Workflow
1. **Define webhook lifecycle events** — Create `StripeWebhookReceived`, `StripeWebhookProcessed`, `StripeWebhookFailed` events. Dispatch them at lifecycle points in the webhook processing pipeline.
2. **Implement metric recording listeners** — Listeners increment counters (`stripe_webhook_received_count`, `stripe_webhook_processed_count`, `stripe_webhook_failed_count`, `stripe_webhook_duplicate_count`) tagged by `event_type`. Record latency histograms.
3. **Set alert thresholds on ratios** — Alert on `failed_count / received_count > 1%` over 5 minutes, not absolute counts. Alert on `duplicate / received > 10%`. Alert on P95 latency > 10s.
4. **Implement subscription drift reconciliation** — Nightly job: fetch active subscriptions from Stripe API, compare against local database. Any non-zero drift triggers a P1 alert.
5. **Create custom Pulse cards** — Display `subscription_drift_count`, `failed_billing_jobs`, and `feature_gate_denial_count` on the operations dashboard.
6. **Pass correlation IDs through the full chain** — Generate `correlation_id` at the webhook controller. Pass it through job constructors, event payloads, Stripe API metadata, and log entries. Use `Log::withContext()`.
7. **Configure Sentry/Bugsnag with tags** — Set `stripe_event_id` and `team_id` as tags. This enables "show me all errors for this Stripe event" queries.
8. **Monitor feature gate denials** — Track `feature_gate_denial_count` tagged by `gate_name` and `team_id`. Set up anomaly detection for unexpected spikes.
9. **Separate billing queue in Horizon** — Use a dedicated `billing` queue so billing metrics are isolated from application queue metrics.
10. **Ensure Telescope is disabled in production** — Telescope records every request payload, including webhook secrets. Never enable in production.

## Validation Checklist
- [ ] Webhook lifecycle events (`Received`, `Processed`, `Failed`) defined and dispatched
- [ ] Counters and histograms track all billing webhook events, tagged by `event_type`
- [ ] Subscription drift reconciliation runs on a schedule (daily minimum)
- [ ] Billing queue separated from application queues in Horizon config
- [ ] Custom Pulse cards show billing KPIs on the operations dashboard
- [ ] Sentry/Bugsnag configured with `stripe_event_id` and `team_id` as tags
- [ ] Alert thresholds: failure rate > 1%, P95 latency > 10s, queue depth > 100, drift > 0
- [ ] Structured logs include `stripe_event_id`, `team_id`, `correlation_id` in every entry
- [ ] Correlation IDs pass through webhook → job → API call chain
- [ ] Telescope disabled in all production environments

## Common Failures
- Only monitoring webhook failures in Stripe's dashboard (Stripe shows delivery, not processing)
- No latency monitoring — slow processing causes queue backlogs silently
- No subscription drift monitoring — weeks of mismatched state before customer reports
- Not tagging metrics by `event_type` — can't distinguish critical from non-critical failures
- Correlation IDs not passed through jobs — can't trace a job failure to its webhook
- Telescope enabled in production — webhook secrets and customer data exposed

## Decision Points
- **Counters vs. logs?** — Both. Counters for alerting and dashboards; logs for post-mortem investigation
- **Absolute or ratio alerts?** — Ratios. `failed/received > 1%` adapts to traffic volume changes
- **How often to reconcile?** — Daily minimum. More frequent for high-volume billing systems
- **Which metrics need Pulse cards?** — `subscription_drift_count`, `failed_billing_jobs`, `feature_gate_denial_count` — the KPIs that indicate billing health

## Performance Considerations
- Metric recording listeners should be lightweight (increment a counter, record a histogram value)
- Pulse cards should use cached values refreshed by scheduled jobs, not real-time queries
- Subscription reconciliation job makes Stripe API calls — respect rate limits, use staggered processing
- Structured logging with `Log::withContext()` adds negligible overhead

## Security Considerations
- Telescope must be disabled in production — it records webhook secrets and customer data
- Horizon dashboard must be behind authentication (`Horizon::auth()`)
- Correlation IDs should not be metric labels (cardinality explosion) — log them, don't tag them
- Log entries may contain billing data — apply appropriate access controls to log storage

## Related Rules (from 05-rules.md)
- Track Webhook Lifecycle as Counters and Histograms, Not Just Logs
- Alert on Subscription Drift > 0 Immediately
- Tag All Billing Metrics by event_type
- Pass Correlation IDs Through Every Log Entry, Job, and API Call
- Monitor Feature Gate Denial Spikes as Business Health Indicators

## Related Skills
- Billing alerts and repair flows (alert response and manual repair procedures)
- Webhook queue design (the pipeline being monitored)
- Billing queue topology (per-queue monitoring)

## Success Criteria
- Billing degradation is detected by monitoring before customers report it
- Every billing event can be traced end-to-end via correlation IDs
- Subscription drift is caught within 24 hours and alerted as P1
- Feature gate denial spikes trigger investigation before customer complaints
- The operations dashboard shows billing health alongside application health
