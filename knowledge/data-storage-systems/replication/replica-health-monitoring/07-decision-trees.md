# 7-21 Replica Health Monitoring - Decision Trees

## Replica Health Check Strategy

---

## Decision Context

Choosing the right health check strategy for replicas — balancing detection speed against monitoring overhead, and deciding automated response vs manual intervention.

---

## Decision Criteria

* performance: health checks add minimal load (SELECT 1 every 10-60s)
* architectural: must check connection, replication threads, AND data freshness separately
* maintainability: automated response reduces MTTR; manual intervention prevents incorrect auto-fixes

---

## Decision Tree

Check 1 — Connection health: Can probe connection succeed?

YES → Replica reachable
    ↓
Check 2 — Replication threads running (IO + SQL)?

BOTH YES → Replication active
    ↓
Check 3 — Data freshness (lag < threshold)?

YES → Replica healthy
    Continue serving reads
    Re-check in 10-60 seconds

NO (lag > threshold) → Remove from read pool

    ↓
    Route reads to primary or other replicas
    Log the lag event for investigation
    Re-check more frequently (every 5s)
    Re-add to pool when lag drops below threshold

NO (IO or SQL thread stopped) → CRITICAL

    ↓
    Remove from read pool immediately
    Alert: replication stopped
    
    ↓
    Automated: restart SQL thread (SHOW REPLICA STATUS → START REPLICA)
    Manual: investigate root cause (disk full, corrupted relay log, duplicate key)
    If restart fails → rebuild replica

NO (connection fails) → Mark replica OFFLINE

    ↓
    Remove from read pool
    Alert: replica unreachable
    Automated: retry connection every 30s
    Manual: investigate network, process, resource issues
    If all replicas unhealthy → degrade to primary-only reads

---

## Recommended Default

**Default:** 3-layer health check (connection → threads → lag) every 15s; automated SQL thread restart; manual for other failures
**Reason:** Connection test alone misses replicas serving stale data. Thread check catches stopped replication. Lag check catches slow replication.

---

## Degraded Mode Routing

---

## Decision Context

When replicas become unhealthy, determining whether to serve reads from the primary (degraded but functional) or return errors — balancing availability against primary overload.

---

## Decision Criteria

* performance: primary serving reads + writes may increase write latency
* architectural: degraded mode is preferable to serving errors
* maintainability: automatic degradation requires monitoring integration

---

## Decision Tree

All replicas unhealthy?

YES → Read from primary (degraded mode)

    ↓
    Route ALL queries to primary
    Alert: all replicas down
    Log the degraded state
    
    ↓
    Impact: primary handles full read+write load
    Response: slower writes, higher primary CPU
    
    ↓
    Recovery: when any replica becomes healthy, restore read routing
    Considerations: auto-scale primary if degraded mode is prolonged

NO → Some replicas healthy, some unhealthy?

    ↓
    Route reads to healthy replicas only
    Remove unhealthy replicas from pool
    Alert: partial replica failure
    
    ↓
    If remaining replicas can handle read load:
    → Continue normal operation
    
    ↓
    If remaining replicas approaching capacity:
    → Set degraded warning
    → Monitor: if remaining replicas exceed 80% CPU, route some reads to primary

NO → All replicas healthy?

    → Normal operation
    Routes: reads to replicas, writes to primary
    Continue periodic health checks

---

## Recommended Default

**Default:** Degrade to primary reads when all replicas are unhealthy rather than returning errors
**Reason:** Serving stale data is worse than slower reads. Primary can handle combined load temporarily — better than error pages.

---

## Related Rules

* Rule 7-21-1: Always Monitor IO and SQL Thread Separately
* Rule 7-21-2: Never Assume Replica Has Current Data Just Because It's Running

---

## Related Skills

* Monitor Replica Health
* Configure Replica Health Checks
* Implement Automated Replica Repair
