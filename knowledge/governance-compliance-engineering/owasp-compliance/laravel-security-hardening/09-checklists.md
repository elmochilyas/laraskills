# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** owasp-compliance
**Knowledge Unit:** laravel-security-hardening
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Laravel security defaults reviewed: CSRF, Blade output escaping, Eloquent parameterized queries, bcrypt/argon2 hashing
- [ ] Session hardening configured: HttpOnly, Secure, SameSite cookies
- [ ] Input validation implemented via Form Requests
- [ ] Rate limiting applied with throttle middleware
- [ ] File upload validation configured (MIME + size)

---

# Architecture Checklist

- [ ] CSRF middleware active on all web routes (except stateless API routes)
- [ ] Blade output escaping prevents XSS by default; raw output reviewed case-by-case
- [ ] Eloquent parameterized queries prevent SQL injection throughout the app
- [ ] Password hashing configured with bcrypt/argon2 cost factor appropriate for hardware
- [ ] Session configuration hardened: HttpOnly prevents JS access, Secure enforces HTTPS, SameSite restricts CSRF

---

# Implementation Checklist

- [ ] Form Request classes created for all data input validation
- [ ] Rate limiter configured per route group with appropriate max attempts and decay
- [ ] File upload validated on MIME type AND file size using Laravel validation rules
- [ ] `composer audit` configured in CI/CD for dependency vulnerability scanning
- [ ] `APP_DEBUG` set to false, `.env` protected from web access, Telescope/Horizon access restricted

---

# Performance Checklist

- [ ] CSRF token verification overhead measured per request
- [ ] Rate limiting memory/database store selected for performance
- [ ] File upload validation size limits set per use case
- [ ] Session driver performance reviewed (Redis recommended)
- [ ] `composer audit` execution time benchmarked

---

# Security Checklist

- [ ] Session cookies configured with correct SameSite, Secure, and HttpOnly flags
- [ ] Form Request validation tested for injection and boundary cases
- [ ] Rate limiting prevents brute force on authentication and API endpoints
- [ ] File upload MIME type enforcement cannot be bypassed by extension spoofing
- [ ] `APP_DEBUG` disabled in all non-local environments; `APP_ENV` checked

---

# Reliability Checklist

- [ ] CSRF token expiration does not break legitimate long-form submissions
- [ ] Rate limiting provides clear error response with Retry-After header
- [ ] File upload failure handled with user-friendly error message
- [ ] Session hardening does not break API or SPA authentication flows

---

# Testing Checklist

- [ ] CSRF protection tested on all state-changing web routes
- [ ] XSS injection tested across Blade templates
- [ ] SQL injection tested across Eloquent and raw DB queries
- [ ] Rate limiting tested with automated request flooding
- [ ] File upload MIME and size enforcement tested

---

# Maintainability Checklist

- [ ] Form Request classes organized per domain module
- [ ] Rate limiter configuration documented per route group
- [ ] Session hardening configuration documented for ops team
- [ ] Dependency audit schedule documented (weekly)
- [ ] Related skills (OWASP Top 10, Security Headers, CI/CD Gates) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No raw Blade output (`{!! !!}`) without explicit security review
- [ ] No raw DB queries where Eloquent parameterized query would suffice
- [ ] No rate limiting that blocks legitimate traffic (threshold reviewed)
- [ ] No file upload without MIME + size validation
- [ ] No `APP_DEBUG` enabled in production under any condition

---

# Production Readiness Checklist

- [ ] Session hardening verified with security scanner (HSTS, cookie flags)
- [ ] Rate limiter thresholds validated against production traffic patterns
- [ ] File upload storage monitored for capacity
- [ ] `composer audit` integrated into CI/CD pipeline with fail on high severity
- [ ] Telescope/Horizon access restricted via IP allowlist or additional auth

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: defaults enabled, session hardened, CSRF active
- [ ] Security requirements satisfied: XSS prevented, SQLi prevented, rate limiting, file validation
- [ ] Performance requirements satisfied: middleware overhead OK, rate limiter store chosen
- [ ] Testing requirements satisfied: CSRF, XSS, SQLi, rate limiting, file upload tested
- [ ] Anti-pattern checks passed: no raw output, no raw queries, no debug mode, no ignored uploads
- [ ] Production readiness verified: security scanner, rate limit validation, composer audit in CI/CD

---

# Related References

- GCE-OWA-001 (owasp-top-10-2025) — OWASP categories addressed by hardening
- GCE-OWA-002 (security-headers) — Header-specific hardening
- GCE-COM-001 (cicd-policy-gates) — CI/CD hardening checks
- GCE-AUD-001 (spatie-activitylog-v5) — Logging and monitoring for security
