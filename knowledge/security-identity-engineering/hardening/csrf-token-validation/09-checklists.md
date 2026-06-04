# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** CSRF token exchange and validation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: CSRF Token in GET URLs**: Token exposed via referrer headers, server logs, and browser history
- [ ] Prevent anti-pattern: API Routes with CSRF**: Adding VerifyCsrfToken middleware to stateless API routes
- [ ] Prevent anti-pattern: No Alternative Protection for Excluded Routes**: Webhook exclusions without HMAC or IP allowlist
- [ ] `VerifyCsrfToken` middleware in `web` middleware group
- [ ] `@csrf` in all Blade POST/PUT/PATCH/DELETE forms
- [ ] SPA calls `/sanctum/csrf-cookie` before mutating requests
- [ ] Webhook routes in `$except` with documented justification
- [ ] No routes excluded without clear documentation
- [ ] Avoid: Mistake
- [ ] Avoid: Forgetting `@csrf` in forms
- [ ] Avoid: Adding CSRF to API routes

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- CSRF middleware in `web` middleware group (default â€” do not remove)
- `@csrf` in every Blade form â€” never skip it
- SPA: Sanctum's `/sanctum/csrf-cookie` + Axios `withCredentials: true`
- CSRF token is regenerated on session regeneration (login/logout)
- Exclude non-standard routes in `VerifyCsrfToken::$except` array â€” document each

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `VerifyCsrfToken` middleware in `web` middleware group
- [ ] - [ ] `@csrf` in all Blade POST/PUT/PATCH/DELETE forms
- [ ] - [ ] SPA calls `/sanctum/csrf-cookie` before mutating requests
- [ ] - [ ] Webhook routes in `$except` with documented justification

# Performance Checklist
- CSRF validation is a session comparison â€” ~0.1ms per request
- No database queries â€” purely session-based
- Token generation happens once per session creation

# Security Checklist
- **Session Dependency**: CSRF protection depends on the session. Stateless API routes cannot use CSRF (use tokens instead).
- **Token in Cookie (Sanctum)**: The `XSRF-TOKEN` cookie is readable by JavaScript â€” necessary for Axios to auto-send it. The session cookie (`laravel_session`) remains `httpOnly`.
- **Same-Site Cookies**: `same_site=lax` in session config provides additional CSRF protection for same-domain forms.
- **CSRF on API Routes**: Do NOT add CSRF to API routes â€” they use token auth. Adding CSRF breaks API clients that don't send the token.

# Reliability Checklist
- [ ] Ensure: Cross-Site Request Forgery (CSRF) protection in Laravel uses a token-based valid...

# Testing Checklist
- [ ] `VerifyCsrfToken` middleware in `web` middleware group
- [ ] `@csrf` in all Blade POST/PUT/PATCH/DELETE forms
- [ ] SPA calls `/sanctum/csrf-cookie` before mutating requests
- [ ] Webhook routes in `$except` with documented justification
- [ ] No routes excluded without clear documentation
- [ ] CSRF excluded routes tested for alternative protection (signature, IP allowlist)
- [ ] Avoid: Mistake
- [ ] Avoid: Forgetting `@csrf` in forms
- [ ] Avoid: Adding CSRF to API routes

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: CSRF Token in GET URLs**: Token exposed via referrer headers, server logs, and browser history
- [ ] Prevent: API Routes with CSRF**: Adding VerifyCsrfToken middleware to stateless API routes
- [ ] Prevent: No Alternative Protection for Excluded Routes**: Webhook exclusions without HMAC or IP allowlist
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Forgetting `@csrf` in forms
- [ ] Avoid mistake: Adding CSRF to API routes
- [ ] Avoid mistake: Excluding CSRF on all routes
- [ ] Avoid mistake: Not calling `/sanctum/csrf-cookie`

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
- CSRF Token in GET URLs**: Token exposed via referrer headers, server logs, and browser history
- API Routes with CSRF**: Adding VerifyCsrfToken middleware to stateless API routes
- No Alternative Protection for Excluded Routes**: Webhook exclusions without HMAC or IP allowlist
## Skills
- Configure CSRF Token Validation for All State-Changing Routes


