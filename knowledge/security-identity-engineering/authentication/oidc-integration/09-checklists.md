# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** OIDC integration (jwks validation, nonce, discovery)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Missing Audience Validation**: Not checking `aud` claim against client ID, allowing cross-client token reuse
- [ ] Prevent anti-pattern: HTTP OIDC Flows**: Allowing non-HTTPS redirect URIs, exposing authorization codes in transit
- [ ] Prevent anti-pattern: Single-Contributor Package Dependency**: Using community OIDC drivers without fallback plan
- [ ] `id_token` signature validated using JWKS on every callback
- [ ] Nonce parameter generated and validated for replay protection
- [ ] JWKS cached with TTL aligned with IdP key rotation schedule
- [ ] `aud` claim validated against client ID
- [ ] Token `exp` claim checked before use
- [ ] Avoid: Mistake
- [ ] Avoid: Not validating id_token signature
- [ ] Avoid: Missing nonce validation

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Extend Socialite's OAuth2 provider for OIDC integration
- JWKS keys should be cached â€” they change infrequently (rotate ~monthly)
- Nonce generation: random string stored in session, validated on callback
- `scope` must include `openid` (add `profile`, `email` for additional claims)
- Configure a dedicated guard for OIDC-authenticated users if needed

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `id_token` signature validated using JWKS on every callback
- [ ] - [ ] Nonce parameter generated and validated for replay protection
- [ ] - [ ] JWKS cached with TTL aligned with IdP key rotation schedule
- [ ] - [ ] `aud` claim validated against client ID

# Performance Checklist
- JWKS retrieval: HTTP request to IdP on first authentication. Cache for 24 hours (or respect `Cache-Control` headers).
- `id_token` verification: local JWT signature verification using cached JWKS â€” <1ms.
- Token refresh: one HTTP request per refresh cycle.

# Security Checklist
- **Nonce Replay Prevention**: Without nonce validation, an attacker can reuse an intercepted `id_token` to authenticate.
- **JWKS Rotation**: IdPs rotate signing keys periodically. Cache expiry should be aligned with rotation frequency.
- **id_token `aud` Claim**: Validate that the `aud` (audience) claim matches your application's client ID.
- **HTTPS Required**: All OIDC communication must be over HTTPS. No exceptions.

# Reliability Checklist
- [ ] Ensure: OpenID Connect (OIDC) integration in Laravel is typically implemented via custom...

# Testing Checklist
- [ ] `id_token` signature validated using JWKS on every callback
- [ ] Nonce parameter generated and validated for replay protection
- [ ] JWKS cached with TTL aligned with IdP key rotation schedule
- [ ] `aud` claim validated against client ID
- [ ] Token `exp` claim checked before use
- [ ] Refresh token flow implemented (if available)
- [ ] Avoid: Mistake
- [ ] Avoid: Not validating id_token signature
- [ ] Avoid: Missing nonce validation

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Missing Audience Validation**: Not checking `aud` claim against client ID, allowing cross-client token reuse
- [ ] Prevent: HTTP OIDC Flows**: Allowing non-HTTPS redirect URIs, exposing authorization codes in transit
- [ ] Prevent: Single-Contributor Package Dependency**: Using community OIDC drivers without fallback plan
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not validating id_token signature
- [ ] Avoid mistake: Missing nonce validation
- [ ] Avoid mistake: Hardcoding endpoints
- [ ] Avoid mistake: Caching JWKS indefinitely

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
- Missing Audience Validation**: Not checking `aud` claim against client ID, allowing cross-client token reuse
- HTTP OIDC Flows**: Allowing non-HTTPS redirect URIs, exposing authorization codes in transit
- Single-Contributor Package Dependency**: Using community OIDC drivers without fallback plan
## Skills
- Integrate OpenID Connect (OIDC) for Enterprise Single Sign-On


