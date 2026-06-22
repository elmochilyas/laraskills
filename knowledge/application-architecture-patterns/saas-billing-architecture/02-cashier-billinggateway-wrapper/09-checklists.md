# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Cashier + BillingGateway Wrapper Pattern
**Generated:** 2026-06-22

---

# Quick Checklist

- [ ] BillingGateway interface defined with domain-focused method signatures
- [ ] All billing operations in controllers/actions/jobs go through the BillingGateway contract
- [ ] No direct Cashier or Stripe SDK calls outside StripeCashierGateway
- [ ] All gateway methods return application-owned DTOs — never Stripe/Cashier types
- [ ] FakeBillingGateway implements the full interface for testing
- [ ] Stripe exceptions wrapped in application exceptions inside the gateway
- [ ] Gateway mutation methods log audit events
- [ ] Container binding in dedicated BillingServiceProvider

---

# Architecture Checklist

- [ ] BillingGateway interface is application-owned — method names reflect domain operations, not Stripe API shape
- [ ] StripeCashierGateway is the single concrete implementation of BillingGateway
- [ ] StripeCashierGateway uses Cashier for standard flows, Stripe SDK directly for the escape hatch
- [ ] DTOs (SubscriptionResult, SubscriptionData, InvoiceData) are readonly classes
- [ ] Cashier model synchronization (subscription local cache) happens inside the gateway
- [ ] BillingServiceProvider binds BillingGateway to StripeCashierGateway in production
- [ ] Test environment swaps binding to FakeBillingGateway
- [ ] Interface does not contain entitlement logic — stays focused on billing operations

---

# Implementation Checklist

- [ ] createCustomer: handles idempotent customer creation, returns Stripe customer ID
- [ ] createSubscription: supports trial days, payment method, checkout flow
- [ ] cancelSubscription: calls Cashier cancel method, handles already-canceled gracefully
- [ ] resumeSubscription: handles the case where no canceled subscription exists
- [ ] swapPlan: validates subscription exists before swapping
- [ ] getSubscription: returns SubscriptionData DTO, throws if no subscription
- [ ] getInvoices: returns array of InvoiceData DTOs, supports limit parameter
- [ ] getUpcomingInvoice: returns InvoiceData for pending charges
- [ ] createCheckoutSession: escape hatch using Stripe SDK directly for flows Cashier doesn't handle
- [ ] createBillingPortalSession: returns Stripe customer portal URL
- [ ] refund: accepts payment intent ID and optional partial amount

---

# Testing Checklist

- [ ] FakeBillingGateway handles all interface methods with deterministic behavior
- [ ] FakeBillingGateway::$shouldFail flag enables testing failure paths
- [ ] Team can subscribe to Pro plan via FakeBillingGateway
- [ ] Subscription creation failure returns incomplete status
- [ ] Canceled subscription shows canceled status in subsequent getSubscription call
- [ ] Resumed subscription returns to active status
- [ ] Plan swap updates subscription's plan identifier
- [ ] Invoice data is returned in correct DTO format
- [ ] Gateway exceptions are caught and wrapped in application exceptions
- [ ] Both success and failure paths tested

---

# Production Readiness Checklist

- [ ] Stripe secret key stored in environment variable, never in code or logs
- [ ] Billing audit log channel configured (separate from application logs)
- [ ] Stripe API version pinned in config — prevents unexpected API behavior changes
- [ ] Gateway timeout configured for Stripe API calls (default 30s)
- [ ] Monitoring: alert on Stripe API error rate exceeding threshold
- [ ] Monitoring: alert on subscription creation failure rate > 5%
- [ ] Billing operations throttled (rate limiting on checkout/payment endpoints)
- [ ] Idempotency keys used for payment creation operations (via Stripe SDK if needed)
- [ ] Stripe webhook secret rotated procedure documented
- [ ] Rollback strategy: manual Stripe dashboard intervention documented for emergency scenarios

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied: interface isolation, DTO returns, container binding
- [ ] Security requirements satisfied: audit logging on mutations, secret protection, exception wrapping
- [ ] Performance requirements satisfied: gateway adds negligible overhead, Cashier local reads used
- [ ] Testing requirements satisfied: FakeBillingGateway complete, failure paths tested
- [ ] Anti-pattern checks passed: no Cashier/Stripe calls outside gateway, no Stripe types leaked
- [ ] Production readiness verified: audit channel configured, monitoring alerts in place

---

# Related References

- AAP-SAAS-001 (Plan-Feature-Entitlement Model) — Entitlement decisions compute from state synchronized by this gateway
- AAP-SAAS-003 (Stripe Webhook Idempotency) — Webhooks keep local subscription state in sync with Stripe
- AAP-SAAS-005 (Subscription Drift Reconciliation) — Reconciliation compares gateway data vs local state
- AAP-SAAS-006 (Billing Failure States) — Gateway operations trigger state transitions in the billing state machine
