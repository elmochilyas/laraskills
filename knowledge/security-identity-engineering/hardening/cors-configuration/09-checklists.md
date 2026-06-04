# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** CORS configuration for cross-origin requests
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: CORS on All Routes**: CORS middleware applied to internal-only routes
- [ ] Prevent anti-pattern: No CORS at All for Public API**: Public APIs block all cross-origin browser requests
- [ ] Prevent anti-pattern: Mixed CORS Config**: Some endpoints use credentials, others don't â€” inconsistent
- [ ] `allowed_origins` contains only known frontend domains
- [ ] `supports_credentials: true` when using Sanctum SPA auth
- [ ] `allowed_origins` is `['*']` only for public APIs without credentials
- [ ] CORS preflight responses include correct headers
- [ ] Sanctum stateful domains match CORS allowed origins
- [ ] Avoid: Mistake
- [ ] Avoid: `allowed_origins: ['*']` with credentials
- [ ] Avoid: Missing Sanctum stateful domains

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- CORS config in `config/cors.php` (Laravel 9+) or via middleware
- `allowed_origins`: specific domains for production, `*` for development (if acceptable risk)
- `supports_credentials`: `true` if using Sanctum cookie auth, `false` for public API
- Preflight cache: set `max_age` to 86400 (24 hours) for repeated requests
- Exclude CORS middleware from routes that don't need it (CLI commands, queue workers)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `allowed_origins` contains only known frontend domains
- [ ] - [ ] `supports_credentials: true` when using Sanctum SPA auth
- [ ] - [ ] `allowed_origins` is `['*']` only for public APIs without credentials
- [ ] - [ ] CORS preflight responses include correct headers

# Performance Checklist
- CORS headers are set on every response â€” negligible overhead
- Preflight (OPTIONS) requests: one request per distinct method/header combination. Cached via `Access-Control-Max-Age`.
- No database impact â€” purely HTTP header manipulation

# Security Checklist
- **`allowed_origins: ['*']`**: Any website can make browser-based requests to your API. Acceptable for public APIs, but never pair with credentials.
- **Credentials Restriction**: With `supports_credentials = true`, `allowed_origins` must not be `*`. Browser requirement.
- **Overly Permissive Methods**: Only allow methods your application actually needs. `DELETE` on a read-only API is unnecessary.
- **Exposed Headers**: Only expose headers that clients need access to (`Authorization`, `X-Request-ID`, etc.).

# Reliability Checklist
- [ ] Ensure: CORS (Cross-Origin Resource Sharing) controls which origins can access your appl...

# Testing Checklist
- [ ] `allowed_origins` contains only known frontend domains
- [ ] `supports_credentials: true` when using Sanctum SPA auth
- [ ] `allowed_origins` is `['*']` only for public APIs without credentials
- [ ] CORS preflight responses include correct headers
- [ ] Sanctum stateful domains match CORS allowed origins
- [ ] Tested with actual browser client
- [ ] Avoid: Mistake
- [ ] Avoid: `allowed_origins: ['*']` with credentials
- [ ] Avoid: Missing Sanctum stateful domains

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: CORS on All Routes**: CORS middleware applied to internal-only routes
- [ ] Prevent: No CORS at All for Public API**: Public APIs block all cross-origin browser requests
- [ ] Prevent: Mixed CORS Config**: Some endpoints use credentials, others don't â€” inconsistent
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: `allowed_origins: ['*']` with credentials
- [ ] Avoid mistake: Missing Sanctum stateful domains
- [ ] Avoid mistake: Too many allowed origins
- [ ] Avoid mistake: Allowing all methods

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
- CORS on All Routes**: CORS middleware applied to internal-only routes
- No CORS at All for Public API**: Public APIs block all cross-origin browser requests
- Mixed CORS Config**: Some endpoints use credentials, others don't â€” inconsistent
## Skills
- Configure CORS for Cross-Origin API Access


