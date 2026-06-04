# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** Security headers (HSTS, CSP, XFO, etc.)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No Security Headers Middleware**: Headers configured ad-hoc per response
- [ ] Prevent anti-pattern: X-Powered-By Exposed**: PHP version visible in responses
- [ ] Prevent anti-pattern: CSP Enforced Without Report-Only Testing**: Production broken by CSP
- [ ] Global middleware applies headers to all responses
- [ ] HSTS with `max-age=31536000` for production
- [ ] CSP in Report-Only first, monitoring violations
- [ ] CSP reporting endpoint configured (`report-uri` or `report-to`)
- [ ] X-Frame-Options set (DENY or SAMEORIGIN)
- [ ] Avoid: Mistake
- [ ] Avoid: CSP enforced without testing
- [ ] Avoid: HSTS too short max-age

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Global middleware adds security headers to every response
- CSP policy size affects browser parsing â€” keep directives focused on actual requirements
- HSTS `max-age`: minimum 1 year (31536000) for preload eligibility; start with 1 week during testing
- Use the `spatie/laravel-cookie-consent` or custom middleware for security header management
- For large CSP policies, consider CSP with nonces (for inline scripts/styles)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Global middleware applies headers to all responses
- [ ] - [ ] HSTS with `max-age=31536000` for production
- [ ] - [ ] CSP in Report-Only first, monitoring violations
- [ ] - [ ] CSP reporting endpoint configured (`report-uri` or `report-to`)

# Performance Checklist
- Security headers are set once per response â€” negligible overhead
- CSP policy size: 500-2000 bytes typical. Larger policies affect browser parsing time â€” keep focused.
- HSTS: one-time header check per domain visit â€” no per-request impact
- No significant server-side performance impact from any security header

# Security Checklist
- **CSP as Fallback, Not Primary**: CSP is a secondary XSS defense. Primary defense is Blade escaping (`{{ }}`).
- **HSTS Downgrade Protection**: HSTS prevents SSL stripping attacks but requires HTTPS to be working first.
- **Report-Only Bypass**: Report-Only modes do not block violations â€” they only report. Ensure violations are reviewed.
- **Permissions-Policy**: Limits damage if XSS is exploited â€” prevents access to camera, microphone, geolocation.

# Reliability Checklist
- [ ] Ensure: Security headers are HTTP response headers that instruct browsers to apply secur...

# Testing Checklist
- [ ] Global middleware applies headers to all responses
- [ ] HSTS with `max-age=31536000` for production
- [ ] CSP in Report-Only first, monitoring violations
- [ ] CSP reporting endpoint configured (`report-uri` or `report-to`)
- [ ] X-Frame-Options set (DENY or SAMEORIGIN)
- [ ] X-Content-Type-Options: `nosniff`
- [ ] Avoid: Mistake
- [ ] Avoid: CSP enforced without testing
- [ ] Avoid: HSTS too short max-age

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Security Headers Middleware**: Headers configured ad-hoc per response
- [ ] Prevent: X-Powered-By Exposed**: PHP version visible in responses
- [ ] Prevent: CSP Enforced Without Report-Only Testing**: Production broken by CSP
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: CSP enforced without testing
- [ ] Avoid mistake: HSTS too short max-age
- [ ] Avoid mistake: Missing `includeSubDomains`
- [ ] Avoid mistake: No CSP reporting

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- No Security Headers Middleware**: Headers configured ad-hoc per response
- X-Powered-By Exposed**: PHP version visible in responses
- CSP Enforced Without Report-Only Testing**: Production broken by CSP
## Skills
- Configure Security Headers Middleware for Browser-Level Protection


