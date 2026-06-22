# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Webhook Audit Log, Replay & Reconciliation
**Generated:** 2026-06-22

---

# Quick Checklist

- [ ] StripeEvent table records every incoming webhook (including duplicates)
- [ ] StripeEvent payload column is never mutated after creation (append-only)
- [ ] Replay is safe — all handlers verified idempotent before replay enabled
- [ ] StripeEventReplayService resets event to pending and re-dispatches job
- [ ] Reconciliation job compares local state against Stripe API on schedule
- [ ] Auto-repair only touches safe fields (status, dates) — never plan
- [ ] All repair actions logged with before/after state
- [ ] Reconciliation rate-limited to avoid Stripe API 429 errors

---

# Architecture Checklist

- [ ] StripeEvent model serves double duty as audit log and deduplication store
- [ ] StripeEvent scopes: failed(), duplicates(), byType(), processedBetween()
- [ ] StripeEventReplayService supports: single event replay, all-failed replay, by-type replay
- [ ] `billing:replay` artisan command exposes replay to operators
- [ ] Admin replay endpoint secured with authorization (admin/support role)
- [ ] DriftDetectionService compares local subscription state against Stripe
- [ ] Drift classification: LOW (dates), MEDIUM (status), CRITICAL (plan, orphaned)
- [ ] `billing:reconcile` artisan command with --auto-repair, --team, --dry-run options
- [ ] Reconciliation scheduled in console kernel (hourly minimum)

---

# Implementation Checklist

- [ ] StripeEventReplayService::replay() resets event status and re-dispatches job
- [ ] StripeEventReplayService::replayAllFailed() processes all failed events in batch
- [ ] StripeEventReplayService::replayByType() filters by event type and optional date
- [ ] DriftDetectionService compares: status, trial_ends_at, period dates, plan, cancel_at_period_end
- [ ] 5-second clock skew tolerance on all date comparisons
- [ ] DriftItem value object carries field, local/stripe values, severity, safeForAutoRepair flag
- [ ] DriftRepairService::repair() only repairable items; creates DriftAlert for critical drifts
- [ ] Orphaned subscription detection: subscription exists locally but not in Stripe → mark canceled
- [ ] Reconciliation output logged with team ID, drifts found, repairs applied
- [ ] StripeEvents pruned on schedule (90 days retention for processed events)

---

# Testing Checklist

- [ ] Replay of subscription.created event produces correct state (idempotent)
- [ ] Replay of already-processed event does nothing
- [ ] DriftDetectionService correctly identifies status drift
- [ ] DriftDetectionService correctly identifies date drift (with clock skew)
- [ ] DriftDetectionService correctly identifies plan drift (critical)
- [ ] DriftRepairService auto-repairs status drift, does not auto-repair plan drift
- [ ] Orphaned subscription detected and marked as canceled locally
- [ ] Reconciliation with --dry-run reports drift without modifying state
- [ ] Reconciliation with --auto-repair applies safe repairs
- [ ] Replay audit trail recorded (retry_count incremented)

---

# Production Readiness Checklist

- [ ] Reconciliation scheduled hourly with `withoutOverlapping` lock
- [ ] Daily full reconciliation with --dry-run for monitoring report
- [ ] Stripe event pruning scheduled (90 days for processed, 180 days for all)
- [ ] Admin replay endpoint has confirmation dialog (accidental replay prevention)
- [ ] Drift alerts routed to dedicated Slack channel or PagerDuty
- [ ] Monitoring: alert if reconciliation failure rate exceeds 2%
- [ ] Monitoring: alert if drift count per cycle exceeds threshold
- [ ] Audit log retention policy documented and compliant with regulatory requirements
- [ ] StripeEvent table PII handling documented (GDPR/CCPA implications)
- [ ] Reconciliation timeout configured for worst-case subscription count

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied: audit log, replay, reconciliation triad
- [ ] Security requirements satisfied: admin auth on replay, PII protection, audit immutability
- [ ] Performance requirements satisfied: rate-limited API calls, prune schedule, paginated queries
- [ ] Testing requirements satisfied: replay idempotency, drift detection/repair, orphaned handling
- [ ] Anti-pattern checks passed: no payload mutation, no plan auto-repair, no unrate-limited API calls
- [ ] Production readiness verified: schedules configured, alerts routed, retention documented

---

# Related References

- AAP-SAAS-003 (Stripe Webhook Idempotency) — Foundation: StripeEvent model and deduplication
- AAP-SAAS-005 (Subscription Drift Reconciliation) — Detailed drift detection and repair logic
- AAP-SAAS-002 (Cashier BillingGateway Wrapper) — Gateway provides Stripe API access for reconciliation
- AAP-SAAS-006 (Billing Failure States) — State transitions repaired by reconciliation
