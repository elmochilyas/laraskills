# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.29 Tenant migration priority and canary rollout
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Canary rollout for tenant migrations: apply schema changes to a small subset of tenants first, monitor for errors, verify performance, then roll to remaining tenants. Priority ordering: internal/test tenants → low-usage tenants → medium tenants → enterprise (high-value) tenants last. Enables early detection of migration issues without impacting all tenants.

---

# Core Concepts

- **Canary group**: 5-10 test/internal tenants. Apply migration, run automated tests, monitor error rates.
- **Phased rollout**: Canary (5%) → Ring 1 (20%, low-usage) → Ring 2 (30%, medium) → Ring 3 (45%, enterprise). 15-minute cooldown between rings.
- **Rollback trigger**: Automated: if error rate increases by 2% after migration, halt rollout and roll back the last ring.

---

# Patterns

**Tenant ring assignment**: Each tenant assigned to a deployment ring in the central database. Migrations are per-ring. Rings defined by tenant tier, usage, risk profile.

**Migration window per ring**: Canary: any time. Ring 1-2: off-peak hours. Ring 3: scheduled maintenance window (enterprise SLA).

---

# Common Mistakes

**Rolling migrations to all tenants simultaneously**: A bad migration corrupts all tenants' data. Canary rollout limits blast radius to a small subset.

---

# Related Knowledge Units

5.9 Migration orchestration | 5.19 Schema version ledger
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

