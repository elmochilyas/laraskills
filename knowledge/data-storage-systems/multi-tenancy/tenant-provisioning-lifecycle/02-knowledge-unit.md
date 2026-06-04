# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.10 Tenant provisioning and lifecycle (create, migrate, seed, deactivate, archive, delete)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Tenant lifecycle management covers creating a new tenant (provisioning database/schema, running migrations, seeding default data), ongoing maintenance, and eventual deactivation/archival/deletion. A robust provisioning pipeline is essential for self-service signup flows.

---

# Core Concepts

- **Provisioning steps**: Create tenant record in central DB. Create schema/database per isolation model. Run migrations. Seed default data. Initialize queues, storage, cache prefixes.
- **Async provisioning**: Queue the provisioning job for faster signup response. Tenant marked as "provisioning" until complete.
- **Deactivation**: Soft-disable tenant (set `active=false`). Queries still work but app rejects requests. Enables reactivation.
- **Archival**: Export tenant data to cold storage. Drop schema/database. Re-import on reactivation.

---

# Patterns

**Provisioning pipeline**: Job chain: `CreateTenant → RunMigrations → SeedDefaults → InitializeIntegrations`. Each step runs as separate queued job.

**Deletion gate**: Confirm deletion twice. Provide data export before permanent delete. Soft-delete with 30-day grace period.

---

# Common Mistakes

**Synchronous provisioning**: User signs up, waits 30s for migrations and seeding. Queue provisioning; show "setting up your workspace" screen.

**No archival before deletion**: Accidental permanent delete without backup. Always archive before delete.

---

# Related Knowledge Units

5.9 Migration orchestration | 5.27 Per-tenant backups
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

