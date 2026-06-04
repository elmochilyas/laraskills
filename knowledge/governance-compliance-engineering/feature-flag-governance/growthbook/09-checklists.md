# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** feature-flag-governance
**Knowledge Unit:** growthbook
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] GrowthBook deployed (self-hosted or cloud) as open-source feature flag and experimentation platform
- [ ] Warehouse-native experimentation configured to query existing data warehouse
- [ ] OpenFeature standard implementation verified
- [ ] RBAC and approval workflows configured
- [ ] Stale flag detection enabled for cleanup governance

---

# Architecture Checklist

- [ ] Warehouse-native architecture chosen: experiment results computed where data lives
- [ ] OpenFeature standard SDK evaluated for vendor-agnostic flag evaluation
- [ ] RBAC roles defined for flag management access control
- [ ] Approval workflows required for production flag changes
- [ ] Stale flag detection configured with periodic review alerts

---

# Implementation Checklist

- [ ] GrowthBook SDK integrated for flag evaluation and experiment tracking
- [ ] Data warehouse connection configured for experiment result computation
- [ ] OpenFeature provider set up for standardized flag evaluation
- [ ] RBAC roles created in GrowthBook dashboard matching IAM structure
- [ ] Approval workflow rules configured per environment

---

# Performance Checklist

- [ ] Warehouse query performance for experiment analysis benchmarked
- [ ] Flag evaluation latency measured for OpenFeature vs native SDK
- [ ] Data warehouse cost impact of experiment queries reviewed
- [ ] Flag evaluation caching configured for repeated calls
- [ ] Experiment result computation scheduled to avoid peak warehouse load

---

# Security Checklist

- [ ] Warehouse credentials stored securely; read-only access for experiments
- [ ] RBAC roles restrict flag modification to authorized users
- [ ] Approval workflow prevents unauthorized production changes
- [ ] Stale flag data does not expose sensitive experiment results
- [ ] Self-hosted deployment: network access restricted to application tier

---

# Reliability Checklist

- [ ] GrowthBook service unavailability fallback: serve default flag values
- [ ] Warehouse connection failure does not block flag evaluation
- [ ] Experiment result computation retries on failure
- [ ] Self-hosted GrowthBook deployment backed up regularly

---

# Testing Checklist

- [ ] Flag evaluation tested with GrowthBook SDK and OpenFeature provider
- [ ] Experiment assignment tested for consistent user bucketing
- [ ] Approval workflow tested: create, review, approve/reject
- [ ] Stale flag detection tested with inactive flags
- [ ] Warehouse-native experiment query verified for correctness

---

# Maintainability Checklist

- [ ] Flag naming conventions documented per domain
- [ ] Experiment definitions documented with hypothesis and success metrics
- [ ] OpenFeature provider configuration documented
- [ ] Stale flag review cadence established (monthly)
- [ ] Related skills (Pennant, LaunchDarkly, Unleash) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No experiment results used for irreversible production decisions without validation
- [ ] No warehouse queries that expose PII in experiment results
- [ ] No flag evaluation in server-rendered views without caching
- [ ] No RBAC bypass for flag management
- [ ] No orphaned experiments without cleanup plan

---

# Production Readiness Checklist

- [ ] GrowthBook service health monitoring configured
- [ ] Warehouse query cost budgeted for experiment analysis
- [ ] Approval workflow drill conducted with product team
- [ ] Stale flag review process established
- [ ] Rollback plan for flags promoted to permanent state

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: warehouse-native, OpenFeature, RBAC
- [ ] Security requirements satisfied: read-only warehouse, RBAC, approval, no PII in results
- [ ] Performance requirements satisfied: flag eval latency, warehouse query cost OK
- [ ] Testing requirements satisfied: flag eval, experiment assignment, approval flow tested
- [ ] Anti-pattern checks passed: no PII in results, RBAC enforced, no orphaned experiments
- [ ] Production readiness verified: monitoring, budget, drill, stale flag process

---

# Related References

- GCE-FFG-001 (laravel-pennant) — Simple flagging, no experimentation
- GCE-FFG-002 (launchdarkly) — Enterprise SaaS, similar governance
- GCE-FFG-004 (unleash) — Open-source alternative with FeatureOps
