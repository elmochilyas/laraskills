# Skill: Configure Security Headers Middleware for Browser-Level Protection

## Purpose
Implement global HTTP middleware that sets security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) on every response for defense-in-depth browser security.

## When To Use
- Every web application — security headers are baseline hardening
- HSTS for all HTTPS-only applications
- CSP for applications loading external resources
- X-Frame-Options to prevent clickjacking

## When NOT To Use
- CSP enforced without testing (start in Report-Only mode)
- HSTS with `preload` if subdomains may not support HTTPS
- Applications that legitimately need iframing (use CSP `frame-ancestors` instead)

## Prerequisites
- Global HTTP middleware infrastructure
- Understanding of each header's purpose and impact

## Workflow
1. Create `SecurityHeadersMiddleware` class
2. Add HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
3. Add CSP starting in Report-Only mode: `Content-Security-Policy-Report-Only`
4. Add `X-Frame-Options: DENY` (or `SAMEORIGIN`)
5. Add `X-Content-Type-Options: nosniff`
6. Add `Referrer-Policy: strict-origin-when-cross-origin`
7. Add `Permissions-Policy: geolocation=(), camera=(), microphone=()`
8. Remove `X-Powered-By` header (`expose_php = Off`)
9. Register middleware in HTTP kernel globally
10. Monitor CSP reports, then graduate from Report-Only to enforced

## Validation Checklist
- [ ] Global middleware applies headers to all responses
- [ ] HSTS with `max-age=31536000` for production
- [ ] CSP in Report-Only first, monitoring violations
- [ ] CSP reporting endpoint configured (`report-uri` or `report-to`)
- [ ] X-Frame-Options set (DENY or SAMEORIGIN)
- [ ] X-Content-Type-Options: `nosniff`
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy restricts camera, mic, geolocation
- [ ] X-Powered-By removed
- [ ] Headers tested with curl in CI
