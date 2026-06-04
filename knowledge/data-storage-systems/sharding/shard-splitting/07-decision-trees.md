# 6-11 Shard Splitting - Decision Trees

## Range Splitting Strategy

---

## Decision Context

Determining the split point and approach when dividing an overloaded shard into two shards — based on sharding strategy (range vs hash vs directory).

---

## Decision Criteria

* performance: split adds migration load to the already overloaded shard
* architectural: range split divides the key range; directory split moves specific keys
* maintainability: range split is simpler; directory split offers more precise balancing

---

## Decision Tree

Sharding strategy:

↓

Range-based (contiguous key ranges)?

    YES → Range split
        
        ↓
        Find split point: median key value or 50th percentile by data volume
        Split range into two: [1M-2M] → [1M-1.5M] + [1.5M-2M]
        
        ↓
        If data distribution within range is uneven:
        → Find split point that balances DATA volume, not just key count
        Use SELECT COUNT(*) or table size to find balance point
        
        ↓
        Migration:
        1. Create new shard
        2. Start double-write for split range to both shards
        3. Backfill from old to new for the split portion
        4. Verify → update range map → stop double-write

Hash-based (consistent hashing or modulo)?

    YES → Add new shard + rebalance
        
        ↓
        Cannot "split" a hash shard — must add shard and redistribute
        Consistent hashing: add shard to ring, 1/N of keys move
        Modulo: full rehash required
        
        ↓
        Process:
        1. Add new shard N+1
        2. Rebalance keys from hot shard to new shard
        3. Double-write during migration
        4. Cutover → verify → clean up

Directory-based (shard map)?

    → Directory split
    Move subset of keys from hot shard to new shard
    Update shard map entries atomically
    Most flexible — move exactly the right number of keys

---

## Recommended Default

**Default:** Range split for range-based sharding; add shard + rebalance for hash-based; directory move for directory-based
**Reason:** Each sharding strategy has a natural splitting approach. Range splitting is a literal range division; hash requires adding a new shard; directory is key-level movement.

---

## Split Trigger Threshold

---

## Decision Context

Determining when a shard should be split — choosing monitoring thresholds and evaluation criteria to trigger splitting before performance is affected.

---

## Decision Criteria

* performance: splitting too early wastes resources; splitting too late causes degradation
* architectural: different resources (CPU, storage, IOPS) have different threshold urgency
* maintainability: automated splitting reduces ops burden; manual approval adds safety

---

## Decision Tree

Monitor shard metrics:

↓

Storage > 80%?

YES → Schedule split (non-urgent)

    ↓
    Storage fills predictably
    Plan split before reaching 90%
    Storage-based split is proactive, not reactive
    
    ↓
    Exception: if storage growth is very fast (doubling weekly)
    → Split immediately

NO → CPU > 70% sustained for 10+ minutes?

    YES → Evaluate split (urgent)
        
        ↓
        Check if CPU is from writes or reads:
        - If writes: shard may be write-hot → split
        - If reads: consider read replicas first
        
        ↓
        If replica alone doesn't help → split needed

NO → IOPS > 70% sustained?

    YES → Evaluate split
        
        ↓
        IOPS saturation = queuing = latency
        Check if IOPS is from read replicas or primary
        
        ↓
        If primary: split needed
        If replica: add more replicas

NO → All metrics below thresholds?

    → No split needed
    Re-evaluate when any metric approaches threshold
    Pre-split planning: document split procedure while not under pressure

---

## Recommended Default

**Default:** Split when any shard metric exceeds 70% for 10+ minutes; storage > 80% triggers proactive split planning
**Reason:** 70% gives headroom above the threshold — the split itself adds load that could push a 90%-utilized shard over the edge.

---

## Related Rules

* Rule 6-11-1: Always Monitor Shard Utilization
* Rule 6-11-2: Never Split Without Verified Data Integrity

---

## Related Skills

* Implement Shard Splitting
* Automate Shard Split Detection
