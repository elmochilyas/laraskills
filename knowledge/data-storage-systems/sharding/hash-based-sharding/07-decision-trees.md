# 6-2 Hash Based Sharding - Decision Trees

## Modulo vs Consistent Hashing

---

## Decision Context

Choosing between modulo hashing (`hash(key) % N`) and consistent hashing (ring-based) for distributing data across shards.

---

## Decision Criteria

* performance: modulo is O(1) and simpler; consistent hashing requires binary search on ring
* architectural: modulo remaps ALL keys when N changes; consistent hashing remaps only 1/N
* maintainability: modulo is trivially implementable; consistent hashing needs virtual nodes for even distribution

---

## Decision Tree

Will the shard count change over time?

NO → Shard count is fixed forever

    ↓
    Use modulo hashing
    shard_id = crc32(key) % N
    N is power of 2 for better distribution
    
    ↓
    Pro: Simple O(1) routing
    Pro: No virtual nodes needed
    Pro: Even distribution with good hash function
    
    ↓
    Con: If N EVER changes, ALL data must move

YES → Shards may be added or removed

    ↓
    Use consistent hashing (ring-based)
    
    ↓
    Key hashes to a point on the ring
    Each shard owns a ring segment
    Adding a shard splits one segment → 1/N of keys move
    
    ↓
    Pro: Elastic scaling — minimal data movement
    Pro: Adding/removing shards is incremental
    
    ↓
    Con: More complex implementation
    Con: Needs virtual nodes (100-1000 per shard) for even distribution
    Con: Slightly slower routing (binary search on sorted ring)

---

## Recommended Default

**Default:** Modulo hashing for fixed shard count; consistent hashing when shard count is expected to grow
**Reason:** Modulo is simpler and sufficient for the common case. Consistent hashing's complexity pays off only when shards are added or removed.

---

## Virtual Buckets Strategy

---

## Decision Context

Choosing between direct key-to-shard mapping (modulo N) and virtual buckets (keys → many buckets → physical shards) for hash-based sharding.

---

## Decision Criteria

* performance: virtual buckets add one indirection level but enable finer-grained rebalancing
* architectural: buckets decouple key mapping from physical shard assignment
* maintainability: rebalancing moves buckets (not individual keys) — simpler than per-key migration

---

## Decision Tree

Need fine-grained rebalancing control?

YES → Use virtual buckets

    ↓
    Divide key space into 4096+ virtual buckets
    Map buckets to physical shards (many buckets per shard)
    
    ↓
    Rebalancing: move buckets, not individual keys
    Moving a bucket = updating one map entry
    Only 1/N of buckets move when adding/removing shards
    
    ↓
    Pro: Smooth rebalancing
    Pro: Can weight shards (more buckets to bigger shards)
    Pro: Each shard has many buckets → even distribution

NO → Simple modulo N is sufficient

    ↓
    Fixed shard count → modulo N
    Deterministic, no indirection
    
    ↓
    When to upgrade to virtual buckets:
    - Shard count changes more than once
    - Uneven shard capacity (different sizes)
    - Need per-shard weight configuration

---

## Recommended Default

**Default:** Modulo N for fixed shard counts; virtual buckets (4096+ buckets) when shard count changes or heterogeneous shard sizes needed
**Reason:** Virtual buckets add complexity that only pays off when shards need elastic scaling or weighted capacity.

---

## Related Rules

* Rule 6-2-1: Always Use Deterministic Hash Function
* Rule 6-2-2: Never Use Modulo With Changing Shard Count

---

## Related Skills

* Implement Hash-Based Sharding
* Implement Modulo vs Consistent Hashing
