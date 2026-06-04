# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Passport OAuth2 server (grants, scopes, keys)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Passport for First-Party Auth**: Using Passport's OAuth2 flow when Sanctum would suffice â€” unnecessary complexity
- [ ] Prevent anti-pattern: Missing PKCE for Public Clients**: Allowing authorization code flow without PKCE for SPAs and mobile apps
- [ ] Prevent anti-pattern: Long-Lived Access Tokens**: Setting access token expiry to days or weeks instead of minutes
- [ ] RSA keys generated and permissions set to 600, stored outside web root
- [ ] Private key NOT in version control
- [ ] PKCE required for all public clients
- [ ] Password Grant disabled
- [ ] Scopes are granular (e.g., `read-orders`, not `admin`)
- [ ] Avoid: Mistake
- [ ] Avoid: Using Password Grant in production
- [ ] Avoid: Not securing the private key

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Passport routes mounted via `Passport::routes()` in your service provider
- Token scopes defined in `Passport::tokensCan()` â€” register all available scopes
- Token validation middleware: `CheckScopes`, `CheckForAnyScope`
- Revoked tokens checked automatically on each request â€” no additional setup needed
- Headless since Laravel 13.x â€” client management UI must be implemented separately
- Separate token database tables from user tables (no schema conflicts)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] RSA keys generated and permissions set to 600, stored outside web root
- [ ] - [ ] Private key NOT in version control
- [ ] - [ ] PKCE required for all public clients
- [ ] - [ ] Password Grant disabled

# Performance Checklist
- RSA signature verification on every authenticated request (~0.1-0.5ms)
- Token database queries: scope lookup, token revocation check, client lookup
- Token introspection: Passport checks token existence and revocation status on each request
- Token pruning: schedule `passport:purge` for expired tokens to prevent table bloat

# Security Checklist
- **Private Key Protection**: The OAuth2 private key is the root of trust. Store securely, restrict file permissions, rotate on compromise.
- **Client Secret Exposure**: Server-side clients must keep secrets confidential. Public clients (SPAs) cannot â€” use PKCE instead.
- **CSRF for Authorization**: Authorization Code grant without PKCE is vulnerable to authorization code interception.
- **Token Revocation**: Revoke tokens on security events (password change, logout from all devices).
- **Scope Validation**: Always validate that requested scopes are valid and authorized by the resource owner.

# Reliability Checklist
- [ ] Ensure: Laravel Passport is a full OAuth2 server implementation built on `league/oauth2-...

# Testing Checklist
- [ ] RSA keys generated and permissions set to 600, stored outside web root
- [ ] Private key NOT in version control
- [ ] PKCE required for all public clients
- [ ] Password Grant disabled
- [ ] Scopes are granular (e.g., `read-orders`, not `admin`)
- [ ] Token pruning scheduled in Kernel
- [ ] Avoid: Mistake
- [ ] Avoid: Using Password Grant in production
- [ ] Avoid: Not securing the private key

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Passport for First-Party Auth**: Using Passport's OAuth2 flow when Sanctum would suffice â€” unnecessary complexity
- [ ] Prevent: Missing PKCE for Public Clients**: Allowing authorization code flow without PKCE for SPAs and mobile apps
- [ ] Prevent: Long-Lived Access Tokens**: Setting access token expiry to days or weeks instead of minutes
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using Password Grant in production
- [ ] Avoid mistake: Not securing the private key
- [ ] Avoid mistake: Overly broad scopes
- [ ] Avoid mistake: Not pruning expired tokens

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
- Passport for First-Party Auth**: Using Passport's OAuth2 flow when Sanctum would suffice â€” unnecessary complexity
- Missing PKCE for Public Clients**: Allowing authorization code flow without PKCE for SPAs and mobile apps
- Long-Lived Access Tokens**: Setting access token expiry to days or weeks instead of minutes
## Skills
- Configure Passport OAuth2 Server for Delegated Authorization


