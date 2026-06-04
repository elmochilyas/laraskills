# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.25 Tenant bootstrapper pattern (central vs. tenant connections)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The tenant bootstrapper pattern separates two database connection configurations: a central connection (for the tenants registry, plans, global config) and a tenant connection (for per-tenant data). The bootstrapper initializes the tenant connection after resolving the current tenant. This pattern is the foundation of all isolation models.

---

# Core Concepts

- **Central connection**: `config('database.connections.central')` — stores tenant registry (`tenants` table), global settings. Always available.
- **Tenant connection**: `config('database.connections.tenant')` — dynamically configured per request. Database/schema/connection string comes from the tenant record.
- **Bootstrapper class**: `TenantBootstrapper` — takes resolved tenant, configures tenant connection, purges stale connections, sets session variables (RLS).

---

# Patterns

**Central for cross-tenant ops**: Admin panel queries central database for tenant list, billing, usage. Tenant database for tenant-specific data.

**Bootstrapper sequence**: IdentifyTenant middleware → TenantBootstrapper → configure tenant connection → app ready.

**Connection purge on switch**: `DB::purge('tenant')` before reconfiguring. Prevents stale connection data.

---

# Common Mistakes

**Using same connection for central and tenant data**: Without separation, global queries are tenant-scoped, or tenant queries are global. Two explicit connections prevent confusion.

---

# Related Knowledge Units

5.4 Tenant resolution | 5.6 Tenant middleware | 5.13 Connection caching
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

