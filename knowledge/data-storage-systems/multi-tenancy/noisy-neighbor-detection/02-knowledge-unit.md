# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.15 Noisy neighbor detection and mitigation (tenant-level rate limiting, resource quotas)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Noisy neighbors are tenants consuming disproportionate resources (CPU, IOPS, memory, connections), degrading performance for other tenants on shared infrastructure. Detection requires per-tenant resource monitoring. Mitigation: tenant-level rate limiting, query timeout enforcement, resource quotas, and ultimately isolation escalation (dedicated resources).

---

# Core Concepts

- **Detection signals**: Per-tenant CPU, IOPS, connection count, query count per second, slow query count, response time deviation from platform average.
- **Mitigation tiers**: Rate limiting → query timeout → resource quota → dedicated instance → schema/DB-per-tenant.
- **Resource quota**: Max connections per tenant, max concurrent queries, max storage, max API requests per minute.

---

# Patterns

**Tenant-level rate limiter**: Laravel `RateLimiter::for('tenant', fn() => Limit::perMinute(1000)->by(tenant()->id))`. Per-tenant rate limit independent of per-user limits.

**Slow query kill**: Kill queries running longer than N seconds per tenant. Prevents one tenant's bad query from blocking shared resources.

**Automatic isolation escalation**: Monitor per-tenant resource usage. If a tenant exceeds thresholds for N consecutive minutes, flag for escalation to dedicated resources.

---

# Common Mistakes

**Global rate limiting**: Rate limit applies to all tenants equally — a small tenant gets blocked because a large tenant consumed the global budget. Per-tenant limits are essential.

---

# Related Knowledge Units

5.1 Shared-table | 5.16 Per-tenant scaling
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

