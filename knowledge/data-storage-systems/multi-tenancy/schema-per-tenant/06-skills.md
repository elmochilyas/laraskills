# Skill: Implement Schema-Per-Tenant Multi-Tenancy

## Purpose

Isolate tenant data using separate database schemas (PostgreSQL) or table prefixes (MySQL) within a single database server, providing medium isolation with moderate operational complexity.

## When To Use

- Medium isolation required between tenants (stronger than shared-table, weaker than DB-per-tenant)
- Single database server is sufficient for total data volume
- PostgreSQL is available (native schema support)
- Team can manage N schema migrations per deployment

## When NOT To Use

- Compliance mandates physical database separation
- Tenants require independent backup/restore
- Application uses MySQL without strong schema prefix conventions
- Connection pooling in transaction mode (SET search_path is lost)

## Prerequisites

- PostgreSQL database (preferred) or MySQL
- Understanding of database schemas and search_path
- Migration orchestration tool or pattern

## Inputs

- Tenant registry with schema names
- Central database connection for tenant metadata
- Migration files to apply per schema

## Workflow (numbered steps)

1. Create a central `tenants` table to map tenant IDs to schema names
2. For PostgreSQL: `CREATE SCHEMA tenant_{id};` and create tables inside it
3. Implement middleware that sets `SET search_path TO tenant_{id};` after connection
4. For MySQL: use table prefix `tenant_{id}_` and dynamic table name resolution
5. Run migrations per schema: loop tenants, configure connection, run `artisan migrate`
6. Create a `TenantBootstrapper` that configures the tenant connection per request

## Validation Checklist

- [ ] Each tenant's data is invisible from other tenants' schemas
- [ ] `search_path` is correctly set per request
- [ ] Migrations run successfully across all schemas
- [ ] Connection pooling works with schema switching

## Common Failures

- Search path not reset between requests in persistent worker (Octane)
- Migration run on central schema instead of tenant schema
- MySQL table prefix collisions from inconsistent naming

## Decision Points

- PostgreSQL schemas vs MySQL table prefixes
- Single connection with SET search_path vs per-tenant connection

## Performance Considerations

- Schema switching via search_path is instant (no connection overhead)
- PostgreSQL caches query plans per schema

## Security Considerations

- Ensure tenant cannot `SET search_path` to another tenant's schema
- Use RLS as defense-in-depth layer

## Related Rules

- 5-2-1: Always Set Search Path Per Request
- 5-2-2: Never Hardcode Schema Names In Queries

## Related Skills

- Implement Shared-Table Multi-Tenancy
- Implement Database-Per-Tenant Multi-Tenancy
- Implement Tenant Bootstrapper Pattern

## Success Criteria

- Tenant isolation verified via cross-schema access attempts
- Migrations can be applied to all schemas in < 5 minutes for 1000 tenants
- Zero connection overhead for schema switching

---

# Skill: Orchestrate Schema-Per-Tenant Migrations

## Purpose

Apply database schema changes across all tenant schemas safely, with batched execution, rollback capability, and minimal downtime.

## When To Use

- Deploying migration changes to schema-per-tenant architecture
- Adding or removing tenant schemas
- Backfilling data across all tenant schemas

## When NOT To Use

- Single-tenant or shared-table architecture (migrate once)
- Emergency hotfix that must be applied instantly (use canary first)

## Prerequisites

- Tenant schema version ledger
- Migration files compatible with all tenant schema versions
- Rollback scripts for each migration batch

## Inputs

- List of all tenant schemas with current migration versions
- Migration batch files
- Batch size configuration (default: 20 tenants per batch)

## Workflow (numbered steps)

1. Read tenant list from central registry
2. Compare each tenant's schema version against target version
3. Sort tenants: canary (5%) → low-usage (20%) → medium (30%) → enterprise (45%)
4. Process tenants in batches of 20: for each batch, run `artisan migrate --force --schema=tenant_{id}`
5. Between batches, verify migration success and check replication lag
6. On failure in any batch, halt, roll back that batch, and log the gap

## Validation Checklist

- [ ] All tenant schemas are at the target migration version
- [ ] Schema version ledger is updated after each migration
- [ ] Rollback procedure tested on a staging tenant

## Common Failures

- Migration runs on wrong schema (central instead of tenant)
- Batch too large causes database overload
- Migration fails on one tenant but others proceed (inconsistent state)

## Decision Points

- Synchronous batch processing vs async queue per tenant
- Rollback all or rollback failed batch only

## Performance Considerations

- Process 20 tenants per batch with 5-second cooldown
- Monitor database CPU and replication lag between batches

## Security Considerations

- Migrations should never expose or transform tenant data insecurely
- Audit log each migration run per tenant

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Tenant Migration Canary
- Implement Schema Version Ledger
- Implement Migration Orchestration Across Tenants

## Success Criteria

- Zero failed tenant migrations across a deployment
- Rollback restores only affected tenants
- Total migration time is predictable and monitored
