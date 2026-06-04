# 6-17 Read Replica Per Shard - Decision Trees

## Symmetric vs Asymmetric Replica Count

---

## Decision Context

Choosing between symmetric (same number of replicas per shard) and asymmetric (different replica counts per shard based on read load) read replica deployment.

---

## Decision Criteria

* performance: asymmetric matches read capacity to actual per-shard demand
* architectural: asymmetric requires per-shard monitoring; symmetric is uniform
* maintainability: asymmetric needs per-shard sizing; symmetric is simpler

---

## Decision Tree

Read load is evenly distributed across all shards?

YES → Symmetric replica count

    ↓
    Same number of replicas per shard
    Example: 4 shards, 2 replicas each = 8 total replicas
    
    ↓
    Pro: Simple to configure and manage
    Pro: Uniform monitoring and alerting
    Pro: Predictable capacity planning
    
    ↓
    Con: Wastes resources on low-read shards
    Con: May not meet peak demands of high-read shards

NO → Some shards have significantly higher read load

    ↓
    Use asymmetric replica count
    
    ↓
    Hot shard (high read load): 3 replicas
    Average shard: 2 replicas
    Cold shard (low read load): 1 replica or none
    
    ↓
    Pro: Cost-efficient — right-size per shard
    Pro: Hot shards get the read capacity they need
    
    ↓
    Con: More complex to manage
    Con: Uneven replica distribution may cause routing confusion
    Con: Monitoring per shard must account for different replica counts

Asymmetric sizing approach:

↓

Measure read traffic per shard over 7 days

    ↓
    Top 25% shards by read load → 3+ replicas
    Middle 50% → 2 replicas
    Bottom 25% → 1 replica
    
    ↓
    Re-evaluate monthly: traffic patterns may shift

---

## Recommended Default

**Default:** Symmetric replicas for even read distribution; asymmetric for cost-optimization with uneven load
**Reason:** Symmetric is simpler and sufficient for balanced workloads. Asymmetric is worth the complexity when some shards have 2-3x the read traffic of others.

---

## Read Replica Lag Per Shard

---

## Decision Context

Monitoring and handling read replica lag independently per shard — avoiding stale reads on one shard while another shard's replicas are healthy.

---

## Decision Criteria

* performance: per-shard lag monitoring adds minimal overhead
* architectural: each shard's replication is independent; lag varies by shard write rate
* maintainability: per-shard lag thresholds may differ by workload

---

## Decision Tree

Per-shard replica lag > threshold?

YES → Remove that shard's replicas from read pool

    ↓
    Route reads for that shard to its primary
    Other shards continue using their replicas
    
    ↓
    Per-shard degraded mode:
    Shard 1: lag 2s → use replicas
    Shard 2: lag 30s → route reads to primary
    Shard 3: lag 1s → use replicas
    
    ↓
    Alert: shard 2 replica lag exceeded threshold
    Investigate: high write rate on shard 2?

NO → All replicas within threshold

    → Normal read routing per shard
    All shards serve reads from replicas
    Continue monitoring per-shard lag

Lag threshold determination:

↓

Workload type on this shard?

    Freshness-critical (user-facing data): threshold = 2s
    Tolerant (reports, analytics): threshold = 60s
    Archive (historical data): threshold = hours

---

## Recommended Default

**Default:** Per-shard replica lag threshold of 5s for user-facing data; fallback to primary reads when exceeded
**Reason:** Each shard has independent replication. One shard's lag shouldn't affect other shards' replica usage.

---

## Related Rules

* Rule 6-17-1: Always Monitor Replica Lag Per Shard
* Rule 6-17-2: Never Route Critical Reads To High-Lag Replicas

---

## Related Skills

* Configure Read Replicas Per Shard
* Route Shard Reads to Replicas Based on Workload
