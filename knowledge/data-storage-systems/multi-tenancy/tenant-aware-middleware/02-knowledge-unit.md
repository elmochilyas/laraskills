# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.6 Tenant-aware middleware (IdentifyTenant, SetTenantConnection)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Tenant-aware middleware runs early in the request lifecycle to resolve the tenant, set the current tenant context, and configure the database connection. Middleware is the correct place for tenant initialization — before controllers, services, or models run.

---

# Core Concepts

- **IdentifyTenant middleware**: Extracts tenant identifier from subdomain/domain/header. Looks up tenant in central database. Sets `app(CurrentTenant::class)`.
- **SetTenantConnection middleware**: For schema-per-tenant or DB-per-tenant: updates database config (`config(['database.connections.tenant.database' => ...])`), clears connection (`DB::purge('tenant')`), reconnects.
- **Middleware order**: `IdentifyTenant` runs before `SetTenantConnection`, which runs before `StartSession` and `Authenticate`.

---

# Patterns

**Singleton CurrentTenant**: A simple data object holding `id`, `name`, `connection`, `config`. Set once by middleware, read anywhere via `app(CurrentTenant::class)`.

**Skip middleware for public routes**: Tenant middleware should not apply to login, registration, or webhook routes.

---

# Common Mistakes

**Resolving tenant in boot method**: Tenant resolution in `AppServiceProvider::boot()` runs before request context is available. Middleware is the correct place.

---

# Related Knowledge Units

5.4 Tenant resolution | 5.5 Global scopes | 5.13 Connection caching
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

