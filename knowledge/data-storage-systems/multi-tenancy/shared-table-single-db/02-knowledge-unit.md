# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.1 Shared-table (single DB, tenant_id column with global scope)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

The shared-table model stores all tenants' data in the same database tables, distinguished by a `tenant_id` column. A global scope automatically filters by tenant on every query. Lowest operational cost but highest risk of cross-tenant data leaks. Most common approach for B2B SaaS starting out.

---

# Core Concepts

- **Single database, shared tables**: Every row has a `tenant_id`. Queries must always filter by it.
- **Global scope**: Eloquent `addGlobalScope` automatically adds `WHERE tenant_id = ?` to all queries.
- **Index requirement**: Composite index on `(tenant_id, ...)` for filtered columns. Without it, every query scans all tenants' data.

---

# Patterns

**Default isolation strategy**: Start with shared-table for MVPs and early-stage SaaS. Migrate to higher isolation only when compliance or noise justifies the cost.

**Tenant ID as partition key**: Index on `(tenant_id, created_at)` for tenant-scoped list queries.

---

# Common Mistakes

**Missing index on tenant_id**: Without it, every tenant query performs a full table scan. As tenant count grows, performance degrades linearly.

---

# Related Knowledge Units

5.2 Schema-per-tenant | 5.3 Database-per-tenant | 5.5 Eloquent global scopes
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

