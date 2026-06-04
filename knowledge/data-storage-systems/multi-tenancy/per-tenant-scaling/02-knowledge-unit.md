# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.16 Per-tenant scaling (whale tenants on dedicated resources)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Whale tenants (high-usage tenants) outgrow shared infrastructure and require dedicated resources. Scaling strategies: move tenant to a dedicated database server, dedicated schema with higher IOPS, dedicated queue worker, dedicated cache instance. Automated detection + migration pipeline prevents manual intervention for each whale tenant.

---

# Core Concepts

- **Whale detection**: Monitor per-tenant storage, query volume, IOPS, connection count. Flag tenants exceeding 2-3x platform median.
- **Isolation escalation path**: Shared-table → dedicated schema → dedicated DB server → dedicated server cluster.
- **Migration impact**: Moving a tenant to dedicated resources requires downtime or replication setup. Schedule during low-usage windows.

---

# Patterns

**Multi-tier isolation model**: Tier 1 (free/startup) — shared table. Tier 2 (growth) — schema-per-tenant or dedicated DB. Tier 3 (enterprise) — dedicated server with SLA.

**Automated whale promotion**: When tenant exceeds thresholds for 7 days, queue provisioning of dedicated resources. Notify tenant admin of upgrade.

**Gradual resource increase**: Before full DB-per-tenant, first increase: dedicated connection pool, higher rate limits, priority queue.

---

# Common Mistakes

**Treating all tenants equally**: One tenant at 10x the average consumption degrades experience for everyone. Whale tenants must pay more or move to dedicated resources.

---

# Related Knowledge Units

5.15 Noisy neighbor | 5.17 Tenant segmentation
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

