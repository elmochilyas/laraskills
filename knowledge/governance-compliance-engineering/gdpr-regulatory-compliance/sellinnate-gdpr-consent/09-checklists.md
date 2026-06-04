# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** gdpr-regulatory-compliance
**Knowledge Unit:** sellinnate-gdpr-consent
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Sellinnate/laravel-gdpr-consent-database installed for focused consent management
- [ ] Consent types configured: required, optional, versioned, expiring
- [ ] Polymorphic `user_consents` table migrated and indexed
- [ ] Guest consent via session implemented for unauthenticated users
- [ ] Middleware gating applied to routes requiring specific consent

---

# Architecture Checklist

- [ ] Consent management focused exclusively on consent, not broader GDPR toolkit
- [ ] Consent types separated into required (functional) and optional (marketing, analytics)
- [ ] Versioned consents track user acceptance over policy iterations
- [ ] Expiring consents require re-acceptance after defined period
- [ ] Polymorphic `user_consents` table supports multiple user models

---

# Implementation Checklist

- [ ] Migration created for polymorphic `user_consents` table
- [ ] Consent type definitions seeded (required, optional, versioned, expiring)
- [ ] Guest consent middleware captures consent via session ID
- [ ] Route middleware gating applied to features requiring consent
- [ ] Consent acceptance event listener for audit logging

---

# Performance Checklist

- [ ] Polymorphic consent query performance reviewed (index on `user_id`, `consent_type_id`)
- [ ] Session-based guest consent TTL configured
- [ ] Consent middleware gate latency measured
- [ ] Expiring consent check frequency tuned
- [ ] Consent type cache configured for fast lookup

---

# Security Checklist

- [ ] Consent records linked to user identity or session ID with timestamp
- [ ] Guest consent session ID not correlatable to PII without authentication
- [ ] Consent withdrawal enforced globally across all feature gates
- [ ] Expiring consent re-acceptance workflow prevents silent consent lapse
- [ ] Middleware gating does not block essential functionality

---

# Reliability Checklist

- [ ] Consent middleware gate failure defaults to denying access (fail-closed)
- [ ] Session-based guest consent persists across user session duration
- [ ] Consent type migration does not invalidate existing consent records
- [ ] Expiring consent notification sent before expiry date

---

# Testing Checklist

- [ ] Consent type acceptance and enforcement tested per type
- [ ] Versioned consent tested: old version consent rejected after policy update
- [ ] Expiring consent re-acceptance tested after expiry
- [ ] Guest consent session flow tested
- [ ] Middleware gating tested for each consent type

---

# Maintainability Checklist

- [ ] Consent type definitions documented with purpose and legal basis
- [ ] Polymorphic consent table schema documented for compliance
- [ ] Guest consent session strategy documented for privacy review
- [ ] Consent expiry periods reviewed and documented quarterly
- [ ] Related skills (Rylxes GDPR, AI Act Compliance, Foothing GDPR) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No required consent that can be withdrawn (functional necessity documented)
- [ ] No guest consent that persists beyond session TTL
- [ ] No consent middleware that blocks essential app functionality
- [ ] No consent version that overwrites history without audit trail
- [ ] No expiring consent that goes unnoticed by user

---

# Production Readiness Checklist

- [ ] Consent records backup strategy configured
- [ ] Consent expiry notification workflow tested
- [ ] Guest consent session duration reviewed for privacy regulations
- [ ] Consent audit log included in compliance evidence collection
- [ ] Dashboard for consent acceptance rate monitored

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: consent types, polymorphic table, middleware gating
- [ ] Security requirements satisfied: fail-closed middleware, timestamped records, withdrawal
- [ ] Performance requirements satisfied: polymorphic query indexed, middleware latency OK
- [ ] Testing requirements satisfied: type enforcement, versioning, expiry, guest flow tested
- [ ] Anti-pattern checks passed: no essential blocked, history kept, expiry notified
- [ ] Production readiness verified: backup, expiry notifications, audit evidence, dashboard

---

# Related References

- GCE-GDP-001 (rylxes-laravel-gdpr) — Includes consent management in broader toolkit
- GCE-GDP-002 (laravel-ai-act-compliance) — Consent ledger module
- GCE-GDP-006 (foothing-gdpr-consent) — Lightweight consent alternative
