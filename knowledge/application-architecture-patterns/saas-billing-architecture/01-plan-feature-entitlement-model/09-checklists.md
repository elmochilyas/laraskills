# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Plan, Feature & Entitlement Model
**Generated:** 2026-06-22

---

# Quick Checklist

- [ ] Billing state (Stripe) and entitlement decisions (app) are separated into distinct layers
- [ ] Entitlement computation is a pure function of local database state — no Stripe API calls
- [ ] FeatureGate is the single entry point for all feature access checks
- [ ] Entitlement caching implemented with invalidation on all billing state changes
- [ ] Usage records written asynchronously (queued), reconciled periodically
- [ ] Entitlement overrides have audit trail (who, when, why, expiration)
- [ ] Feature keys whitelisted — never accepted directly from user input
- [ ] Plans use pivot table for features, not hardcoded arrays
- [ ] Fail-closed: exceptions in entitlement computation deny access

---

# Architecture Checklist

- [ ] `Plan`, `Feature`, `Subscription`, `EntitlementOverride`, `UsageLimit`, `UsageRecord` tables created with proper foreign keys and indexes
- [ ] `plan_feature` pivot table with config column for feature-specific settings
- [ ] EntitlementService computes entitlements from local state only
- [ ] FeatureGate integrates with Laravel's Gate system for `@can` Blade directives
- [ ] EntitlementSet is an immutable value object — returns new instances on mutation
- [ ] Entitlement object carries config, usage limits, and consumption — not just a boolean
- [ ] Cache keys prefixed with team ID to prevent cross-team entitlement leakage
- [ ] Feature keys are internal strings defined in the `features` table — never derived from Stripe metadata alone

---

# Implementation Checklist

- [ ] EntitlementService::getEntitlements() returns cached EntitlementSet per team
- [ ] EntitlementService::computeEntitlements() is a pure function with no side effects
- [ ] UsageService::recordUsage() writes usage records asynchronously
- [ ] UsageService::getUsage() aggregates usage records by feature + period
- [ ] FeatureGate::can() checks global feature flag first, then entitlement
- [ ] FeatureGate::authorize() throws FeatureAccessDeniedException with descriptive message
- [ ] All webhook handlers call `$entitlements->invalidateCache($team)` on state change
- [ ] Admin actions that modify overrides call `$entitlements->invalidateCache($team)`
- [ ] Plan versioning strategy documented: new Plan row for changes, soft-delete old ones
- [ ] GrantFeatureOverrideAction logs audit record on every grant/revoke

---

# Testing Checklist

- [ ] Team on Pro plan can access Pro features, team on Starter cannot
- [ ] Team with exhausted usage limit is denied access even on paid plan
- [ ] Team with custom override is granted access despite plan limitations
- [ ] Team with expired override reverts to plan-based entitlement
- [ ] Entitlement cache is invalidated on webhook processing
- [ ] Entitlement computation returns empty set for teams with no/canceled subscription
- [ ] FeatureGate blocks access when global feature flag is disabled
- [ ] Feature keys from user input are validated against whitelist
- [ ] Cross-team entitlement isolation verified (team A's entitlements don't leak to team B)
- [ ] Fail-closed behavior: exception during computation returns empty EntitlementSet

---

# Production Readiness Checklist

- [ ] Entitlement cache TTL configured based on acceptable staleness (1-5 minutes)
- [ ] Monitoring: alert if entitlement computation exceeds 50ms
- [ ] Monitoring: alert if cache miss rate exceeds 10% for entitlement queries
- [ ] Entitlement override expiration monitored (alert on overrides expiring in 7 days)
- [ ] Plan change migration runbook documented (creating new plan version, migrating subscribers)
- [ ] Usage record pruner scheduled (delete aggregated records older than retention period)
- [ ] Feature flag integration documented (which feature flag system controls which features)
- [ ] Admin UI or CLI command exists for managing entitlement overrides
- [ ] Stripe webhook fail-open: if webhooks stop, entitlements degrade gracefully (cache TTL provides buffer)
- [ ] Rollback strategy: restoring from backup includes entitlement cache flush

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied: billing/entitlement separation, pure computation, caching
- [ ] Security requirements satisfied: feature key whitelisting, audit trail on overrides, cross-team isolation
- [ ] Performance requirements satisfied: cached entitlements, async usage writes, no Stripe API on hot path
- [ ] Testing requirements satisfied: all states tested, cross-team isolation verified, fail-closed verified
- [ ] Anti-pattern checks passed: no Stripe API in entitlement computation, no raw feature keys from input
- [ ] Production readiness verified: cache invalidation on all state changes, monitoring configured

---

# Related References

- AAP-SAAS-002 (Cashier + BillingGateway Wrapper) — Gateway contract for billing operations
- AAP-SAAS-003 (Stripe Webhook Idempotency) — Webhook deduplication that triggers cache invalidation
- AAP-SAAS-005 (Subscription Drift Reconciliation) — Reconciliation job repairs stale entitlement state
- AAP-SAAS-006 (Billing Failure States) — State machine that feeds into entitlement decisions
