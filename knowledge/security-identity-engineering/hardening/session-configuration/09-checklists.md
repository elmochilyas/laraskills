# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** Session configuration (secure, http_only, same_site)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Excessively Long Session Lifetime**: Sessions lasting days or weeks
- [ ] Prevent anti-pattern: Default Cookie Name**: `laravel_session` conflicts with other apps on same domain
- [ ] Prevent anti-pattern: Same Session ID Across Applications**: Cookie collision on subdomains
- [ ] Session driver is Redis/database in production (not file on multi-server)
- [ ] `secure` = `true` in production (HTTPS-only cookies)
- [ ] `http_only` = `true` (JS cannot read session cookie)
- [ ] `same_site` configured appropriately for domain setup
- [ ] Session lifetime appropriate for application needs
- [ ] Avoid: Mistake
- [ ] Avoid: `secure = false` in production
- [ ] Avoid: `http_only = false`

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Session driver: `redis` for production (fast, shared across servers). `database` as fallback.
- `secure`: `true` in production. `false` in local dev (no HTTPS).
- `http_only`: `true` always. No exceptions unless explicitly justified.
- `same_site`: `lax` for most applications. `none` for Sanctum SPA subdomain auth (requires `secure=true`).
- `encrypt`: `false` by default. Enable for high-security applications (adds encryption overhead).
- Session ID regenerated after login (`session()->regenerate()`)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Session driver is Redis/database in production (not file on multi-server)
- [ ] - [ ] `secure` = `true` in production (HTTPS-only cookies)
- [ ] - [ ] `http_only` = `true` (JS cannot read session cookie)
- [ ] - [ ] `same_site` configured appropriately for domain setup

# Performance Checklist
- File sessions: single-server only, slow under concurrency
- Database sessions: moderate performance, scales horizontally
- Redis sessions: fastest, ideal for distributed deployments
- Encrypted sessions: adds ~0.1-0.5ms encryption/decryption per request
- Session GC (garbage collection): `php artisan session:gc` or automatic via config

# Security Checklist
- **Session Hijacking**: `http_only = true` prevents XSS-based theft. `secure = true` prevents network interception. `same_site` prevents CSRF-based session exploitation.
- **Session Fixation**: `session()->regenerate()` after login prevents fixation. Verify this is called.
- **Session Lifetime**: Set appropriately â€” too long increases hijacking window, too short frustrates users. 120 minutes is default.
- **Session ID Entropy**: Laravel's session IDs are cryptographically random â€” no additional entropy needed.

# Reliability Checklist
- [ ] Ensure: Session configuration in Laravel's `config/session.php` controls the security pr...

# Testing Checklist
- [ ] Session driver is Redis/database in production (not file on multi-server)
- [ ] `secure` = `true` in production (HTTPS-only cookies)
- [ ] `http_only` = `true` (JS cannot read session cookie)
- [ ] `same_site` configured appropriately for domain setup
- [ ] Session lifetime appropriate for application needs
- [ ] Session cookie name unique to the application
- [ ] Avoid: Mistake
- [ ] Avoid: `secure = false` in production
- [ ] Avoid: `http_only = false`

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Excessively Long Session Lifetime**: Sessions lasting days or weeks
- [ ] Prevent: Default Cookie Name**: `laravel_session` conflicts with other apps on same domain
- [ ] Prevent: Same Session ID Across Applications**: Cookie collision on subdomains
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: `secure = false` in production
- [ ] Avoid mistake: `http_only = false`
- [ ] Avoid mistake: `same_site = none` without `secure`
- [ ] Avoid mistake: File driver in production

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
- Excessively Long Session Lifetime**: Sessions lasting days or weeks
- Default Cookie Name**: `laravel_session` conflicts with other apps on same domain
- Same Session ID Across Applications**: Cookie collision on subdomains
## Skills
- Configure Secure Session Settings for Production


