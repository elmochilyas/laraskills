# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** Zero-downtime key rotation (Locksmith)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No Rotation Testing in Staging**: Production-only rotation with no staging validation â€” guaranteed data loss scenario
- [ ] Prevent anti-pattern: No Decryption Failure Monitoring**: After rotation, no alerts for `DecryptException` â€” silent data loss
- [ ] Prevent anti-pattern: Rotation Without Documentation**: Team knowledge is tribal â€” rotation steps exist only in one person's head
- [ ] All data successfully decrypted with new keys
- [ ] Old keys backed up securely before destruction
- [ ] Transition period maintained for data not yet re-encrypted
- [ ] Key rotation tested on staging before production
- [ ] No data loss after rotation verified
- [ ] Avoid: Mistake
- [ ] Avoid: No grace period
- [ ] Avoid: Too short grace period

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Install `brainlet-ali/laravel-locksmith` or implement custom key rotation service
- Dual-validity: store two keys (current and previous) with expiry for the previous
- Grace period: configurable per service (hours for regular rotation, minutes for emergency)
- Key pool: pre-generate N keys; rotate by activating the next key in sequence
- Rotation command: `php artisan locksmith:rotate <service>` â€” generates new key, starts grace period

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] All data successfully decrypted with new keys
- [ ] - [ ] Old keys backed up securely before destruction
- [ ] - [ ] Transition period maintained for data not yet re-encrypted
- [ ] - [ ] Key rotation tested on staging before production

# Performance Checklist
- Key validation: two lookups during grace period (old + new) â€” negligible overhead
- After grace period: single key lookup
- Key pools: pre-generation is done offline â€” no runtime impact

# Security Checklist
- **Grace Period Length**: Too long exposes the old key longer. Too short risks client disruption. Standard: 24 hours for regular, 1 hour for emergency.
- **Key Storage**: Rotated keys must be stored as securely as active keys (encrypted at rest, Vault, or environment-specific).
- **Compromise Response**: For key compromise, shorten grace period. Notify clients to update immediately.
- **Audit Trail**: Every rotation is a security event. Log with timestamp, initiator, service, and expected migration window.

# Reliability Checklist
- [ ] Ensure: API key rotation is the process of replacing an existing key with a new one with...

# Testing Checklist
- [ ] All data successfully decrypted with new keys
- [ ] Old keys backed up securely before destruction
- [ ] Transition period maintained for data not yet re-encrypted
- [ ] Key rotation tested on staging before production
- [ ] No data loss after rotation verified
- [ ] Avoid: Mistake
- [ ] Avoid: No grace period
- [ ] Avoid: Too short grace period

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Rotation Testing in Staging**: Production-only rotation with no staging validation â€” guaranteed data loss scenario
- [ ] Prevent: No Decryption Failure Monitoring**: After rotation, no alerts for `DecryptException` â€” silent data loss
- [ ] Prevent: Rotation Without Documentation**: Team knowledge is tribal â€” rotation steps exist only in one person's head
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: No grace period
- [ ] Avoid mistake: Too short grace period
- [ ] Avoid mistake: Not monitoring key usage
- [ ] Avoid mistake: Manual rotation

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
- No Rotation Testing in Staging**: Production-only rotation with no staging validation â€” guaranteed data loss scenario
- No Decryption Failure Monitoring**: After rotation, no alerts for `DecryptException` â€” silent data loss
- Rotation Without Documentation**: Team knowledge is tribal â€” rotation steps exist only in one person's head
## Skills
- Rotate Encryption Keys Without Data Loss


