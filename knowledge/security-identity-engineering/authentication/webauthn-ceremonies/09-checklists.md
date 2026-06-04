# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** WebAuthn ceremonies (attestation, assertion)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Attestation Overuse in Consumer Apps**: Requiring attestation verification (`direct`) for consumer applications where it adds privacy concerns and ceremony failures
- [ ] Prevent anti-pattern: Missing Origin Validation**: Not validating the WebAuthn origin against the configured RP origin during ceremonies
- [ ] Prevent anti-pattern: Private Key on Server Side**: Attempting to store or handle the WebAuthn private key server-side
- [ ] Unique random challenge generated per ceremony
- [ ] Challenge has short TTL (5 minutes max)
- [ ] Attestation origin validated against RP origin
- [ ] Assertion signature verified with stored public key
- [ ] Sign count tracked and compared for clone detection
- [ ] Avoid: Mistake
- [ ] Avoid: Implementing ceremonies manually
- [ ] Avoid: Reusing challenges

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Attestation flow: Server generates challenge â†’ browser calls `navigator.credentials.create()` â†’ returns `PublicKeyCredential` â†’ server validates and stores credential
- Assertion flow: Server generates challenge â†’ browser calls `navigator.credentials.get()` â†’ returns `AuthenticationResponse` â†’ server verifies with stored public key
- Credential storage: `credential_id`, `public_key`, `counter`, `user_id`, `transports`
- Challenge storage: challenge â†’ user association, expiry (5 minutes), single-use

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Unique random challenge generated per ceremony
- [ ] - [ ] Challenge has short TTL (5 minutes max)
- [ ] - [ ] Attestation origin validated against RP origin
- [ ] - [ ] Assertion signature verified with stored public key

# Performance Checklist
- Key generation: <1 second on modern devices (TPM/secure enclave)
- Signature verification: ~1-5ms server-side using stored public key
- Challenge storage: minimal overhead (session or temporary cache entry)

# Security Checklist
- **Challenge Must Be Random**: Use `random_bytes(32)` â€” never reuse or predict challenges.
- **Challenge Expiry**: Challenges should expire (5 minutes recommended). Prevents replay of captured challenges.
- **Counter Monitoring** : If `signCount` decreases, the authenticator may be cloned â€” force re-registration.
- **User Verification**: `required` is recommended for production. `discouraged` reduces security to device-presence only.
- **Attestation Verification** (enterprise): Verify the `aaguid` against a list of trusted authenticator models.

# Reliability Checklist
- [ ] Ensure: WebAuthn (Web Authentication) is a W3C standard for passwordless authentication ...

# Testing Checklist
- [ ] Unique random challenge generated per ceremony
- [ ] Challenge has short TTL (5 minutes max)
- [ ] Attestation origin validated against RP origin
- [ ] Assertion signature verified with stored public key
- [ ] Sign count tracked and compared for clone detection
- [ ] Credential ID and public key stored securely in database
- [ ] Avoid: Mistake
- [ ] Avoid: Implementing ceremonies manually
- [ ] Avoid: Reusing challenges

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Attestation Overuse in Consumer Apps**: Requiring attestation verification (`direct`) for consumer applications where it adds privacy concerns and ceremony failures
- [ ] Prevent: Missing Origin Validation**: Not validating the WebAuthn origin against the configured RP origin during ceremonies
- [ ] Prevent: Private Key on Server Side**: Attempting to store or handle the WebAuthn private key server-side
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Implementing ceremonies manually
- [ ] Avoid mistake: Reusing challenges
- [ ] Avoid mistake: Not setting challenge expiry
- [ ] Avoid mistake: Ignoring counter value

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
- Attestation Overuse in Consumer Apps**: Requiring attestation verification (`direct`) for consumer applications where it adds privacy concerns and ceremony failures
- Missing Origin Validation**: Not validating the WebAuthn origin against the configured RP origin during ceremonies
- Private Key on Server Side**: Attempting to store or handle the WebAuthn private key server-side
## Skills
- Implement WebAuthn Ceremonies for Passwordless Authentication


