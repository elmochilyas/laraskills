# 6-19 Shard Proxy Considerations - Decision Trees

## ProxySQL vs Vitess vs pgcat

---

## Decision Context

Choosing a shard proxy solution — comparing ProxySQL (MySQL rule-based routing), Vitess (distributed MySQL), and pgcat (PostgreSQL pooling/routing).

---

## Decision Criteria

* performance: ProxySQL adds <1ms; Vitess adds 5-15ms for cross-shard queries
* architectural: ProxySQL is a smart proxy; Vitess is a distributed DB; pgcat is a lightweight proxy
* maintainability: ProxySQL is simpler; Vitess requires significant ops expertise

---

## Decision Tree

Database engine:

↓

MySQL/MariaDB?

    YES → Need cross-shard query support (joins, subqueries)?
        
        YES → Use Vitess
            
            ↓
            Full distributed query engine
            Automatic shard management and resharding
            Best for: large-scale sharding with complex queries
            
            ↓
            Con: high operational complexity
            Con: significant infrastructure requirements
            Con: some MySQL features not supported
        
        NO → Simple routing + connection pooling?
            
            → Use ProxySQL
            Rule-based query routing
            Connection pooling
            Read/write splitting per shard
            Best for: MySQL routing + pooling without cross-shard queries

PostgreSQL?

    YES → Use pgcat
        
        ↓
        Connection pooling (transaction mode)
        Read/write splitting
        Basic shard routing (PASS THROUGH)
        
        ↓
        Best for: PostgreSQL connection pooling + basic routing
        Not a full distributed database (unlike Vitess for MySQL)

Proxy high availability:

↓

Single proxy instance?

    → SPOF — not recommended for production
    Deploy: ProxySQL cluster (2+ nodes) or multiple VTGate instances
    Test: proxy failover before production deployment

---

## Recommended Default

**Default:** ProxySQL for MySQL routing/pooling; pgcat for PostgreSQL; Vitess when cross-shard queries are required at scale
**Reason:** ProxySQL/pgcat are lightweight and well-understood. Vitess solves harder problems (distributed queries) but at significant complexity.

---

## Application-Level vs Proxy-Level Routing

---

## Decision Context

Choosing between application-level shard routing (ShardRouter in Laravel) and proxy-level routing (ProxySQL/Vitess) — balancing control against transparency.

---

## Decision Criteria

* performance: proxy adds <1ms (ProxySQL) to 15ms (Vitess) overhead
* architectural: proxy routing is transparent to app; app routing requires explicit code
* maintainability: proxy is a single routing point; app routing is distributed across all codebases

---

## Decision Tree

Multiple applications/languages access the same sharded DB?

YES → Use proxy-level routing

    ↓
    All apps connect to proxy
    Proxy handles routing consistently
    
    ↓
    Pro: Single routing configuration
    Pro: Consistent behavior across all apps
    Pro: Add new app without routing code
    
    ↓
    Con: Proxy is additional infrastructure
    Con: Proxy becomes a potential bottleneck

NO → Single application (Laravel) only?

    ↓
    Use application-level routing
    
    ↓
    ShardRouter class in Laravel
    DB::connection('shard_'.$shardId)
    
    ↓
    Pro: No additional infrastructure
    Pro: Full control over routing logic
    Pro: Easy to debug (routing is in code)
    
    ↓
    Con: Every app needs routing logic
    Con: Changing routing requires code deployment

Hybrid approach:

↓

Proxy for connection pooling + app for routing?

    YES → Best of both
        Proxy manages connections (pooling)
        App routes queries to correct shard through proxy
        Most flexible

---

## Recommended Default

**Default:** Application-level routing for single-app deployments; proxy-level for multi-app environments
**Reason:** App routing is simpler for Laravel-only stacks. Proxy routing pays off when multiple applications share the database.

---

## Related Rules

* Rule 6-19-1: Always HA Deploy Shard Proxies
* Rule 6-19-2: Never Route Queries Through Unauthenticated Proxy

---

## Related Skills

* Evaluate Shard Proxy Solutions
* Configure Shard Routing in ProxySQL
