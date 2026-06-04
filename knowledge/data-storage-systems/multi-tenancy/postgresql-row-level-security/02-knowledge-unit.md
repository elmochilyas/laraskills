# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.14 PostgreSQL Row-Level Security as defense-in-depth (RLS policies, app.current_tenant)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

PostgreSQL Row-Level Security (RLS) enforces tenant isolation at the database level. Even if an application bug bypasses the global scope, RLS policies block access to other tenants' rows. Enabled via `CREATE POLICY ... USING (tenant_id = current_setting('app.current_tenant')::bigint)`. Defense-in-depth layer that catches scope bypasses.

---

# Core Concepts

- **RLS policy**: `CREATE POLICY tenant_isolation ON orders FOR ALL USING (tenant_id = current_setting('app.current_tenant')::bigint)`. Applied to every row access.
- **app.current_tenant**: PostgreSQL session variable set per connection. Laravel sets it after connection: `DB::statement("SET app.current_tenant = ?", [$tenantId])`.
- **RLS impact on performance**: Each row access checks the policy. Overhead is small (microseconds per row) but measurable for bulk operations.

---

# Patterns

**RLS + global scope**: Global scope catches most leaks at app level. RLS catches any leak that reaches the database. Two independent layers.

**Bulk operation bypass**: Use `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` for bulk operations. Re-enable after.

---

# Common Mistakes

**RLS without app.current_tenant**: Policy compares against a NULL value — all rows are blocked. Always set the session variable before running queries.

**RLS on all tables**: RLS has overhead. Apply to tenant-scoped tables only. Tables in the central/public schema should not have RLS.

---

# Related Knowledge Units

5.5 Global scopes | 5.11 Cross-tenant leak prevention | 12.19 RLS policies
## Ecosystem Usage

The stancl/tenancy package dominates Laravel multi-tenancy. Three approaches: shared-table with global scopes, schema-per-tenant, and database-per-tenant. PostgreSQL row-level security offers database-enforced tenant isolation.

## Failure Modes

Cross-tenant data leaks when global scopes are bypassed. Tenant resolution failures expose all tenant data. Connection pool exhaustion from per-tenant connections. Migration drift between tenant databases.

## Performance Considerations

Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include tenant ID filters.

## Production Considerations

Implement canary rollout for migrations. Monitor noisy neighbor tenants. Use connection health checks. Implement per-tenant backup strategies.

## Research Notes

PostgreSQL schema-per-tenant with RLS is increasingly favored. Connection pooling continues to improve. The community trend is toward database-per-tenant for SaaS.

## Internal Mechanics

stancl/tenancy leverages Laravel's queue and connection management. Tenant resolution happens in middleware by matching hostname against a central database. Global scopes apply to Eloquent queries at model boot time.

## Architectural Decisions

Shared-table: Low isolation, single connection, low complexity. Schema-per-tenant: Medium isolation, single connection, medium complexity. Database-per-tenant: High isolation, N connections, high complexity.

## Tradeoffs

Shared-table simplicity comes with cross-tenant leak risk. Database isolation provides safety but connection overhead. Schema-per-tenant balances isolation and complexity.

## Mental Models

Each tenant is a separate silo. Shared-table = cubicle walls. Schema-per-tenant = office walls. Database-per-tenant = separate buildings. Choose based on tenant trust requirements.

