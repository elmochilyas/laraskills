# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Audit & Logging
**Knowledge Unit:** Multi-tenant audit logging
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Admin tools using unscoped queries**: Admin tools querying all tenants' logs without explicit tenant filter â€” data leak
- [ ] Prevent anti-pattern: No monitoring for null tenant_id**: Missing tenant context goes undetected, hiding potential cross-tenant leaks
- [ ] Prevent anti-pattern: Cross-tenant retention cleanup bugs**: Retention deletion jobs deleting wrong tenant's logs due to missing tenant_id filter
- [ ] `tenant_id` attached to every tenant-scoped log entry
- [ ] Activity queries scoped to current tenant
- [ ] Tenant admin UI only shows own tenant's logs
- [ ] Queue jobs restore tenant context before logging
- [ ] Retention policies configurable per tenant
- [ ] Avoid: Mistake
- [ ] Avoid: Not including tenant_id in log queries
- [ ] Avoid: Forgetting tenant context in queue jobs

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Add `tenant_id` column to the `activity_log` migration. Index it.
- Global scope for safety (prevent leaks). Explicit `where` for performance-critical queries.
- Shared table with `tenant_id` for 99% of apps. Per-tenant table only when regulatory requirements demand full separation.
- Batch tenants by `retention_days` for retention cleanup, not individually.
- Admin tenant switching tool sets the "impersonated tenant" context, not the admin's own tenant.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `tenant_id` attached to every tenant-scoped log entry
- [ ] - [ ] Activity queries scoped to current tenant
- [ ] - [ ] Tenant admin UI only shows own tenant's logs
- [ ] - [ ] Queue jobs restore tenant context before logging

# Performance Checklist
- `tenant_id` index on activity log table is essential â€” all queries filter by tenant
- Global scope adds `WHERE tenant_id = ?` to every query â€” no significant overhead with proper indexing
- Per-tenant retention: batch by retention_days group, not individual tenant queries

# Security Checklist
- **Missing Tenant ID = Data Leak**: Log entry with `tenant_id = NULL` is invisible to all tenant views â€” or visible to all, depending on query scoping. Either way, a security gap.
- **Queue Context**: Every queue job must include and restore `tenant_id`. Missing context logs to wrong (or null) tenant.
- **Admin Queries**: Admin tools must use tenant-scoped queries. Unscoped queries return all tenants' logs â€” a data leak.
- **Cross-tenant Retention Bug**: A bug in retention job could delete Tenant A's logs instead of Tenant B's. Always use explicit `tenant_id` in retention queries.

# Reliability Checklist
- [ ] Ensure: Multi-tenant audit logging ensures that log entries are isolated per tenant, sco...

# Testing Checklist
- [ ] `tenant_id` attached to every tenant-scoped log entry
- [ ] Activity queries scoped to current tenant
- [ ] Tenant admin UI only shows own tenant's logs
- [ ] Queue jobs restore tenant context before logging
- [ ] Retention policies configurable per tenant
- [ ] Cross-tenant data leakage tested in CI
- [ ] Avoid: Mistake
- [ ] Avoid: Not including tenant_id in log queries
- [ ] Avoid: Forgetting tenant context in queue jobs

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Admin tools using unscoped queries**: Admin tools querying all tenants' logs without explicit tenant filter â€” data leak
- [ ] Prevent: No monitoring for null tenant_id**: Missing tenant context goes undetected, hiding potential cross-tenant leaks
- [ ] Prevent: Cross-tenant retention cleanup bugs**: Retention deletion jobs deleting wrong tenant's logs due to missing tenant_id filter
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not including tenant_id in log queries
- [ ] Avoid mistake: Forgetting tenant context in queue jobs
- [ ] Avoid mistake: Same retention for all tenants
- [ ] Avoid mistake: Not indexing tenant_id

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
- Admin tools using unscoped queries**: Admin tools querying all tenants' logs without explicit tenant filter â€” data leak
- No monitoring for null tenant_id**: Missing tenant context goes undetected, hiding potential cross-tenant leaks
- Cross-tenant retention cleanup bugs**: Retention deletion jobs deleting wrong tenant's logs due to missing tenant_id filter
## Skills
- Implement Multi-Tenant Audit Logging with Tenant Isolation


