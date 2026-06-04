# 7-6 Replica Lag Monitoring - Decision Trees

## Seconds_Behind_Master vs pt-heartbeat

---

## Decision Context

Choosing between MySQL's built-in `Seconds_Behind_Master` (SBM) and Percona Toolkit's pt-heartbeat for measuring replica lag.

---

## Decision Criteria

* performance: both have negligible monitoring overhead
* architectural: SBM is built-in, zero setup; pt-heartbeat requires Percona Toolkit
* maintainability: pt-heartbeat is more accurate during replication errors; SBM can show 0 falsely

---

## Decision Tree

Production environment with critical read consistency?

YES → Use pt-heartbeat (or equivalent)

    ↓
    pt-heartbeat --update on primary (every 1s)
    pt-heartbeat --monitor on replica
    
    ↓
    Accurate lag even during replication errors
    Works when SBM shows 0 (relay log gap)
    Measures real elapsed time, not binlog position

NO → Development or non-critical environment?

    YES → Seconds_Behind_Master is sufficient
        
        ↓
        SHOW REPLICA STATUS \G → Seconds_Behind_Master
        
        ↓
        Built-in, no setup
        Adequate for approximate monitoring
        
        ↓
        Limitation: can show 0 when replica hasn't processed events
        Not reliable during replication errors

NO → Third-party monitoring (RDS, CloudWatch)?

    → Use cloud provider's lag metric
    AWS RDS: ReplicaLag in CloudWatch
    No pt-heartbeat setup needed
    May have similar limitations to SBM

---

## Recommended Default

**Default:** pt-heartbeat for production; SBM for development; cloud provider metrics for managed services
**Reason:** pt-heartbeat is the only reliable measurement during replication issues. SBM is adequate for non-critical environments.

---

## Alert Threshold Configuration

---

## Decision Context

Setting replica lag alert thresholds — balancing false alarms (too low) against stale data risk (too high).

---

## Decision Criteria

* performance: threshold depends on query sensitivity
* architectural: user-facing apps need tighter thresholds
* maintainability: thresholds should be tuned per replica role

---

## Decision Tree

Replica purpose?

↓

User-facing reads (profiles, orders, balances)?

YES → Warning: > 2s, Critical: > 10s

    ↓
    Users should see recent data
    Lag > 2s: investigate
    Lag > 10s: some users see stale data
    
    ↓
    Action on critical: alert on-call, consider routing reads to primary

NO → API/backend (moderate freshness requirements)?

    YES → Warning: > 5s, Critical: > 30s
        
        ↓
        API responses tolerate minor staleness
        Lag > 5s: investigate
        Lag > 30s: API serving stale data
        
    NO → Analytics/reporting (tolerant of old data)?
    
        → Warning: > 60s, Critical: > 300s
        Reports don't need real-time data
        Lag > 60s: minor concern
        Lag > 300s: investigate replica health

---

## Recommended Default

**Default:** Warning at 5s, Critical at 30s for general-purpose replicas
**Reason:** 5s provides early warning. 30s is the point where user experience degrades. Tune tighter for user-facing, looser for analytics.

---

## Related Rules

* Rule 7-6-1: Always Monitor All Replicas For Lag
* Rule 7-6-2: Never Rely Solely On Seconds_Behind_Master

---

## Related Skills

* Monitor Replica Lag
* Set Up pt-heartbeat for Accurate Lag Measurement
