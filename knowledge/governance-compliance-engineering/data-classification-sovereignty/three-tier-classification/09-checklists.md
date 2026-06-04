# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** data-classification-sovereignty
**Knowledge Unit:** three-tier-classification
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Three-tier data classification model mapped to encryption strategy and cloud provider choice
- [ ] Tier 1 (High — PII, financial, healthcare) identified for HYOK encryption and EU-native cloud
- [ ] Tier 2 (Medium — analytics, logs) identified for BYOK with EU region guardrails
- [ ] Tier 3 (Low — public data) identified for standard encryption
- [ ] Three-layer sovereignty model documented: data, metadata, derived data

---

# Architecture Checklist

- [ ] Classification per entity: each model tagged with Tier 1, 2, or 3
- [ ] HYOK encryption strategy applied to Tier 1 data with customer-controlled HSM
- [ ] BYOK encryption strategy applied to Tier 2 data with EU region guardrails
- [ ] Metadata sovereignty tracked separately from data sovereignty
- [ ] Classification determines cloud provider choice and data placement region

---

# Implementation Checklist

- [ ] `DataClassification` enum created with Tier 1, 2, 3 values
- [ ] Model attribute or trait added to declare classification tier
- [ ] Encryption strategy resolver selects BYOK/HYOK based on tier
- [ ] Data placement logic routes Tier 1 data to EU-native cloud providers
- [ ] Metadata classification schema documented and enforced

---

# Performance Checklist

- [ ] Classification lookup overhead measured per query (enum resolution)
- [ ] HYOK encryption latency compared to BYOK for Tier 1 data
- [ ] Data placement router performance for multi-region writes
- [ ] Classification-based query filtering indexed
- [ ] Encryption strategy selection cached by tier

---

# Security Checklist

- [ ] Tier 1 data never stored on non-EU infrastructure (cloud provider verified)
- [ ] HYOK keys never leave customer HSM environment
- [ ] Metadata tagged fields do not leak data sovereignty tier in error messages
- [ ] Classification override protected by admin role only
- [ ] Downgrade from Tier 1 to Tier 2 reviewed for compliance implications

---

# Reliability Checklist

- [ ] Classification migration plan for re-classifying existing data
- [ ] HYOK key access failure handled gracefully (block access, alert)
- [ ] BYOK region guardrail enforcement fail-closed
- [ ] Data placement misconfiguration detected by compliance scan

---

# Testing Checklist

- [ ] Classification tag applied and enforced on CRUD operations per tier
- [ ] Encryption strategy selection tested per tier
- [ ] Data placement routing tested for region compliance
- [ ] Classification override workflow tested
- [ ] Compliance scan detects misclassification

---

# Maintainability Checklist

- [ ] Classification tier criteria documented for each data type
- [ ] Encryption strategy mapping documented per tier
- [ ] Re-classification process documented for data evolution
- [ ] Cloud provider sovereignty documentation reviewed and linked
- [ ] Related skills (BYOK/HYOK, Data Residency, Evidence Collection) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No classification applied after data storage (classify before persist)
- [ ] No Tier 1 data stored without HYOK encryption
- [ ] No classification tier change without compliance review
- [ ] No metadata-only classification without data-level enforcement
- [ ] No ignoring derived data sovereignty (logs, caches, backups)

---

# Production Readiness Checklist

- [ ] Classification audit run to verify all entities have assigned tier
- [ ] Encryption strategy compliance verified for each tier
- [ ] Data placement verified per region for Tier 1/2 workloads
- [ ] Re-classification drill conducted
- [ ] Monitoring set for classification compliance violations

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: tiers mapped, encryption/placement per tier
- [ ] Security requirements satisfied: Tier 1 HYOK, no non-EU storage, classification protected
- [ ] Performance requirements satisfied: lookup overhead OK, HYOK latency measured
- [ ] Testing requirements satisfied: CRUD per tier, encryption selection, placement tested
- [ ] Anti-pattern checks passed: no post-hoc classification, no Tier 1 without HYOK
- [ ] Production readiness verified: classification audit, encryption compliance, drill

---

# Related References

- GCE-DCS-002 (byok-hyok-encryption) — Encryption strategy per classification tier
- GCE-MUL-002 (data-residency-tenants) — Multi-region data placement
- GCE-COM-002 (evidence-collection-automation) — Evidence collection for classification compliance
