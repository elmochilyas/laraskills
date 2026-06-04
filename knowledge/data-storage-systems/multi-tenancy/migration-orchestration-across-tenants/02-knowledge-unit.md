# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.9 Migration orchestration across tenants (single DB, per-schema, per-DB)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Running migrations across tenants is the primary operational challenge of multi-tenant systems. For shared-table: run once. For schema-per-tenant: loop schemas, run per schema. For database-per-tenant: loop databases, run per database. The orchestration strategy determines deployment complexity, downtime risk, and rollback capability.

---

# Core Concepts

- **Shared-table**: Standard migrations. Run once. Central `migrations` table. No orchestration required.
- **Schema-per-tenant**: N migration runs per deployment. Each schema has its own `migrations` table. Loop all schemas; run `migrate` for each.
- **Database-per-tenant**: N database connections. Each database has its own `migrations` table. Largest orchestration overhead.

---

# Patterns

**Central migration tracker**: Single table tracks which migration batch each tenant has applied. Enables differential migration (only apply pending migrations per tenant).

**Batch size control**: Process tenants in batches of 10-20 to control database load. Between batches, wait for replication lag to settle.

**Rollback strategy**: Per-tenant rollback. If migration fails on tenant 50/1000, roll back that tenant only. Log the gap, fix and re-run.

---

# Common Mistakes

**Synchronous full-tenant migration**: Running migrations for all 2000 tenants sequentially in one request. Use batched background jobs.

**No migration version tracking per tenant**: Can't tell which tenants are behind. Always store `tenant_id + migration_batch` in a central log.

---

# Related Knowledge Units

5.2 Schema-per-tenant | 5.3 Database-per-tenant | 11.14 Multi-DB migration strategies
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

