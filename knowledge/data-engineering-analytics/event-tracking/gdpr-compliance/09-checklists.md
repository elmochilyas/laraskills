# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 01-event-tracking
**Knowledge Unit:** gdpr-compliance
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] IP anonymization applied before event storage (last octet zeroed or full masking)
- [ ] Consent-based tracking with opt-out mechanism implemented in middleware
- [ ] Cookieless tracking operating without user consent configured as default
- [ ] Data retention policy configurable per tenant with automated purge
- [ ] Right to erasure (deletion) endpoint implemented with tenant-scoped execution
- [ ] Plausible/Matomo/PostHog GDPR compliance approach understood and applied

---

# Architecture Checklist

- [ ] GDPR enforcement hooks placed in middleware layer (K001), before queue dispatch
- [ ] IP anonymization applied before event enters queue — never stored raw at any layer
- [ ] Consent check gates the queuing of tracking events — no dispatch without valid consent
- [ ] Cookieless tracking configured as default; cookies never set for analytics
- [ ] Right to erasure cascade deletes events across all storage tiers (DB, cache, queue)
- [ ] Per-tenant data retention and anonymization config maintained separately

---

# Implementation Checklist

- [ ] IP address anonymized in terminate() middleware hook before dispatch to queue
- [ ] Consent cookie/flag checked in tracking middleware before event capture proceeds
- [ ] Opt-out mechanism accessible via user-facing page with persistent preference storage
- [ ] Data retention TTL implemented as scheduled job purging expired events per tenant
- [ ] Deletion API endpoint for right to erasure with tenant-scoped batch execution
- [ ] Audit log entry created for each GDPR erasure request with timestamp

---

# Performance Checklist

- [ ] Consent check is local cookie read — no per-request database query
- [ ] IP anonymization is zero-copy string manipulation, no heavy computation
- [ ] Data retention cleanup runs as scheduled job outside critical request path
- [ ] Right-to-erasure deletion uses chunked/batched queries, not single large DELETE
- [ ] Cookieless mode reduces HTTP request size, improving overall page performance

---

# Security Checklist

- [ ] Anonymized IP retains zero personally identifiable information (last octet irreversibly zeroed)
- [ ] Consent cookie value validated server-side — cannot be manipulated to enable tracking without consent
- [ ] Right to erasure deletes all events for a given user identifier, including queue backups
- [ ] Data retention TTL enforced at the storage layer (table TTL), not only application logic
- [ ] Audit log for GDPR data deletion requests retained for compliance reporting

---

# Reliability Checklist

- [ ] Consent check failure defaults to not tracked (fail-safe, not fail-open)
- [ ] Data retention purge job logs progress and retries on partial batch failure
- [ ] Right-to-erasure handler accepts batch user IDs and processes within transactions
- [ ] Cookieless fallback still functions when third-party cookies are blocked by browser
- [ ] IP anonymization cannot fail silently — unit test verifies last octet is zeroed

---

# Testing Checklist

- [ ] Test IP anonymization preserves geographic region but removes individual identity
- [ ] Test consent opt-out completely stops all event tracking for that user
- [ ] Test data retention purge deletes correct events by tenant without cross-tenant leakage
- [ ] Test right to erasure cascade deletes across all related analytics tables
- [ ] Test cookieless mode works correctly in privacy-focused browsers (Firefox, Brave)
- [ ] Test consent re-enablement after opt-out resumes tracking correctly

---

# Maintainability Checklist

- [ ] GDPR compliance logic in dedicated middleware class, not mixed with tracking logic
- [ ] Data retention TTL in config file per subdomain/tenant group
- [ ] Consent mechanism versioned to support opt-in model changes over time
- [ ] Documentation updated for privacy impact assessment (PIA) readiness
- [ ] All GDPR-related configuration and logic locale-agnostic

---

# Anti-Pattern Prevention Checklist

- [ ] Do not store raw IP addresses even temporarily — anonymize before any write operation
- [ ] Do not default to tracking until consent is given — default to no tracking
- [ ] Do not hardcode retention periods — must be configurable per tenant
- [ ] Do not bypass GDPR checks in admin or internal routes
- [ ] Do not log raw user-agent strings that could fingerprint individual users

---

# Production Readiness Checklist

- [ ] Prometheus metric for GDPR event rejection rate (consent denied count)
- [ ] Logged warning when retention purge deletes unexpectedly large batch (>10k events)
- [ ] Right to erasure produces confirmation audit trail for data protection authority inspection
- [ ] GDPR compliance report auto-generated for scheduled data protection audit
- [ ] Deployment checklist includes GDPR configuration review step
- [ ] Cookie-less mode verified in staging before production deployment

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: middleware enforcement, pre-queue anonymization, consent gating
- [ ] Security requirements satisfied: irreversible anonymization, validated consent, storage-layer TTL
- [ ] Performance requirements satisfied: no per-request DB, zero-copy masking, batched deletion
- [ ] Testing requirements satisfied: anonymization verification, opt-out, cascade delete, browser compatibility
- [ ] Anti-pattern checks passed: no raw IP storage, no default-track, no hardcoded retention, no bypass
- [ ] Production readiness verified: metrics, audit trail, compliance report, staging cookie-less test

---

# Related References

- K001 (Middleware Event Tracking): Where GDPR enforcement happens
- K018 (Multi-Tenancy): Per-tenant GDPR compliance and retention policies
- K003 (Self-Hosted Analytics): Plausible/Matomo GDPR approach comparison
