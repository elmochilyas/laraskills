# 7-11 Replica Promotion Failover - Decision Trees

## Automated vs Manual Failover

---

## Decision Context

Choosing between automated failover (orchestrator detects failure, promotes replica automatically) and manual failover (ops team executes runbook) based on RTO requirements.

---

## Decision Criteria

* performance: automated RTO = 10-60s; manual RTO = 5-30 minutes
* architectural: automated requires orchestrator infra (Orchestrator, Patroni, RDS Multi-AZ)
* maintainability: automated requires testing; manual is simpler but slower

---

## Decision Tree

RTO requirement?

↓

< 60 seconds (user-facing critical app)?

YES → Automated failover

    ↓
    Tools:
    - MySQL: Orchestrator, ProxySQL + orchestrator
    - PostgreSQL: Patroni + etcd/consul
    - Managed: RDS Multi-AZ, Aurora
    
    ↓
    Config:
    - Health check interval: 5s
    - Failure threshold: 3 consecutive failures
    - Promotion: most advanced replica
    - Post-promotion: update DNS/VIP within 10s

NO → < 5 minutes (internal tool, moderate criticality)?

    YES → Semi-automated or manual with runbook
        
        ↓
        Semi-automated: orchestrator detects, alerts human, human approves
        Manual: runbook with step-by-step commands
        
        ↓
        RTO: 2-5 minutes (semi) or 5-30 minutes (manual)
        No orchestrator overhead

NO → Hours acceptable (development, analytics)?

    → Manual failover only
    No automation needed
    Ops team handles when available

---

## Recommended Default

**Default:** Automated for production with RTO < 60s; manual runbook for lower-criticality environments
**Reason:** Automated failover is essential for user-facing apps. Manual is acceptable for internal tools with longer outage tolerance.

---

## Replica Selection for Promotion

---

## Decision Context

When multiple replicas exist, choosing which one to promote to primary — considering lag, topology position, and configuration.

---

## Decision Criteria

* performance: least lag = least data loss
* architectural: must have same configuration as original primary (storage, memory, version)
* maintainability: designated replica vs most-advanced selection

---

## Decision Tree

Multiple replicas available for promotion?

YES → Evaluate candidates

    ↓
    Check: Which replica has the least lag?
    - MySQL: SHOW REPLICA STATUS → Seconds_Behind_Master
    - PostgreSQL: pg_stat_replication → replay_lag
    
    ↓
    Candidate 1: Least lag → lowest data loss (RPO)
    Candidate 2: Same AZ as app → lowest latency after promotion
    Candidate 3: Full replica (not cascade) → independent of other replicas
    
    ↓
    Selection criteria (priority order):
    1. Lag: must be < RPO threshold
    2. Location: same region/AZ if possible
    3. Configuration: same or larger than original primary

NO → Single replica available?

    → Promote it regardless of lag
    Accept RPO = lag since last acknowledged write
    Verify lag before commit — if too high, assess data loss

---

## Recommended Default

**Default:** Promote the replica with the least lag that matches or exceeds the original primary's configuration
**Reason:** Least lag minimizes data loss. Configuration match ensures no performance degradation after promotion.

---

## Related Rules

* Rule 7-11-1: Always Test Failover Monthly
* Rule 7-11-2: Always Monitor Replication Lag Before Promotion

---

## Related Skills

* Implement Automated Replica Promotion Failover
* Execute Manual Planned Switchover
