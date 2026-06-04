# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** feature-flag-governance
**Knowledge Unit:** unleash
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Unleash deployed (self-hosted or cloud) for open-source feature flag management
- [ ] FeatureOps discipline adopted — flag management as operational practice
- [ ] RBAC configured for flag management access control
- [ ] 4-eyes principle enforced for production flag changes
- [ ] PII protection via server-side flag evaluation verified

---

# Architecture Checklist

- [ ] FeatureOps discipline applied: lifecycle management, review, archiving
- [ ] 4-eyes principle (two-person review) required for production flag changes
- [ ] Server-side flag evaluation prevents PII exposure to client
- [ ] Archive functionality preserves audit trail for deleted flags
- [ ] RBAC roles mapped to organizational structure

---

# Implementation Checklist

- [ ] Unleash SDK integrated with PHP client library
- [ ] Feature flags registered with lifecycle stage (dev, staging, production, archived)
- [ ] Approval flow configured for production with minimum 2 reviewers
- [ ] Server-side evaluation context includes user ID but not PII
- [ ] Archive enabled for flag deletion audit trail

---

# Performance Checklist

- [ ] Server-side flag evaluation latency measured
- [ ] SDK client cache configured for low-latency evaluation
- [ ] Unleash API polling interval tuned for freshness vs load
- [ ] Flag evaluation count minimized per request
- [ ] Archive data retention sized for audit requirements

---

# Security Checklist

- [ ] PII not included in flag evaluation context sent to Unleash
- [ ] RBAC prevents unauthorized flag modification
- [ ] 4-eyes principle prevents single-person production changes
- [ ] Archive retains flag change history for audit
- [ ] Self-hosted deployment locked down by network policy

---

# Reliability Checklist

- [ ] SDK fallback values for Unleash service unavailability
- [ ] API polling failure serves last known flag state
- [ ] Approval flow does not block emergency flag changes (bypass with audit)
- [ ] Self-hosted deployment backed up with database restore tested

---

# Testing Checklist

- [ ] Flag evaluation tested with Unleash SDK
- [ ] 4-eyes approval flow tested: create, review, approve, reject
- [ ] Server-side evaluation tested with and without PII in context
- [ ] Archive tested for flag restoration
- [ ] RBAC role restrictions tested

---

# Maintainability Checklist

- [ ] Flag lifecycle documentation: stage transitions and review requirements
- [ ] RBAC role definitions documented with permission matrix
- [ ] 4-eyes workflow documented for release team
- [ ] Archive retention policy documented for compliance
- [ ] Related skills (Pennant, LaunchDarkly, GrowthBook) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No PII sent to Unleash in evaluation context
- [ ] No production flag changes without 4-eyes approval
- [ ] No flag deletion without archive; archive before delete
- [ ] No RBAC that grants excessive permissions to flag management
- [ ] No bypass of approval flow without audit trail

---

# Production Readiness Checklist

- [ ] Unleash health monitoring configured
- [ ] Approval flow drill conducted with release team
- [ ] Archive data backup scheduled
- [ ] Emergency bypass procedure documented and tested
- [ ] Flag review cadence established for FeatureOps governance

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: FeatureOps, 4-eyes, server-side eval, archive
- [ ] Security requirements satisfied: no PII in context, RBAC, approval enforced
- [ ] Performance requirements satisfied: server-side latency, polling tuned, caching
- [ ] Testing requirements satisfied: eval, approval flow, server-side, archive, RBAC
- [ ] Anti-pattern checks passed: no PII, approval enforced, archive before delete
- [ ] Production readiness verified: monitoring, drill, backup, bypass procedure, review cadence

---

# Related References

- GCE-FFG-001 (laravel-pennant) — Simpler flagging without governance
- GCE-FFG-002 (launchdarkly) — Enterprise SaaS with similar governance
- GCE-FFG-003 (growthbook) — Open-source with experimentation focus
