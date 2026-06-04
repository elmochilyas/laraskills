# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** compliance-automation-policy-as-code
**Knowledge Unit:** unified-control-mapping
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Control matrix created mapping technical controls to regulatory frameworks (SOC 2, HIPAA, PCI-DSS, GDPR, ISO 27001)
- [ ] Single implementation satisfies multiple framework requirements
- [ ] Control coverage analysis completed to identify gaps
- [ ] Control drift detection configured for continuous monitoring
- [ ] 60-80% compliance maintenance effort reduction targeted

---

# Architecture Checklist

- [ ] Each technical control (encryption, MFA, logging, access control) mapped to all applicable frameworks
- [ ] Control matrix structure supports framework-agnostic implementation with framework-specific evidence
- [ ] Control coverage analysis identifies frameworks not fully covered
- [ ] Control drift detection compares current state against control baseline
- [ ] Single implementation avoids per-framework compliance code branches

---

# Implementation Checklist

- [ ] Control matrix table created with columns: control ID, description, frameworks satisfied
- [ ] Control implementation modules tagged with framework identifiers
- [ ] Coverage analysis script enumerates controls per framework and flags gaps
- [ ] Drift detection Artisan command compares live config against control baseline
- [ ] Evidence collection scoped per control for framework-specific audit

---

# Performance Checklist

- [ ] Control matrix query performance for large numbers of controls
- [ ] Coverage analysis execution time reviewed for frequent runs
- [ ] Drift detection command performance against production config volume
- [ ] Framework-to-control index used for efficient lookups
- [ ] Control state cached with invalidation on config change

---

# Security Checklist

- [ ] Control matrix does not expose implementation details that weaken security
- [ ] Drift detection configuration stored securely, not in plaintext
- [ ] Coverage analysis output reviewed for sensitive infrastructure mapping
- [ ] Control implementation modules enforce least privilege
- [ ] Control state cached does not include secrets

---

# Reliability Checklist

- [ ] Drift detection runs on schedule; failure alerts on missed run
- [ ] Coverage analysis handles missing controls gracefully (reported as gaps)
- [ ] Control matrix updates versioned and auditable
- [ ] Drift detection false positive rate reviewed and tuned

---

# Testing Checklist

- [ ] Control mapping verified against each framework requirement document
- [ ] Coverage analysis gaps confirmed or documented as low-priority
- [ ] Drift detection tested with baseline changes
- [ ] Control implementation satisfies all mapped frameworks tested per framework
- [ ] Evidence collection per control verified for framework-specific output

---

# Maintainability Checklist

- [ ] Control matrix documented with framework version references
- [ ] Framework requirement mappings updated when framework version changes
- [ ] Control implementation modules organized by domain
- [ ] Drift detection baseline documented for ops team
- [ ] Related skills (Evidence Collection, CI/CD Policy Gates) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No per-framework code branches for the same control
- [ ] No control coverage gaps identified but not tracked for remediation
- [ ] No drift detection that alerts on every config change (high false positive rate)
- [ ] No control matrix that is manually maintained without automation
- [ ] No control mapping that ignores framework-specific nuance

---

# Production Readiness Checklist

- [ ] Control coverage report generated and reviewed by compliance team
- [ ] Drift detection alert threshold tuned for production
- [ ] Control matrix updates deployed via CI/CD, not manual DB edits
- [ ] Framework requirement change monitoring feed set up
- [ ] Compliance maintenance effort reduction tracked and reported

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: control matrix, single impl multi-framework
- [ ] Security requirements satisfied: no implementation exposure, least privilege
- [ ] Performance requirements satisfied: matrix queries efficient, drift detection fast
- [ ] Testing requirements satisfied: mapping verified per framework, drift detection tested
- [ ] Anti-pattern checks passed: no per-framework branches, gaps tracked, no manual matrix
- [ ] Production readiness verified: coverage report reviewed, alerts tuned, CI/CD updates

---

# Related References

- GCE-COM-002 (evidence-collection-automation) — Evidence collection per control
- GCE-COM-001 (cicd-policy-gates) — Policy gates enforce control state
- GCE-COM-004 (compliance-attestation-pdf) — Attestation references control mapping
