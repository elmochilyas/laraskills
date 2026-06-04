# Skill: Implement Database-Per-Tenant Isolation Strategy

## Purpose
Configure a database-per-tenant multi-tenancy architecture where each tenant has its own database for maximum data isolation, using `stancl/tenancy` for automated database creation, migrations, and connection switching.

## When To Use
- Compliance requiring physical data separation (HIPAA, PCI DSS, financial data)
- Tenants with large, incompatible datasets
- Premium/enterprise tier requiring dedicated database resources
- Applications where tenant data must never coexist in shared tables

## When NOT To Use
- Shared-database approach is sufficient (simpler, lower cost)
- Applications with thousands of small tenants (database overhead too high)
- When database connection limits become a bottleneck

## Prerequisites
- `stancl/tenancy` installed (handles per-tenant database management)
- Database server supporting multiple databases (MySQL, PostgreSQL)
- Sufficient database connection capacity

## Workflow
1. Configure `stancl/tenancy` with database-per-tenant strategy
2. Define tenant database name convention: `tenant_{tenant_id}`
3. Implement tenant `created` event to create database and run migrations
4. Use `Tenant::run()` for per-tenant operations: `$tenant->run(fn () => Artisan::call('migrate'))`
5. Configure `database` bootstrapper to switch connection per tenant
6. Use `tenants:migrate` for bulk migration across all tenants
7. Implement tenant database backup strategy (per-tenant snapshots)
8. Monitor database connection pool usage as tenant count grows

## Validation Checklist
- [ ] Each tenant automatically gets a dedicated database on creation
- [ ] Tenant migrations run automatically on database creation
- [ ] Database connection switches correctly per tenant request
- [ ] Cross-tenant data access impossible at database level
- [ ] Tenant database backups configured independently
- [ ] Connection pool monitoring in place for scaling
