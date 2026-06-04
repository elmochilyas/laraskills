# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** feature-flag-governance
**Knowledge Unit:** laravel-pennant
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Laravel Pennant installed for first-party feature flag management
- [ ] Feature flags defined with database or array drivers
- [ ] Scope resolution configured for user/targeted flag evaluation
- [ ] Percentage-based rollouts implemented for gradual feature releases
- [ ] Eager loading configured for flag resolution in batch contexts

---

# Architecture Checklist

- [ ] Pennant chosen for simplicity; enterprise governance (RBAC, approval, audit) deferred to LaunchDarkly/Unleash
- [ ] Database driver used for persistent flag state; array driver for static/testing scenarios
- [ ] Scope resolution tied to authenticated user or request context
- [ ] Percentage-based rollouts used for canary releases
- [ ] Bulk activate/deactivate and purge commands used for flag lifecycle

---

# Implementation Checklist

- [ ] Feature flags defined in `App\Features` or via config
- [ ] `Feature::active()` checks placed in controllers, middleware, and Blade views
- [ ] Scope resolver implemented for user-targeted flags
- [ ] Percentage rollout values added to flag definition
- [ ] Bulk operations (activate, deactivate, purge) command documented

---

# Performance Checklist

- [ ] Feature flag cache configured for repeated `Feature::active()` calls
- [ ] Eager loading enabled for flag resolution in list views
- [ ] Database driver indexed for flag resolution queries
- [ ] Purge command run after flag removal to clean stale data
- [ ] Flag resolution latency benchmarked per request

---

# Security Checklist

- [ ] Feature flag management access restricted to admin roles (no built-in RBAC)
- [ ] Flag definitions do not expose sensitive configuration values
- [ ] Scope resolution prevents user A seeing user B's flag state
- [ ] Percentage rollouts do not segregate users in a privacy-sensitive way
- [ ] Purge command does not delete active flag data

---

# Reliability Checklist

- [ ] Array driver fallback for testing; database driver for production persistence
- [ ] Flag definition change does not invalidate existing scope assignments
- [ ] Purge command dry-run mode available
- [ ] Bulk operations atomic per flag

---

# Testing Checklist

- [ ] Feature flag active/inactive tested for each flag definition
- [ ] Scope resolution tested for targeted user groups
- [ ] Percentage rollout boundary tested (0%, 50%, 100%)
- [ ] Eager loading tested for performance under batch context
- [ ] Bulk activate/deactivate/purge tested

---

# Maintainability Checklist

- [ ] Feature flag definitions documented with purpose and target audience
- [ ] Flag naming conventions established and followed
- [ ] Purge schedule documented for stale flag cleanup
- [ ] Flag owner assigned per definition for accountability
- [ ] Related skills (LaunchDarkly, Unleash, CI/CD Policy Gates) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No long-lived feature flags without cleanup plan
- [ ] No flag checks in hot code paths without caching
- [ ] No percentage-based flags for security-critical features
- [ ] No synchronous purge on production without dry-run
- [ ] No flag names that conflict across feature branches

---

# Production Readiness Checklist

- [ ] Flag usage tracked and stale flag review schedule established
- [ ] Flag change audit logged (no built-in audit; manual or custom observer)
- [ ] Purge command tested in production-like environment
- [ ] Flag resolution cache TTL configured
- [ ] Rollback plan for flag removal that breaks feature access

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Pennant for simple flags, upgrade path documented
- [ ] Security requirements satisfied: admin-restricted management, no scope leak
- [ ] Performance requirements satisfied: cache enabled, eager loading, purge schedule
- [ ] Testing requirements satisfied: active/inactive, scope, percentage, bulk tested
- [ ] Anti-pattern checks passed: no long-lived flags, cached hot paths, no sync purge
- [ ] Production readiness verified: stale flag review, audit, cache TTL, rollback plan

---

# Related References

- GCE-FFG-002 (launchdarkly) — Enterprise alternative with full governance
- GCE-FFG-003 (growthbook) — Open-source alternative with experimentation
- GCE-FFG-004 (unleash) — Open-source with FeatureOps discipline
- GCE-COM-001 (cicd-policy-gates) — CI/CD integration for flag governance
