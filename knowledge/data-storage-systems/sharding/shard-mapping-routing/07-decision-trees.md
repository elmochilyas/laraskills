# 6-5 Shard Mapping Routing - Decision Trees

## Service-Side vs Proxy-Level Routing

---

## Decision Context

Choosing between service-side shard routing (application computes shard and connects directly) and proxy-level routing (middleware like Vitess/ProxySQL handles routing transparently).

---

## Decision Criteria

* performance: service-side has zero proxy overhead; proxy-level adds < 1ms per query
* architectural: service-side requires explicit shard selection in code; proxy-level is transparent to app
* maintainability: service-side gives full control; proxy-level simplifies application code

---

## Decision Tree

Does the application need full control over routing logic?

YES → Use service-side routing

    ↓
    ShardRouter class: getShard(key) → shard_id
    DB::connection('shard_'.$shardId)->query(...)
    
    ↓
    Pro: Full control over routing decisions
    Pro: No additional infrastructure (proxy)
    Pro: Per-query routing choices possible
    
    ↓
    Con: Every query must explicitly select shard
    Con: Fan-out logic must be implemented in code
    Con: All applications need their own routing logic

NO → Can the team operate a proxy (Vitess, ProxySQL)?

    YES → Use proxy-level routing
        
        ↓
        Proxy parses queries, routes to correct shard
        Application connects as if single database
        
        ↓
        Pro: Application code is shard-unaware
        Pro: Cross-shard queries handled by proxy
        Pro: Single routing point for all applications
        
        ↓
        Con: Proxy adds latency and operational complexity
        Con: Limited by proxy's SQL parsing capabilities
        Con: Some query patterns may not route correctly

NO → Small team or simple sharding?

    → Service-side routing
    No additional infrastructure to maintain
    Explicit routing in code is easier to debug

---

## Recommended Default

**Default:** Service-side routing for most Laravel applications; proxy-level routing (Vitess) for large multi-application deployments
**Reason:** Service-side routing is simpler, transparent, and gives full control. Proxy-level routing's benefits (transparent routing) only pay off at scale.

---

## Connection Management Strategy

---

## Decision Context

Managing database connections across shards — choosing between persistent connections per shard and connection pooling to avoid connection exhaustion.

---

## Decision Criteria

* performance: connections per shard × shards can exceed database limits
* architectural: each shard needs its own connection pool
* maintainability: connection exhaustion causes unpredictable failures

---

## Decision Tree

Number of shards × connections per application worker:

↓

< database max_connections?

    YES → Direct connections per shard sufficient
        
        ↓
        Configure Laravel database.php with per-shard connections
        'shard_0' => ['host' => 'shard0.host', ...],
        'shard_1' => ['host' => 'shard1.host', ...]
        
        ↓
        Each shard connection uses its own pool
        Monitor: total connections across all shards

NO → Use connection pooling (ProxySQL, pgbouncer)

    ↓
    Each shard behind a pooler
    Pooler limits actual connections to each shard
    
    ↓
    ProxySQL for MySQL: pool_mode=transaction
    pgbouncer for PostgreSQL: pool_mode=transaction
    
    ↓
    Shard pool size = max_connections / shards
    Application: one pooler address per shard

Fan-out query connection management:

↓

Parallel fan-out to N shards uses N simultaneous connections

↓

If N × pool_size > database max_connections:

    → Reduce fan-out parallelism or increase database max_connections
    Or: use connection pooler to multiplex

---

## Recommended Default

**Default:** Direct connections if total < database max_connections; connection pooler if approaching limits
**Reason:** Direct connections are simpler and faster. Poolers add latency but prevent connection exhaustion.

---

## Related Rules

* Rule 6-5-1: Always Route By Shard Key When Available
* Rule 6-5-2: Never Allow Direct Shard Access From Client Code

---

## Related Skills

* Implement Shard Routing
* Implement Service-Side Shard Routing
