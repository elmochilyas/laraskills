# 10.7 Connection Count Management - Decision Trees

## max_connections Sizing Based on Available RAM

---

## Decision Context

Setting the database `max_connections` parameter to balance connection availability against server memory constraints.

---

## Decision Criteria

* performance: each connection uses 2-10MB RAM; too many connections = OOM
* architectural: must reserve admin connections for emergency access
* maintainability: connection count must account for pooler multiplexing
* security: connection storms can be DDoS vectors; rate-limit at network level

---

## Decision Tree

How to set max_connections?

↓

Is a connection pooler (PgBouncer/ProxySQL) deployed?

YES → max_connections = pool_size + reserved + monitoring

    ↓
    Calculate pool_size = (peak concurrent queries × connections per query) / multiplexing
    Transaction mode multiplexing: 5-10×
    Add 10 reserved connections (admin + monitoring)
    
    Example: 50 pool + 10 reserved = max_connections = 60
    vs 300 direct connections without pooler

NO → Direct connections (no pooler)?

    YES → max_connections = total_workers + reserved
    
        ↓
        Calculate: servers × workers_per_server
        Add 10 reserved connections
        Example: 4 servers × 50 workers = 200 + 10 = max_connections = 210
        
        ↓
        Risk: If server count increases, max_connections may be exceeded
        Strongly recommend deploying a pooler
        
    NO → Octane with built-in pool?
    
        → max_connections = (workers × pool.max) + reserved
        Example: 8 workers × 10 pool.max = 80 + 10 = max_connections = 90

---

## Recommended Default

**Default:** Deploy a pooler and set `max_connections = pool_size × 1.2` (20% buffer)
**Reason:** Pooler reduces connection count by 5-10×. A buffer of 20% prevents edge-case exhaustion while keeping memory predictable.

---

## Connection Storm Prevention During Deployments

---

## Decision Context

Preventing simultaneous connection creation from all application workers during deployment restarts, which can overwhelm the database.

---

## Decision Criteria

* performance: storm can spike connections to > max_connections in <1 second
* architectural: deploy pipeline must include staggered worker startup
* maintainability: automate storm prevention in deployment scripts
* security: connection storms can be triggered by DDoS — monitor and rate-limit

---

## Decision Tree

How to prevent connection storms?

↓

Deploying new application version?

YES → Implement staggered worker startup

    ↓
    Add 100-500ms random delay before workers connect
    Distributes connection creation over several seconds
    
    ↓
    PHP-FPM: configure process.spawn_delay in php-fpm.conf
    Octane: use --workers startup with interval
    Kubernetes: use startupProbe with initialDelaySeconds
    
    ↓
    Without staggering: 300 connections in 1 second → database locks up
    With staggering: 300 connections over 5-10 seconds → manageable

NO → Auto-scaling event (new server spins up)?

    YES → Set health check grace period
    
        ↓
    New server should not receive traffic immediately
    Allow 10-30s for connections to establish gradually
    Load balancer: configure slow-start or connection draining
    
NO → Need connection storm recovery?

    → Use reserved connections to access DB and diagnose
    Kill idle connections: `pg_terminate_backend()` or `KILL CONNECTION`
    Temporarily reduce pooler sizes to stabilize

---

## Recommended Default

**Default:** Staggered worker startup with 200ms random delay and reserved admin connections
**Reason:** Simultaneous reconnection is the most common cause of post-deploy database outages. A small random delay eliminates the storm with no performance cost.

---

## Related Rules

* Rule 10-7-1: Reserve Admin Connections
* Rule 10-2-1: Deploy Server-Side Pooler for PHP-FPM

---

## Related Skills

* Manage Connection Count
* Configure Pool Architecture
