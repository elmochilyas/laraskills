# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.30 Tenant-aware caching (cache prefix isolation)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Cache keys in multi-tenant systems must be scoped per tenant to prevent cache collisions and data leaks. Use a tenant-specific cache prefix (e.g., `cache:tenant_{id}:`). All cache operations automatically prepend the prefix. Redis, DynamoDB, and file caches all need tenant-aware key namespacing.

---

# Core Concepts

- **Cache prefix**: `config('cache.prefix')` set dynamically: `'cache_'.$tenant->id`. Applied to all cache keys created during this request.
- **Key collision without prefix**: Two tenants cache `user_42`. Without prefix, tenant A retrieves tenant B's cached user data.
- **Tagged cache**: `Cache::tags(['orders', 'tenant:'.$tenantId])` — cache tags scoped per tenant. Flush per tenant.

---

# Patterns

**Dynamic cache prefix in middleware**: After tenant resolution, set `config('cache.prefix')` to `"app_{$tenant->id}"`. All subsequent cache operations use this prefix.

**Per-tenant Redis database**: `config('database.redis.options.prefix')` set per tenant. Separate Redis database per tenant (Redis has 16 logical databases).

---

# Common Mistakes

**No cache key isolation**: One tenant's cached data served to another tenant. Data leak via cache. Always prefix keys with tenant ID.

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

