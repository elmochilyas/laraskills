# Metadata
**Domain:** Observability & Production Intelligence
**Subdomain:** Billing Observability
**Knowledge Unit:** Billing Webhook Production Metrics & Monitoring
**Generated:** 2026-06-22

# Quick Checklist (10-20 derived items)
- [ ] Webhook lifecycle events (`Received`, `Processed`, `Failed`) defined and dispatched
- [ ] Counters track all billing webhook events, tagged by `event_type`
- [ ] Latency histograms measure P50/P95/P99 processing time per event type
- [ ] Subscription drift reconciliation runs on a schedule (daily minimum)
- [ ] Drift count reported as a gauge metric and alerted on > 0
- [ ] Billing queue separated from application queues in `config/horizon.php`
- [ ] Custom Pulse cards show billing KPIs on the operations dashboard
- [ ] Sentry/Bugsnag configured with `stripe_event_id` and `team_id` as tags
- [ ] Alert thresholds defined: webhook failure rate > 1%, P95 latency > 10s, drift > 0
- [ ] Correlation IDs pass through the full webhook → job → API call chain
- [ ] Telescope disabled in all production environments

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Metric emission layer**: Laravel events at lifecycle points → listeners → counters/histograms
- **Dashboard layer**: Horizon for queue health + Pulse for business KPIs + Sentry for error context
- **Reconciliation layer**: Scheduled job comparing database state to Stripe API state
- **Correlation layer**: Correlation IDs threaded through controller → job → Stripe API → log entries
- **Alerting layer**: Ratios over absolutes, tagged by event_type, with anomaly detection

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] `StripeWebhookReceived` event: `eventId`, `eventType`, `teamId`
- [ ] `StripeWebhookProcessed` event: `eventId`, `eventType`, `teamId`, `durationMs`
- [ ] `StripeWebhookFailed` event: `eventId`, `eventType`, `teamId`, `failureReason`
- [ ] `RecordWebhookMetrics` listener: increments Prometheus-compatible counters
- [ ] Custom Pulse card `BillingHealthCard`: drift count, failed billing jobs, recent failures
- [ ] `ReconcileSubscriptions` scheduled job: compares DB against Stripe API
- [ ] Structured logging with `stripe_event_id`, `team_id`, `subscription_id`, `correlation_id`
- [ ] Sentry context configured with `stripe_event_id` and `team_id` as tags

# Performance Checklist
- Metric listeners execute post-job, not inline — negligible overhead
- Pulse card queries must be lightweight — use cached values refreshed by scheduled jobs
- Reconciliation job should be paginated for teams with many subscriptions
- Histogram bucket sizes should be configured for realistic latency ranges (100ms to 30s)

# Security Checklist
- [ ] Telescope disabled in all production environments (records raw request payloads)
- [ ] Metric labels must not include PII (customer emails, names) — use `team_id` or `stripe_event_id`
- [ ] Horizon dashboard behind authentication in production
- [ ] Sentry data scrubbing configured for sensitive billing fields

# Reliability Checklist
- [ ] Alert thresholds based on ratios (failed/received) not absolute counts — adapts to traffic volume
- [ ] Subscription drift alert fires immediately (P1), not as a warning
- [ ] Webhook latency P95 > 10s triggers alert — slow handlers cause backlogs
- [ ] Feature gate denial spike detection catches billing corruption before customer reports
- [ ] Permission denial spike detection catches authorization bugs from billing state issues

# Testing Checklist
- [ ] Test that webhook lifecycle events fire for each processing outcome
- [ ] Test that metric counters increment correctly for each event_type
- [ ] Test that latency histogram records accurate durations
- [ ] Test that reconciliation job detects injected drift
- [ ] Test that Pulse card displays correct billing KPIs
- [ ] Test that correlation IDs appear in all log entries for a single webhook lifecycle

# Maintainability Checklist
- [ ] Metric names follow consistent naming convention (`stripe_webhook_{metric}`)
- [ ] Event type labels derive from Stripe's actual event type strings
- [ ] Alert thresholds documented with rationale (why 1% failure rate, not 5%)
- [ ] Reconciliation job has `--dry-run` flag for safe testing

# Anti-Pattern Prevention Checklist
- [ ] Prevent: Metrics only in Stripe dashboard (delivery != processing success)
- [ ] Prevent: Telescope in production (logs sensitive webhook payloads)
- [ ] Prevent: Alerting on absolute counts (fires on legitimate traffic spikes)
- [ ] Prevent: No reconciliation process (relying on webhooks alone for state)
- [ ] Prevent: Missing event_type tags (can't distinguish critical from non-critical failures)

# Production Readiness Checklist
- [ ] Webhook lifecycle metrics emitting to production monitoring system
- [ ] Subscription drift reconciliation running on daily schedule
- [ ] Custom Pulse cards visible on operations dashboard
- [ ] Sentry tags configured for billing events
- [ ] Alert thresholds tested in staging
- [ ] Alert routing to on-call engineer configured (PagerDuty/Opsgenie)
- [ ] Telescope confirmed disabled in production environment
- [ ] Correlation ID propagation verified across full pipeline trace

# Final Approval Checklist
- [ ] Architecture review completed (event-driven metrics, dashboard strategy)
- [ ] Security review completed (Telescope disabled, PII in labels, Horizon auth)
- [ ] Performance impact assessed (listener overhead, Pulse card query weight)
- [ ] Testing coverage adequate (event dispatch, metric accuracy, reconciliation)
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Rules/Skills/Trees/Anti-Patterns
## Rules
- Track Webhook Lifecycle as Counters and Histograms, Not Just Logs
- Alert on Subscription Drift > 0 Immediately, Not as a Warning
- Tag All Billing Metrics by event_type
- Pass Correlation IDs Through Every Log Entry, Job, and API Call
- Monitor Feature Gate Denial Spikes as Business Health Indicators
## Anti-Patterns
- Metrics only in Stripe's dashboard
- Telescope in production
- Alerting on absolute counts without baselines
- No reconciliation process
