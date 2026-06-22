# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Billing Failure States, Trials, Grace Periods & Downgrades
**Generated:** 2026-06-22

---

# Quick Checklist

- [ ] Subscription model correctly identifies all states: trial, active, past_due, canceled, expired
- [ ] Billing state and entitlement decisions are separate layers
- [ ] Grace period (7-14 days) configured and enforced before access revocation
- [ ] Trial provides full feature access (entitlement layer)
- [ ] Canceled subscriptions retain access until period end — not immediate revocation
- [ ] Trial ending notifications at 7d, 3d, 1d before expiration
- [ ] Payment failure triggers: email notification, in-app banner, grace period start
- [ ] Payment recovery (past_due → active) restores access and clears warnings
- [ ] Downgrade defaults to period-end scheduling — not immediate with negative proration

---

# Architecture Checklist

- [ ] Subscription model has boolean state methods: isOnTrial(), isActive(), isOnGracePeriod(), isCanceled(), isExpired()
- [ ] Subscription model has hasAccess() — permissive baseline for billing-level access
- [ ] EntitlementService::getEffectiveFeatures() computes features per state
- [ ] GracePeriodService manages grace period duration and warning schedule
- [ ] StartTrialAction creates trial subscription via BillingGateway
- [ ] CancelSubscriptionAction schedules ProcessSubscriptionExpiry with delay
- [ ] DowngradePlanAction validates new plan is lower tier, defaults to period-end scheduling
- [ ] BillingPortalService decides between Stripe Customer Portal and custom billing page

---

# Implementation Checklist

- [ ] Trial: `stripe_status === 'trialing'` with `trial_ends_at` in the future
- [ ] Active: `stripe_status === 'active'`
- [ ] Past Due (grace period): `stripe_status === 'past_due'`
- [ ] hasGracePeriodExpired(): checks elapsed time since entering past_due vs configurable grace days
- [ ] Canceled (with access): `stripe_status === 'canceled'` and `!isExpired()`
- [ ] Expired: `stripe_status === 'canceled'` and period end is in the past
- [ ] Trial ending notifications dispatched daily, filtered by trial end date
- [ ] Payment recovery handler (invoice.payment_succeeded) clears grace period state
- [ ] Post-expiration cleanup: revoke API tokens, archive data, notify user
- [ ] Downgrade reason logged for analytics and win-back campaigns

---

# Testing Checklist

- [ ] Trial → active transition when payment method is added
- [ ] Active → past_due transition when payment fails
- [ ] Past_due retains feature access (grace period)
- [ ] Past_due → active recovery when payment succeeds
- [ ] Past_due → expired when grace period exhausts
- [ ] Canceled subscription retains access until period end
- [ ] Expired subscription has zero feature access
- [ ] Trial ending notifications sent at correct intervals
- [ ] Grace period final warning sent 24 hours before expiry
- [ ] Downgrade schedules at period end (not immediate)
- [ ] Post-expiration cleanup runs after period end

---

# Production Readiness Checklist

- [ ] Grace period duration configurable via environment/config
- [ ] Trial notifications batched into single scheduled job (not per-team dispatch)
- [ ] Grace period warning emails include direct link to update payment method
- [ ] Stripe Customer Portal URL generated only for authenticated users
- [ ] Post-expiration cleanup handles edge cases: already-cleaned, subscription re-activated
- [ ] Monitoring: alert on trial expiration rate anomaly (spike in expirations)
- [ ] Monitoring: alert on payment failure rate > threshold (potential billing system issue)
- [ ] Cancellation reasons aggregated for product analytics
- [ ] Downgrade survey URL configured (if used for feedback collection)
- [ ] Rollback: manual subscription reactivation documented for support team

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied: state machine, billing/entitlement separation, grace period config
- [ ] Security requirements satisfied: expired access fully revoked, payment info not leaked in UI
- [ ] Performance requirements satisfied: state checks from local cache, notifications batched
- [ ] Testing requirements satisfied: all state transitions tested, grace period timing tested
- [ ] Anti-pattern checks passed: no immediate lockout on failure, no crippled trials, no silent expiry
- [ ] Production readiness verified: grace period tuned, notifications scheduled, monitoring configured

---

# Related References

- AAP-SAAS-001 (Plan-Feature-Entitlement Model) — Entitlement layer applies feature access per billing state
- AAP-SAAS-002 (Cashier BillingGateway Wrapper) — Gateway methods for cancel, resume, swap
- AAP-SAAS-003 (Stripe Webhook Idempotency) — Webhook handlers drive state transitions
- AAP-SAAS-005 (Subscription Drift Reconciliation) — Reconciliation corrects stale state after missed transitions
