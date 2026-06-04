# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Sanctum SPA cookie auth vs token auth
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: localStorage Token Storage**: Storing Bearer tokens in localStorage for browser apps, exposing them to XSS
- [ ] Prevent anti-pattern: Mixed Auth Mode Middleware**: Using the same `tokenCan()` logic for both SPA cookie and token auth routes
- [ ] Prevent anti-pattern: Cross-Domain Cookie Auth Attempt**: Trying to use SPA cookie auth across different root domains
- [ ] SPA same-domain uses cookie auth, not Bearer tokens in localStorage
- [ ] SANCTUM_STATEFUL_DOMAINS includes all SPA domains
- [ ] Session driver is production-appropriate (Redis for multi-server)
- [ ] SPA calls `/sanctum/csrf-cookie` before login
- [ ] CORS configured with specific origins and `supports_credentials: true`
- [ ] Avoid: Mistake
- [ ] Avoid: Using token auth for same-domain SPA
- [ ] Avoid: Not configuring stateful domains

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- SPA mode: session driver (`config/session.php`) must use `database`, `redis`, or `memcached` (not `file` in production)
- Token mode: no session dependency â€” stateless API calls
- Stateful domains configured in `config/sanctum.php` â†’ `stateful` array
- Both modes can coexist â€” same user can have both a session and tokens simultaneously
- Route middleware: `auth:sanctum` applies to both modes

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] SPA same-domain uses cookie auth, not Bearer tokens in localStorage
- [ ] - [ ] SANCTUM_STATEFUL_DOMAINS includes all SPA domains
- [ ] - [ ] Session driver is production-appropriate (Redis for multi-server)
- [ ] - [ ] SPA calls `/sanctum/csrf-cookie` before login

# Performance Checklist
- SPA mode: session read/write on every request â€” use Redis for session storage in production
- Token mode: SHA-256 hash lookup on every request â€” index the `tokenable_id` and `token` columns
- Token mode is slightly faster (no session read) for API-heavy applications

# Security Checklist
- **XSS**: SPA mode is more resistant to XSS token theft (session cookie is `httpOnly` â€” not accessible to JS). Token mode sends Bearer token in Authorization header (accessible to JS if stored in localStorage).
- **CSRF**: SPA mode requires CSRF token. Token mode does not â€” Bearer tokens are not subject to CSRF.
- **Token Leakage**: Token mode tokens are in every request header â€” leak via logs, referer headers, or server logs.
- **Session Fixation**: SPA mode requires session regeneration after login â€” Sanctum handles this automatically.

# Reliability Checklist
- [ ] Ensure: Laravel Sanctum provides two distinct authentication modes: **SPA cookie auth** ...

# Testing Checklist
- [ ] SPA same-domain uses cookie auth, not Bearer tokens in localStorage
- [ ] SANCTUM_STATEFUL_DOMAINS includes all SPA domains
- [ ] Session driver is production-appropriate (Redis for multi-server)
- [ ] SPA calls `/sanctum/csrf-cookie` before login
- [ ] CORS configured with specific origins and `supports_credentials: true`
- [ ] Bearer tokens for mobile stored in secure device storage
- [ ] Avoid: Mistake
- [ ] Avoid: Using token auth for same-domain SPA
- [ ] Avoid: Not configuring stateful domains

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: localStorage Token Storage**: Storing Bearer tokens in localStorage for browser apps, exposing them to XSS
- [ ] Prevent: Mixed Auth Mode Middleware**: Using the same `tokenCan()` logic for both SPA cookie and token auth routes
- [ ] Prevent: Cross-Domain Cookie Auth Attempt**: Trying to use SPA cookie auth across different root domains
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using token auth for same-domain SPA
- [ ] Avoid mistake: Not configuring stateful domains
- [ ] Avoid mistake: Storing Bearer token in localStorage
- [ ] Avoid mistake: Missing XSRF-TOKEN on SPA mutating requests

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
- localStorage Token Storage**: Storing Bearer tokens in localStorage for browser apps, exposing them to XSS
- Mixed Auth Mode Middleware**: Using the same `tokenCan()` logic for both SPA cookie and token auth routes
- Cross-Domain Cookie Auth Attempt**: Trying to use SPA cookie auth across different root domains
## Skills
- Configure Sanctum SPA Cookie Auth vs Token Auth for Appropriate Client Types


