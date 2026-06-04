# Skill: Implement Database-Per-Tenant Multi-Tenancy

## Purpose

Provide the strongest tenant isolation by provisioning a separate database for each tenant, enabling independent backup, restore, scaling, and billing attribution.

## When To Use

- Enterprise SaaS with compliance requirements (HIPAA, GDPR, SOC 2)
- Whales tenants with dedicated resource requirements
- Per-tenant backup/restore is a product requirement
- Billing attribution must be precise (per-database metrics)

## When NOT To Use

- More than a few hundred tenants (N databases × operational overhead)
- Team lacks DevOps capacity to manage N databases
- Connection pooling and management infrastructure not in place
- Simple shared-table isolation would suffice for current stage

## Prerequisites

- Database server capable of N logical databases (or multiple servers)
- Connection pooling infrastructure (PgBouncer, ProxySQL, RDS Proxy)
- Tenant provisioning automation (IaC or scripts)

## Inputs

- Tenant registry with database names and credentials
- Central database for tenant metadata
- Database server connection pool configuration

## Workflow (numbered steps)

1. Create a central `tenants` table storing per-tenant database connection details
2. Implement provisioning pipeline: create database, run migrations, seed default data
3. Configure dynamic connection: `config(['database.connections.tenant.database' => 'tenant_'.$id])` per request
4. Call `DB::purge('tenant')` after config change to force reconnection
5. Set up connection pooling per tenant or shared pool with database parameter
6. Implement per-tenant backup schedule (pg_dump/mysqldump per database)
7. Create middleware that resolves tenant and configures the tenant connection

## Validation Checklist

- [ ] Each tenant's data is in a physically separate database
- [ ] Dynamic connection switching works without stale PDO objects
- [ ] Per-tenant backup and restore tested
- [ ] Connection pooling prevents max_connections exhaustion

## Common Failures

- Missing `DB::purge()` after config change — stale connection to wrong database
- Connection count grows as N tenants × connections per tenant
- Provisioning pipeline fails silently, leaving tenant without database

## Decision Points

- Shared database server vs per-tenant database server
- Connection pooling per tenant vs shared pool with database parameter
- Synchronous vs async tenant provisioning

## Performance Considerations

- Total connections = tenant count × connections per tenant. Pooling is essential
- Database-per-tenant enables per-database resource limits

## Security Considerations

- Encrypt tenant database credentials in the central registry
- Use separate database users per tenant for audit trails
- Never expose connection strings to tenant-facing UI

## Related Rules

- 5-3-1: Always Purge After Dynamic Config Change
- 5-3-2: Never Share Connection Credentials Between Tenants

## Related Skills

- Implement Tenant Connection Caching and Pooling
- Implement Per-Tenant Backups and Restore
- Implement Tenant Provisioning Lifecycle

## Success Criteria

- Tenant isolation is physical (separate databases)
- Dynamic connection switching completes in < 5ms per request
- Per-tenant backup completes within SLA window
- Zero cross-tenant data access possible

---

# Skill: Automate Tenant Database Provisioning

## Purpose

Create a reliable, repeatable pipeline for provisioning new tenant databases including schema creation, migration execution, and initial data seeding.

## When To Use

- Self-service tenant signup flow
- Bulk tenant creation during migration or onboarding
- Automated scaling: promoting a tenant to dedicated database

## When NOT To Use

- Manual tenant creation acceptable for < 10 tenants total
- Single shared database architecture

## Prerequisites

- Database server infrastructure (RDS, Aurora, self-managed)
- Migration files for tenant schema
- Central tenant registry

## Inputs

- Tenant signup event (tenant name, plan, region)
- Database server pool configuration
- Seed data templates

## Workflow (numbered steps)

1. Receive tenant creation request with plan and region
2. Select database server from pool (based on region, capacity, and plan)
3. Create database: `CREATE DATABASE tenant_{id};`
4. Run migrations against the new database
5. Seed default data (settings, roles, default categories)
6. Update central tenant registry with database connection details
7. Initialize tenant-specific infrastructure (queue, cache prefix, storage bucket)
8. Mark tenant as active

## Validation Checklist

- [ ] Database created and migrations applied successfully
- [ ] Seed data present and correct
- [ ] Tenant accessible via application with correct isolation
- [ ] Backup schedule configured for new database

## Common Failures

- Database creation succeeds but migrations fail — inconsistent state
- Seed data references cross-tenant records (data leak)
- Provisioning timeout leaves tenant in half-provisioned state

## Decision Points

- Synchronous vs async (queued) provisioning
- Single server vs server pool selection strategy

## Performance Considerations

- Provisioning should complete within signup flow timeout (5-10s for sync)
- Async provisioning returns faster UX but requires polling

## Security Considerations

- Database credentials generated securely per tenant
- Provisioning logs must not contain passwords

## Related Rules

- 5-3-1: Always Purge After Dynamic Config Change

## Related Skills

- Implement Tenant Provisioning Lifecycle
- Implement Tenant Connection Caching and Pooling

## Success Criteria

- Tenant database provisioned and available within 10 seconds (sync) or 30 seconds (async)
- Zero provisioning failures due to race conditions or timeouts
- All created databases are accounted for in monitoring
