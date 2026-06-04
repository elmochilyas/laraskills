# 7-10 Multi Region Replication - Decision Trees

## Active-Passive vs Active-Active Topology

---

## Decision Context

Choosing between active-passive (single writable region, async replicas in other regions) and active-active (multiple writable regions with bidirectional replication) for multi-region deployment.

---

## Decision Criteria

* performance: active-passive write latency = local region only; active-active write latency = max(regional acks)
* architectural: active-passive is simpler; active-active needs conflict resolution
* maintainability: active-passive has simpler failover; active-active has data divergence risk

---

## Decision Tree

Writes originate from a single region?

YES → Active-passive (recommended)

    ↓
    Primary: us-east-1 (writes)
    Replica: eu-west-1, ap-southeast-1 (reads only)
    
    ↓
    Simple async replication from primary to other regions
    Write latency: local to primary region only
    Failover: promote cross-region replica to primary
    
    ↓
    Pro: no conflict resolution, simpler failover
    Con: cross-region reads may be stale (1-5s lag)

NO → Writes must be accepted in multiple regions?

    YES → Active-active (multi-primary)
        
        ↓
        Each region has a writable primary
        Bidirectional replication between regions
        
        ↓
        Requires conflict resolution:
        - Last-writer-wins (LWW)
        - CRDT-based merging
        - Application-level conflict handling
        
        ↓
        Pro: writes accepted locally in any region
        Con: write latency = max(region acks)
        Con: data divergence risk

NO → DR-only requirement?

    → Active-passive for DR
    Cross-region replica serves DR failover only
    Reads and writes served from primary region
    Only failover traffic uses cross-region replica

---

## Recommended Default

**Default:** Active-passive for most use cases; active-active only when writes must be accepted in multiple regions
**Reason:** Active-passive is simpler and avoids conflict resolution complexity. Active-active is justified only when local writes are mandatory in every region.

---

## Cross-Region Read Routing

---

## Decision Context

Routing read queries to the nearest regional replica to minimize read latency while handling cross-region lag.

---

## Decision Criteria

* performance: reads from nearest region = <10ms vs 100-200ms from primary region
* architectural: geo-routing via DNS latency-based routing (Route53, CloudFront)
* maintainability: must handle replica lag — fall back to primary region if needed

---

## Decision Tree

User location determined?

YES → Route reads to nearest region's replica

    ↓
    DNS: Route53 latency-based routing
    Application: geo-IP detection → regional read pool
    
    ↓
    US user reads from us-east-1 replica (~5ms)
    EU user reads from eu-west-1 replica (~5ms)
    
    ↓
    Fallback: if regional replica lag > threshold → read from primary region

NO → Replica lag exceeds acceptable threshold?

    YES → Fall back to primary region for reads
        
        ↓
        Example: EU replica lag = 10s
        Route EU reads to us-east-1 primary (temporarily)
        Better to have 200ms latency than 10s stale data

NO → Lag within acceptable range?

    → Continue serving reads from local replica
    Monitor lag; alert if trend exceeds threshold
    Lag-aware routing adjusts thresholds per region

---

## Recommended Default

**Default:** DNS-based geo-routing to nearest replica; fall back to primary region when lag exceeds threshold
**Reason:** Geo-routing minimizes read latency. Lag-aware fallback prevents serving stale data when replication is delayed.

---

## Related Rules

* Rule 7-10-1: Always Use Async Replication for Cross-Region
* Rule 7-10-2: Always Monitor Cross-Region Replication Lag

---

## Related Skills

* Configure Multi-Region Replication
* Select Multi-Region Replication Topology
