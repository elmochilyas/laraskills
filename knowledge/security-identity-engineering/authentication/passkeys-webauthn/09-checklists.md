# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** First-party Passkeys/WebAuthn (laravel/passkeys)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Private Key Transmission**: Accidentally sending private key material to the server, defeating WebAuthn's security model
- [ ] Prevent anti-pattern: Missing Browser Compatibility Testing**: Only testing in Chrome while Firefox and Safari have different WebAuthn behaviors
- [ ] Prevent anti-pattern: No Credential Counter Monitoring**: Ignoring the assertion counter that detects cloned authenticators
- [ ] `laravel/passkeys` exact version pinned in `composer.json`
- [ ] `@laravel/passkeys` npm package installed
- [ ] RP ID configured as domain only (no port, no path)
- [ ] RP origin configured as full HTTPS URL
- [ ] HTTPS enabled in all environments
- [ ] Avoid: Mistake
- [ ] Avoid: Using passkeys as the only auth method
- [ ] Avoid: Not pinning laravel/passkeys version

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Server-side: `laravel/passkeys` package provides routes, controllers, and credential storage
- Client-side: `@laravel/passkeys` npm package provides browser ceremony handlers
- RP configuration: `rp.name` (your app name), `rp.id` (your domain â€” no port/subdirectory), `origin` (full HTTPS origin)
- Credential storage: public key, credential ID, counter, and user association in `passkeys` table
- User verification: `required` (PIN/biometric) vs `preferred` vs `discouraged`

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `laravel/passkeys` exact version pinned in `composer.json`
- [ ] - [ ] `@laravel/passkeys` npm package installed
- [ ] - [ ] RP ID configured as domain only (no port, no path)
- [ ] - [ ] RP origin configured as full HTTPS URL

# Performance Checklist
- WebAuthn ceremonies are fast (~500ms for biometric verification on modern devices)
- Credential storage: public keys are small (~100-200 bytes each)
- No server-side hashing overhead (public key cryptography replaces password hashing)

# Security Checklist
- **Phishing Resistance**: Passkeys are scoped to the RP domain â€” cannot be phished on a fake domain.
- **Device-Bound Security**: Private key never leaves the user's device â€” no server-side secret storage.
- **Pre-1.0 Maturity**: API may change in non-backward-compatible ways. Pin versions and test upgrades.
- **Backup/Fallback**: Passkeys sync across devices via iCloud Keychain, Google Password Manager, etc. (platform-dependent).

# Reliability Checklist
- [ ] Ensure: First-party `laravel/passkeys` (April 2026) provides WebAuthn passkey authentica...

# Testing Checklist
- [ ] `laravel/passkeys` exact version pinned in `composer.json`
- [ ] `@laravel/passkeys` npm package installed
- [ ] RP ID configured as domain only (no port, no path)
- [ ] RP origin configured as full HTTPS URL
- [ ] HTTPS enabled in all environments
- [ ] Password fallback authentication available
- [ ] Avoid: Mistake
- [ ] Avoid: Using passkeys as the only auth method
- [ ] Avoid: Not pinning laravel/passkeys version

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Private Key Transmission**: Accidentally sending private key material to the server, defeating WebAuthn's security model
- [ ] Prevent: Missing Browser Compatibility Testing**: Only testing in Chrome while Firefox and Safari have different WebAuthn behaviors
- [ ] Prevent: No Credential Counter Monitoring**: Ignoring the assertion counter that detects cloned authenticators
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using passkeys as the only auth method
- [ ] Avoid mistake: Not pinning laravel/passkeys version
- [ ] Avoid mistake: Misconfiguring RP ID
- [ ] Avoid mistake: Ignoring HTTP security context

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
- Private Key Transmission**: Accidentally sending private key material to the server, defeating WebAuthn's security model
- Missing Browser Compatibility Testing**: Only testing in Chrome while Firefox and Safari have different WebAuthn behaviors
- No Credential Counter Monitoring**: Ignoring the assertion counter that detects cloned authenticators
## Skills
- Implement First-Party Passkeys/WebAuthn Passwordless Authentication


