# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Package Decision Calibration
**Knowledge Unit:** Laravel Cashier Decision Matrix
**Generated:** 2026-06-22
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Stripe is the sole payment provider (not "for now, with plans to add others")
- [ ] Cashier is wrapped behind a BillingGateway interface

---

# Architecture Checklist

- [ ] Subscription plans map to Stripe products/prices (not custom entitlement engine)
- [ ] Cashier migration tables are the ONLY subscription state tables (no duplication)
- [ ] Webhook handling uses Cashier's built-in `Cashier::webhook()` route
- [ ] Escape hatch (stripe/stripe-php direct) is designed for 1-2 methods
- [ ] Business logic depends on BillingGateway, never on Cashier directly

---

# Implementation Checklist

- [ ] Workflow step completed: Cashier installed and Billable trait added to User model
- [ ] Workflow step completed: BillingGateway interface created with business-language methods
- [ ] Workflow step completed: StripeCashierAdapter implements BillingGateway, delegates to Cashier
- [ ] Workflow step completed: Cashier webhook route registered with `Cashier::webhook()`
- [ ] Workflow step completed: Stripe webhook secret configured and signature verification enabled
- [ ] Workflow step completed: Webhook route excluded from CSRF protection
- [ ] Workflow step completed: Plan configuration stored in Stripe dashboard, not hardcoded
- [ ] Workflow step completed: Idempotency keys added for charge operations
- [ ] Workflow step completed: No Cashier Billable method overrides (logic in wrapper, not overrides)

---

# Performance Checklist

- [ ] Subscription status cached — not queried on every authenticated request
- [ ] Upcoming invoice API calls cached (they're synchronous Stripe calls)
- [ ] Customer portal URL pre-fetched or lazy-loaded (synchronous Stripe call)
- [ ] Webhook processing queued for high-volume apps
- [ ] `subscriptions` table indexed on `user_id` and `stripe_status`

---

# Security Checklist

- [ ] Stripe webhook signature verification enabled (Cashier does this automatically — do not disable)
- [ ] `STRIPE_WEBHOOK_SECRET` set in production environment
- [ ] Idempotency keys used for charge operations to prevent double-charging
- [ ] Subscription status is input to authorization, not the sole authorization mechanism
- [ ] Stripe API version pinned and documented

---

# Reliability Checklist

- [ ] Failure addressed: Using Cashier for one-off payments without subscriptions:
- [ ] Failure addressed: Cashier Stripe API version mismatch:
- [ ] Failure addressed: Business-critical subscription state read from Stripe API, not local DB:
- [ ] Failure addressed: Overriding Cashier Billable methods:
- [ ] Failure addressed: Webhook failures causing stale subscription state:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Stripe is the sole payment provider (not "for now, with plans to add")
- [ ] Subscription plans map to Stripe products/prices (not custom entitlement engine)
- [ ] Cashier is wrapped behind a BillingGateway interface
- [ ] Webhook handling uses Cashier's built-in `Cashier::webhook()` route
- [ ] Escape hatch (stripe/stripe-php direct) is designed and tested for 1-2 methods
- [ ] Subscription status is cached, not queried on every request
- [ ] Test suite includes Stripe test clocks for time-sensitive subscription scenarios
- [ ] Webhook failure monitoring is configured
- [ ] Stripe API version is pinned and documented
- [ ] No Cashier Billable method overrides exist (logic is in wrapper, not overrides)

### Success Criteria
- [ ] All subscription lifecycle states tested (create, trial, active, cancel, expired)
- [ ] Webhook handling tested with simulated Stripe events
- [ ] Payment failure flows tested (card declined, insufficient funds, authentication required)
- [ ] Subscription sync health monitored and alerted in production

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Cashier-as-CRM (using subscription data as primary customer DB)
- [ ] Anti-pattern prevented: Cashier in every request (un cached subscription checks)
- [ ] Anti-pattern prevented: Cashier for non-Stripe (expecting multi-provider support)

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Stripe API degraded or down:
- [ ] Failure scenario handled: Webhook delivery delayed or failed:
- [ ] Failure scenario handled: Cashier upgrade requires Stripe API version change:

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
