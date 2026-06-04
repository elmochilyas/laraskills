# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Passport vs Sanctum decision framework
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: "More Enterprise = Better" Fallacy**: Assuming Passport is more "enterprise-ready" than Sanctum regardless of requirements
- [ ] Prevent anti-pattern: Copy-Paste Decision**: Repeating the same auth package choice across projects without re-evaluating requirements
- [ ] Prevent anti-pattern: Hidden Passport Dependency**: Passport listed in composer.json but only Sanctum guards are active â€” unused infrastructure
- [ ] Sanctum chosen for first-party, Passport for third-party (or both with separate guards)
- [ ] No unnecessary dual setup (Passport added only if confirmed needed)
- [ ] Guard configuration matches selected packages
- [ ] SPA uses Sanctum cookie auth, not Bearer tokens
- [ ] Password Grant not used in either package
- [ ] Avoid: Mistake
- [ ] Avoid: Using Passport for first-party SPA
- [ ] Avoid: Using Sanctum for third-party OAuth

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Sanctum: single token table (`personal_access_tokens`), SHA-256 hashed tokens, ability-based scoping
- Passport: multiple tables (oauth_clients, oauth_access_tokens, oauth_refresh_tokens, oauth_auth_codes), RSA keys, full scopes
- Dual-guard: Sanctum guard for first-party API, Passport guard for third-party API
- Tradeoff: Sanctum cannot do delegated authorization; Passport adds client management, grants, scopes, and key infrastructure

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Sanctum chosen for first-party, Passport for third-party (or both with separate guards)
- [ ] - [ ] No unnecessary dual setup (Passport added only if confirmed needed)
- [ ] - [ ] Guard configuration matches selected packages
- [ ] - [ ] SPA uses Sanctum cookie auth, not Bearer tokens

# Performance Checklist
- Sanctum: SHA-256 hash lookup on each request. Minimal database overhead.
- Passport: JWT signature verification + token DB lookup. Slightly more overhead.
- Sanctum token creation is simpler (no authorization code flow).

# Security Checklist
- **Sanctum SPA Security**: Cookie-based session auth provides CSRF protection via `same_site` cookie and XSS mitigation (token not accessible to JS).
- **Sanctum Token Security**: Bearer tokens for mobile/third-party are hashed with SHA-256 â€” database compromise does not expose plaintext tokens.
- **Passport Security**: OAuth2 standards-compliance (PKCE for public clients, Client Credentials for M2M, token revocation).

# Reliability Checklist
- [ ] Ensure: The Sanctum vs Passport decision is the most critical authentication architectur...

# Testing Checklist
- [ ] Sanctum chosen for first-party, Passport for third-party (or both with separate guards)
- [ ] No unnecessary dual setup (Passport added only if confirmed needed)
- [ ] Guard configuration matches selected packages
- [ ] SPA uses Sanctum cookie auth, not Bearer tokens
- [ ] Password Grant not used in either package
- [ ] Avoid: Mistake
- [ ] Avoid: Using Passport for first-party SPA
- [ ] Avoid: Using Sanctum for third-party OAuth

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: "More Enterprise = Better" Fallacy**: Assuming Passport is more "enterprise-ready" than Sanctum regardless of requirements
- [ ] Prevent: Copy-Paste Decision**: Repeating the same auth package choice across projects without re-evaluating requirements
- [ ] Prevent: Hidden Passport Dependency**: Passport listed in composer.json but only Sanctum guards are active â€” unused infrastructure
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using Passport for first-party SPA
- [ ] Avoid mistake: Using Sanctum for third-party OAuth
- [ ] Avoid mistake: Setting up both unnecessarily
- [ ] Avoid mistake: Password Grant with Sanctum

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
- "More Enterprise = Better" Fallacy**: Assuming Passport is more "enterprise-ready" than Sanctum regardless of requirements
- Copy-Paste Decision**: Repeating the same auth package choice across projects without re-evaluating requirements
- Hidden Passport Dependency**: Passport listed in composer.json but only Sanctum guards are active â€” unused infrastructure
## Skills
- Select Between Sanctum and Passport for API Authentication


