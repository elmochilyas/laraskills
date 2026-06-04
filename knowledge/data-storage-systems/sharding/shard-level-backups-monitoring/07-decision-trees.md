# 6-18 Shard Level Backups Monitoring - Decision Trees

## Per-Shard Backup Schedule

---

## Decision Context

Determining backup frequency and retention per shard — balancing recovery point objectives (RPO) against backup storage costs and performance impact.

---

## Decision Criteria

* performance: backup frequency affects shard I/O during backup windows
* architectural: each shard is independent; recovery of one shard shouldn't affect others
* maintainability: per-shard backup policies require more configuration but enable granular RPO

---

## Decision Tree

Shard type:

↓

Write-heavy shard (high data change rate)?

    YES → Frequent backups (hourly)
        
        ↓
        RPO: 1 hour
        Use incremental or binlog-based backups between full backups
        Stagger backup times to avoid simultaneous load
        
        ↓
        Retention: 24 hourly snapshots + 30 daily full backups

NO → Archive or read-only shard?

    YES → Infrequent backups (daily)
        
        ↓
        RPO: 24 hours
        Data changes slowly or not at all
        Full daily backup sufficient
        
        ↓
        Retention: 30 daily backups

NO → Standard shard (moderate write rate)?

    → Moderate backups (every 4-6 hours)
    RPO: 4-6 hours
    Full backup every 4-6 hours
    Retention: 14 daily backups + monthly

Restore testing:

↓

Test per-shard restore quarterly

    Rotate through shards: test shard 1 in Q1, shard 2 in Q2, etc.
    Verify restore RTO and data integrity

---

## Recommended Default

**Default:** Hourly for write-heavy shards, daily for archive shards, every 4-6h for standard shards; quarterly restore testing
**Reason:** Backup frequency should match data change rate. Rarely-changing shards don't need hourly backups.

---

## Per-Shard vs Aggregate Monitoring

---

## Decision Context

Choosing between per-shard individual monitoring (separate dashboards per shard) and aggregate cluster monitoring (single view with per-shard breakdown) for sharded databases.

---

## Decision Criteria

* performance: metric collection overhead is per-shard
* architectural: per-shard metrics detect hot shards; aggregate metrics hide them
* maintainability: aggregate view is simpler; per-shard view is more actionable

---

## Decision Tree

Number of shards:

↓

≤ 4 shards?

    YES → Per-shard individual monitoring
        
        ↓
        Manageable to have separate dashboards per shard
        Each shard: CPU, storage, connections, query latency, replication lag
        
        ↓
        Pro: Clear visibility into each shard's health
        Pro: Easy to spot the problematic shard

NO → 5+ shards?

    YES → Aggregate dashboard with per-shard breakdown
        
        ↓
        Main dashboard: cluster overview
        - Total queries/s, average latency, shard count
        - Per-shard utilization heatmap
        - Hot shard alerts
        
        ↓
        Drill-down per shard: individual dashboard
        - Detailed metrics for the selected shard
        
        ↓
        Pro: Single view for overall cluster health
        Pro: Heatmap quickly identifies hot shards
        Pro: Drill-down for detailed investigation

Alert thresholds:

↓

Uniform thresholds for all shards?

    YES → Simpler to configure
        
        ↓
        CPU > 80% on ANY shard → alert
        Storage > 75% on ANY shard → alert
        
        ↓
        Risk: may miss shard-specific patterns

NO → Per-shard thresholds

    → More accurate
    Hot shard: CPU > 70% → alert
    Cold shard: CPU > 90% → alert
    Match thresholds to shard workload

---

## Recommended Default

**Default:** Aggregate dashboard with per-shard heatmap and drill-down for 5+ shards; per-shard individual dashboards for ≤4 shards
**Reason:** Aggregate views with breakdown balance overview and detail. Per-shard dashboards become unwieldy at scale.

---

## Related Rules

* Rule 6-18-1: Always Verify Backup Integrity Per Shard
* Rule 6-18-2: Never Restore Backup To Wrong Shard

---

## Related Skills

* Implement Shard-Level Backups
* Monitor Shard Health and Performance
