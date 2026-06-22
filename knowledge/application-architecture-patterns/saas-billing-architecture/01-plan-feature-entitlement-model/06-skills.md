# Skill: Implement Plan, Feature & Entitlement Model

## Purpose

Design and implement the Plan/Feature/Entitlement data model and computation engine that separates commercial packaging (Stripe) from application access decisions (entitlements) for Laravel SaaS applications.

## When To Use

- SaaS with paid plans where feature access must be gated by plan tier
- When Stripe outages must NOT block application feature access for paying customers
- When you need usage-based limits, custom overrides, or promotional feature grants
- When multiple teams/tenants have different feature access within the same application
- When you offer trials, grace periods, or custom plan overrides per team

## When NOT To Use

- Single-plan SaaS with no feature gating (all users get all features)
- When all access decisions map 1:1 to Stripe subscription status with zero custom logic
- Billing managed entirely externally where the application doesn't own access decisions
- Prototype/MVP where the team hasn't committed to a paid subscription model yet

## Prerequisites

- Laravel Cashier installed and configured with Stripe
- Team/tenant architecture in place (multi-tenant SaaS)
- Stripe webhook handling pipeline operational
- Understanding of the BillingGateway wrapper pattern

## Inputs

- Plan definitions (name, slug, Stripe price ID, trial days, billing interval)
- Feature catalog (key, display name, type, group)
- Plan-to-feature mappings (which features each plan includes, with optional config)
- Business rules for usage limits, trial behavior, and grace period access
- Override requests from sales/support teams

## Workflow

1. Define the Features table with unique keys and types (boolean, numeric, list)
2. Define the Plans table with Stripe price ID mapping and feature set configuration
3. Create the Plan-Feature pivot table with optional per-feature config
4. Create the Subscriptions table to cache Stripe state locally
5. Implement the EntitlementService with `computeEntitlements()` as a pure function of local state
6. Create the FeatureGate service as the single entry point for all feature access checks
7. Implement UsageLimit and UsageRecord models for metered feature tracking
8. Implement EntitlementOverride with audit trail for custom access grants
9. Integrate with webhook handlers to invalidate entitlement cache on billing state changes
10. Integrate FeatureGate with Laravel's Gate system for Blade `@can` directives

## Validation Checklist

- [ ] Entitlement computation is a pure function of local database state (no Stripe HTTP calls)
- [ ] FeatureGate is the only entry point for feature access checks in the application
- [ ] Entitlement caching is implemented with invalidation on all billing state changes
- [ ] Cache keys are prefixed with team ID to prevent cross-team leakage
- [ ] Fail-closed: exceptions in entitlement computation deny access rather than granting it
- [ ] Usage limits are enforced in the entitlement layer (access denied when exhausted)
- [ ] Entitlement overrides have full audit trail (who, when, why, expiration)
- [ ] Plan features are stored in a pivot table, not hardcoded in application code
- [ ] Feature keys are whitelisted against the known feature set before evaluation
- [ ] Feature tests verify: plan features granted, overrides applied, usage limits enforced, expired overrides ignored

## Common Failures

- Checking `$team->subscription->stripe_status` directly instead of routing through FeatureGate
- Calling Stripe API during entitlement computation (non-deterministic, adds latency)
- Not caching entitlement results — N+1 queries on every feature check across every page load
- Forgetting to invalidate entitlement cache after webhook processing
- Hardcoding plan-to-feature mappings in code instead of using the pivot table
- Using an anemic boolean-only entitlement model that cannot express usage limits
- Granting access on exception instead of denying (fail-open instead of fail-closed)
- Not cleaning up expired entitlement overrides

## Decision Points

- Feature definitions in code (enum) vs database (features table)?
- Entitlement cache TTL: 1 minute (fast invalidation) vs 5+ minutes (lower DB load)?
- Usage record writes: synchronous (accurate counts) vs async/queued (faster hot path)?
- Plan versioning strategy: immutable plans with soft-deletes vs plan_version pivot table?

## Performance Considerations

- Entitlement computation runs on every feature gate check if uncached; cache at 1-5 minute TTL
- Cache invalidation on subscription status change, plan change, and override change
- Usage record writes should be async (queued) to avoid slowing the feature access hot path
- The EntitlementSet is intentionally immutable — returns new objects on mutation to prevent stale cache poisoning
- For dashboards listing multiple teams, batch-load entitlements rather than computing per-team sequentially

## Security Considerations

- Entitlement computation must never expose Stripe raw data to the presentation layer
- Feature keys are internal identifiers — never accept them from user input without whitelisting
- Entitlement overrides require audit logging (who granted, when, why)
- Cache keys must be prefixed with team ID — prevents cross-team entitlement leakage
- Fail closed: if entitlement computation throws, deny access; never silently grant
- Expired overrides must be excluded from computation (check `expires_at` > now())

## Related Rules

- Rule 1: Separate Billing State From Entitlement Decisions
- Rule 2: Entitlement Computation Must Be a Pure Function of Local State
- Rule 3: Feature Keys Are Internal Identifiers — Never Accept From User Input
- Rule 4: Cache Entitlements With Invalidation on Every Billing State Change
- Rule 5: Entitlement Overrides Require Audit Trail
- Rule 6: Plans Are Immutable After Release

## Related Skills

- Implement Cashier + BillingGateway Wrapper Pattern
- Implement Stripe Webhook Idempotency & Event Deduplication
- Handle Billing Failure States, Trials, Grace Periods & Downgrades

## Success Criteria

- Every feature access check in the application routes through FeatureGate
- Entitlement computation completes in under 10ms (database queries only, no HTTP)
- Feature test: team on Pro plan can access Pro features, team on Starter cannot
- Feature test: team with exhausted usage limit is denied access to that feature
- Feature test: team with custom override is granted access despite plan limitations
- Feature test: expired override no longer grants access
- Feature test: Stripe API outage does not block feature access for authenticated users
