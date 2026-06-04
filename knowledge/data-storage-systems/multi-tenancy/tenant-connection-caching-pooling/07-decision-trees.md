# 5-13 Tenant Connection Caching/Pooling - Decision Trees

## Connection Caching Strategy for Multi-Tenant Database Switching

---

## Decision Context

Managing database connections efficiently when each request may switch to a different tenant database — avoiding expensive TCP + SSL handshakes per request.

---

## Decision Criteria

* performance: new connection = 50-200ms; cached connection = ~0.01ms
* architectural: caching reduces handshake overhead but increases memory usage
* maintainability: Octane handles this automatically; PHP-FPM needs ProxySQL
* security: cached connections may hold stale credentials

---

## Decision Tree

How to cache tenant connections?

↓

Using Octane (persistent workers)?

YES → Octane's built-in pool caches per worker

    ↓
    Each worker's pool holds connections per tenant
    First request to a tenant: create connection (50-200ms)
    Subsequent requests: reuse pooled connection (~0.01ms)
    
    ↓
    Pool size per worker: pool.min, pool.max
    Total connections = workers × pool.max (per unique tenant)
    Risk: pool.max may be reached if many unique tenants hit one worker

NO → Using PHP-FPM?

    YES → Use ProxySQL as intermediary
        
        ↓
        ProxySQL pools connections to tenant databases
        PHP-FPM connects to ProxySQL (single connection per worker)
        ProxySQL routes to tenant DB based on schema/database name
        
        ↓
        ProxySQL handles connection multiplexing
        No application-level caching needed
        Connection overhead: one per worker (not per tenant)

NO → Direct connections without proxy?

    → Connection factory caching (least recommended)
    Cache PDO instances keyed by tenant ID
    Flush cache on credential rotation
    
    ↓
    Risk: stale connections, state leakage
    Acceptable only for small deployments (<50 tenants)

---

## Recommended Default

**Default:** Octane pool for Octane apps; ProxySQL for PHP-FPM; avoid manual connection caching
**Reason:** Octane's built-in pool is simplest for Octane apps. ProxySQL eliminates per-tenant connection overhead for PHP-FPM. Manual caching adds complexity and risk.

---

## Connection Pool Sizing for Per-Tenant Databases

---

## Decision Context

Sizing connection pools when each tenant has their own database — balancing connection availability against database memory constraints.

---

## Decision Criteria

* performance: more connections = more concurrent queries; fewer = queuing
* architectural: per-tenant pool sizing must account for tenant count
* maintainability: monitoring per-tenant pool utilization
* security: one noisy tenant shouldn't exhaust shared pool

---

## Decision Tree

How to size pools for per-tenant databases?

↓

Number of active tenants?

↓

< 50 tenants?

YES → Per-tenant pools in PgBouncer

    ↓
    Each tenant: default_pool_size = 10
    Total: 50 tenants × 10 = 500 connections
    Each tenant has guaranteed pool allocation
    
    ↓
    Monitoring: per-tenant pool utilization
    Alert: any single tenant > 80% pool utilization

NO → 50-500 tenants?

    YES → Shared pool with dynamic switching
        
        ↓
        Single PgBouncer pool: default_pool_size = 100
        Shared across all tenants
        Dynamic database switching per request
        
        ↓
        Pro: Efficient — connections shared
        Con: Noisy tenant can exhaust pool
        Mitigation: PgBouncer per-database connection limits

NO → 500+ tenants?

    → ProxySQL routing with tenant groups
    Group tenants into shared database clusters
    Pool per cluster, not per tenant
    Scale: add clusters as tenant count grows

---

## Recommended Default

**Default:** <50 tenants → per-tenant pools; 50-500 → shared pool with limits; 500+ → clustered groups
**Reason:** Pooling strategy must scale with tenant count. Per-tenant pools are simple for small deployments. Shared pools scale better. Clustering adds horizontal scalability.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant Connection Caching and Pooling
* Configure Pool Architecture
