# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Fortify headless auth backend
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Fortify Without Frontend**: Installing Fortify with no plan to build auth UI routes â€” half-configured backend
- [ ] Prevent anti-pattern: Stale Fortify Config**: Publishing config once and never revisiting when features change or upgrade
- [ ] Prevent anti-pattern: Missing 2FA Confirmation**: Skipping `confirmPassword` in 2FA feature config, leaving 2FA settings unprotected
- [ ] Features array enables only required auth features
- [ ] Action overrides in `App\Actions\Fortify\` (not vendor files)
- [ ] Login rate limiting configured (not unlimited)
- [ ] Mail configured if email verification is enabled
- [ ] `Fortify::redirectsTo()` set correctly
- [ ] Avoid: Mistake
- [ ] Avoid: Modifying vendor Fortify files
- [ ] Avoid: Not configuring mail for email verification

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Fortify operates as a middleware pipeline â€” routes â†’ middleware (auth, verified, password.confirm) â†’ actions
- All customization goes in `App\Actions\Fortify\*` (published via `php artisan vendor:publish --tag=fortify-actions`)
- Fortify config published to `config/fortify.php`
- Views can be published for customization: `php artisan vendor:publish --tag=fortify-views`

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Features array enables only required auth features
- [ ] - [ ] Action overrides in `App\Actions\Fortify\` (not vendor files)
- [ ] - [ ] Login rate limiting configured (not unlimited)
- [ ] - [ ] Mail configured if email verification is enabled

# Performance Checklist
- Fortify adds minimal overhead â€” routes and controllers are lazy-loaded
- Rate limiting uses Laravel's Cache â€” Redis-backed in production
- 2FA adds TOTP verification overhead (~50ms per challenge)

# Security Checklist
- **Rate-Limited Login**: Fortify's rate limiting protects against brute force attacks. Do not disable.
- **Password Confirmation**: `password.confirm` middleware available for sensitive actions (disabling 2FA, changing email).
- **2FA Recovery Codes**: Generated automatically. Users should be prompted to save them on setup.
- **Email Verification**: Fortify handles email verification links. Configure mail before enabling.

# Reliability Checklist
- [ ] Ensure: Laravel Fortify is a headless authentication backend implementation. It provides...

# Testing Checklist
- [ ] Features array enables only required auth features
- [ ] Action overrides in `App\Actions\Fortify\` (not vendor files)
- [ ] Login rate limiting configured (not unlimited)
- [ ] Mail configured if email verification is enabled
- [ ] `Fortify::redirectsTo()` set correctly
- [ ] Password confirmation on sensitive routes
- [ ] Avoid: Mistake
- [ ] Avoid: Modifying vendor Fortify files
- [ ] Avoid: Not configuring mail for email verification

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Fortify Without Frontend**: Installing Fortify with no plan to build auth UI routes â€” half-configured backend
- [ ] Prevent: Stale Fortify Config**: Publishing config once and never revisiting when features change or upgrade
- [ ] Prevent: Missing 2FA Confirmation**: Skipping `confirmPassword` in 2FA feature config, leaving 2FA settings unprotected
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Modifying vendor Fortify files
- [ ] Avoid mistake: Not configuring mail for email verification
- [ ] Avoid mistake: Disabling rate limiting
- [ ] Avoid mistake: Enabling all features by default

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
- Fortify Without Frontend**: Installing Fortify with no plan to build auth UI routes â€” half-configured backend
- Stale Fortify Config**: Publishing config once and never revisiting when features change or upgrade
- Missing 2FA Confirmation**: Skipping `confirmPassword` in 2FA feature config, leaving 2FA settings unprotected
## Skills
- Customize Fortify Headless Auth Backend for Custom Frontend Authentication


