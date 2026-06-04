# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Multi-Tenancy Security
**Knowledge Unit:** stancl/tenancy package architecture
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Storing tenant data in session**: stancl/tenancy manages tenant context â€” duplicating in session creates sync issues
- [ ] Prevent anti-pattern: Not testing cross-tenant queue isolation**: Queue tenant context is the most common failure mode â€” must be tested
- [ ] Prevent anti-pattern: Not configuring filesystem isolation**: Tenant A's uploaded files visible to Tenant B without separate storage roots
- [ ] Tenant resolution middleware registered (by domain/subdomain)
- [ ] Bootstrappers configured appropriately (not all by default)
- [ ] Queue tenant context serialization verified
- [ ] Cache isolation configured (prefix or tags)
- [ ] UUIDs used for tenant IDs
- [ ] Avoid: Mistake
- [ ] Avoid: Not configuring queue tenant context
- [ ] Avoid: Overloading bootstrappers

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Install: `composer require stancl/tenancy`
- Publish config: `php artisan tenancy:install`
- Configure middleware: add `InitializeTenancyByDomain` to global HTTP middleware
- Configure bootstrappers in `config/tenancy.php` â€” `bootstrappers` array
- Tenant model: `php artisan make:tenant` creates the App\Models\Tenant class
- Queue: jobs dispatched in tenant context automatically carry tenant ID

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Tenant resolution middleware registered (by domain/subdomain)
- [ ] - [ ] Bootstrappers configured appropriately (not all by default)
- [ ] - [ ] Queue tenant context serialization verified
- [ ] - [ ] Cache isolation configured (prefix or tags)

# Performance Checklist
- Tenant initialization: domain lookup + bootstrapper execution â€” ~5-20ms per request
- Cache bootstrapper: adds prefix to cache keys â€” negligible overhead
- Database bootstrapper: switches database connection â€” ~1ms
- Queue context serialization: tenant ID stored in job payload â€” no per-job overhead
- Use Redis data store for faster tenant resolution vs database store

# Security Checklist
- **Queue Context** : Jobs without tenant context may operate in the wrong tenant scope. Always verify.
- **Bootstrapper Security**: The `db` bootstrapper switch database connections. Misconfiguration can connect to the wrong database.
- **Overwriting Tenant Data**: Tenant migration commands run on tenant databases â€” ensure they only affect the intended tenant.
- **Cache Leak Prevention**: Without isolation, cached items from one tenant may be served to another. Use prefix or tags.

# Reliability Checklist
- [ ] Ensure: `stancl/tenancy` is the gold-standard multi-tenancy package for Laravel. It supp...

# Testing Checklist
- [ ] Tenant resolution middleware registered (by domain/subdomain)
- [ ] Bootstrappers configured appropriately (not all by default)
- [ ] Queue tenant context serialization verified
- [ ] Cache isolation configured (prefix or tags)
- [ ] UUIDs used for tenant IDs
- [ ] `tenants:migrate` configured for tenant database migrations
- [ ] Avoid: Mistake
- [ ] Avoid: Not configuring queue tenant context
- [ ] Avoid: Overloading bootstrappers

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Storing tenant data in session**: stancl/tenancy manages tenant context â€” duplicating in session creates sync issues
- [ ] Prevent: Not testing cross-tenant queue isolation**: Queue tenant context is the most common failure mode â€” must be tested
- [ ] Prevent: Not configuring filesystem isolation**: Tenant A's uploaded files visible to Tenant B without separate storage roots
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not configuring queue tenant context
- [ ] Avoid mistake: Overloading bootstrappers
- [ ] Avoid mistake: Missing cache isolation
- [ ] Avoid mistake: Using auto-increment tenant IDs

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
- Storing tenant data in session**: stancl/tenancy manages tenant context â€” duplicating in session creates sync issues
- Not testing cross-tenant queue isolation**: Queue tenant context is the most common failure mode â€” must be tested
- Not configuring filesystem isolation**: Tenant A's uploaded files visible to Tenant B without separate storage roots
## Skills
- Configure stancl/tenancy for Multi-Tenant Application Architecture


