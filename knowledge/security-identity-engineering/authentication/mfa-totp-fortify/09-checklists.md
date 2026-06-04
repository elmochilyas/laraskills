# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** MFA/TOTP with Fortify
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Unlogged 2FA Events**: No audit trail for enable/disable/reset, making incident response blind to 2FA tampering
- [ ] Prevent anti-pattern: Invisible 2FA Status**: No indicator in admin UI showing which users have MFA enabled â€” compliance blind spot
- [ ] Prevent anti-pattern: TOTP Secret in Plaintext**: Encryption key misconfigured, storing TOTP secrets unencrypted in database
- [ ] Password confirmation required for 2FA setup changes
- [ ] Recovery codes hashed (bcrypt) and displayed once during setup
- [ ] TOTP verification rate-limited (not unlimited)
- [ ] Admin accounts enforced to have MFA enabled
- [ ] 2FA events logged with user ID, IP, timestamp
- [ ] Avoid: Mistake
- [ ] Avoid: Not requiring password confirmation for 2FA setup
- [ ] Avoid: Not providing recovery code fallback

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Enable 2FA feature in `config/fortify.php`: `Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true])`
- Customize `App\Actions\Fortify\TwoFactorAuthentication` action for custom 2FA behavior
- Recovery codes: 10 codes by default, configurable. Each code is single-use.
- Challenge middleware automatically applied after login for users with 2FA enabled

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Password confirmation required for 2FA setup changes
- [ ] - [ ] Recovery codes hashed (bcrypt) and displayed once during setup
- [ ] - [ ] TOTP verification rate-limited (not unlimited)
- [ ] - [ ] Admin accounts enforced to have MFA enabled

# Performance Checklist
- TOTP verification is local â€” no external API calls. ~50ms per challenge.
- QR code generation requires the `simple-qrcode` package. ~200ms one-time setup cost.
- Recovery code hashing (bcrypt) on generation â€” configurable cost.

# Security Checklist
- **TOTP Secret Storage**: Fortify encrypts the TOTP secret in the database using Laravel's encryption.
- **Recovery Code Exposure**: Recovery codes are displayed only once during setup (plain text). After that, only hashed versions are stored.
- **Brute Force Protection**: Fortify rate-limits TOTP verification attempts.
- **Session Security**: 2FA session state is stored in the session â€” must use secure session configuration.

# Reliability Checklist
- [ ] Ensure: Laravel Fortify provides built-in two-factor authentication (2FA) using TOTP (Ti...

# Testing Checklist
- [ ] Password confirmation required for 2FA setup changes
- [ ] Recovery codes hashed (bcrypt) and displayed once during setup
- [ ] TOTP verification rate-limited (not unlimited)
- [ ] Admin accounts enforced to have MFA enabled
- [ ] 2FA events logged with user ID, IP, timestamp
- [ ] Documented recovery flow for lost authenticator
- [ ] Avoid: Mistake
- [ ] Avoid: Not requiring password confirmation for 2FA setup
- [ ] Avoid: Not providing recovery code fallback

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Unlogged 2FA Events**: No audit trail for enable/disable/reset, making incident response blind to 2FA tampering
- [ ] Prevent: Invisible 2FA Status**: No indicator in admin UI showing which users have MFA enabled â€” compliance blind spot
- [ ] Prevent: TOTP Secret in Plaintext**: Encryption key misconfigured, storing TOTP secrets unencrypted in database
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not requiring password confirmation for 2FA setup
- [ ] Avoid mistake: Not providing recovery code fallback
- [ ] Avoid mistake: Making 2FA mandatory without exception handling
- [ ] Avoid mistake: Not logging 2FA changes

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
- Unlogged 2FA Events**: No audit trail for enable/disable/reset, making incident response blind to 2FA tampering
- Invisible 2FA Status**: No indicator in admin UI showing which users have MFA enabled â€” compliance blind spot
- TOTP Secret in Plaintext**: Encryption key misconfigured, storing TOTP secrets unencrypted in database
## Skills
- Implement MFA/TOTP Two-Factor Authentication with Fortify


