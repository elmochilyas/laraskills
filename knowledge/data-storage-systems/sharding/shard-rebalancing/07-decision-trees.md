# 6-10 Shard Rebalancing - Decision Trees

## Offline vs Online Rebalancing

---

## Decision Context

Choosing between offline rebalancing (stop writes, dump/reload) and online rebalancing (double-write + backfill + cutover) when data distribution across shards becomes uneven.

---

## Decision Criteria

* performance: offline is simpler but requires downtime; online has no downtime but adds migration load
* architectural: offline rebuilds all data; online migrates only affected keys
* maintainability: offline is easy to execute; online requires careful orchestration

---

## Decision Tree

Can the application tolerate downtime proportional to data volume?

YES → Use offline rebalancing

    ↓
    Steps:
    1. Stop writes (maintenance mode)
    2. Dump all data from all shards
    3. Load into new shard layout
    4. Verify data integrity
    5. Update routing config
    6. Resume writes
    
    ↓
    Pro: Simple, well-understood process
    Pro: No double-write complexity
    Pro: Easy to verify (full dump/reload)
    
    ↓
    Con: Downtime = data volume / throughput
    Con: 100GB at 100MB/s = ~17 minutes downtime
    Con: All-or-nothing — if it fails, no progress

NO → Zero downtime required

    ↓
    Use online rebalancing (double-write + backfill + cutover)
    
    ↓
    Steps:
    1. Add new shards to infrastructure
    2. Start double-writing writes to both old and new shards
    3. Backfill existing data from old to new shards (rate-limited)
    4. Verify consistency between old and new shards
    5. Atomic cutover: update shard map to route reads to new shards
    6. Stop double-writing
    7. Clean up old data
    
    ↓
    Pro: Zero application downtime
    Pro: Reversible (revert shard map if issues detected)
    Pro: Rate-limited migration (throttle impact)
    
    ↓
    Con: Complex orchestration
    Con: Double-write adds latency
    Con: Backfill adds load to source shards

---

## Recommended Default

**Default:** Online rebalancing for production; offline rebalancing for non-production or when maintenance windows exist
**Reason:** Production applications generally can't tolerate downtime. Online rebalancing adds complexity but enables zero-downtime migration.

---

## Virtual Bucket Migration

---

## Decision Context

Choosing virtual bucket migration (move buckets between physical shards) over per-key migration when rebalancing hash-based or directory-based shards.

---

## Decision Criteria

* performance: bucket migration moves many keys at once (coarse granularity); per-key is fine-grained but slow
* architectural: bucket migration updates a single mapping entry; per-key migration requires scanning all keys
* maintainability: bucket migration is simpler — move a bucket, not individual keys

---

## Decision Tree

Number of keys to move during rebalance:

↓

< 1 million keys?

    → Per-key migration is feasible
    Read key, write to new shard, update mapping
    Rate-limit to control impact
    Simple implementation

≥ 1 million keys?

    ↓
    Use virtual bucket migration
    
    ↓
    Each key maps to a bucket: bucket = hash(key) % 4096
    Move the bucket (1000s of keys) by updating bucket→shard map
    
    ↓
    Number of buckets to move:
    Target: move = imbalance / 2 (reduce skew by 50% per cycle)
    Move distribution: pick buckets from overloaded shard
    
    ↓
    Steps:
    1. Identify overloaded shards (top N by utilization)
    2. Select buckets on overloaded shards to move
    3. Migrate all keys for selected buckets to target shard
    4. Update bucket→shard mapping atomically
    5. Verify data on target shard
    6. Clean up from source shard

Bucket count decision:

↓

All data fits in memory (per shard)?

YES → 4096 buckets (adequate granularity)

NO → 65536 buckets (finer granularity)

    More buckets = less data per bucket
    Easier to balance precisely
    More mapping entries to manage

---

## Recommended Default

**Default:** Virtual bucket migration with 4096 buckets for rebalancing large shards; per-key migration for small rebalances
**Reason:** Bucket migration is simpler and more efficient for large-scale moves. Per-key migration is only practical for small data volumes.

---

## Related Rules

* Rule 6-10-1: Always Verify Data After Migration
* Rule 6-10-2: Never Switch Reads Before Data Migration Completes

---

## Related Skills

* Implement Shard Rebalancing
* Implement Virtual Bucket Rebalancing
