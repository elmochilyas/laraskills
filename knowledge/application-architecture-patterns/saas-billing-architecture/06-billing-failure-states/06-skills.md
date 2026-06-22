# Skill: Handle Billing Failure States, Trials, Grace Periods & Downgrades

## Purpose

Design and implement the subscription lifecycle state machine that governs how each billing state (trial, active, past_due, canceled, expired) maps to product behavior — feature access, grace periods, notifications, and cleanup — as a product-policy layer separate from the billing state itself.

## When To Use

- Any SaaS with subscription trials (free or paid)
- When payment failures should not immediately lock users out (grace periods)
- When cancellation doesn't immediately revoke access (cancel-at-period-end pattern)
- When different billing states need different product behavior (features available during trial vs past_due vs canceled)
- When you need to communicate billing state changes to users (trial ending, payment failed, subscription expired)

## When NOT To Use

- Free product with no billing whatsoever
- Fully prepaid model where payment failure isn't possible mid-period (annual upfront, no recurring)
- Simple case where all states map to a boolean "has access / no access" — but even then, the state model documents behavior explicitly and is worth implementing

## Prerequisites

- Plan/Feature/Entitlement model in place
- BillingGateway wrapper pattern in place
- Stripe webhook processing operational
- Subscription model with locally cached Stripe state (status, period dates, trial dates)
- Notification infrastructure (mail, in-app, or both)

## Inputs

- Subscription model with billing state query methods (isActive, isOnTrial, isOnGracePeriod, isCanceled, isExpired)
- Configurable grace period duration (default: 7 days)
- Configurable trial behavior (full access vs limited)
- Notification templates for: trial ending, payment failed, grace period warning, final warning, subscription expired
- Downgrade policy (at period end vs immediate with proration)

## Workflow

1. Implement billing state query methods on the Subscription model (isOnTrial, isOnGracePeriod, etc.)
2. Implement `hasAccess()` as a permissive baseline — the entitlement layer refines this
3. Implement `billingStateLabel()` for user-facing status display
4. In the EntitlementService, map each billing state to its feature access policy
5. Configure grace period: default to full access during past_due with configurable duration
6. Implement trial handling: full access during trial, notification schedule (7d, 3d, 1d before end)
7. Implement grace period handling: payment failure notification, progressive warnings, recovery detection
8. Implement cancellation flow: cancel with access until period end, schedule post-expiration cleanup
9. Implement downgrade flow: schedule at period end by default, optional immediate with proration
10. Implement post-expiration cleanup: revoke API tokens, archive data, send final notification
11. Schedule trial ending and grace period warning notifications via Laravel Scheduler

## Validation Checklist

- [ ] Subscription model correctly identifies: trial, active, past_due, canceled, expired states
- [ ] `hasAccess()` provides a permissive baseline that the entitlement layer refines
- [ ] Trial provides full feature access (entitlement layer) with notification schedule
- [ ] Past due allows access with configurable grace period duration (default 7-14 days)
- [ ] Canceled provides access until period end (not immediate revocation)
- [ ] Expired revokes all access including API tokens and shared resources
- [ ] Trial ending notifications sent at 7 days, 3 days, and 1 day before trial end
- [ ] Payment failure triggers: email notification, in-app banner, grace period start
- [ ] Payment recovery (past_due → active) restores full access and clears warnings
- [ ] Downgrade by default schedules at period end (not immediate)
- [ ] Cancellation flow: reason collection, period-end access retained, expiry job scheduled
- [ ] Post-expiration cleanup: revoke API tokens, archive data per retention policy
- [ ] Test: trial → active transition (payment method added)
- [ ] Test: active → past_due → active (payment failure and recovery)
- [ ] Test: active → past_due → expired (grace period exhaustion)
- [ ] Test: active → canceled → expired (user cancellation lifecycle)
- [ ] Test: canceled subscription retains access until period end
- [ ] Test: expired subscription has zero feature access

## Common Failures

- Locking users out immediately on payment failure (drives churn; most failures are transient)
- Treating "canceled" as "no access" (revokes access the user already paid for in the current period)
- Crippling trial experience by limiting features (users can't evaluate the real product value)
- Not notifying before trial ends (users surprised by charges → chargebacks and churn)
- Grace period without communication (users don't know payment failed → churn when access is revoked)
- Downgrade with immediate proration refunds (negative customer experience, accounting complexity)
- Expired subscriptions not cleaning up resources (orphaned data, active API tokens, shared resources)
- Not tracking cancellation reasons (cannot improve retention without understanding why users leave)
- Hardcoding product decisions (grace period length, trial access) in the billing model instead of the entitlement layer

## Decision Points

- Grace period duration: 7 days vs 14 days vs configurable per plan?
- Grace period feature access: full access vs core features only vs configurable?
- Trial payment method: required upfront vs not required until trial ends?
- Downgrade strategy: always at period end vs always immediate vs customer choice?
- Cancellation feedback: required reason vs optional vs exit survey after cancellation?
- Stripe Customer Portal vs custom billing management UI?

## Performance Considerations

- State checks (`isOnTrial()`, `hasAccess()`) are computed from cached local subscription data — no Stripe API calls
- Grace period expiration checks reference the local `current_period_end` date, not Stripe
- Trial ending notifications should be batched into a single scheduled job, not dispatched per-team
- The entitlement computation per state is the same function regardless of state — just with different inputs; cache it uniformly
- Post-expiration cleanup jobs can be delayed to off-peak hours to avoid competing with user-facing operations

## Security Considerations

- During grace period, usage limits must still be enforced — users should not consume usage they won't pay for
- Canceled-but-not-expired users have legitimate access — do not treat them as unauthorized in middleware
- Expired subscriptions must revoke ALL access: API tokens, shared resources, team member access
- Grace period communications (emails, in-app banners) must not leak billing details to unauthorized team members
- Post-expiration data retention must comply with GDPR and stated privacy policy

## Related Rules

- Rule 1: Billing State and Entitlement Are Separate — The Billing State Machine Informs Entitlement, It Doesn't Dictate It
- Rule 2: Default to Allowing Access During Grace Periods
- Rule 3: Canceled Subscriptions Retain Access Until Period End — Never Revoke Immediately
- Rule 4: Trials Should Provide Full Feature Access
- Rule 5: Notify Users Before Trial Expiration — Multiple Touchpoints

## Related Skills

- Implement Plan, Feature & Entitlement Model
- Implement Cashier + BillingGateway Wrapper Pattern
- Detect and Repair Subscription Drift

## Success Criteria

- Every billing state transition is explicitly modeled and tested (trial→active, active→past_due, past_due→active, canceled→expired)
- Product team can change grace period length or trial access policy via configuration, not code changes
- Trial-to-paid conversion rate is measured and improvements can be made without billing model changes
- Users receive timely, clear communication about billing state changes at every stage
- Post-expiration cleanup prevents unauthorized access to paid features and user data
