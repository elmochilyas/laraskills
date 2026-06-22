# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Subscription Drift Detection & Repair
**Generated:** 2026-06-22

---

# Quick Checklist

- [ ] Stripe is always the source of truth — reconciliation updates local state, never Stripe
- [ ] Drift classified by severity: LOW (dates), MEDIUM (status), CRITICAL (plan, orphaned)
- [ ] Auto-repair only safe fields — plan drift always requires human review
- [ ] Clock skew tolerance (5 seconds) applied to all date comparisons
- [ ] Orphaned subscriptions detected and marked as canceled locally
- [ ] Reconciliation rate-limited (50ms delay between Stripe API calls)
- [ ] All repairs logged with before/after state and actor
- [ ] Drift rate monitored — high drift signals webhook processing issues

---

# Architecture Checklist

- [ ] DriftDetectionService compares local subscription state against Stripe API
- [ ] DriftItem value object carries: field, local value, stripe value, severity, safeForAutoRepair
- [ ] DriftReport value object aggregates drift items with helper methods (hasCriticalDrift, autoRepairableItems)
- [ ] DriftRepairService applies safe repairs and creates DriftAlert for critical drifts
- [ ] DriftSeverity enum: LOW, MEDIUM, CRITICAL
- [ ] DriftAlert model persists critical drifts for manual review
- [ ] Orphaned subscription detection in reconciliation logic
- [ ] Reconciliation scheduled in console kernel (hourly with withoutOverlapping lock)
- [ ] CleanupOrphanedSubscriptions job runs on schedule

---

# Implementation Checklist

- [ ] DriftDetectionService::detectForTeam() returns DriftReport for a single team
- [ ] Status drift detected: local status differs from Stripe status
- [ ] Date drifts detected: trial_ends_at, current_period_start, current_period_end, canceled_at
- [ ] Plan drift detected: local plan's stripe_price_id differs from Stripe's
- [ ] cancel_at_period_end drift detected
- [ ] Orphaned subscription detected: getSubscription() throws RuntimeException
- [ ] DriftRepairService::repair() updates safe fields from Stripe data
- [ ] Critical drifts create DriftAlert record with status 'pending_review'
- [ ] `billing:reconcile` command supports --auto-repair, --team, --dry-run options
- [ ] Reconciliation rate-limited with usleep(50000) between calls

---

# Testing Checklist

- [ ] Local status 'active', Stripe status 'past_due' → drift detected and auto-repaired
- [ ] Local plan 'Pro', Stripe plan 'Enterprise' → drift detected, alerted, NOT auto-repaired
- [ ] Subscription exists locally but not in Stripe → orphan detected, canceled locally
- [ ] Date difference of 3 seconds → within tolerance, no drift reported
- [ ] Date difference of 10 seconds → drift detected
- [ ] cancel_at_period_end drift detected and repaired
- [ ] Critical drift creates DriftAlert with correct metadata
- [ ] Reconciliation with --dry-run reports drift but makes no changes
- [ ] Orphaned subscription cleanup: active locally, not found in Stripe → marked canceled
- [ ] Drift rate monitoring: high drift triggers alert

---

# Production Readiness Checklist

- [ ] Reconciliation scheduled hourly (or more frequently) with withoutOverlapping lock
- [ ] Reconciliation runs on a dedicated queue with controlled concurrency
- [ ] Stripe API rate limiting enforced (20 calls/sec for live mode)
- [ ] Drift alert channel configured (Slack/PagerDuty/email)
- [ ] Monitoring: alert if drift rate exceeds 1% of active subscriptions
- [ ] Monitoring: alert if reconciliation fails entirely
- [ ] DriftAlert review process documented (who reviews critical drifts, response SLA)
- [ ] Orphaned subscription alert escalated to on-call engineer
- [ ] Reconciliation performance benchmarked for current subscription volume
- [ ] Partitioning strategy planned for reconciliation at >50k subscriptions

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied: detection, classification, repair, monitoring
- [ ] Security requirements satisfied: no Stripe push during reconciliation, all repairs logged
- [ ] Performance requirements satisfied: rate-limited, queue-isolated, benchmarked
- [ ] Testing requirements satisfied: all drift types tested, severity classification verified, dry-run mode tested
- [ ] Anti-pattern checks passed: no plan auto-repair, no zero-tolerance date compare, no silent repairs
- [ ] Production readiness verified: schedules, alerts, monitoring, benchmarks

---

# Related References

- AAP-SAAS-003 (Stripe Webhook Idempotency) — Webhooks are the primary sync mechanism
- AAP-SAAS-004 (Webhook Audit & Replay) — Replay caught-up missed events, reconciliation catches the rest
- AAP-SAAS-002 (Cashier BillingGateway Wrapper) — Gateway provides Stripe API access
- AAP-SAAS-006 (Billing Failure States) — Drift can affect state transitions
