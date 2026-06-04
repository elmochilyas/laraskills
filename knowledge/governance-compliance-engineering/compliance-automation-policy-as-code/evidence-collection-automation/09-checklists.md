# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** compliance-automation-policy-as-code
**Knowledge Unit:** evidence-collection-automation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Continuous evidence snapshots configured for encryption, access control, logging, and audit trail
- [ ] Immutable evidence storage configured (S3 Object Lock)
- [ ] Evidence types defined per compliance framework (SOC 2, ISO 27001)
- [ ] Audit report generation pipeline established from collected evidence
- [ ] Evidence collection scheduled on timer and triggered by configuration changes

---

# Architecture Checklist

- [ ] Evidence snapshots stored in immutable S3 Object Lock bucket (no delete, no overwrite)
- [ ] Evidence types categorized per compliance framework domain
- [ ] Schedule-based collection runs daily/weekly; change-triggered collection hooks into config events
- [ ] Audit report generation reads from immutable evidence store, not live configuration
- [ ] Evidence collection replaces manual evidence gathering for audits

---

# Implementation Checklist

- [ ] S3 Object Lock bucket created with retention period matching audit observation window
- [ ] Evidence collector Artisan commands implemented per evidence type
- [ ] Configuration change event listener triggers ad-hoc evidence snapshot
- [ ] Evidence metadata stored in database referencing S3 object key
- [ ] Audit report generation command assembles evidence for observation window

---

# Performance Checklist

- [ ] Evidence collection job duration measured and optimized per evidence type
- [ ] S3 Object Lock retention costs modeled for evidence volume
- [ ] Change-triggered collection rate-limited to prevent duplicate snapshots
- [ ] Evidence metadata queries indexed on framework and collection timestamp
- [ ] Report generation paginated for large observation windows

---

# Security Checklist

- [ ] S3 Object Lock bucket policy prevents deletion by any principal (including root)
- [ ] Evidence collection service account scoped to write-only to evidence bucket
- [ ] Evidence read access restricted to compliance admin role
- [ ] Evidence metadata does not contain sensitive configuration values
- [ ] Evidence snapshots encrypted at rest (S3 SSE-KMS)

---

# Reliability Checklist

- [ ] Evidence collection failure retried with backoff; alert on persistent failure
- [ ] S3 Object Lock misconfiguration caught by pre-flight check
- [ ] Change-triggered collection deduplicated to prevent race condition snapshots
- [ ] Report generation verifies evidence completeness before output

---

# Testing Checklist

- [ ] Evidence snapshot collected and S3 object written verified
- [ ] S3 Object Lock prevents deletion tested
- [ ] Change-triggered collection fires on config change event
- [ ] Report generation produces complete evidence set for observation window
- [ ] Evidence collection failure alert triggers

---

# Maintainability Checklist

- [ ] Evidence types documented per framework with collection frequency
- [ ] Collector commands documented with expected output format
- [ ] S3 Object Lock retention policy documented and aligned with legal requirements
- [ ] Evidence metadata schema documented for report generation queries
- [ ] Related skills (CI/CD Policy Gates, Unified Control Mapping) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No mutable evidence storage; all evidence is immutable by policy
- [ ] No missing evidence gaps in observation window (continuous collection)
- [ ] No evidence collection that modifies source configuration state
- [ ] No evidence metadata storing secrets or credentials
- [ ] No evidence collection that fails silently

---

# Production Readiness Checklist

- [ ] S3 Object Lock retention period verified for audit requirement
- [ ] Evidence storage costs budgeted and monitored
- [ ] Collection schedule tested in production-like environment
- [ ] Evidence completeness verified for each framework
- [ ] Drill conducted for evidence retrieval during audit

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: immutable storage, collection types, report generation
- [ ] Security requirements satisfied: Object Lock, write-only service account, SSE-KMS
- [ ] Performance requirements satisfied: collection duration OK, rate-limiting, cost modeled
- [ ] Testing requirements satisfied: snapshot, immutability, change trigger, report completeness
- [ ] Anti-pattern checks passed: no mutable store, no silent failure, no secret exposure
- [ ] Production readiness verified: retention period, budget, collection schedule, retrieval drill

---

# Related References

- GCE-COM-001 (cicd-policy-gates) — CI/CD gate evidence collection
- GCE-COM-003 (unified-control-mapping) — Evidence mapped to frameworks
- GCE-COM-004 (compliance-attestation-pdf) — Evidence-based attestation PDF generation
- GCE-AUD-002 (laravel-audit-chain) — Immutable audit trail as evidence source
