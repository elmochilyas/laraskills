# Billing Production Observability Metrics — Checklist

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** Billing Observability
- **Knowledge Unit:** Billing Production Observability Metrics
- **Last Updated:** 2026-06-22

---

## Prerequisites Checklist
- [ ] Stripe webhook handling implemented (signature verification, event dispatch)
- [ ] Cache driver supports atomic increments (Redis, database — NOT array)
- [ ] Laravel Pulse installed (or equivalent dashboard tool)
- [ ] Sentry or Bugsnag configured for exception tracking
- [ ] Horizon configured for queue monitoring
- [ ] Alerting infrastructure available (PagerDuty, Slack, Opsgenie)
- [ ] Log aggregation tool configured (ELK, Datadog, Grafana Loki)

## Implementation Checklist
- [ ] `stripe_webhook_received_count` counter incremented on every webhook receipt
- [ ] `stripe_webhook_validated_count` counter incremented after signature verification
- [ ] `stripe_webhook_duplicate_count` counter incremented on idempotency detection
- [ ] `stripe_webhook_dispatched_count` counter incremented after job dispatch
- [ ] `stripe_webhook_processed_count` counter incremented on successful handler completion
- [ ] `stripe_webhook_failed_count` counter incremented on handler exception
- [ ] `stripe_webhook_processing_latency` histogram recorded (receipt → completion time)
- [ ] `subscription_drift_count` gauge set by daily reconciliation job
- [ ] `billing_queue_depth` gauge monitoring billing queue length
- [ ] `failed_billing_jobs` counter categorized by event type and failure reason
- [ ] `feature_gate_denial_count` counter for billing feature gate denials
- [ ] `permission_denial_spikes` anomaly detection for billing permissions
- [ ] Correlation IDs generated, propagated, logged, and stored at all pipeline stages
- [ ] Dedicated billing queue with separate Horizon supervisor
- [ ] Pulse custom `BillingMetrics` card displaying real-time metrics
- [ ] Sentry/Bugsnag grouping billing exceptions by event type with correlation ID context
- [ ] Manual replay UI in admin panel for failed billing events
- [ ] Audit log integration for all billing event state transitions

## Verification Checklist
- [ ] All pipeline stage counters incrementing (verified via Pulse dashboard or cache inspection)
- [ ] Gap analysis possible: (received - validated = signature failures) | (validated - dispatched = dedup + dispatch failures) | (dispatched - processed = handler failures)
- [ ] Correlation ID present in every log entry from receipt to database write
- [ ] Subscription drift reconciliation runs daily; drift count is zero under normal operation
- [ ] Billing queue depth within normal bounds; spikes correlate with webhook volume, not non-billing work
- [ ] Failed job categorization provides actionable breakdown by type and reason
- [ ] Feature gate denials within expected range (no unexpected spikes)
- [ ] Manual replay UI functional: support agent can replay a failed webhook and see it complete

## Security Checklist
- [ ] Alert messages contain no PII (emails, names, subscription details) — use correlation IDs
- [ ] Correlation IDs use UUID v4 (cryptographically random, not sequential)
- [ ] Replay UI access restricted to admin/support roles
- [ ] Stripe API keys for drift reconciliation have minimal scope (read-only subscriptions)
- [ ] Feature gate denial metrics aggregate data — no per-user PII in metric values
- [ ] Alert channels (Slack, PagerDuty) periodically scanned for PII leakage
- [ ] Dashboard access role-restricted
- [ ] Audit log for all manual replays (who, when, why, which event)

## Performance Checklist
- [ ] Per-stage counter increments add < 10ms total per webhook
- [ ] For >100 webhooks/second, StatsD/UDP used instead of synchronous Cache::increment()
- [ ] Correlation ID logging overhead negligible (~36 bytes per log entry)
- [ ] Drift reconciliation batched to stay within Stripe API rate limits
- [ ] Pulse `pulse_entries` table retention configured (e.g., 7 days for billing metrics)
- [ ] Dedicated billing workers have sufficient CPU/memory allocation
- [ ] Billing queue worker saturation monitored independently from general workers

## Production Readiness Checklist
- [ ] Webhook volume alerts configured with baseline comparison (same hour last week)
- [ ] Webhook processing latency alerts at p99 threshold
- [ ] Subscription drift alert: PagerDuty (critical) for any non-zero drift
- [ ] Billing queue depth alert: Slack warning at threshold, PagerDuty at critical
- [ ] Failed billing job alerts by category: rate_limited → Slack warning; invalid_payload → PagerDuty critical
- [ ] Feature gate denial anomaly detection: PagerDuty if denial rate > 3σ from baseline
- [ ] Permission denial spike detection: PagerDuty if rate > 5× baseline
- [ ] Dedicated billing on-call rotation (or billing alerts escalated with higher severity)
- [ ] Manual replay runbook documented for support team
- [ ] Dashboard links available to on-call engineers for rapid investigation

## Common Mistakes to Avoid
- [ ] Only tracking "processed" — cannot localize pipeline failures
- [ ] No correlation IDs — slow debugging, manual log correlation
- [ ] Billing jobs on shared default queue — delayed by non-critical work
- [ ] Fixed alert thresholds for variable metrics — false positives and missed anomalies
- [ ] No subscription drift detection — revenue leakage undetected
- [ ] Uncategorized failure metrics — "50 failures" unactionable
- [ ] No replay mechanism — every failure requires engineering intervention
- [ ] PII in alert messages — compliance risk from alert channel exposure

## Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review: pipeline metrics coverage, queue isolation, drift reconciliation design
- [ ] Security review: alert message sanitization, correlation ID randomness, replay access control
- [ ] Performance review: metric emission overhead, reconciliation batching, Pulse retention
- [ ] Testing review: pipeline metrics verified across normal and failure scenarios
- [ ] Anti-pattern review: none of the 8 anti-patterns present
- [ ] Production readiness: alerts configured, runbooks documented, on-call rotation defined
