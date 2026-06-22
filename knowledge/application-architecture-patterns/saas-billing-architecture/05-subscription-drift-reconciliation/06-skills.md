# Skill: Detect and Repair Subscription Drift

## Purpose

Design and implement drift detection and repair systems that compare local subscription state against Stripe's canonical state, classify discrepancies by severity, and safely repair safe drifts while alerting on critical ones that require human review.

## When To Use

- Every production SaaS with Stripe billing where subscription state is cached locally
- When operational staff make changes directly in the Stripe Dashboard (plan changes, cancellations, refunds)
- When billing accuracy is critical and missed webhooks or processing bugs can cause state divergence
- When compliance requires proof that billing state is accurately reflected in the application
- When you've experienced webhook processing failures and need ongoing drift protection

## When NOT To Use

- Development environments where reconciliation is useful but lower priority than production
- Applications where local subscription state is never cached (all state read from Stripe on demand) — but then you have a different architectural problem

## Prerequisites

- BillingGateway wrapper pattern in place (for Stripe API access)
- Subscription model with locally cached Stripe state (stripe_status, period dates, plan reference)
- Stripe webhook idempotency and deduplication operational
- EntitlementService with cache invalidation capability

## Inputs

- Active subscriptions with locally cached Stripe state
- BillingGateway for querying canonical Stripe state
- Drift severity classification rules (LOW, MEDIUM, CRITICAL)
- Auto-repair field whitelist (safe fields)
- Alerting channels for critical drift (Slack, email, PagerDuty)
- DriftAlert model for tracking critical drifts pending review

## Workflow

1. Create DriftItem and DriftReport value objects with severity classification
2. Implement DriftDetectionService that compares local vs Stripe state field by field
3. Add clock skew tolerance (5 seconds) for date field comparisons
4. Classify drifts: LOW (period dates, trial dates), MEDIUM (status, cancel_at_period_end), CRITICAL (plan, orphaned subscriptions)
5. Implement DriftRepairService that auto-repairs only safe fields, alerts on critical fields
6. Detect orphaned subscriptions (exists locally, not found in Stripe) and mark as canceled locally
7. Create DriftAlert model for critical drifts pending human review
8. Implement `billing:reconcile` Artisan command with --auto-repair, --dry-run, and --team options
9. Rate-limit Stripe API calls: 50ms delay between calls (~20 req/sec for live mode)
10. Schedule reconciliation to run hourly with monitoring on drift rate
11. Integrate repair operations with entitlement cache invalidation

## Validation Checklist

- [ ] DriftDetectionService correctly identifies: status drift, date drift, plan drift, cancel_at_period_end drift
- [ ] 5-second clock skew tolerance applied to date comparisons
- [ ] DriftReport correctly classifies items by severity (LOW, MEDIUM, CRITICAL)
- [ ] Auto-repair only touches safe fields (status, period dates, canceled_at) — never plan or pricing
- [ ] Critical drift (plan change, orphaned subscription) triggers alert and creates DriftAlert record
- [ ] Orphaned subscriptions detected and marked as canceled locally (not silently ignored)
- [ ] Reconciliation rate-limited with 50ms delay between API calls
- [ ] All repairs logged with team ID, fields changed, old/new values, and actor identity
- [ ] Stripe is always the source of truth — local state updated to match Stripe, never the reverse
- [ ] DriftAlert records stored for human review of critical drift
- [ ] `billing:reconcile` command runs on schedule (hourly minimum)
- [ ] Drift rate monitored: alert if > 1% of subscriptions show drift (indicates systemic issue)
- [ ] Test: local status 'active', Stripe status 'past_due' → detected and auto-repaired
- [ ] Test: local plan 'Pro', Stripe plan 'Enterprise' → detected, alerted, NOT auto-repaired
- [ ] Test: subscription exists locally but not in Stripe → orphan detected, canceled locally

## Common Failures

- Treating all drift as equal and auto-repairing everything (including plan changes)
- Zero clock skew tolerance causing false-positive drift on every reconciliation cycle
- Pushing local state corrections to Stripe instead of pulling Stripe corrections to local state
- Not handling orphaned subscriptions — users retain free access to paid features
- Running reconciliation without rate limiting and getting Stripe 429 errors
- Using reconciliation as the primary sync mechanism instead of fixing broken webhook processing
- Not logging repair actions — cannot audit what changed or why
- Alerting on every single drift (alert fatigue — ops team ignores billing alerts)

## Decision Points

- Drift severity classification: three tiers (LOW/MEDIUM/CRITICAL) vs binary (safe/unsafe)?
- Orphan handling: auto-cancel vs create review ticket vs alert-only?
- Drift alerting: alert per drift vs alert on drift rate threshold vs alert on critical only?
- Reconciliation scheduling: hourly vs continuous vs daily?
- Sharding: single-server with batching vs sharded by team ID ranges?

## Performance Considerations

- Reconciliation queries Stripe API once per active subscription. At 20 calls/sec, 10,000 subscriptions take ~8 minutes
- Use a dedicated queue worker with low priority to avoid competing with user-facing jobs
- For 50k+ subscriptions, shard reconciliation by team ID ranges
- Cache reconciliation results in a drift_alerts table — don't report live in application logic
- Deduplicate alerts by team ID + field to prevent alert storms from repeating drifts
- The drift detection itself is local (comparing database values) — the Stripe API call is the bottleneck

## Security Considerations

- Reconciliation API calls use the same Stripe secret key as billing operations — protect the queue worker environment
- Drift alert data may contain PII (team names, email domains) — access-control alert channels
- Auto-repair must never modify Stripe state — it only syncs local state to match the Stripe source of truth
- Reconciliation must not expose Stripe subscription data to unauthorized operators
- Repair audit logs must be access-controlled (contain billing state information)

## Related Rules

- Rule 1: Stripe Is Always the Source of Truth — Never Push Local Corrections to Stripe
- Rule 2: Classify Drift by Severity — Never Treat All Drift Equally
- Rule 3: Use Clock Skew Tolerance on Date Comparisons
- Rule 4: Detect and Handle Orphaned Subscriptions
- Rule 5: Reconciliation Is a Safety Net — Fix Webhook Processing First

## Related Skills

- Implement Webhook Audit Log, Replay & Reconciliation
- Implement Stripe Webhook Idempotency & Event Deduplication
- Implement Cashier + BillingGateway Wrapper Pattern

## Success Criteria

- Drift is detected within one reconciliation cycle (hourly) for all active subscriptions
- Safe drift is auto-repaired without human intervention, critical drift triggers alerts for review
- Drift rate is tracked and monitored — systemic issues are detected before customers report them
- Orphaned subscriptions are cleaned up within one reconciliation cycle
- All repair actions are traceable via audit logs with before/after values
- Reconciliation completes successfully for the entire subscription base without Stripe API errors
