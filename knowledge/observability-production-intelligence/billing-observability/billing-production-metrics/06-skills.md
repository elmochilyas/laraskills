# Skill: Instrument Billing Production Observability

## Purpose
Implement comprehensive production observability for a Laravel billing system, covering Stripe webhook lifecycle metrics, subscription drift detection, queue health monitoring, failure categorization, anomaly detection, correlation ID tracing, and Alert escalation.

## When To Use
Any production Laravel application with Stripe billing (Cashier, Spark, or custom) that processes webhooks and manages subscription state. When billing revenue depends on webhook processing reliability and failures must be detected before customers report them.

## When NOT To Use
Applications without billing; Stripe Checkout-only flows (no server-side webhook processing); very low volume (< 10 webhooks/day) where manual monitoring suffices.

## Prerequisites
- Stripe webhook handling implemented (signature verification, event dispatch)
- Cache driver supporting atomic increments (Redis, database)
- Laravel Pulse installed (for dashboard cards)
- Sentry or Bugsnag configured (for exception tracking)
- Horizon configured (for queue monitoring)
- Alerting infrastructure (PagerDuty, Slack, Opsgenie)

## Inputs
- Stripe webhook controller and event handlers
- Billing job classes
- Queue configuration (Horizon supervisors)
- Stripe API access (for drift reconciliation)
- Alert escalation policy

## Workflow
1. **Instrument webhook pipeline**: Add counter increments at each pipeline stage (received, validated, deduplicated, dispatched).
2. **Instrument job handler**: Add counter increments for processed/failed. Categorize failures by event type and reason.
3. **Add correlation IDs**: Generate UUID at webhook entry, pass to job constructor, log at every step, store in audit table.
4. **Create dedicated billing queue**: Configure Horizon supervisor for `billing` queue with dedicated workers.
5. **Implement subscription drift check**: Daily scheduled job comparing local subscriptions to Stripe state. Alert on any drift.
6. **Configure Pulse dashboard**: Create custom `BillingMetrics` card showing real-time pipeline metrics.
7. **Configure Sentry/Bugsnag**: Group billing exceptions by webhook event type. Include correlation ID in context.
8. **Define alert thresholds**: Baseline-based for volume metrics; fixed (zero) for drift metrics.
9. **Set up alert escalation**: PagerDuty for critical (drift, volume drop >50%); Slack for warning (latency > p99).
10. **Implement replay UI**: Admin panel to manually replay failed webhooks from `billing_events` audit table.

## Validation Checklist
- [ ] Counter incremented at each pipeline stage (received, validated, deduped, dispatched, processed, failed)
- [ ] Failed jobs categorized by event type AND failure reason
- [ ] Correlation ID present in every log entry and stored in audit table
- [ ] Dedicated billing queue with separate Horizon supervisor
- [ ] Subscription drift check runs daily; alerts on non-zero drift
- [ ] Pulse dashboard shows real-time billing metrics
- [ ] Sentry groups billing exceptions by event type
- [ ] Alert thresholds configured with baseline comparison
- [ ] PagerDuty escalation for critical billing alerts
- [ ] Manual replay UI available for support team

## Common Failures
- Only tracking "processed" — can't localize pipeline failures
- No correlation IDs — slow debugging, manual log correlation
- Billing jobs on default queue — delayed by non-critical backlog
- Fixed alert thresholds — false alerts at low-traffic, missed at high-traffic
- No subscription drift detection — revenue leakage undetected for weeks
- No failure categorization — "50 failures" unactionable without type/reason
- No replay UI — every failed webhook requires engineering intervention

## Decision Points
- Dedicated billing queue vs shared queue: dedicated for any meaningful billing volume
- Baseline-comparison alerting vs fixed thresholds: baseline for volume metrics, fixed for zero-tolerance metrics
- Correlation ID storage: log-only vs audit table — audit table for compliance, logs for debugging
- Drift reconciliation frequency: daily for standard, hourly for high-volume, continuous for enterprise
- Replay UI: admin panel with confirmation vs automated retry with manual review queue

## Performance Considerations
- Per-stage counter increments: ~1ms each. At 100+ webhooks/second, use StatsD/UDP (fire-and-forget)
- Correlation ID: 36 bytes per UUID per log entry — negligible
- Drift reconciliation: one Stripe API call per active subscription. Batch to stay within rate limits
- Pulse storage: billing metrics stored in `pulse_entries`. Configure retention (e.g., 7 days)
- Dedicated billing workers: separate CPU/memory allocation. Monitor saturation independently

## Security Considerations
- Alert messages must not expose customer PII or payment details
- Correlation IDs must be random (UUID v4) — not predictable (no sequential IDs)
- Replay UI must be access-controlled (admin/support roles only)
- Stripe API keys used in drift reconciliation must have minimal scope (read-only subscriptions)
- Feature gate denial metrics must not reveal which specific users were denied (privacy)
- Permission denial spike alerts must not expose which resources triggered the denials

## Related Rules
- Rule 1: track-webhook-pipeline-per-stage
- Rule 2: correlation-id-on-every-billing-event
- Rule 3: dedicated-billing-queue-with-separate-monitoring
- Rule 4: alert-on-subscription-drift-nonzero
- Rule 5: baseline-compare-alert-thresholds
- Rule 6: categorize-failed-billing-jobs

## Related Skills
- Handle Stripe Webhooks
- Configure Queue Workers and Horizon
- Monitor Application Health with Pulse
- Implement Feature Flags

## Success Criteria
Every billing event is traceable end-to-end via correlation ID; pipeline failures are localized to the exact stage; subscription drift is detected within 24 hours; billing queue health is independently monitored; failed jobs are categorized for rapid diagnosis; alerts fire on anomalies before customer impact.
