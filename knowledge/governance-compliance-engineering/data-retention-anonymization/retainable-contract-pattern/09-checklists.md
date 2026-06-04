# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** data-retention-anonymization
**Knowledge Unit:** retainable-contract-pattern
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Retainable contract interface defined with `retentionPeriod()`, `anonymize()`, and `isRetained()` methods
- [ ] Cascade map configured per model for related records (orders, comments, uploads, activity logs)
- [ ] Legal hold mechanism implemented to prevent deletion of records under hold
- [ ] GDPR Article 5(1)(e) storage limitation compliance achieved
- [ ] Anonymize implementations wired to field-level scrubbing (Data Scrubber)

---

# Architecture Checklist

- [ ] Retainable interface fills the gap where `Prunable` trait only supports hard deletion
- [ ] `retentionPeriod()` returns duration per model (e.g., 90 days, 6 months)
- [ ] `anonymize()` calls field-level scrubbing strategies for PII fields
- [ ] `isRetained()` checks if record is under legal hold or still within retention period
- [ ] Cascade map defines related records to process when parent is anonymized

---

# Implementation Checklist

- [ ] `Retainable` contract interface created in `app/Contracts`
- [ ] Each model implements `retentionPeriod()`, `anonymize()`, `isRetained()`
- [ ] Cascade map array defined per model listing related retainable records
- [ ] `LegalHold` model/trait created to mark records exempt from retention
- [ ] Artisan command created to process expired records per model

---

# Performance Checklist

- [ ] `isRetained()` query reviewed to not be a full table scan (index on `retained_until`)
- [ ] Cascade anonymization tested for deep relationship chains
- [ ] Batch processing chunk size tuned for production data volume
- [ ] Legal hold check indexed for efficient filtering
- [ ] Processing schedule runs during off-peak hours

---

# Security Checklist

- [ ] Legal hold override protected by admin role only
- [ ] `anonymize()` implementation verified irreversible for Tier 1 PII
- [ ] Cascade map does not accidentally process records that should be retained
- [ ] `isRetained()` returns false for records outside retention period only after legal hold check
- [ ] Processing audit logged with record count and date

---

# Reliability Checklist

- [ ] Anonymize failure on one record does not stop cascade (continue with logged error)
- [ ] Legal hold flag persisted and survives deployment
- [ ] Processing command idempotent: re-running does not double-process
- [ ] Cascade map circular reference detection

---

# Testing Checklist

- [ ] `retentionPeriod()` boundary tested: record retained for exactly the period
- [ ] `anonymize()` tested verifies fields are scrubbed per strategy
- [ ] Cascade anonymization tested with parent+related model chain
- [ ] Legal hold tested: record under hold not processed
- [ ] Processing command dry-run mode tested

---

# Maintainability Checklist

- [ ] Retainable interface documentation includes example implementation per model
- [ ] Cascade map documented per model with relationship details
- [ ] Legal hold documentation for compliance officer workflow
- [ ] Retention period review schedule established (quarterly)
- [ ] Related skills (Prunable, Data Scrubber, GDPR toolkits) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No retaining data beyond legal retention period without compliance review
- [ ] No anonymize implementation that leaves identifiable data intact
- [ ] No cascade map that misses related records (incomplete PII cleanup)
- [ ] No legal hold bypass for administrative bulk operations
- [ ] No processing of records without audit logging

---

# Production Readiness Checklist

- [ ] Retention period review and alignment with legal requirements confirmed
- [ ] Processing dry-run executed before production enablement
- [ ] Legal hold workflow tested with compliance team
- [ ] Processing failure alert configured
- [ ] Rollback documented: anonymized data is not recoverable, test thoroughly

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: interface defined, cascade map, legal hold
- [ ] Security requirements satisfied: anonymization irreversible, legal hold protected
- [ ] Performance requirements satisfied: batch processing, indexed queries, off-peak
- [ ] Testing requirements satisfied: boundary, anonymization, cascade, legal hold tested
- [ ] Anti-pattern checks passed: no retention overrun, no incomplete cascade, audit logged
- [ ] Production readiness verified: legal review, dry-run, failure alert, rollback considered

---

# Related References

- GCE-DRA-001 (laravel-prunable-trait) — Hard-delete complement
- GCE-DRA-003 (laravel-data-scrubber) — Scrubbing implementations
- GCE-GDP-001 (rylxes-laravel-gdpr) — Right to erasure integration
- GCE-AUD-001 (spatie-activitylog-v5) — Audit logging for anonymization events
