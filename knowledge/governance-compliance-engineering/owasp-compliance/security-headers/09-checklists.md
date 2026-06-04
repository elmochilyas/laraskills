# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** owasp-compliance
**Knowledge Unit:** security-headers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] `Strict-Transport-Security` header configured with max-age >= 1 year
- [ ] `X-Content-Type-Options: nosniff` header applied to prevent MIME sniffing
- [ ] `X-Frame-Options: DENY` header set to prevent clickjacking
- [ ] `Content-Security-Policy` deployed in report-only mode initially, then enforce
- [ ] `Permissions-Policy` configured for feature restriction

---

# Architecture Checklist

- [ ] HSTS preload evaluated for domain-wide HTTPS enforcement
- [ ] `X-Frame-Options: DENY` for all pages; frame-specific exceptions documented
- [ ] CSP deployed via report-only mode, reviewed, then switched to enforce mode
- [ ] `Permissions-Policy` restricts camera, microphone, geolocation per application need
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` for privacy-preserving referrer behavior

---

# Implementation Checklist

- [ ] Security headers middleware created and registered globally
- [ ] HSTS max-age >= 31536000 (1 year) for preload eligibility
- [ ] CSP report-uri endpoint configured for violation reporting
- [ ] CSP report-only mode tested for 1 week before enforcement
- [ ] Nginx/Apache header configuration verified if headers set at server level

---

# Performance Checklist

- [ ] Header middleware overhead measured (negligible — string concatenation only)
- [ ] CSP report-uri endpoint monitored for volume and processing load
- [ ] HSTS preload list submission impact reviewed
- [ ] Large CSP policy strings evaluated for HTTP header size limits
- [ ] Header size verified within CDN and proxy limitations

---

# Security Checklist

- [ ] HSTS includeSubDomains flag applied for all subdomains
- [ ] `X-Frame-Options: DENY` prevents clickjacking on all pages
- [ ] CSP policy reviewed against application resource loading patterns
- [ ] `Permissions-Policy` disables unused features (geolocation, camera, microphone)
- [ ] `Referrer-Policy` prevents sensitive data in Referer header

---

# Reliability Checklist

- [ ] CSP report-only violations logged and reviewed before enforcement
- [ ] HSTS misconfiguration does not lock out HTTP access without backup
- [ ] Header implementation tested across all supported browsers
- [ ] CSP enforcement breaking changes detected in pre-production

---

# Testing Checklist

- [ ] All security headers verified present in HTTP response via security scanner
- [ ] HSTS preload requirements checked
- [ ] CSP report-only violations reviewed and resolved
- [ ] CSP enforcement tested in staging against all application features
- [ ] `Permissions-Policy` tested for disabled feature unavailability

---

# Maintainability Checklist

- [ ] Security header configuration documented per header
- [ ] CSP policy versioned and reviewed quarterly
- [ ] HSTS preload status monitored and updated
- [ ] Header update procedure documented for middleware changes
- [ ] Related skills (OWASP Top 10, Laravel Security Hardening, Evidence Collection) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No CSP enforced without review period in report-only mode
- [ ] No `X-Frame-Options: DENY` bypassed without documented business requirement
- [ ] No `Permissions-Policy` with unnecessary features enabled
- [ ] No HSTS without includeSubDomains for full coverage
- [ ] No security headers set inconsistently across application and CDN layers

---

# Production Readiness Checklist

- [ ] HSTS preload submission prepared (if applicable)
- [ ] CSP enforcement validated in staging with production-like traffic
- [ ] Security header scanner (securityheaders.com) grade reviewed
- [ ] Header configuration included in compliance evidence collection
- [ ] CSP report analysis cadence established (weekly)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: all six headers configured appropriately
- [ ] Security requirements satisfied: HSTS, nosniff, DENY, CSP, Permissions, Referrer
- [ ] Performance requirements satisfied: header overhead negligible, report volume OK
- [ ] Testing requirements satisfied: all headers verified, CSP violations resolved
- [ ] Anti-pattern checks passed: CSP report-first, no DENY bypass, no unnecessary features
- [ ] Production readiness verified: preload prepped, staging validation, scanner grade, evidence collection

---

# Related References

- GCE-OWA-001 (owasp-top-10-2025) — Security misconfiguration (#2) includes missing headers
- GCE-OWA-003 (laravel-security-hardening) — Headers as part of hardening checklist
- GCE-COM-002 (evidence-collection-automation) — Header configuration evidence
