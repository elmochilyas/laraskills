# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.19 Schema version ledger per tenant
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

In multi-tenant systems (especially schema-per-tenant and DB-per-tenant), tenants may be at different migration versions. A schema version ledger tracks which migration batch each tenant has applied. Essential for differential migrations, rollback targeting, and auditing.

---

# Core Concepts

- **Central ledger table**: `tenant_schema_versions(tenant_id, batch, migration_name, applied_at)`. One row per applied migration per tenant.
- **Differential migration**: Compare tenant's applied version against current schema version. Apply missing migrations only.
- **Canary migration**: Apply migrations to a subset of tenants first. Monitor for errors. Then roll to remaining tenants.

---

# Patterns

**Migration tracking in provisioning**: When provisioning a new tenant, record the current schema batch in the ledger. New tenants always start at latest schema.

**Drift detection**: Daily check: tenants whose ledger version differs from latest. Flag for investigation or automated migration.

---

# Common Mistakes

**Assuming all tenants are at the same schema version**: After partial rollouts, rollbacks, or failed migrations, tenants diverge. Always check the ledger before assuming schema state.

---

# Related Knowledge Units

5.9 Migration orchestration | 5.29 Tenant migration canary
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

