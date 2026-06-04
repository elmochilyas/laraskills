# 6-21 Time Based Sharding - Decision Trees

## Time-Only vs Time+Hash Hybrid

---

## Decision Context

Choosing between pure time-based sharding (one shard per time period) and a time+hash hybrid (time period × hash buckets within each period) for time-series data.

---

## Decision Criteria

* performance: pure time has a hot current shard; hybrid distributes writes within the current period
* architectural: pure time is simpler; hybrid adds hash routing as a second level
* maintainability: pure time needs only time-based routing; hybrid needs time + hash routing

---

## Decision Tree

Write volume to the current time period:

↓

Will a single shard handle the write throughput for the current period?

YES → Pure time-based sharding is sufficient

    ↓
    Shard per month: shard_2024_01, shard_2024_02, etc.
    All writes go to the current shard
    
    ↓
    Pro: Simple routing (time only)
    Pro: Natural archival (drop old shard)
    Pro: Predictable lifecycle
    
    ↓
    Con: Current shard is write-hot
    Con: Scalability limited to single-shard write throughput

NO → Current period write volume > single shard capacity

    ↓
    Use time+hash hybrid
    
    ↓
    Level 1: Time interval (e.g., shard_2024_01)
    Level 2: Hash within interval (e.g., hash(user_id) % 4)
    
    ↓
    Example: shard_2024_01_0, shard_2024_01_1, shard_2024_01_2, shard_2024_01_3
    
    ↓
    Pro: Distributes writes across N shards per time period
    Pro: Point query (time + user_id) hits one shard
    Pro: Archival still possible (drop all hash shards for old period)
    
    ↓
    Con: More complex routing
    Con: Time-range queries fan-out within the time period

Time interval selection:

↓

Query pattern: most queries for recent data (last 24h)?

    YES → Use daily intervals
        Shard per day: small shards, fast archival
        More shards to manage
    
    NO → Queries span weeks/months?
        → Use monthly intervals
        Fewer shards, larger per shard
        Slower archival

---

## Recommended Default

**Default:** Monthly time intervals; add hash sub-sharding when current period exceeds single-shard write capacity
**Reason:** Monthly is a manageable number of shards (12/year). Hash sub-sharding adds complexity only when needed.

---

## Pre-Creation and Retention

---

## Decision Context

Determining how many future shards to pre-create and when to archive/drop old shards in a time-based sharding system.

---

## Decision Criteria

* performance: pre-creation ensures no "no shard for current time" errors
* architectural: retention policy determines data lifecycle
* maintainability: automated creation/removal reduces ops burden

---

## Decision Tree

Pre-creation window:

↓

How far ahead to create shards?

    Stable growth, confident projections → 12 months ahead
    Uncertain growth → 6 months ahead (monitor and extend)
    High growth, rapid iteration → 3 months ahead (re-evaluate monthly)

↓

Automation:

    CRON job or scheduler: runs monthly
    Creates shards for N+6 months (or configurable window)
    Creates database, schema, tables on new shard infrastructure

Retention and archival:

↓

Does data have a retention requirement (legal, compliance, storage cost)?

YES → Define retention policy per data type

    ↓
    Hot data (current period): on primary shards, replicated
    Warm data (1-12 months old): on standard storage, compressed
    Cold data (> 12 months): archived to S3/cold storage, queryable via Athena
    
    ↓
    Automated: retention CRON job drops/archives on schedule
    Never delete before retention period expires

NO → Keep all data indefinitely?

    → Monitor storage growth
    At capacity: archive oldest shards first
    Consider: older data is queried less frequently
    Archive: move to cheaper storage, keep accessible for queries

---

## Recommended Default

**Default:** Pre-create 6 months of future shards; retain hot shards for 3 months on primary, warm for 12 months on standard storage, cold archived
**Reason:** 6 months of pre-creation covers projection uncertainties. Tiered storage optimizes cost vs query performance by data age.

---

## Related Rules

* Rule 6-21-1: Always Pre-Create Future Shards
* Rule 6-21-2: Never Delete Shards Before Retention Period Expires

---

## Related Skills

* Implement Time-Based Sharding
* Combine Time-Based Sharding with Hash Sharding
