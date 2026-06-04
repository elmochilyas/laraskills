# Skill: Implement PostgreSQL Row-Level Security for Tenant Isolation

## Purpose

Add a defense-in-depth layer of tenant isolation at the database level using PostgreSQL RLS policies, ensuring data access control even if application-level scopes are bypassed.

## When To Use

- PostgreSQL as primary database
- Shared-table multi-tenancy needing database-level isolation guarantee
- Compliance requirements (HIPAA, SOC 2) needing data access control at database level
- Defense-in-depth: RLS catches bugs missed by application-level scopes

## When NOT To Use

- MySQL (no equivalent RLS feature)
- Schema-per-tenant or DB-per-tenant where physical isolation already exists
- Performance-critical bulk operations where RLS overhead is significant

## Prerequisites

- PostgreSQL 9.5+ with RLS enabled
- Tenant ID column on all RLS-protected tables
- Application sets `app.current_tenant` session variable after connection

## Inputs

- List of tables to protect with RLS
- Current tenant ID from middleware
- RLS policy definitions

## Workflow (numbered steps)

1. Enable RLS on table: `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;`
2. Create policy: `CREATE POLICY tenant_isolation ON orders FOR ALL USING (tenant_id = current_setting('app.current_tenant')::bigint);`
3. For SELECT only: `FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::bigint)`
4. Set session variable after connection: `DB::statement("SET app.current_tenant = ?", [$tenantId])`
5. Grant table permissions to application role (RLS applies to all roles unless `FORCE ROW LEVEL SECURITY` is off)
6. Create default policies for new tables via event trigger
7. Test RLS by attempting cross-tenant access with direct SQL

## Validation Checklist

- [ ] RLS enabled on all tenant-scoped tables
- [ ] Policies cover SELECT, INSERT, UPDATE, DELETE
- [ ] Session variable set on every connection
- [ ] Direct SQL cross-tenant access is blocked
- [ ] RLS doesn't break legitimate queries

## Common Failures

- RLS policy not created — table has RLS enabled but no policy (all rows blocked)
- Session variable not set on connection — all queries return no rows
- RLS bypassed by table owner or superuser
- RLS overhead blocks bulk operations performance

## Decision Points

- RLS-only isolation vs RLS as supplement to global scopes
- Same policy for all operations vs separate policies per operation type

## Performance Considerations

- RLS adds microseconds per row check — negligible for OLTP
- Bulk INSERT/UPDATE may be 10-30% slower with RLS enabled
- Use `EXPLAIN ANALYZE` to measure RLS impact on heavy queries

## Security Considerations

- RLS does not apply to superuser or table owner
- RLS is defense-in-depth, not a replacement for application-level controls
- Ensure `app.current_tenant` cannot be set to arbitrary values by tenant users

## Related Rules

- 5-14-1: Always Enable RLS On Tenant Tables
- 5-14-2: Always Set Session Variable On Connection

## Related Skills

- Implement Cross-Tenant Data Leak Prevention
- Implement Eloquent Global Scopes
- Implement Partition-Aware RLS

## Success Criteria

- RLS blocks all cross-tenant data access at database level
- Zero performance regression on OLTP queries
- RLS policies are tested and maintained alongside schema changes

---

# Skill: Automate RLS Policy Management

## Purpose

Automate the creation, auditing, and maintenance of RLS policies across all tenant-scoped tables, including new tables added by migrations.

## When To Use

- More than 10 tables need RLS policies
- New tables are added frequently
- RLS policy consistency is critical for security

## When NOT To Use

- Few tables with static schema (manual management is simpler)
- RLS not used as isolation mechanism

## Prerequisites

- PostgreSQL event triggers or migration hooks
- Migration system that can run raw SQL

## Inputs

- List of tenant-scoped tables
- Policy template
- Table creation events (from migrations)

## Workflow (numbered steps)

1. Create a stored procedure `apply_tenant_rls(table_name TEXT)` that enables RLS and creates standard policy
2. In migration `up()` for new tables, call `SELECT apply_tenant_rls('orders')`
3. Create PostgreSQL event trigger on `ddl_command_end` for `CREATE TABLE` to auto-apply RLS
4. Add CI check that verifies all tenant-scoped tables have RLS enabled
5. Periodically audit: `SELECT tablename FROM pg_tables WHERE rowsecurity = false AND tablename NOT IN ('exempt', 'tables')`

## Validation Checklist

- [ ] All tenant-scoped tables have RLS enabled
- [ ] New tables automatically get RLS policies
- [ ] CI detects tables missing RLS
- [ ] Audit report shows zero tables without RLS

## Common Failures

- Event trigger misses CREATE TABLE in certain contexts
- Stored procedure fails silently on tables with existing RLS
- CI check has false positives for non-tenant tables

## Decision Points

- Event triggers vs migration-hooks vs CI-only verification

## Performance Considerations

- Event trigger overhead on CREATE TABLE is negligible
- CI audit runs in seconds

## Security Considerations

- RLS audit is security-critical — run automatically and alert on failure
- Exempt tables must have documented justification

## Related Rules

- 5-14-1: Always Enable RLS On Tenant Tables

## Related Skills

- Implement PostgreSQL Row-Level Security
- Implement Cross-Tenant Data Leak Prevention

## Success Criteria

- All tenant tables have RLS within 1 minute of creation
- CI blocks deployment if any tenant table lacks RLS
- Zero manual RLS configuration needed
