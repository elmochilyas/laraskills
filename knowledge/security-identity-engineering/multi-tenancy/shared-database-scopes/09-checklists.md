# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Multi-Tenancy Security
**Knowledge Unit:** Shared-database multi-tenancy with global scopes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Queue jobs without tenant context**: Forgetting to restore tenant context in queue workers is the most common cross-tenant leak
- [ ] Prevent anti-pattern: Not using BelongsToTenant trait**: Relying on individual model configuration instead of a reusable trait
- [ ] Prevent anti-pattern: Missing tenant_id foreign keys**: Tenant-scoped tables without FK constraints to the tenants table
- [ ] `tenant_id` column on all tenant-scoped tables
- [ ] Global scope applied to all tenant models
- [ ] `tenant_id` auto-set on model creation
- [ ] `withoutGlobalScope()` usage documented and audited
- [ ] Tenant isolation tested with automated tests
- [ ] Avoid: Mistake
- [ ] Avoid: Not using global scopes
- [ ] Avoid: Not including tenant_id in unique indexes

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- `BelongsToTenant` trait: adds global scope, auto-fills `tenant_id` on create
- Tenant resolution: middleware checks subdomain, authenticated user's tenant, or header
- Queue jobs: include `$tenantId` property; call `tenancy()->initialize($this->tenantId)` in `handle()`
- Admin bypass: `Model::withoutGlobalScopes()` for admin tools â€” minimal and audited usage
- Foreign keys: use `tenant_id` as FK in all tenant-scoped tables

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `tenant_id` column on all tenant-scoped tables
- [ ] - [ ] Global scope applied to all tenant models
- [ ] - [ ] `tenant_id` auto-set on model creation
- [ ] - [ ] `withoutGlobalScope()` usage documented and audited

# Performance Checklist
- Global scope adds `WHERE tenant_id = ?` to every query â€” negligible with index
- `tenant_id` index is essential on every tenant-scoped table
- Shared table means all tenants' data in one table â€” partition by `tenant_id` for large datasets
- Composite indexes must include `tenant_id` as the first column for query efficiency

# Security Checklist
- **Scope Bypass**: `withoutGlobalScopes()` and raw DB queries bypass Eloquent scoping. Audit all uses.
- **Cross-Tenant Leak**: Missing `tenant_id` in a query returns ALL tenants' data â€” a data leak.
- **Queue Jobs**: Forgetting to restore tenant context in queue jobs is the most common cross-tenant leak.
- **Admin Tools**: Admin user switching tenants must set the correct tenant context, not use the admin's own tenant.

# Reliability Checklist
- [ ] Ensure: Shared database multi-tenancy uses a single database with a `tenant_id` column o...

# Testing Checklist
- [ ] `tenant_id` column on all tenant-scoped tables
- [ ] Global scope applied to all tenant models
- [ ] `tenant_id` auto-set on model creation
- [ ] `withoutGlobalScope()` usage documented and audited
- [ ] Tenant isolation tested with automated tests
- [ ] Index on `tenant_id` for query performance
- [ ] Avoid: Mistake
- [ ] Avoid: Not using global scopes
- [ ] Avoid: Not including tenant_id in unique indexes

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Queue jobs without tenant context**: Forgetting to restore tenant context in queue workers is the most common cross-tenant leak
- [ ] Prevent: Not using BelongsToTenant trait**: Relying on individual model configuration instead of a reusable trait
- [ ] Prevent: Missing tenant_id foreign keys**: Tenant-scoped tables without FK constraints to the tenants table
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not using global scopes
- [ ] Avoid mistake: Not including tenant_id in unique indexes
- [ ] Avoid mistake: Forgetting tenant context in queue jobs
- [ ] Avoid mistake: Using auto-increment IDs

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
- Queue jobs without tenant context**: Forgetting to restore tenant context in queue workers is the most common cross-tenant leak
- Not using BelongsToTenant trait**: Relying on individual model configuration instead of a reusable trait
- Missing tenant_id foreign keys**: Tenant-scoped tables without FK constraints to the tenants table
## Skills
- Implement Shared-Database Multi-Tenancy with Global Scopes


