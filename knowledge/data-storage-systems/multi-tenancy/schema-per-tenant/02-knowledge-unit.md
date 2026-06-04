# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.2 Schema-per-tenant (single DB, separate schemas/prefixes per tenant)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Schema-per-tenant uses a single database server with separate schemas (PostgreSQL) or table prefixes (MySQL) per tenant. All tenants share the same connection pool but their data is physically separated at the schema level. Medium isolation, moderate operational complexity.

---

# Core Concepts

- **PostgreSQL schemas**: `CREATE SCHEMA tenant_123;` Each tenant's tables are created inside their schema. `SET search_path TO tenant_123;` isolates queries.
- **MySQL table prefixes**: `tenant_123_orders` vs `tenant_456_orders`. Same database, different table names. Less elegant than PostgreSQL schemas.
- **Connection switching**: Laravel `config(['database.connections.tenant.database' => 'tenant_'.$id])` — rebind connection on the fly.

---

# Patterns

**Migration per schema**: Loop through tenants, run migrations against each schema. `artisan migrate --path=... --database=tenant` with dynamic config.

**Search path approach (PostgreSQL)**: One connection, SET search_path per tenant. No connection switching overhead.

---

# Common Mistakes

**Schema-per-tenant on MySQL**: MySQL schemas are equivalent to databases. Schema-per-tenant on MySQL means database-per-tenant. PostgreSQL is the right engine for true schema-per-tenant.

---

# Related Knowledge Units

5.1 Shared-table | 5.3 Database-per-tenant | 5.9 Migration orchestration
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

