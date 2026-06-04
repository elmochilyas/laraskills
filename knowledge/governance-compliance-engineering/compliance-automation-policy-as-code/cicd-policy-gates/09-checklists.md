# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** compliance-automation-policy-as-code
**Knowledge Unit:** cicd-policy-gates
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] CI/CD policy gate pipeline configured for compliance rule enforcement at deploy time
- [ ] Terraform plan evaluation against OPA/Rego policies implemented
- [ ] Checkov static analysis scanning IaC for security misconfigurations
- [ ] Conftest evaluated for configuration file policy checking
- [ ] PHPUnit compliance tests integrated into CI/CD pipeline

---

# Architecture Checklist

- [ ] Policy evaluation pipeline placed before the deploy step, not after
- [ ] Block/Deploy decision modeled: non-compliant builds fail CI/CD pipeline
- [ ] OPA/Rego policies versioned alongside infrastructure code
- [ ] Checkov scans executed on every pull request to catch IaC misconfigurations
- [ ] PHPUnit compliance tests enforce application-level policy rules

---

# Implementation Checklist

- [ ] CI/CD stage created for policy gate evaluation
- [ ] OPA CLI integrated into CI/CD runner for Rego policy evaluation
- [ ] Checkov configuration file created with severity thresholds
- [ ] Conftest policies written for configuration file validation
- [ ] PHPUnit test suite extended with compliance test cases

---

# Performance Checklist

- [ ] Policy evaluation pipeline step duration measured and optimized
- [ ] OPA Rego bundle pre-compiled for faster CI/CD gate execution
- [ ] Checkov scan scoped to changed IaC files only
- [ ] PHPUnit compliance tests parallelized for faster feedback
- [ ] CI/CD gate timeout configured appropriately

---

# Security Checklist

- [ ] Policy gate enforced on all deployable branches (main, release)
- [ ] Checkov severity threshold set to fail on high/critical findings
- [ ] OPA Rego policies signed to prevent tampered policy evaluation
- [ ] CI/CD secrets used for OPA API access, not hardcoded
- [ ] PHPUnit compliance tests cover OWASP Top 10 categories

---

# Reliability Checklist

- [ ] Policy gate bypass mechanism for emergencies documented and audited
- [ ] OPA evaluation failure fails the pipeline (fail-closed)
- [ ] Checkov scan failure handled gracefully with clear error output
- [ ] Conftest policy errors reported in CI/CD output, not silently ignored

---

# Testing Checklist

- [ ] Rego policy tests written with `opa test` in CI/CD
- [ ] Checkov scan tested against known-bad IaC templates
- [ ] Conftest policy tests executed per configuration file type
- [ ] PHPUnit compliance tests run in CI/CD pipeline
- [ ] Policy gate bypass tested with controlled drill

---

# Maintainability Checklist

- [ ] Rego policies documented per compliance framework (SOC 2, HIPAA, PCI-DSS)
- [ ] Checkov skip rules documented with justification
- [ ] Conftest policies organized per configuration domain
- [ ] PHPUnit compliance tests grouped in dedicated test suite
- [ ] Related skills (OPA, OWASP Top 10, Evidence Collection) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No policy gate that can be skipped without audit trail
- [ ] No Checkov scan that ignores high-severity findings
- [ ] No OPA Rego policies without corresponding tests
- [ ] No PHPUnit compliance tests that are not executed in CI/CD
- [ ] No hardcoded thresholds in CI/CD configuration

---

# Production Readiness Checklist

- [ ] CI/CD gate failure notification configured (Slack, email)
- [ ] Policy gate bypass audited with requester and reason logged
- [ ] Checkov baseline scan run on existing IaC before enforcement
- [ ] Deployment rollback procedure includes policy gate re-evaluation
- [ ] Drill conducted for emergency bypass scenario

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: gates before deploy, fail-closed model
- [ ] Security requirements satisfied: all branches covered, secrets protected
- [ ] Performance requirements satisfied: evaluation duration OK, parallelized tests
- [ ] Testing requirements satisfied: Rego tests, Checkov, Conftest, PHPUnit pass
- [ ] Anti-pattern checks passed: no skip without audit, no ignored findings
- [ ] Production readiness verified: notifications, bypass audit, rollback procedure

---

# Related References

- GCE-ACC-003 (opa-openpolicyagent) — OPA Rego policies used in CI/CD gates
- GCE-COM-002 (evidence-collection-automation) — Continuous compliance evidence
- GCE-COM-003 (unified-control-mapping) — Control mapping for policy rules
- GCE-OWA-001 (owasp-top-10-2025) — Security checks in CI/CD pipeline
