# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** feature-flag-governance
**Knowledge Unit:** launchdarkly
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] LaunchDarkly SDK integrated for enterprise feature flag management
- [ ] FedRAMP compliance requirement verified
- [ ] RBAC with AWS IAM-style custom roles configured
- [ ] Approval workflows defined with multi-stage review per environment
- [ ] Relay Proxy evaluated for air-gapped environment deployment

---

# Architecture Checklist

- [ ] LaunchDarkly chosen for enterprise governance: approval workflows, RBAC, audit logging
- [ ] Per-environment approval configuration: different rules for production vs QA/staging
- [ ] Configurable review counts (1-5); self-approval prevention enforced
- [ ] Bypass mechanism documented for emergencies with full audit trail
- [ ] Strictest-settings aggregation across environments applied

---

# Implementation Checklist

- [ ] LaunchDarkly PHP SDK installed and configured with SDK key
- [ ] Custom roles defined in LaunchDarkly dashboard mirroring IAM roles
- [ ] Approval workflow configured per environment with required reviewer count
- [ ] Relay Proxy deployed in air-gapped environment with local evaluation mode
- [ ] Experiment approvals (2026 beta) evaluated for test/rollout governance

---

# Performance Checklist

- [ ] Stream connections optimized; flag evaluation uses local cache
- [ ] Relay Proxy latency tested for air-gapped deployments
- [ ] Flag evaluation count minimized per request
- [ ] SDK initialization timing tracked to avoid request delay
- [ ] Kill switch flags use highest-priority evaluation path

---

# Security Checklist

- [ ] SDK keys stored in environment variables, not source code
- [ ] RBAC custom roles follow least privilege for flag management
- [ ] Approval workflow prevents unauthorized production flag changes
- [ ] Audit log reviewed for suspicious flag modifications
- [ ] Relay Proxy mTLS configured for secure communication

---

# Reliability Checklist

- [ ] SDK fallback values defined for LaunchDarkly service unavailability
- [ ] Relay Proxy provides local flag evaluation when disconnected
- [ ] Kill switch activates immediately on flag toggle
- [ ] Gradual rollout ramping monitored for error rate regression

---

# Testing Checklist

- [ ] Flag evaluation tested with SDK in local and streaming modes
- [ ] Approval workflow tested: review, reject, approve, emergency bypass
- [ ] Relay Proxy failover tested in air-gapped scenario
- [ ] RBAC custom role restrictions tested
- [ ] Audit log entries verified for flag changes

---

# Maintainability Checklist

- [ ] Flag naming conventions documented per domain
- [ ] Custom role definitions documented with permission matrix
- [ ] Approval workflow configuration documented per environment
- [ ] Relay Proxy deployment documented for ops on-call
- [ ] Related skills (Pennant, GrowthBook, Unleash, CI/CD Gates) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No flags with sensitive default values that expose data
- [ ] No approval bypass without audit trail
- [ ] No flag evaluation without SDK local caching
- [ ] No production flag changes without approval workflow
- [ ] No orphaned flags without archive/removal schedule

---

# Production Readiness Checklist

- [ ] SDK key rotation procedure documented
- [ ] Approval workflow drill conducted with release team
- [ ] Relay Proxy health monitoring configured
- [ ] Flag change notifications set for production environment
- [ ] Kill switch effectiveness tested with controlled drill

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: approval workflows, RBAC, Relay Proxy
- [ ] Security requirements satisfied: SDK keys secured, audit log, least privilege
- [ ] Performance requirements satisfied: local caching, stream optimized, kill switch fast
- [ ] Testing requirements satisfied: flag eval, approval workflow, proxy failover, RBAC
- [ ] Anti-pattern checks passed: no sensitive defaults, approval enforced, caching used
- [ ] Production readiness verified: key rotation, drill, proxy health, kill switch tested

---

# Related References

- GCE-FFG-001 (laravel-pennant) — Simpler, free alternative
- GCE-FFG-003 (growthbook) — Open-source alternative with experimentation
- GCE-FFG-005 (configcat) — Cross-platform alternative
- GCE-COM-001 (cicd-policy-gates) — CI/CD integration for flag approvals
