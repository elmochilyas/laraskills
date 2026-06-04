# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** audit-trails-activity-logging
**Knowledge Unit:** ss-ipg-auditable
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] ss-ipg/laravel-auditable installed for PHP 8 attribute-based audit configuration
- [ ] Audit attributes declared on model properties using PHP 8 attributes
- [ ] JSON log output format reviewed for log aggregation (Datadog, Splunk)
- [ ] Column filtering and redaction configured per model
- [ ] Context providers created for dynamic audit enrichment

---

# Architecture Checklist

- [ ] PHP 8 attribute-based approach chosen over method-based (Spatie) for declarative config
- [ ] JSON log output structured for ingestion by log aggregation tools
- [ ] Column filtering excludes non-auditable fields; redaction masks sensitive values
- [ ] Context providers supply request-level metadata (IP, user agent, session ID)
- [ ] Attribute configuration moves audit logic closer to model property declarations

---

# Implementation Checklist

- [ ] `#[Auditable]` attribute applied to model classes
- [ ] `#[AuditColumn]` attribute configured on properties with redaction rules
- [ ] JSON log formatter registered in logging configuration
- [ ] Context provider class created implementing `AuditContextProvider`
- [ ] Column redaction rules tested for pattern-based masking (email, phone, SSN)

---

# Performance Checklist

- [ ] PHP 8 attribute reflection overhead measured per request
- [ ] JSON log encoding benchmarked for high-throughput endpoints
- [ ] Context provider execution time profiled
- [ ] Column filtering vs serializing full model state compared
- [ ] Batch audit log writes used for bulk operations

---

# Security Checklist

- [ ] Column redaction verified to not leak masked values in log output
- [ ] Context providers do not capture sensitive headers or tokens
- [ ] JSON log output reviewed for accidental PII inclusion
- [ ] Log access restricted to admin roles via Policy
- [ ] Redaction rules kept in sync with data classification (Tier 1/2/3)

---

# Reliability Checklist

- [ ] Attribute parsing failure does not crash model save; graceful fallback to no audit
- [ ] JSON log write failure handled gracefully
- [ ] Context provider failure does not block audit logging
- [ ] Column filtering fails safely (audit logged but without unmasked fields)

---

# Testing Checklist

- [ ] `#[Auditable]` attribute tested for triggering audit on save
- [ ] Column redaction pattern tests for formats (email, phone, credit card)
- [ ] JSON log output validated against log aggregator schema
- [ ] Context provider execution tested with simulated request data
- [ ] Attribute-based approach compared to method-based for regression

---

# Maintainability Checklist

- [ ] Audit attributes documented inline on model properties
- [ ] Context providers documented with example output
- [ ] Redaction rules versioned alongside data classification changes
- [ ] JSON schema documented for log aggregator configuration
- [ ] Related skills (Spatie Activitylog, BeakAudit) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No audit attributes on transient or cached properties
- [ ] No redaction rules that match too broadly (over-redaction)
- [ ] No context provider accessing DB or external APIs per log entry
- [ ] No JSON log output that bypasses centralized logging pipeline
- [ ] No attribute-based audit on legacy models with incompatible serialization

---

# Production Readiness Checklist

- [ ] JSON log format verified in staging log aggregator
- [ ] Redaction rules validated against sample production data
- [ ] Context provider latency monitored in production
- [ ] Log volume from attribute-based audit projected and accounted for
- [ ] Rollback plan for attribute renames affecting audit configuration

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: attribute-based declarative audit configured
- [ ] Security requirements satisfied: redaction verified, context provider sanitized
- [ ] Performance requirements satisfied: reflection overhead measured, JSON encoding OK
- [ ] Testing requirements satisfied: attribute triggers, column redaction, JSON schema tested
- [ ] Anti-pattern checks passed: no transient props, no DB context, no log bypass
- [ ] Production readiness verified: log aggregator integration, latency monitoring, rollback

---

# Related References

- GCE-AUD-001 (spatie-activitylog-v5) — Method-based approach, DB storage
- GCE-AUD-006 (beakaudit-audit-logging) — HTTP logging, HMAC integrity
- GCE-OWA-002 (security-headers) — Logging as security control
