# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.17 Tenant segmentation (grouped tiers, graduated isolation)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Tenant segmentation groups tenants into tiers based on usage, revenue, or requirements. Each tier uses a different isolation model: free tier on shared-table, growth tier on schema-per-tenant, enterprise on dedicated databases. Tier assignment is dynamic — tenants can be promoted as they grow.

---

# Core Concepts

- **Tier-based isolation**: Free (shared-table, rate limited) → Pro (schema-per-tenant, higher limits) → Enterprise (DB-per-tenant, dedicated server).
- **Graduated isolation**: A tenant that stays within usage limits stays on shared infrastructure. Above 2x median → isolated. Above 10x → dedicated.
- **Tier assignment rules**: Based on monthly active users, storage used, API requests per day, or subscription plan.

---

# Patterns

**Dynamic connection resolution**: `config(['database.connections.tenant.database' => tenant()->tier === 'enterprise' ? 'tenant_'.$tenant->id : 'shared'])` — connection config depends on tier.

**Tier upgrade pipeline**: When tenant crosses tier threshold, queue provisioning for upgraded isolation. Downtime-free migration via replication.

---

# Common Mistakes

**One-size-fits-all isolation**: All tenants on DB-per-tenant is expensive. All on shared-table is risky. Graduated isolation aligns cost with value.

---

# Related Knowledge Units

5.3 DB-per-tenant | 5.16 Per-tenant scaling
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

