# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.13 Tenant connection caching and pooling
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

In schema-per-tenant and DB-per-tenant models, every request potentially uses a different database connection. Creating a new PDO connection per request is expensive (handshake, auth, SSL). Connection pooling and caching strategies reduce overhead: persistent connections, connection pool middleware, connection factory caching.

---

# Core Concepts

- **Connection setup cost**: TCP handshake + SSL negotiation + MySQL auth handshake ~50-200ms per new connection. For 100 tenants per minute per worker, this is unsustainable.
- **Persistent connections**: `pdo.options' => [PDO::ATTR_PERSISTENT => true]` reuses connections across requests. Risks: stale connections, maximum connection limits.
- **Connection factory caching**: Cache the resolved PDO instance keyed by tenant ID. Flush cache when credentials rotate.

---

# Patterns

**ProxySQL connection routing**: Route per-tenant connections through ProxySQL. ProxySQL pools connections to backend databases. Laravel connects to ProxySQL, not directly to tenant DB.

**Octane connection reuse**: Laravel Octane keeps connections alive across requests. Tenant-aware connection factory reuses existing pooled connections.

**Read/write split pooling**: Separate pools for read replicas and primary. Tenant-aware routing per pool.

---

# Common Mistakes

**Creating connection per request without pooling**: 1000 tenants × 10 PHP-FPM workers = 10,000 connections. Pooling reduces this to N tenants × 1-2 connections.

---

# Related Knowledge Units

5.2 Schema-per-tenant | 5.3 DB-per-tenant | 10.4 Connection pooling
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

