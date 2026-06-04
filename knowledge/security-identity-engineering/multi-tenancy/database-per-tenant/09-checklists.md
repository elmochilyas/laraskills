# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Multi-Tenancy Security
**Knowledge Unit:** Database-per-tenant isolation pattern
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No connection pooling**: Dynamic connections without pooling degrade performance
- [ ] Prevent anti-pattern: Sequential migration fan-out on 1000+ tenants**: Must use batch parallelism to avoid downtime
- [ ] Prevent anti-pattern: Not encrypting tenant database credentials**: Tenant connection strings stored in plaintext
- [ ] Each tenant automatically gets a dedicated database on creation
- [ ] Tenant migrations run automatically on database creation
- [ ] Database connection switches correctly per tenant request
- [ ] Cross-tenant data access impossible at database level
- [ ] Tenant database backups configured independently
- [ ] Avoid: Mistake
- [ ] Avoid: Starting with per-tenant DB prematurely
- [ ] Avoid: Not automating migration fan-out

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Dynamic connection: resolve tenant â†’ get database name â†’ create connection at runtime
- Migration strategy: central migration command iterates tenants, runs migrations on each
- Tenant creation: Artisan command creates database, runs migrations, seeds initial data
- Connection config: store tenant database credentials in tenant record (encrypted) or derive from tenant ID
- Admin tools: admin connects to each tenant DB individually for data investigation

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Each tenant automatically gets a dedicated database on creation
- [ ] - [ ] Tenant migrations run automatically on database creation
- [ ] - [ ] Database connection switches correctly per tenant request
- [ ] - [ ] Cross-tenant data access impossible at database level

# Performance Checklist
- No cross-tenant query interference â€” each tenant has dedicated database resources
- Connection overhead: dynamic connection resolution adds ~5-10ms per request
- Connection pooling: use persistent connections to avoid repeated connection setup
- Migration fan-out: 1,000 tenants = 1,000 migration runs â€” sequential for consistency, limit parallelism

# Security Checklist
- **Strong Isolation**: Database-level separation means a SQL injection in tenant A's context cannot affect tenant B's data.
- **Connection String Security**: Tenant database credentials must be encrypted at rest and decrypted in memory only when needed.
- **Backup Security**: Tenant database backups must be isolated per tenant â€” no cross-tenant backup access.
- **Audit Isolation**: Audit logs must be per-tenant or include `tenant_id` for cross-database tracing.

# Reliability Checklist
- [ ] Ensure: The database-per-tenant pattern provides the strongest data isolation by giving ...

# Testing Checklist
- [ ] Each tenant automatically gets a dedicated database on creation
- [ ] Tenant migrations run automatically on database creation
- [ ] Database connection switches correctly per tenant request
- [ ] Cross-tenant data access impossible at database level
- [ ] Tenant database backups configured independently
- [ ] Connection pool monitoring in place for scaling
- [ ] Avoid: Mistake
- [ ] Avoid: Starting with per-tenant DB prematurely
- [ ] Avoid: Not automating migration fan-out

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No connection pooling**: Dynamic connections without pooling degrade performance
- [ ] Prevent: Sequential migration fan-out on 1000+ tenants**: Must use batch parallelism to avoid downtime
- [ ] Prevent: Not encrypting tenant database credentials**: Tenant connection strings stored in plaintext
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Starting with per-tenant DB prematurely
- [ ] Avoid mistake: Not automating migration fan-out
- [ ] Avoid mistake: Static database connections
- [ ] Avoid mistake: No connection pooling

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
- No connection pooling**: Dynamic connections without pooling degrade performance
- Sequential migration fan-out on 1000+ tenants**: Must use batch parallelism to avoid downtime
- Not encrypting tenant database credentials**: Tenant connection strings stored in plaintext
## Skills
- Implement Database-Per-Tenant Isolation Strategy


