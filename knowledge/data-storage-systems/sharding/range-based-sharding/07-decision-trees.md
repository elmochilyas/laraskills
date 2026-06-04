# 6-3 Range Based Sharding - Decision Trees

## Range vs Hash Sharding Strategy

---

## Decision Context

Choosing between range-based and hash-based sharding — balancing range scan efficiency against even data distribution.

---

## Decision Criteria

* performance: range-based supports efficient range scans on shard key; hash-based scatters them
* architectural: range-based risks hot ranges (monotonically increasing keys); hash-based distributes evenly
* maintainability: range-based requires monitoring and splitting hot ranges; hash-based is self-balancing

---

## Decision Tree

Are frequent range queries on the shard key required (WHERE key BETWEEN X AND Y, date ranges)?

YES → Range queries are common

    ↓
    Use range-based sharding
    
    ↓
    Pro: Single-shard range scans (efficient sequential reads)
    Pro: Predictable shard assignment by key value
    Pro: Natural time-based partitioning (archive old ranges)
    
    ↓
    Con: Hot last range with monotonically increasing keys
    Con: Needs active monitoring and range splitting
    Con: Uneven distribution if ranges poorly chosen

NO → Even distribution is more important

    ↓
    Is the shard key monotonically increasing (auto-increment, timestamp)?
    
    YES → Use hash-based sharding
        
        ↓
        Hash distributes monotonically increasing keys evenly
        Avoids the "hot last shard" problem
        
        ↓
        Con: Range scans scatter across ALL shards
        Con: No sequential locality on disk
        
    NO → Consider both approaches
        
        ↓
        Evaluate tradeoffs:
        - Range: efficient range scans, but requires splitting management
        - Hash: even distribution, but no range locality
        
        ↓
        If range scans exist on other columns (not shard key):
        → Range sharding won't help those queries anyway
        → Hash-based sharding is likely better

---

## Recommended Default

**Default:** Hash-based sharding unless range scans on the shard key are a primary access pattern
**Reason:** Hash-based avoids the hot-range problem. Only use range-based when single-shard range scans provide clear performance benefit.

---

## Hot Range Mitigation

---

## Decision Context

Mitigating the "hot last shard" problem where monotonically increasing keys (auto-increment, timestamps) concentrate all new writes on the highest range shard.

---

## Decision Criteria

* performance: hot last shard limits write throughput to single-shard capacity
* architectural: range splitting distributes load; compound shard keys add complexity
* maintainability: pre-splitting requires growth estimation; compound keys require code changes

---

## Decision Tree

Shard key is monotonically increasing (auto-increment ID, created_at)?

YES → Hot last shard risk

    ↓
    Can you pre-split ranges with headroom?
    
    YES → Use pre-splitting with 20%+ headroom
        
        ↓
        Estimate 12-month growth
        Pre-allocate ranges: shard 1 (1-2M), shard 2 (2M-4M), etc.
        20% headroom reduces split frequency
        
        ↓
        Pro: Simple to implement
        Pro: No application changes
        Pro: Only splits when actual growth exceeds estimate

NO → Use compound shard key (hash prefix + range)

    ↓
    shard_key = hash(tenant_id) + auto_increment_id
    Hash prefix distributes writes across shards
    Range component enables range scans within hash prefix
    
    ↓
    Example: shard = crc32(tenant_id) % N
    Range scan within tenant: WHERE tenant_id = X AND id BETWEEN ...
    
    ↓
    Pro: Even write distribution
    Pro: No hot shard
    Pro: Range scans still efficient (per hash prefix)
    
    ↓
    Con: All queries need both key components
    Con: More complex routing logic

---

## Recommended Default

**Default:** Pre-split ranges with 20% headroom for monotonically increasing keys; use compound shard keys if pre-splitting is insufficient
**Reason:** Pre-splitting is simple and covers most growth scenarios. Compound keys are the robust solution for unpredictable growth.

---

## Related Rules

* Rule 6-3-1: Always Monitor Range Utilization
* Rule 6-3-2: Never Allow Unbounded Range Growth

---

## Related Skills

* Implement Range-Based Sharding
* Split a Hot Range
