# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Spatie Passkeys Livewire components
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Manual WebAuthn Ceremony Implementation**: Writing raw WebAuthn browser API calls when Spatie handles them
- [ ] Prevent anti-pattern: Passkey Registration Without User Education**: Adding passkey support without explaining to users what passkeys are
- [ ] Prevent anti-pattern: Overriding Spatie Backend Logic**: Reimplementing passkey storage and verification instead of using Spatie's provided backend
- [ ] `spatie/laravel-passkeys` installed and configured
- [ ] RP name, ID, and origin configured correctly
- [ ] HTTPS enabled in all environments
- [ ] Livewire components published and customized
- [ ] Password fallback authentication maintained
- [ ] Avoid: Mistake
- [ ] Avoid: Making passkeys the only auth method
- [ ] Avoid: Not configuring HTTPS

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Install `spatie/laravel-passkeys` via Composer
- Publish config and migrations: `php artisan vendor:publish --tag=passkeys-config --tag=passkeys-migrations`
- Publish Livewire components for customization: `php artisan vendor:publish --tag=passkeys-views`
- Configure `config/passkeys.php` with RP name, ID, and origin
- Use the provided Livewire components in auth views

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `spatie/laravel-passkeys` installed and configured
- [ ] - [ ] RP name, ID, and origin configured correctly
- [ ] - [ ] HTTPS enabled in all environments
- [ ] - [ ] Livewire components published and customized

# Performance Checklist
- WebAuthn ceremonies are fast (~500ms for biometric verification)
- Public key storage is minimal (~100-200 bytes per key)
- No server-side hashing (public key cryptography replaces passwords)

# Security Checklist
- **Phishing Resistance**: Passkeys are scoped to the RP domain â€” cannot be phished.
- **Device-Bound**: Private key never leaves the user's device.
- **Production-Tested**: Spatie's package powers Mailcoach â€” battle-tested for production use.
- **Pre-1.0 First-Party Alternative**: Spatie's package is more mature than `laravel/passkeys` (v0.2.x) as of 2026.

# Reliability Checklist
- [ ] Ensure: `spatie/laravel-passkeys` provides WebAuthn passkey authentication with pre-buil...

# Testing Checklist
- [ ] `spatie/laravel-passkeys` installed and configured
- [ ] RP name, ID, and origin configured correctly
- [ ] HTTPS enabled in all environments
- [ ] Livewire components published and customized
- [ ] Password fallback authentication maintained
- [ ] User verification set to `required` for production
- [ ] Avoid: Mistake
- [ ] Avoid: Making passkeys the only auth method
- [ ] Avoid: Not configuring HTTPS

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Manual WebAuthn Ceremony Implementation**: Writing raw WebAuthn browser API calls when Spatie handles them
- [ ] Prevent: Passkey Registration Without User Education**: Adding passkey support without explaining to users what passkeys are
- [ ] Prevent: Overriding Spatie Backend Logic**: Reimplementing passkey storage and verification instead of using Spatie's provided backend
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Making passkeys the only auth method
- [ ] Avoid mistake: Not configuring HTTPS
- [ ] Avoid mistake: Not publishing views
- [ ] Avoid mistake: Misconfiguring RP origin

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
- Manual WebAuthn Ceremony Implementation**: Writing raw WebAuthn browser API calls when Spatie handles them
- Passkey Registration Without User Education**: Adding passkey support without explaining to users what passkeys are
- Overriding Spatie Backend Logic**: Reimplementing passkey storage and verification instead of using Spatie's provided backend
## Skills
- Configure Spatie Passkeys/WebAuthn for Livewire-Based Passwordless Auth


