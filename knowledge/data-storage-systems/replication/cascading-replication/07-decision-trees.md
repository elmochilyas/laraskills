# 7-12 Cascading Replication - Decision Trees

## Direct vs Cascaded Replica Connections

---

## Decision Context

Choosing between direct replica connections (each replica connects to primary) and cascaded (replicas connect through intermediate replicas) based on primary load and replica count.

---

## Decision Criteria

* performance: direct is simpler with lower lag; cascaded reduces primary load
* architectural: each direct replica consumes primary binlog dump thread; cascading shares across few connections
* maintainability: cascading adds monitoring complexity and lag accumulation

---

## Decision Tree

Number of replicas?

↓

≤ 3 replicas?

YES → Direct connections (simpler)

    ↓
    Each replica connects directly to primary
    Primary handles 3 binlog dump threads — negligible overhead
    Lowest lag configuration
    
    ↓
    No cascading infrastructure needed

NO → 4-20 replicas?

    YES → Evaluate primary binlog dump capacity
        
        ↓
        Can primary handle N direct connections?
        Each binlog dump thread uses ~1-2% CPU
        
        ↓
        If yes → Direct connections (simplest monitoring)
        If no → Cascade: 1-2 intermediates, each serving 5-10 downstream replicas

NO → 20+ replicas or multi-region?

    → Cascading recommended
    1-2 direct intermediate replicas per region
    Each intermediate serves 10-20 downstream replicas
    Max cascade depth: 3 levels

---

## Recommended Default

**Default:** Direct connections for ≤ 3 replicas; cascade for 4+ replicas or multi-region deployments
**Reason:** Direct is simpler with less lag. Cascading reduces primary load and enables fan-out for large replica fleets.

---

## Cascade Depth and Lag Accumulation

---

## Decision Context

Determining the maximum cascade depth (how many hops from primary to farthest replica) — balancing lag accumulation against primary load reduction.

---

## Decision Criteria

* performance: each hop adds network RTT + apply time (typically 50-500ms per hop)
* architectural: depth > 3 causes unacceptable lag for user-facing reads
* maintainability: deeper chains are harder to diagnose

---

## Decision Tree

Cascade depth?

↓

1-2 hops (Primary → Intermediate → Downstream)?

YES → Acceptable for user-facing reads

    ↓
    Lag = hop1 + hop2
    Typically 100ms-2s total
    Suitable for most applications
    
    ↓
    Monitor lag per hop
    Alert if any hop exceeds threshold

NO → 3 hops (Primary → A → B → C)?

    YES → Acceptable for tolerant workloads only
        
        ↓
    Lag = hop1 + hop2 + hop3
    Typically 200ms-5s total
    
    ↓
    Suitable for: analytics, reporting, backup source
    Not recommended for: user-facing reads

NO → > 3 hops?

    → Not recommended
    Lag accumulates beyond acceptable range
    Failure at any intermediate breaks all downstream replicas
    Redesign topology with fewer levels

---

## Recommended Default

**Default:** Maximum 2 cascade hops for user-facing replicas; 3 hops for analytics/backup replicas
**Reason:** Each hop adds lag. 2 hops keeps lag under 1-2s for most setups. 3+ hops causes unacceptable freshness for user-facing workloads.

---

## Related Rules

* Rule 7-12-1: Limit Cascade Depth to 3 Levels
* Rule 7-12-2: Enable log_slave_updates on All Intermediate Replicas

---

## Related Skills

* Implement Cascading Replication Topology
* Plan Cascading Replication for Multi-Region Deployment
