# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Shared Security Concerns
**Knowledge Unit:** Laravel Jetstream (Fortify + Sanctum - legacy context)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Customizing Jetstream for tenant isolation**: Teams are collaborative groups, not tenant boundaries.
- [ ] Prevent anti-pattern: Staying on Jetstream indefinitely**: Deprecated package with no future updates.
- [ ] Prevent anti-pattern: Rewriting Fortify actions during migration**: Actions transfer directly to Starter Kits.
- [ ] Jetstream installed with chosen stack
- [ ] Auth routes work (login, register, password reset)
- [ ] 2FA setup and verification functional
- [ ] API token generation and management works
- [ ] Team management features functional (if enabled)
- [ ] Avoid: Mistake
- [ ] Avoid: Using Jetstream for new projects
- [ ] Avoid: Expecting Jetstream features in Starter Kits

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Jetstream demonstrated the canonical Fortify + Sanctum stack that Starter Kits now provide without the teams overhead
- Teams management in Jetstream was an opinionated implementation â€” not a multi-tenancy solution
- API token management UI was built on Sanctum's `HasApiTokens` trait â€” reusable pattern for custom implementations

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Jetstream installed with chosen stack
- [ ] - [ ] Auth routes work (login, register, password reset)
- [ ] - [ ] 2FA setup and verification functional
- [ ] - [ ] API token generation and management works

# Performance Checklist
- Jetstream's teams feature added database queries for membership checks on every request
- Starter Kits have no teams overhead â€” faster baseline performance
- API token management UI can add database load if not cached

# Security Checklist
- Jetstream's teams roles (owner, admin, editor, viewer) are not suitable for multi-tenant isolation â€” they are collaborative groups, not tenant isolation
- Two-factor authentication via Fortify is still the recommended approach in current Starter Kits
- Email verification is enabled by default in both Jetstream and Starter Kits

# Reliability Checklist
- [ ] Ensure: Laravel Jetstream was a feature-rich application starter kit built on Fortify (b...

# Testing Checklist
- [ ] Jetstream installed with chosen stack
- [ ] Auth routes work (login, register, password reset)
- [ ] 2FA setup and verification functional
- [ ] API token generation and management works
- [ ] Team management features functional (if enabled)
- [ ] Email verification configured (if enabled)
- [ ] Avoid: Mistake
- [ ] Avoid: Using Jetstream for new projects
- [ ] Avoid: Expecting Jetstream features in Starter Kits

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Customizing Jetstream for tenant isolation**: Teams are collaborative groups, not tenant boundaries.
- [ ] Prevent: Staying on Jetstream indefinitely**: Deprecated package with no future updates.
- [ ] Prevent: Rewriting Fortify actions during migration**: Actions transfer directly to Starter Kits.
- [ ] Prevent: Expecting Starter Kits to have teams/API token UI**: These features are not included.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using Jetstream for new projects
- [ ] Avoid mistake: Expecting Jetstream features in Starter Kits
- [ ] Avoid mistake: Confusing Jetstream teams with multi-tenancy

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
- Customizing Jetstream for tenant isolation**: Teams are collaborative groups, not tenant boundaries.
- Staying on Jetstream indefinitely**: Deprecated package with no future updates.
- Rewriting Fortify actions during migration**: Actions transfer directly to Starter Kits.
- Expecting Starter Kits to have teams/API token UI**: These features are not included.
## Skills
- Deploy Laravel Jetstream with Fortify and Sanctum Integration


